import { SectionPage } from "@/components/section-page";

export default function ProtectPage() {
  return (
    <SectionPage
      section="protect"
      features={[
        { title: "Payment-link checker", desc: "Paste a link and see red flags before you open it.", status: "soon" },
        { title: "QR risk scan", desc: "Scan or upload a QR code to see who really gets paid.", status: "soon" },
        { title: "Fake collect-request warning", desc: "Spot UPI collect requests that take money instead of sending it.", status: "soon" },
        { title: "OTP scam awareness", desc: "A quick quiz on the tricks scammers use.", status: "soon" },
        { title: "Merchant Trust Score", desc: "How safe a merchant looks, and why.", status: "soon" },
      ]}
    />
  );
}
