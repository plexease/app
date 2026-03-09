import { FREE_MONTHLY_LIMIT, ESSENTIALS_MONTHLY_LIMIT, PRO_MONTHLY_LIMIT } from "@/lib/constants";

const features = [
  { name: "Tool uses", free: `${FREE_MONTHLY_LIMIT}/month`, essentials: `${ESSENTIALS_MONTHLY_LIMIT}/month`, pro: `${PRO_MONTHLY_LIMIT}/month` },
  { name: "All available tools", free: true, essentials: true, pro: true },
  { name: "Saved history", free: false, essentials: true, pro: true },
  { name: "Priority AI responses", free: false, essentials: false, pro: true },
];

export function FeatureComparison() {
  return (
    <div className="overflow-hidden rounded-lg border border-surface-700">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-700 bg-surface-900">
            <th className="px-6 py-3 text-left font-heading text-sm font-medium text-muted-400">Feature</th>
            <th className="px-6 py-3 text-center font-heading text-sm font-medium text-muted-400">Free</th>
            <th className="px-6 py-3 text-center font-heading text-sm font-medium text-muted-400">Essentials</th>
            <th className="px-6 py-3 text-center font-heading text-sm font-medium text-brand-400">Pro</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.name} className="border-b border-surface-700 last:border-0">
              <td className="px-6 py-3 text-sm text-muted-300">{feature.name}</td>
              {(["free", "essentials", "pro"] as const).map((tier) => (
                <td key={tier} className="px-6 py-3 text-center text-sm">
                  {typeof feature[tier] === "boolean" ? (
                    feature[tier] ? (
                      <span className="text-green-400">&#10003;</span>
                    ) : (
                      <span className="text-muted-500">&mdash;</span>
                    )
                  ) : (
                    <span className={tier === "pro" ? "text-white font-medium" : "text-muted-300"}>
                      {feature[tier]}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
