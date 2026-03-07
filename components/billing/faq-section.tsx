const faqs = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You keep Pro access until your billing period ends, plus a 1-day grace period. No questions asked.",
  },
  {
    question: "What happens to my usage if I downgrade?",
    answer:
      "Your existing usage count is preserved. If you've used more than 20 tools this month, free tier limits apply immediately.",
  },
  {
    question: "Can I switch between monthly and annual?",
    answer:
      "Yes — click Manage Subscription and Stripe will handle the switch with prorated billing.",
  },
  {
    question: "Is my payment secure?",
    answer:
      "Payments are processed by Stripe, a PCI DSS Level 1 certified payment processor. We never see or store your card details.",
  },
];

export function FaqSection() {
  return (
    <div className="space-y-6">
      <h3 className="font-heading text-lg font-semibold text-white">Frequently asked questions</h3>
      <dl className="space-y-4">
        {faqs.map(({ question, answer }) => (
          <div key={question}>
            <dt className="text-sm font-medium text-muted-300">{question}</dt>
            <dd className="mt-1 text-sm text-muted-500">{answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
