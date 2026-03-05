import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20">
          <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">Check your email</h1>
        <p className="text-gray-400">
          We&apos;ve sent you a confirmation link. Click the link in your email to activate your account.
        </p>
        <p className="text-sm text-gray-500">
          Didn&apos;t receive it? Check your spam folder.
        </p>
        <Link href="/login" className="inline-block text-sm text-blue-400 hover:text-blue-300">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
