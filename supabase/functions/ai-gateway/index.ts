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

const PROVIDER_MODELS: Record<string, string> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
};

interface GeminiMessage {
  role: string;
  parts: { text: string }[];
}

function convertToGeminiMessages(
  messages: { role: string; content: string }[],
): { systemInstruction?: { parts: { text: string }[] }; contents: GeminiMessage[] } {
  let systemInstruction: { parts: { text: string }[] } | undefined;
  const contents: GeminiMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = { parts: [{ text: msg.content }] };
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  return { systemInstruction, contents };
}

function geminiResponseToOpenAI(
  data: Record<string, unknown>,
  model: string,
): Record<string, unknown> {
  const candidates = data.candidates as { content?: { parts?: { text: string }[] } }[] | undefined;
  const text = candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const usageMetadata = data.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;

  return {
    choices: [{ message: { content: text }, finish_reason: "stop" }],
    model,
    usage: usageMetadata
      ? {
          prompt_tokens: usageMetadata.promptTokenCount ?? 0,
          completion_tokens: usageMetadata.candidatesTokenCount ?? 0,
        }
      : undefined,
  };
}

function geminiStreamChunkToOpenAI(
  line: string,
  model: string,
): Record<string, unknown> | null {
  try {
    const data = JSON.parse(line);
    const candidates = data.candidates as { content?: { parts?: { text: string }[] } }[] | undefined;
    const text = candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) return null;
    return {
      choices: [{ delta: { content: text }, finish_reason: null }],
      model,
    };
  } catch {
    return null;
  }
}

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
    const { messages, provider = "gemini", model, stream = false } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: "Messages array is required" }, 400);
    }

    const apiKey = Deno.env.get(`${provider.toUpperCase()}_API_KEY`);
    if (!apiKey) {
      return jsonResponse({ error: `Provider "${provider}" is not configured` }, 500);
    }

    const resolvedModel = model ?? PROVIDER_MODELS[provider] ?? "gpt-4o-mini";
    const temperature = body.temperature ?? 0.7;
    const maxTokens = body.maxTokens ?? 2048;

    if (provider === "gemini") {
      return await handleGemini(messages, apiKey, resolvedModel, temperature, maxTokens, stream);
    }

    return await handleOpenAICompatible(provider, messages, apiKey, resolvedModel, temperature, maxTokens, stream);
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Internal server error" },
      500,
    );
  }
});

async function handleGemini(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  stream: boolean,
): Promise<Response> {
  const { systemInstruction, contents } = convertToGeminiMessages(messages);

  const geminiBody: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (systemInstruction) {
    geminiBody.systemInstruction = systemInstruction;
  }

  const endpoint = stream
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const upstreamResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(geminiBody),
  });

  if (!upstreamResponse.ok) {
    const errorBody = await upstreamResponse.text();
    return jsonResponse(
      { error: `Gemini API error: ${upstreamResponse.status}`, details: errorBody },
      upstreamResponse.status,
    );
  }

  if (stream && upstreamResponse.body) {
    const reader = upstreamResponse.body.getReader();
    const decoder = new TextDecoder();

    const sseStream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              if (trimmed.startsWith("data: ")) {
                const data = trimmed.slice(6);
                const chunk = geminiStreamChunkToOpenAI(data, model);
                if (chunk) {
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`),
                  );
                }
              }
            }
          }
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(sseStream, {
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
  return jsonResponse(geminiResponseToOpenAI(data, model));
}

async function handleOpenAICompatible(
  provider: string,
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  stream: boolean,
): Promise<Response> {
  const urls: Record<string, string> = {
    openai: "https://api.openai.com/v1/chat/completions",
    deepseek: "https://api.deepseek.com/v1/chat/completions",
  };

  const url = urls[provider];
  if (!url) {
    return jsonResponse({ error: `Unsupported provider: ${provider}` }, 400);
  }

  const upstreamBody = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream,
  };

  const upstreamResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(upstreamBody),
  });

  if (!upstreamResponse.ok) {
    const errorBody = await upstreamResponse.text();
    return jsonResponse(
      { error: `Upstream API error: ${upstreamResponse.status}`, details: errorBody },
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
}
