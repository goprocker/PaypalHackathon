import { DemoLogin } from "@/components/demo-login";

export default function SwitchPage() {
  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-2xl font-extrabold">Family</h1>
        <p className="mt-1 text-sm text-muted">Switch member to see the hub from their side. Private items stay private.</p>
      </div>
      <DemoLogin />
    </div>
  );
}
