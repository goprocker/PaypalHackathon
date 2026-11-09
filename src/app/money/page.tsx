import { SectionPage } from "@/components/section-page";

export default function MoneyPage() {
  return (
    <SectionPage
      section="money"
      features={[
        { title: "Monthly summary", desc: "Where this month's money went, by category.", status: "live", href: "/hub" },
        { title: "Subscriptions", desc: "Recurring charges you may have forgotten.", status: "soon" },
        { title: "Duplicate payments", desc: "Charges that look like they were paid twice.", status: "soon" },
        { title: "Budgets and savings goals", desc: "Limits per category and progress towards goals.", status: "soon" },
        { title: "Accounts and net worth", desc: "All balances in one view.", status: "soon" },
        { title: "LRS tracker", desc: "Foreign spending against the yearly LRS limit.", status: "soon" },
      ]}
    />
  );
}
