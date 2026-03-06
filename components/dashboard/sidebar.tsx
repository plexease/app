import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-950 px-4 py-6">
      <Link href="/dashboard" className="text-xl font-bold text-white">
        Plexease
      </Link>

      <nav className="mt-8 flex-1 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/tools/nuget-advisor"
          className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          NuGet Advisor
        </Link>
      </nav>

      <div className="border-t border-gray-800 pt-4">
        <SignOutButton />
      </div>
    </aside>
  );
}
