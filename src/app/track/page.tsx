import { SectionPage } from "@/components/section-page";

export default function TrackPage() {
  return (
    <SectionPage
      section="track"
      features={[
        { title: "Payment Tracker", desc: "Status, amount debited, refund progress and estimated refund date.", status: "soon" },
        { title: "Proof Vault", desc: "Receipts, screenshots, invoices and transaction IDs in one place.", status: "soon" },
        { title: "Dispute builder", desc: "Draft a dispute from your proof and download it as a PDF.", status: "soon" },
      ]}
    />
  );
}
