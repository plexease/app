"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CHECKOUT_POLL_INTERVAL_MS, CHECKOUT_POLL_TIMEOUT_MS } from "@/lib/constants";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();

    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/stripe/checkout/status");
        const data = await res.json();

        if (data.plan === "pro") {
          clearInterval(poll);
          toast.success("Welcome to Pro! You now have unlimited access.");
          router.push("/dashboard");
        }
      } catch {
        // Ignore network errors during polling
      }

      if (Date.now() - startTime > CHECKOUT_POLL_TIMEOUT_MS) {
        clearInterval(poll);
        setTimedOut(true);
      }
    }, CHECKOUT_POLL_INTERVAL_MS);

    return () => clearInterval(poll);
  }, [router]);

  if (timedOut) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-white">Almost there...</h1>
          <p className="mt-4 text-muted-400">
            Your payment was received but setup is taking longer than expected.
          </p>
          <p className="mt-2 text-muted-400">
            Please refresh the page or contact support if this persists.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white hover:bg-brand-600 shadow-glow transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-surface-700 border-t-brand-500" />
        <h1 className="mt-6 font-heading text-2xl font-bold text-white">Setting up your Pro account...</h1>
        <p className="mt-2 text-muted-400">This usually takes just a few seconds.</p>
      </div>
    </div>
  );
}
