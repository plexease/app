import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl text-gray-400">Page not found</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        Go home
      </Link>
    </main>
  );
}
