type Props = {
  size?: number;
  className?: string;
};

export function LogoWordmark({ size = 20, className = "" }: Props) {
  return (
    <span
      className={`font-heading font-extrabold text-white ${className}`}
      style={{ fontSize: `${size}px` }}
    >
      Plex<span className="text-brand-400">ease</span>
    </span>
  );
}
