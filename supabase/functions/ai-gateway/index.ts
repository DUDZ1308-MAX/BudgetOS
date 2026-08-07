import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAdminClient } from "../_shared/supabase.ts";
import { decideAiRequest, type ConsumeUsageResult } from "../_shared/aiEntitlement.ts";
import { SlidingWindowRateLimiter } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROVIDER_MODELS: Record<string, string> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
  groq: "llama-3.3-70b-versatile",
};

const PROVIDER_RATE_LIMIT_MESSAGE = "AI Copilot is temporarily rate-limited. Please try again shortly.";
const PROVIDER_ERROR_MESSAGE = "The AI provider is temporarily unavailable. Please try again shortly.";

// Bounded upstream retry for provider rate limits (429). We never retry more
// than once and we never retry any other status. A repeated 429 is surfaced
// to the client as-is so the user can wait and try again.
const GEMINI_RATE_LIMIT_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterSeconds(
  response: Response,
  errorBody: string,
): number | undefined {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = parseInt(header, 10);
    if (!Number.isNaN(seconds) && seconds >= 0) return seconds;
  }

  try {
    const data = JSON.parse(errorBody) as {
      error?: { details?: { "@type"?: string; retryDelay?: string }[] };
    };
    const retryDelay = data.error?.details?.find((d) => d.retryDelay)?.retryDelay;
    if (retryDelay) {
      const match = /(\d+(?:\.\d+)?)s/.exec(retryDelay);
      if (match) {
        const seconds = parseFloat(match[1]);
        if (!Number.isNaN(seconds)) return Math.ceil(seconds);
      }
    }
  } catch {
    // ignore malformed provider error bodies
  }

  return undefined;
}

async function fetchGeminiWithRetry(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<{ response: Response; retryAfter?: number }> {
  const doFetch = (): Promise<Response> =>
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  let response = await doFetch();
  let retryAfter: number | undefined;

  for (let attempt = 0; attempt < GEMINI_RATE_LIMIT_RETRIES && !response.ok && response.status === 429; attempt++) {
    retryAfter = parseRetryAfterSeconds(response, await response.text().catch(() => ""));
    await sleep(retryAfter ? retryAfter * 1_000 : DEFAULT_RETRY_DELAY_MS);
    response = await doFetch();
  }

  if (!response.ok) {
    if (response.status === 429) {
      retryAfter = parseRetryAfterSeconds(response, await response.text().catch(() => ""));
    } else {
      await response.text().catch(() => undefined);
    }
  }

  return { response, retryAfter };
}

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

// Additional protection: per-user per-minute cap, independent of the
// monthly plan limit enforced below.
const rateLimiter = new SlidingWindowRateLimiter(
  parseInt(Deno.env.get("AI_RATE_LIMIT") ?? "30"),
  60_000,
);

function normalizeUsageRow(data: unknown): ConsumeUsageResult | null {
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const row = rows[0];
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  return {
    allowed: typeof r.allowed === "boolean" ? r.allowed : undefined,
    request_count: typeof r.request_count === "number" ? r.request_count : null,
    request_limit: typeof r.request_limit === "number" ? r.request_limit : null,
    tier: typeof r.tier === "string" ? r.tier : null,
  };
}

function geminiTokenCount(data: Record<string, unknown>): number {
  const usage = data.usageMetadata as
    | { promptTokenCount?: number; candidatesTokenCount?: number }
    | undefined;
  return (usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0);
}

function openAiTokenCount(data: Record<string, unknown>): number {
  const usage = data.usage as
    | { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number }
    | undefined;
  if (typeof usage?.total_tokens === "number") return usage.total_tokens;
  return (usage?.prompt_tokens ?? 0) + (usage?.completion_tokens ?? 0);
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

    if (!rateLimiter.allow(user.id)) {
      return jsonResponse(
        { error: "Rate limit exceeded. Try again later.", code: "RATE_LIMIT" },
        429,
      );
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

    // Server-authoritative monthly entitlement. The tier and limit come
    // exclusively from the database (consume_ai_usage() resolves
    // public.user_subscriptions and atomically check-increments the
    // ai_usage row). Client-provided tiers and usage values are never
    // read, so a forged tier or a localStorage reset cannot grant quota.
    const admin = createAdminClient();
    const { data: rpcData, error: rpcError } = await admin.rpc(
      "consume_ai_usage",
      { p_user_id: user.id },
    );

    const decision = decideAiRequest(normalizeUsageRow(rpcData), !!rpcError);
    if (decision.action === "deny-error") {
      console.error("ai-gateway usage verification failed", rpcError?.message ?? "");
      return jsonResponse(
        { error: "AI usage could not be verified. Please try again shortly.", code: "USAGE_VERIFY_FAILED" },
        503,
      );
    }
    if (decision.action === "deny-limit") {
      return jsonResponse(
        {
          error: `You've reached your monthly AI request limit (${decision.requestLimit}).`,
          code: "AI_USAGE_LIMIT",
          limit: decision.requestLimit,
        },
        429,
      );
    }

    // Best-effort token accounting after a successful non-stream
    // provider response. Informational only; never used to enforce.
    const recordTokens = (tokenCount: number): void => {
      if (!tokenCount || !Number.isFinite(tokenCount)) return;
      admin.rpc("add_ai_usage_tokens", {
        p_user_id: user.id,
        p_tokens: Math.round(tokenCount),
      }).catch(() => {});
    };

    if (provider === "gemini") {
      return await handleGemini(messages, apiKey, resolvedModel, temperature, maxTokens, stream, recordTokens);
    }

    return await handleOpenAICompatible(provider, messages, apiKey, resolvedModel, temperature, maxTokens, stream, recordTokens);
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
  recordTokens: (tokenCount: number) => void,
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

  const { response: upstreamResponse, retryAfter } = await fetchGeminiWithRetry(endpoint, geminiBody);

  if (!upstreamResponse.ok) {
    const isRateLimit = upstreamResponse.status === 429;
    return jsonResponse(
      {
        error: isRateLimit ? PROVIDER_RATE_LIMIT_MESSAGE : PROVIDER_ERROR_MESSAGE,
        code: isRateLimit ? "PROVIDER_RATE_LIMIT" : "PROVIDER_ERROR",
        retryAfter: isRateLimit ? retryAfter : undefined,
      },
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
  recordTokens(geminiTokenCount(data));
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
  recordTokens: (tokenCount: number) => void,
): Promise<Response> {
  const urls: Record<string, string> = {
    openai: "https://api.openai.com/v1/chat/completions",
    deepseek: "https://api.deepseek.com/v1/chat/completions",
    groq: "https://api.groq.com/openai/v1/chat/completions",
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
    await upstreamResponse.text().catch(() => undefined);
    return jsonResponse(
      {
        error: upstreamResponse.status === 429 ? PROVIDER_RATE_LIMIT_MESSAGE : PROVIDER_ERROR_MESSAGE,
        code: upstreamResponse.status === 429 ? "PROVIDER_RATE_LIMIT" : "PROVIDER_ERROR",
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
  recordTokens(openAiTokenCount(data));
  return jsonResponse(data);
}
