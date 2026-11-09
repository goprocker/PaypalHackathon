import { cookies } from "next/headers";
import { DEMO_MEMBERS } from "./demo/data";
import { privacySchema, type Privacy } from "./money";
import { currentUserId } from "./session";

export const PRIVACY_COOKIE = "payhub_privacy";

export async function getPrivacy(): Promise<Privacy> {
  const raw = (await cookies()).get(PRIVACY_COOKIE)?.value;
  try {
    const parsed = privacySchema.safeParse(JSON.parse(decodeURIComponent(raw ?? "{}")));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

/** Signed-in demo member, else Arun. */
export async function viewer() {
  const id = await currentUserId();
  return DEMO_MEMBERS.find((m) => m.id === id) ?? DEMO_MEMBERS[0];
}
