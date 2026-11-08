"use client";

import { CreditCard, LayoutDashboard, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/pay", label: "Pay", icon: CreditCard },
  { href: "/hub", label: "Hub", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageCircle },
] as const;

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-1 rounded-lg bg-surface-2 p-1 text-sm">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={path === href ? "page" : undefined}
          className={cn(
            "flex h-11 items-center gap-1.5 sm:h-8 rounded-md px-3 font-medium text-muted transition-colors hover:text-text",
            path === href && "bg-surface text-text shadow-sm",
          )}
        >
          <Icon aria-hidden className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
