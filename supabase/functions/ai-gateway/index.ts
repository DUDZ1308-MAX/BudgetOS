import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RATE_LIMIT = parseInt(Deno.env.get("AI_RATE_LIMIT") ?? "30");
const RATE_WINDOW_MS = 60_000;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const PROVIDER_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
};

const PROVIDER_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(userId);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (!checkRateLimit(user.id)) {
      return jsonResponse({ error: "Rate limit exceeded. Try again later." }, 429);
    }

    const body = await req.json();
    const { messages, provider = "openai", model, stream = false } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: "Messages array is required" }, 400);
    }

    const apiKey = Deno.env.get(`${provider.toUpperCase()}_API_KEY`);
    if (!apiKey) {
      return jsonResponse({ error: `Provider "${provider}" is not configured` }, 500);
    }

    const url = PROVIDER_URLS[provider];
    if (!url) {
      return jsonResponse({ error: `Unsupported provider: ${provider}` }, 400);
    }

    const resolvedModel = model ?? PROVIDER_MODELS[provider] ?? "gpt-4o-mini";

    const upstreamBody = {
      model: resolvedModel,
      messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.maxTokens ?? 2048,
      stream,
    };

    const upstreamHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    const upstreamResponse = await fetch(url, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(upstreamBody),
    });

    if (!upstreamResponse.ok) {
      const errorBody = await upstreamResponse.text();
      return jsonResponse(
        {
          error: `Upstream API error: ${upstreamResponse.status}`,
          details: errorBody,
        },
        upstreamResponse.status,
      );
    }

    if (stream && upstreamResponse.body) {
      return new Response(upstreamResponse.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const data = await upstreamResponse.json();
    return jsonResponse(data);
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500,
    );
  }
});
