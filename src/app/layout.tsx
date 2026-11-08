import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { Schibsted_Grotesk } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { MockBadge } from "@/components/badges";
import { NavLinks } from "@/components/nav-links";
import { getUser } from "@/lib/db/queries";
import { paypalMock } from "@/lib/paypal";
import { currentUserId } from "@/lib/session";
import "./globals.css";

const sans = Schibsted_Grotesk({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PayHub AI",
  description: "Know where your money goes.",
};

async function HeaderUser() {
  const userId = await currentUserId();
  const user = userId ? await getUser(userId) : null;
  if (!user) return null;
  return (
    <>
      <NavLinks />
      <span className="ml-auto flex items-center gap-2 text-sm">
        <span className="grid size-8 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent">{user.name[0]}</span>
        <span className="hidden sm:block">
          <span className="font-medium">{user.name}</span> <span className="text-muted">({user.relation})</span>
        </span>
      </span>
    </>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-8 place-items-center rounded-md bg-accent text-white"><Wallet aria-hidden className="size-4" /></span>
              PayHub AI
            </Link>
            <Suspense fallback={null}>
              <HeaderUser />
            </Suspense>
            <Suspense fallback={null}>
              <ModeBadges />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-surface-2" aria-label="Loading" />}>
            {children}
          </Suspense>
        </main>
        <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted">
          Independent demo built on the PayPal developer platform. Not affiliated with PayPal. Amounts are estimates.
        </footer>
      </body>
    </html>
  );
}

async function ModeBadges() {
  // Read env at request time so deploy-time keys are reflected without a rebuild.
  await currentUserId();
  return (
    <div className="flex gap-2">
      {paypalMock() && <MockBadge label="Mock payments" />}
      {!process.env.ANTHROPIC_API_KEY && <MockBadge label="Rule-based AI" />}
    </div>
  );
}
