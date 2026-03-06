import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthHeader } from "@/components/auth/auth-header";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <AuthHeader />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Set new password</h1>
          <p className="mt-2 text-gray-400">
            Enter your new password below
          </p>
        </div>
        <ResetPasswordForm />
        <p className="text-center text-sm text-gray-400">
          Remember your password?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
