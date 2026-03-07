export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-surface-700 border-t-brand-500 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
