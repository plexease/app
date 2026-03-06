import Link from "next/link";

export function AuthHeader() {
  return (
    <div className="text-center">
      <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
        Plexease
      </Link>
    </div>
  );
}
