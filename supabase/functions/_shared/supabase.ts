import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "./http.ts";

export function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
}

export type AuthResult =
  | { user: AuthenticatedUser }
  | { error: Response };

// Authenticates the caller with their own JWT (sent as the
// Authorization header by supabase-js). The returned client is used
// ONLY to verify the token; all database writes go through the
// service-role admin client.
export async function getAuthenticatedUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { error: jsonResponse({ error: "Missing authorization header" }, 401) };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { error: jsonResponse({ error: "Unauthorized" }, 401) };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    },
  };
}

export function getAppUrl(): string {
  const url = Deno.env.get("APP_URL");
  if (!url) {
    throw new Error("APP_URL is not configured");
  }
  const trimmed = url.replace(/\/+$/, "");
  // Server-controlled origin: production must be https; only localhost
  // is allowed over plain http for local development.
  const valid = /^https:\/\/.+/i.test(trimmed) ||
    /^http:\/\/localhost(:\d+)?$/i.test(trimmed);
  if (!valid) {
    throw new Error("APP_URL must be a valid https origin (or http://localhost)");
  }
  return trimmed;
}
