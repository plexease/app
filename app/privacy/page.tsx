import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicy() {
  return (
    <main id="main-content" className="min-h-screen bg-surface-950 text-white">
      <Nav />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-heading text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-500">Last updated: 7 March 2026</p>

        <section className="mt-10 space-y-4 text-sm leading-relaxed text-muted-300">
          <h2 className="font-heading text-xl font-semibold text-white">1. Data Controller</h2>
          <p>
            Plexease is operated by a sole trader registered in the United Kingdom. For the
            purposes of the UK General Data Protection Regulation (UK GDPR) and the Data
            Protection Act 2018, the data controller is the operator of Plexease.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">2. Data We Collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li><strong className="text-white">Account data:</strong> email address and hashed password (managed by Supabase Auth)</li>
            <li><strong className="text-white">Usage data:</strong> which tools you use and how many times per month</li>
            <li><strong className="text-white">Payment data:</strong> billing information processed by Stripe (we do not store card numbers)</li>
            <li><strong className="text-white">Technical data:</strong> IP address, browser type, and device information collected automatically</li>
          </ul>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">3. How We Use Your Data</h2>
          <p>We use your personal data to:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Provide and maintain your account and access to the Service</li>
            <li>Process payments and manage your subscription</li>
            <li>Process your inputs through AI tools and return results</li>
            <li>Enforce usage limits and monitor for abuse</li>
            <li>Communicate service updates or changes</li>
          </ul>
          <p>
            We do not sell your personal data. We do not use your tool inputs for training
            AI models.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">4. Third-Party Processors</h2>
          <p>We share data with the following processors, each under appropriate safeguards:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li><strong className="text-white">Supabase</strong> (auth and database hosting) — USA</li>
            <li><strong className="text-white">Stripe</strong> (payment processing) — USA</li>
            <li><strong className="text-white">Anthropic</strong> (AI model provider, Claude API) — USA</li>
            <li><strong className="text-white">Vercel</strong> (application hosting and deployment) — USA</li>
          </ul>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">5. Cookies</h2>
          <p>
            We use cookies to manage your authentication session and remember your cookie
            consent preference. We do not use third-party tracking or advertising cookies.
            You can manage your cookie preferences at any time using the &quot;Manage cookies&quot;
            option in the footer.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">6. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. Usage data is
            retained for 12 months for billing and analytics purposes. Payment records are
            retained as required by UK tax law (typically 6 years). If you delete your account,
            we will remove your personal data within 30 days, except where retention is required
            by law.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">7. Your Rights</h2>
          <p>Under the UK GDPR, you have the right to:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li><strong className="text-white">Access</strong> your personal data</li>
            <li><strong className="text-white">Rectify</strong> inaccurate personal data</li>
            <li><strong className="text-white">Erase</strong> your personal data (&quot;right to be forgotten&quot;)</li>
            <li><strong className="text-white">Port</strong> your data to another service</li>
            <li><strong className="text-white">Object</strong> to processing of your personal data</li>
            <li><strong className="text-white">Restrict</strong> processing in certain circumstances</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at the email address below. We will
            respond within 30 days. You also have the right to lodge a complaint with the
            Information Commissioner&apos;s Office (ICO) at{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 transition-colors">
              ico.org.uk
            </a>.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">8. International Transfers</h2>
          <p>
            Our third-party processors (Supabase, Stripe, Anthropic, Vercel) are based in the
            United States. Data transfers to the US are protected under appropriate safeguards
            including Standard Contractual Clauses and the EU-US Data Privacy Framework where
            applicable.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">9. Children&apos;s Privacy</h2>
          <p>
            The Service is not designed for or directed at individuals under the age of 16. We
            do not knowingly collect personal data from children. If we become aware that we
            have collected data from a child under 16, we will delete it promptly.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify registered
            users of material changes via email. The &quot;Last updated&quot; date at the top of this
            page indicates when the policy was last revised.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">11. Contact</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your data
            rights, please contact us at{" "}
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
