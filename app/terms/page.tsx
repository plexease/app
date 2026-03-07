import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
};

export default function TermsOfService() {
  return (
    <main id="main-content" className="min-h-screen bg-surface-950 text-white">
      <Nav />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-heading text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-500">Last updated: 7 March 2026</p>

        <section className="mt-10 space-y-4 text-sm leading-relaxed text-muted-300">
          <h2 className="font-heading text-xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Plexease (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service (&quot;Terms&quot;). If you do not agree, you must not use the Service.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">2. Description of Service</h2>
          <p>
            Plexease provides AI-powered integration tools designed for .NET developers,
            tech support staff, and small businesses. The Service includes tools such as the
            NuGet Package Advisor, with additional tools added over time. All AI-generated
            outputs are produced using third-party large language models.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">3. Account Registration</h2>
          <p>
            To access certain features, you must create an account by providing a valid email
            address and password. You are responsible for maintaining the confidentiality of
            your account credentials and for all activity that occurs under your account.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">4. Free and Pro Plans</h2>
          <p>
            The Service offers a Free plan (20 tool uses per month) and a Pro plan
            (&pound;19/month or &pound;190/year) with unlimited tool uses, saved history, and
            priority AI responses. We reserve the right to modify plan features and pricing
            with 30 days&apos; notice.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">5. Payment Terms</h2>
          <p>
            Pro subscriptions are billed in GBP via Stripe. Payments are non-refundable except
            where required by law. You may cancel your subscription at any time through the
            billing portal; access continues until the end of the current billing period. We do
            not store your payment card details — all payment processing is handled by Stripe.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to reverse-engineer, scrape, or extract data from the Service</li>
            <li>Abuse AI tools by submitting harmful, misleading, or excessively repetitive queries</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Share your account credentials with third parties</li>
          </ul>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">7. Intellectual Property</h2>
          <p>
            You retain ownership of any inputs you provide to the Service. AI-generated outputs
            are provided for your use but come with no guarantee of originality or accuracy.
            The Plexease platform, brand, and code are the intellectual property of the Service
            operator.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">8. AI Disclaimer</h2>
          <p>
            AI-generated outputs are for informational purposes only and do not constitute
            professional, legal, financial, or technical advice. You should independently verify
            any information or recommendations before relying on them. We make no warranties
            regarding the accuracy, completeness, or suitability of AI outputs.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Plexease and its operator shall not be
            liable for any indirect, incidental, special, consequential, or punitive damages
            arising from your use of the Service. Our total liability shall not exceed the
            amount you paid for the Service in the 12 months preceding the claim.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">10. Termination</h2>
          <p>
            We may suspend or terminate your account if you breach these Terms. You may delete
            your account at any time by contacting us. Upon termination, your right to use the
            Service ceases immediately, though provisions that by their nature should survive
            (such as limitation of liability) will remain in effect.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">11. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of England
            and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts
            of England and Wales.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">12. Contact</h2>
          <p>
            If you have questions about these Terms, please contact us at{" "}
            <a href="mailto:hello@plexease.io" className="text-brand-400 hover:text-brand-300 transition-colors">
              hello@plexease.io
            </a>.
          </p>
        </section>
      </article>
      <Footer />
    </main>
  );
}
