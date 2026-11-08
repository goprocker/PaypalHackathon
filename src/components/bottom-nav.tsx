"use client";

import { ArrowUpDown, Home, LayoutDashboard, MessageCircle, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SIDE = [
  { href: "/", label: "Home", icon: Home },
  { href: "/hub", label: "Hub", icon: LayoutDashboard },
  { href: "/chat", label: "Ask AI", icon: MessageCircle },
  { href: "/switch", label: "Family", icon: Users },
] as const;

export function BottomNav() {
  const path = usePathname();
  const item = ({ href, label, icon: Icon }: (typeof SIDE)[number]) => {
    const on = path === href;
    return (
      <Link
        key={href}
        href={href}
        aria-current={on ? "page" : undefined}
        className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted", on && "font-bold text-text")}
      >
        <Icon aria-hidden className={cn("size-6", on && "text-accent")} strokeWidth={on ? 2.4 : 1.8} />
        {label}
      </Link>
    );
  };
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[480px] items-end border-t border-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      {item(SIDE[0])}
      {item(SIDE[1])}
      <Link href="/pay" aria-current={path === "/pay" ? "page" : undefined} className="flex flex-1 flex-col items-center gap-1 pb-1 text-[11px] font-medium text-muted">
        <span className="-mt-5 grid size-14 place-items-center rounded-full bg-accent text-on-accent shadow-[0_6px_16px_rgba(20,86,224,0.35)]">
          <ArrowUpDown aria-hidden className="size-6" strokeWidth={2.4} />
        </span>
        <span className={cn(path === "/pay" && "font-bold text-text")}>Pay</span>
      </Link>
      {item(SIDE[2])}
      {item(SIDE[3])}
    </nav>
  );
}
