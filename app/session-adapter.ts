import type { UserProfile } from "@/types/workspace";

const SESSION_KEY = "vdagent-session";
const USER_KEY = "vdagent-user";
const SESSION_VERSION = 1;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const REMEMBERED_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionStatus = "authenticated" | "unauthenticated" | "expired" | "denied" | "inactive";
export type SessionRecord = {
  version: 1;
  user: UserProfile;
  createdAt: number;
  expiresAt: number;
  remember: boolean;
  accountStatus: "active" | "inactive";
  access: "granted" | "denied";
};
export type SessionResult = { status: SessionStatus; session?: SessionRecord };

function isProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<UserProfile>;
  return typeof profile.name === "string" && typeof profile.email === "string" && typeof profile.staffId === "string" && typeof profile.role === "string";
}

function saveRecord(session: SessionRecord) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // ChatWorkspace still reads this stable profile key until the lead integrates the adapter.
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function createMockSession(user: UserProfile, remember: boolean): SessionResult {
  const email = user.email.trim().toLocaleLowerCase("vi-VN");
  if (email.startsWith("denied@") || email.startsWith("noaccess@")) return { status: "denied" };
  if (email.startsWith("inactive@")) return { status: "inactive" };

  const now = Date.now();
  const session: SessionRecord = {
    version: SESSION_VERSION,
    user,
    createdAt: now,
    expiresAt: now + (remember ? REMEMBERED_SESSION_TTL_MS : SESSION_TTL_MS),
    remember,
    accountStatus: "active",
    access: "granted",
  };
  try {
    saveRecord(session);
    return { status: "authenticated", session };
  } catch {
    clearMockSession();
    return { status: "unauthenticated" };
  }
}

export function readMockSession(): SessionResult {
  try {
    const serializedSession = window.localStorage.getItem(SESSION_KEY);
    const serializedUser = window.localStorage.getItem(USER_KEY);

    // Logout in the existing workspace clears the profile key. Treat that as authoritative.
    if (!serializedUser) {
      if (serializedSession) window.localStorage.removeItem(SESSION_KEY);
      return { status: "unauthenticated" };
    }

    const user: unknown = JSON.parse(serializedUser);
    if (!isProfile(user)) {
      clearMockSession();
      return { status: "unauthenticated" };
    }

    if (!serializedSession) {
      const now = Date.now();
      const migrated: SessionRecord = {
        version: SESSION_VERSION,
        user,
        createdAt: now,
        expiresAt: now + SESSION_TTL_MS,
        remember: false,
        accountStatus: "active",
        access: "granted",
      };
      saveRecord(migrated);
      return { status: "authenticated", session: migrated };
    }

    const parsed: unknown = JSON.parse(serializedSession);
    if (!parsed || typeof parsed !== "object") {
      clearMockSession();
      return { status: "unauthenticated" };
    }
    const session = parsed as Partial<SessionRecord>;
    if (session.version !== SESSION_VERSION || !isProfile(session.user) || typeof session.createdAt !== "number" || typeof session.expiresAt !== "number" || typeof session.remember !== "boolean" || (session.accountStatus !== "active" && session.accountStatus !== "inactive") || (session.access !== "granted" && session.access !== "denied")) {
      clearMockSession();
      return { status: "unauthenticated" };
    }
    if (session.user.email !== user.email || session.user.name !== user.name) {
      clearMockSession();
      return { status: "unauthenticated" };
    }
    if (session.accountStatus === "inactive") return { status: "inactive" };
    if (session.access === "denied") return { status: "denied" };
    if (session.expiresAt <= Date.now()) {
      clearMockSession();
      return { status: "expired" };
    }
    return { status: "authenticated", session: session as SessionRecord };
  } catch {
    clearMockSession();
    return { status: "unauthenticated" };
  }
}

export function clearMockSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // Storage can be unavailable in restricted browser contexts; the route gate stays closed.
  }
}
