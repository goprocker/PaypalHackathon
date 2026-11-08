import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Demo login: a signed cookie holding the user id. No passwords in the MVP.
const COOKIE = "payhub_session";
export const DEMO_USERS = ["u_me", "u_mom", "u_dad"] as const;

const secret = () => process.env.AUTH_SECRET || "dev-only-secret";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");

export function encodeSession(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function decodeSession(raw: string | undefined): string | null {
  if (!raw) return null;
  const i = raw.lastIndexOf(".");
  if (i < 1) return null;
  const id = raw.slice(0, i);
  const a = Buffer.from(raw.slice(i + 1));
  const b = Buffer.from(sign(id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

export async function currentUserId(): Promise<string | null> {
  return decodeSession((await cookies()).get(COOKIE)?.value);
}

export async function setSession(userId: string) {
  (await cookies()).set(COOKIE, encodeSession(userId), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
}
