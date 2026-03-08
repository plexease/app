"use client";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  label: string;
  hint?: string;
};

export function CharLimitedInput({
  id,
  value,
  onChange,
  maxLength,
  placeholder,
  disabled,
  rows = 6,
  label,
  hint,
}: Props) {
  const remaining = maxLength - value.length;
  const isNearLimit = remaining <= Math.floor(maxLength * 0.1);
  const isAtLimit = remaining <= 0;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-muted-300">
        {label}
      </label>
      {hint && <p className="mt-1 text-xs text-muted-500">{hint}</p>}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-sm text-white placeholder-muted-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 font-mono"
      />
      <p className={`mt-1 text-xs ${isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-muted-500"}`}>
        {remaining.toLocaleString()} characters remaining
      </p>
    </div>
  );
}
