import { ChatBox } from "@/components/chat-box";
import { StatusLabel } from "@/components/status-label";
import { AGENT_INFO } from "@/lib/agents/log";
import { getT } from "@/lib/i18n/server";

const SUGGESTIONS = {
  en: ["Any problems with my payments?", "Was I charged twice?", "How much budget do I have left?", "What would $120 really cost?", "Is upi://pay?pa=paytm.refund.help@ybl&am=4999 safe?"],
  ta: ["என் கட்டணங்களில் சிக்கல் உண்டா?", "இரண்டு முறை கழிக்கப்பட்டதா?", "பட்ஜெட் எவ்வளவு மீதம்?", "$120 உண்மையில் எவ்வளவு?"],
  hi: ["मेरे भुगतानों में कोई दिक्कत?", "क्या दो बार पैसे कटे?", "मेरा बजट कितना बचा है?", "$120 असल में कितने का पड़ेगा?"],
};

export default async function ChatPage() {
  const { t, locale } = await getT();
  const names = Object.fromEntries(Object.entries(AGENT_INFO).map(([id, a]) => [id, a.name]));
  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold">{t("chat.title")}</h1>
          <StatusLabel status={process.env.ANTHROPIC_API_KEY ? "live" : "demo"} label={t(process.env.ANTHROPIC_API_KEY ? "status.live" : "status.demo")} />
        </div>
        <p className="mt-1 text-sm text-muted">{t(process.env.ANTHROPIC_API_KEY ? "chat.desc" : "chat.rules")}</p>
      </header>
      <ChatBox suggestions={SUGGESTIONS[locale]} agentNames={names} />
    </div>
  );
}
