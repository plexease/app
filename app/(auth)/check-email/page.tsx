import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";

export default function CheckEmailPage() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <AuthHeader />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/20">
          <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl font-bold text-white">Check your email</h1>
        <p className="text-muted-400">
          We&apos;ve sent you a confirmation link. Click the link in your email to activate your account.
        </p>
        <p className="text-sm text-muted-500">
          Didn&apos;t receive it? Check your spam folder.
        </p>
        <div className="flex flex-col items-center gap-2">
          <Link href="/login" className="text-sm text-brand-400 hover:text-brand-300">
            Back to sign in
          </Link>
          <Link href="/" className="text-sm text-muted-500 hover:text-muted-400">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
