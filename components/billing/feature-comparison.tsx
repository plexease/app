const features = [
  { name: "Tool uses", free: "20/month", pro: "Unlimited" },
  { name: "All available tools", free: true, pro: true },
  { name: "Saved history", free: false, pro: true },
  { name: "Priority AI responses", free: false, pro: true },
];

export function FeatureComparison() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900">
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Feature</th>
            <th className="px-6 py-3 text-center text-sm font-medium text-gray-400">Free</th>
            <th className="px-6 py-3 text-center text-sm font-medium text-blue-400">Pro</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.name} className="border-b border-gray-800 last:border-0">
              <td className="px-6 py-3 text-sm text-gray-300">{feature.name}</td>
              <td className="px-6 py-3 text-center text-sm">
                {typeof feature.free === "boolean" ? (
                  feature.free ? (
                    <span className="text-green-400">&#10003;</span>
                  ) : (
                    <span className="text-gray-600">&mdash;</span>
                  )
                ) : (
                  <span className="text-gray-300">{feature.free}</span>
                )}
              </td>
              <td className="px-6 py-3 text-center text-sm">
                {typeof feature.pro === "boolean" ? (
                  feature.pro ? (
                    <span className="text-green-400">&#10003;</span>
                  ) : (
                    <span className="text-gray-600">&mdash;</span>
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
