import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function Nav() {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 lg:px-12">
      <Link href="/" aria-label="Plexease home" className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950 rounded-lg">
        <Logo iconSize={28} textSize={22} />
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm text-muted-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950 rounded-lg px-2 py-1"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium hover:bg-brand-600 shadow-glow transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}
