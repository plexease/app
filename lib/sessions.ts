import "server-only";
import { getServiceClient } from "@/lib/supabase/service";

export type Session = {
  id: string;
  deviceInfo: string;
  rawUserAgent: string | null;
  ipHash: string | null;
  lastActive: string;
  createdAt: string;
};

const MAX_SESSIONS = 3;

export function parseUserAgent(ua: string): string {
  // Browser detection
  let browser = "Unknown browser";
  if (/Edg\//i.test(ua)) {
    browser = "Edge";
  } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    browser = "Opera";
  } else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) {
    browser = "Chrome";
  } else if (/Firefox\//i.test(ua)) {
    browser = "Firefox";
  } else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) {
    browser = "Safari";
  }

  // OS detection
  let os = "Unknown OS";
  if (/Windows/i.test(ua)) {
    os = "Windows";
  } else if (/Macintosh|Mac OS/i.test(ua)) {
    os = "macOS";
  } else if (/Android/i.test(ua)) {
    os = "Android";
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = "iOS";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  }

  if (browser === "Unknown browser" && os === "Unknown OS") {
    return "Unknown device";
  }

  return `${browser} on ${os}`;
}

export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export async function createSession(
  userId: string,
  request: Request
): Promise<string> {
  const supabase = getServiceClient();
  const ua = request.headers.get("user-agent") ?? "";
  const deviceInfo = parseUserAgent(ua);

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const ipHashed = await hashIp(ip);

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      device_info: deviceInfo,
      raw_user_agent: ua || null,
      ip_hash: ipHashed,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return data.id;
}

export async function enforceSessionLimit(
  userId: string,
  maxSessions: number = MAX_SESSIONS
): Promise<void> {
  const supabase = getServiceClient();

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !sessions) return;

  if (sessions.length > maxSessions) {
    const toDelete = sessions.slice(0, sessions.length - maxSessions);
    const ids = toDelete.map((s) => s.id);

    await supabase.from("sessions").delete().in("id", ids);
  }
}

export async function validateSession(sessionId: string): Promise<boolean> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .single();

  if (error || !data) return false;

  await supabase
    .from("sessions")
    .update({ last_active: new Date().toISOString() })
    .eq("id", sessionId);

  return true;
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("sessions")
    .select("id, device_info, raw_user_agent, ip_hash, last_active, created_at")
    .eq("user_id", userId)
    .order("last_active", { ascending: false });

  if (error || !data) return [];

  return data.map((s) => ({
    id: s.id,
    deviceInfo: s.device_info ?? "Unknown device",
    rawUserAgent: s.raw_user_agent,
    ipHash: s.ip_hash,
    lastActive: s.last_active,
    createdAt: s.created_at,
  }));
}

export async function deleteSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const supabase = getServiceClient();

  await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);
}

export async function deleteOtherSessions(
  userId: string,
  currentSessionId: string
): Promise<void> {
  const supabase = getServiceClient();

  await supabase
    .from("sessions")
    .delete()
    .eq("user_id", userId)
    .neq("id", currentSessionId);
}
