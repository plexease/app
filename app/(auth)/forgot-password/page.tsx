import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthHeader } from "@/components/auth/auth-header";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <AuthHeader />
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-white">Reset your password</h1>
          <p className="mt-2 text-muted-400">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-center text-sm text-muted-400">
          Remember your password?{" "}
          <Link href="/login" className="text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
