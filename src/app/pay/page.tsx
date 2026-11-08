import { redirect } from "next/navigation";
import { Checkout } from "@/components/checkout/checkout";
import { paypalMock } from "@/lib/paypal";
import { currentUserId } from "@/lib/session";

export default async function PayPage() {
  if (!(await currentUserId())) redirect("/");
  const mock = paypalMock() || !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Check before you pay</h1>
        <p className="mt-1 text-sm text-muted">See the rupee total for a USD purchase. All amounts are estimates.</p>
      </div>
      <Checkout mock={mock} clientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ""} />
    </div>
  );
}
