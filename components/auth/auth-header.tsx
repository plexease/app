import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function AuthHeader() {
  return (
    <div className="text-center">
      <Link href="/" aria-label="Plexease home" className="inline-block rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950">
        <Logo iconSize={32} textSize={24} />
      </Link>
    </div>
  );
}
