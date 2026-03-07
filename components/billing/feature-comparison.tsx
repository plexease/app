const features = [
  { name: "Tool uses", free: "20/month", pro: "Unlimited" },
  { name: "All available tools", free: true, pro: true },
  { name: "Saved history", free: false, pro: true },
  { name: "Priority AI responses", free: false, pro: true },
];

export function FeatureComparison() {
  return (
    <div className="overflow-hidden rounded-lg border border-surface-700">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-700 bg-surface-900">
            <th className="px-6 py-3 text-left font-heading text-sm font-medium text-muted-400">Feature</th>
            <th className="px-6 py-3 text-center font-heading text-sm font-medium text-muted-400">Free</th>
            <th className="px-6 py-3 text-center font-heading text-sm font-medium text-brand-400">Pro</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.name} className="border-b border-surface-700 last:border-0">
              <td className="px-6 py-3 text-sm text-muted-300">{feature.name}</td>
              <td className="px-6 py-3 text-center text-sm">
                {typeof feature.free === "boolean" ? (
                  feature.free ? (
                    <span className="text-green-400">&#10003;</span>
                  ) : (
                    <span className="text-muted-500">&mdash;</span>
                  )
                ) : (
                  <span className="text-muted-300">{feature.free}</span>
                )}
              </td>
              <td className="px-6 py-3 text-center text-sm">
                {typeof feature.pro === "boolean" ? (
                  feature.pro ? (
                    <span className="text-green-400">&#10003;</span>
                  ) : (
                    <span className="text-muted-500">&mdash;</span>
                  )
                ) : (
                  <span className="text-white font-medium">{feature.pro}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
