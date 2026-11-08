"use client";

import { PayPalOneTimePaymentButton, PayPalProvider } from "@paypal/react-paypal-js/sdk-v6";
import { Loader2, Lock } from "lucide-react";
import { useState } from "react";

interface Props {
  mock: boolean;
  clientId: string;
  payload: Record<string, unknown>;
  onPaid: (txnId: string) => void;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

export function PayButton({ mock, clientId, payload, onPaid }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const createOrder = async () => {
    setError(null);
    const { orderId } = await post<{ orderId: string }>("/api/paypal/orders", payload);
    return { orderId };
  };
  const capture = async (orderId: string) => {
    const { txnId } = await post<{ txnId: string }>("/api/paypal/capture", { orderId });
    onPaid(txnId);
  };

  if (mock) {
    return (
      <>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const { orderId } = await createOrder();
              await capture(orderId);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
        >
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Lock aria-hidden className="size-4" />}
          {busy ? "Paying" : "Pay with mock PayPal"}
        </button>
        {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
      </>
    );
  }

  return (
    <PayPalProvider clientId={clientId} environment="sandbox" components={["paypal-payments"]} pageType="checkout">
      <PayPalOneTimePaymentButton
        createOrder={async () => {
          try {
            return await createOrder();
          } catch (e) {
            setError((e as Error).message);
            throw e;
          }
        }}
        onApprove={async ({ orderId }) => {
          try {
            await capture(orderId);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
        onCancel={() => setError("Payment cancelled. Nothing was charged.")}
        onError={() => setError("PayPal had a problem. Nothing was charged; please try again.")}
      />
      {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
    </PayPalProvider>
  );
}
