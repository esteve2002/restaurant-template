import "server-only";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const configuredUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!configuredUrl || !serviceKey) return null;

  let projectOrigin;
  try {
    const parsedUrl = new URL(configuredUrl);
    if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".supabase.co")) return null;
    projectOrigin = parsedUrl.origin;
  } catch {
    return null;
  }

  return createClient(projectOrigin, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}