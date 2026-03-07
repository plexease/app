import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButton } from "@/components/auth/oauth-button";
import { AuthHeader } from "@/components/auth/auth-header";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <AuthHeader />
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-muted-400">Sign in to your Plexease account</p>
        </div>
        <OAuthButton />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-surface-950 px-2 text-muted-500">or</span>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-muted-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand-400 hover:text-brand-300">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
