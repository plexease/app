import { LogoIcon } from "./logo-icon";
import { LogoWordmark } from "./logo-wordmark";

type Props = {
  iconSize?: number;
  textSize?: number;
  className?: string;
};

export function Logo({ iconSize = 28, textSize = 20, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoIcon size={iconSize} />
      <LogoWordmark size={textSize} />
    </span>
  );
}
