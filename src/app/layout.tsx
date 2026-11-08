import type { Metadata, Viewport } from "next";
import { Wallet } from "lucide-react";
import { Schibsted_Grotesk } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { MockBadge } from "@/components/badges";
import { BottomNav } from "@/components/bottom-nav";
import { PwaRegister } from "@/components/pwa-register";
import { getUser } from "@/lib/db/queries";
import { paypalMock } from "@/lib/paypal";
import { currentUserId } from "@/lib/session";
import "./globals.css";

const sans = Schibsted_Grotesk({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PayHub AI",
  description: "Know where your money goes.",
  applicationName: "PayHub AI",
  appleWebApp: { capable: true, title: "PayHub", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a2766" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1228" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

async function TopBar() {
  const userId = await currentUserId();
  const user = userId ? await getUser(userId) : null;
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-bg/90 px-5 py-3 backdrop-blur">
      <Link href="/" aria-label="PayHub AI home" className="grid size-10 place-items-center rounded-full bg-surface shadow-[0_1px_2px_rgba(12,27,61,0.08)]">
        <Wallet aria-hidden className="size-5 text-accent" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted">{user ? "Welcome back" : "PayHub AI"}</div>
        <div className="truncate text-sm font-semibold">{user ? `${user.name} (${user.relation})` : "Know where your money goes"}</div>
      </div>
      {user && (
        <Link href="/switch" aria-label="Switch family member" className="grid size-10 place-items-center rounded-full bg-surface text-sm font-bold text-accent shadow-[0_1px_2px_rgba(12,27,61,0.08)]">
          {user.name[0]}
        </Link>
      )}
    </header>
  );
}

async function Nav() {
  return (await currentUserId()) ? <BottomNav /> : null;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="app-shell flex flex-col pb-28">
          <Suspense fallback={<div className="h-16" />}>
            <TopBar />
          </Suspense>
          <Suspense fallback={null}>
            <ModeBadges />
          </Suspense>
          <main className="flex-1 px-5 pt-2 pb-6">
            <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-surface-2" aria-label="Loading" />}>
              {children}
            </Suspense>
          </main>
          <footer className="px-5 pb-4 text-center text-xs text-muted">
            Independent demo built on the PayPal developer platform. Not affiliated with PayPal. Amounts are estimates.
          </footer>
        </div>
        <Suspense fallback={null}>
          <Nav />
        </Suspense>
        <PwaRegister />
      </body>
    </html>
  );
}

async function ModeBadges() {
  // Read env at request time so deploy-time keys are reflected without a rebuild.
  await currentUserId();
  const mock = paypalMock();
  const rules = !process.env.ANTHROPIC_API_KEY;
  if (!mock && !rules) return null;
  return (
    <div className="flex gap-2 px-5">
      {mock && <MockBadge label="Mock payments" />}
      {rules && <MockBadge label="Rule-based AI" />}
    </div>
  );
}
