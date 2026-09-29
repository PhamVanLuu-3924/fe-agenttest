"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { readMockSession, type SessionStatus } from "@/app/session-adapter";
import { ChatWorkspace } from "@/components/chat-workspace";

function getSessionStatus(): SessionStatus | "loading" {
  if (typeof window === "undefined") return "loading";
  try {
    if (!window.localStorage.getItem("vdagent-user")) return "unauthenticated";
    const rawSession = window.localStorage.getItem("vdagent-session");
    if (!rawSession) return "authenticated";
    const session = JSON.parse(rawSession) as { accountStatus?: string; access?: string; expiresAt?: number };
    if (session.accountStatus === "inactive") return "inactive";
    if (session.access === "denied") return "denied";
    if (typeof session.expiresAt === "number" && session.expiresAt <= Date.now()) return "expired";
    return "authenticated";
  } catch {
    return "unauthenticated";
  }
}

function subscribeToSession(onChange: () => void) {
  const refresh = () => onChange();
  window.addEventListener("storage", refresh);
  document.addEventListener("visibilitychange", refresh);

  let expiryTimer: number | undefined;
  try {
    const rawSession = window.localStorage.getItem("vdagent-session");
    if (rawSession) {
      const session = JSON.parse(rawSession) as { expiresAt?: number };
      if (typeof session.expiresAt === "number") expiryTimer = window.setTimeout(refresh, Math.max(0, session.expiresAt - Date.now()));
    }
  } catch {
    // The snapshot will report an unauthenticated session when storage cannot be read.
  }

  return () => {
    window.removeEventListener("storage", refresh);
    document.removeEventListener("visibilitychange", refresh);
    if (expiryTimer !== undefined) window.clearTimeout(expiryTimer);
  };
}

export function SessionGate() {
  const router = useRouter();
  const status = useSyncExternalStore(subscribeToSession, getSessionStatus, () => "loading");

  useEffect(() => {
    if (status === "loading") return;
    const result = readMockSession();
    if (result.status === "authenticated") return;
    const reason = result.status === "unauthenticated" ? "" : `?reason=${result.status}`;
    router.replace(`/login${reason}`);
  }, [router, status]);

  if (status === "authenticated") return <div className="luu-app-surface"><ChatWorkspace /></div>;

  return <main className="session-gate" role="status" aria-live="polite"><span className="session-gate__mark">V</span><span className="session-gate__spinner" aria-hidden="true" /><p>Đang tải phiên làm việc…</p></main>;
}
