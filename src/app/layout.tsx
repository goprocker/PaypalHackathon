import type { Metadata, Viewport } from "next";
import { Wallet } from "lucide-react";
import { Schibsted_Grotesk } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { MockBadge } from "@/components/badges";
import { BottomNav } from "@/components/bottom-nav";
import { LangSwitch } from "@/components/lang-switch";
import { PwaRegister } from "@/components/pwa-register";
import { ExitScenario } from "@/components/scenario-picker";
import { activeScenario } from "@/lib/demo/server";
import { getUser } from "@/lib/db/queries";
import { getT } from "@/lib/i18n/server";
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
    { color: "#070d1f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

async function TopBar() {
  const userId = await currentUserId();
  const user = userId ? await getUser(userId) : null;
  const { locale, t } = await getT();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-bg/95 px-5 py-3">
      <Link href="/" aria-label="PayHub AI home" className="glass grid size-10 place-items-center rounded-full">
        <Wallet aria-hidden className="size-5 text-accent" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted">{user ? t("top.welcome") : "PayHub AI"}</div>
        <div className="truncate text-sm font-semibold">{user ? `${user.name} (${user.relation})` : t("top.tagline")}</div>
      </div>
      <LangSwitch locale={locale} label={t("lang.label")} />
      {user && (
        <Link href="/switch" aria-label="Switch family member" className="glass grid size-10 place-items-center rounded-full text-sm font-bold text-accent">
          {user.name[0]}
        </Link>
      )}
    </header>
  );
}

async function Nav() {
  if (!(await currentUserId())) return null;
  const { t } = await getT();
  const labels = { home: t("nav.home"), pay: t("nav.pay"), protect: t("nav.protect"), track: t("nav.track"), money: t("nav.money"), family: t("nav.family"), ai: t("nav.ai") };
  return <BottomNav labels={labels} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }} className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="app-shell flex flex-col pb-42 md:pb-8">
          <Suspense fallback={<div className="h-16" />}>
            <TopBar />
          </Suspense>
          <Suspense fallback={null}>
            <ScenarioBanner />
          </Suspense>
          <Suspense fallback={null}>
            <ModeBadges />
          </Suspense>
          <main className="flex-1 px-5 pt-2 pb-6">
            <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-surface-2" aria-label="Loading" />}>
              {children}
            </Suspense>
          </main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <Nav />
        </Suspense>
        <PwaRegister />
      </body>
    </html>
  );
}

async function ScenarioBanner() {
  const s = await activeScenario();
  if (!s) return null;
  return (
    <div className="mx-5 mb-2 flex items-center gap-2 rounded-xl bg-accent/15 py-1 pr-1 pl-3 text-sm">
      <span className="font-semibold text-accent">Demo</span>
      <Link href={s.href} className="min-w-0 flex-1 truncate">{s.title}</Link>
      <ExitScenario />
    </div>
  );
}

async function Footer() {
  const { t } = await getT();
  return <footer className="px-5 pb-4 text-center text-xs text-muted">{t("footer")}</footer>;
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
