import { cookies } from "next/headers";
import { DICTS, isLocale, type Key, type Locale } from "./dict";

export const LOCALE_COOKIE = "payhub_lang";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : "en";
}

export async function getT() {
  const locale = await getLocale();
  const d = DICTS[locale];
  return { locale, t: (k: Key) => d[k] };
}
