import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { MockBadge } from "@/components/badges";
import { getUser } from "@/lib/db/queries";
import { paypalMock } from "@/lib/paypal";
import { currentUserId } from "@/lib/session";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

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
      <nav className="flex gap-3 text-sm">
        <Link href="/pay" className="text-primary hover:underline">Pay</Link>
        <Link href="/hub" className="text-primary hover:underline">Hub</Link>
        <Link href="/chat" className="text-primary hover:underline">Chat</Link>
      </nav>
      <span className="ml-auto text-sm text-muted">{user.name} ({user.relation})</span>
    </>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-4 px-4 py-3">
            <Link href="/" className="text-base font-semibold">PayHub AI</Link>
            <Suspense fallback={null}>
              <HeaderUser />
            </Suspense>
            <Suspense fallback={null}>
              <ModeBadges />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-surface-2" aria-label="Loading" />}>
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
