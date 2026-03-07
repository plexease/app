type Props = {
  size?: number;
  className?: string;
};

export function LogoIcon({ size = 48, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={`group ${className}`}
    >
      {/* Connection lines */}
      <line x1="12" y1="14" x2="30" y2="10" className="stroke-surface-700" strokeWidth="2.5" />
      <line x1="30" y1="10" x2="38" y2="28" className="stroke-surface-700" strokeWidth="2.5" />
      <line x1="38" y1="28" x2="18" y2="36" className="stroke-surface-700" strokeWidth="2.5" />
      <line x1="18" y1="36" x2="12" y2="14" className="stroke-surface-700" strokeWidth="2.5" />

      {/* Nodes with hover animation */}
      <circle
        cx="12" cy="14" r="5"
        className="fill-brand-500 transition-transform duration-300 origin-center motion-safe:group-hover:-translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
      />
      <circle
        cx="30" cy="10" r="5"
        className="fill-brand-300 transition-transform duration-300 origin-center motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
      />
      <circle
        cx="38" cy="28" r="5"
        className="fill-brand-400 transition-transform duration-300 origin-center motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:translate-y-0.5"
      />
      <circle
        cx="18" cy="36" r="5"
        className="fill-brand-600 transition-transform duration-300 origin-center motion-safe:group-hover:-translate-x-0.5 motion-safe:group-hover:translate-y-0.5"
      />
    </svg>
  );
}
