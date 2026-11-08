import { DemoLogin } from "@/components/demo-login";

export default function Home() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-10 text-center">
      <div>
        <h1 className="text-3xl font-semibold">PayHub AI</h1>
        <p className="mt-2 text-muted">Know where your money goes.</p>
      </div>
      <p className="text-sm text-muted">
        Check the true cost of an international purchase before you pay, pay with PayPal sandbox, then tag it for you,
        your family, or privately.
      </p>
      <DemoLogin />
    </div>
  );
}
