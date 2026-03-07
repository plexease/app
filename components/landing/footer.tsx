import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ManageCookiesButton } from "@/components/ui/manage-cookies-button";

export function Footer() {
  return (
    <footer className="border-t border-surface-700 px-6 py-12 lg:px-12">
      <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-3">
        {/* Brand */}
        <div>
          <Logo iconSize={24} textSize={18} />
          <p className="mt-3 text-sm text-muted-500">
            Complex integrations, with ease
          </p>
          <p className="mt-4 text-xs text-muted-500">
            &copy; {new Date().getFullYear()} Plexease. All rights reserved.
          </p>
        </div>

        {/* Product */}
        <div>
          <h3 className="font-heading text-sm font-semibold text-muted-300">Product</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="/#tools" className="text-muted-500 hover:text-muted-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-1 py-0.5">
                Tools
              </a>
            </li>
            <li>
              <a href="/#pricing" className="text-muted-500 hover:text-muted-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-1 py-0.5">
                Pricing
              </a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="font-heading text-sm font-semibold text-muted-300">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/terms" className="text-muted-500 hover:text-muted-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-1 py-0.5">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-muted-500 hover:text-muted-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-1 py-0.5">
                Privacy Policy
              </Link>
            </li>
            <li>
              <ManageCookiesButton />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
