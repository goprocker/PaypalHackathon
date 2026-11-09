"use client";

import { Bot, CreditCard, Home, PiggyBank, Radar, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Six sections, plus Home first in both navs.
const SECTIONS = [
  { href: "/pay", key: "pay", icon: CreditCard },
  { href: "/protect", key: "protect", icon: ShieldCheck },
  { href: "/track", key: "track", icon: Radar },
  { href: "/money", key: "money", icon: PiggyBank },
  { href: "/family", key: "family", icon: Users },
  { href: "/ai", key: "ai", icon: Bot },
] as const;

export type NavLabels = Record<(typeof SECTIONS)[number]["key"] | "home", string>;

const active = (path: string, href: string) => path === href || path.startsWith(`${href}/`) || (href === "/ai" && path === "/chat");

export function BottomNav({ labels }: { labels: NavLabels }) {
  const path = usePathname();
  return (
    <>
      <nav
        aria-label="Main"
        className="glass fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[480px] items-end border-x-0 border-b-0 px-1 pb-[calc(env(safe-area-inset-bottom)+3.5rem)] md:hidden"
      >
        {[{ href: "/", key: "home", icon: Home } as const, ...SECTIONS].map(({ href, key, icon: Icon }) => {
          const on = href === "/" ? path === "/" : active(path, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn("relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted transition-colors hover:text-text", on && "font-bold text-text")}
            >
              {on && <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-accent" />}
              <Icon aria-hidden className={cn("size-5", on && "text-accent")} strokeWidth={on ? 2.4 : 1.8} />
              <span className="max-w-full truncate">{labels[key]}</span>
            </Link>
          );
        })}
      </nav>
      <nav aria-label="Main" className="glass fixed inset-y-0 left-[max(0px,calc(50%-520px))] z-40 hidden w-56 flex-col gap-1 border-y-0 border-l-0 p-4 pt-20 md:flex">
        {[{ href: "/", key: "home", icon: Home } as const, ...SECTIONS].map(({ href, key, icon: Icon }) => {
          const on = href === "/" ? path === "/" : active(path, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text", on && "bg-accent-fill/20 font-semibold text-text")}
            >
              <Icon aria-hidden className={cn("size-5", on && "text-accent")} />
              {labels[key]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
