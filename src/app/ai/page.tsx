import { SectionPage } from "@/components/section-page";

export default function AiPage() {
  return (
    <SectionPage
      section="ai"
      features={[
        { title: "Ask AI", desc: "Chat about your spending and payments.", status: "live", href: "/chat" },
        { title: "AI Command Centre", desc: "Watch the agents work and hand results to each other.", status: "soon" },
      ]}
    />
  );
}
