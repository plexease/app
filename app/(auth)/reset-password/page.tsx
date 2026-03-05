import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Set new password</h1>
          <p className="mt-2 text-gray-400">
            Enter your new password below
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
