"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/dict";

export function LangSwitch({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const change = (next: Locale) =>
    start(async () => {
      await fetch("/api/lang", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: next }) });
      router.refresh();
    });
  return (
    <label className="glass flex h-10 items-center gap-1 rounded-full px-3 text-xs">
      <Languages aria-hidden className="size-4 text-accent" />
      <span className="sr-only">{label}</span>
      <select value={locale} disabled={pending} onChange={(e) => change(e.target.value as Locale)} className="h-full min-w-16 bg-transparent font-medium outline-none">
        {LOCALES.map((l) => (
          <option key={l} value={l} className="bg-surface">{LOCALE_NAMES[l]}</option>
        ))}
      </select>
    </label>
  );
}
