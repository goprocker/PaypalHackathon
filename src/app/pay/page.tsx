import { redirect } from "next/navigation";
import { Checkout } from "@/components/checkout/checkout";
import { paypalMock } from "@/lib/paypal";
import { currentUserId } from "@/lib/session";

export default async function PayPage() {
  if (!(await currentUserId())) redirect("/");
  const mock = paypalMock() || !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Checkout Copilot</h1>
        <p className="text-sm text-muted">Check the true cost before you pay. All amounts are estimates based on assumptions.</p>
      </div>
      <Checkout mock={mock} clientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ""} />
    </div>
  );
}
