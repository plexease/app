import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/tools", "/upgrade"];
const authRoutes = ["/login", "/signup", "/forgot-password", "/check-email", "/reset-password"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes
  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth routes
  if (user && authRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Onboarding check for authenticated users on protected routes
  const onboardingExemptPaths = ["/onboarding", "/api/", "/upgrade/success", "/cancelled"];
  const isOnboardingExempt = onboardingExemptPaths.some((p) => pathname.startsWith(p));

  if (user && !isOnboardingExempt && protectedRoutes.some((route) => pathname.startsWith(route))) {
    // Check cookie first to avoid DB query on every request
    // Cookie value is bound to user ID to prevent leaking across sessions
    const onboardedCookie = request.cookies.get("plexease_onboarded");
    if (!onboardedCookie || onboardedCookie.value !== user.id) {
      // Query DB to check onboarding status
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.onboarding_completed) {
        const onboardingUrl = request.nextUrl.clone();
        onboardingUrl.pathname = "/onboarding";
        return NextResponse.redirect(onboardingUrl);
      }

      // User is onboarded — set cookie so we skip DB query next time
      supabaseResponse.cookies.set("plexease_onboarded", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
  }

  // Session validation for authenticated users on protected routes
  if (user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const sessionCookie = request.cookies.get("plexease_session_id");

    if (sessionCookie) {
      const sessionCheckedAt = request.cookies.get("session_checked_at");
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      const needsCheck =
        !sessionCheckedAt || now - parseInt(sessionCheckedAt.value, 10) > fiveMinutes;

      if (needsCheck) {
        const { validateSession } = await import("@/lib/sessions");
        const isValid = await validateSession(sessionCookie.value);

        if (!isValid) {
          // Session was invalidated (e.g. signed out from another device)
          const loginUrl = request.nextUrl.clone();
          loginUrl.pathname = "/login";
          loginUrl.searchParams.set("reason", "session_expired");
          const redirectResponse = NextResponse.redirect(loginUrl);
          redirectResponse.cookies.delete("plexease_session_id");
          redirectResponse.cookies.delete("session_checked_at");
          // Clear Supabase auth cookies
          request.cookies.getAll().forEach((cookie) => {
            if (cookie.name.startsWith("sb-")) {
              redirectResponse.cookies.delete(cookie.name);
            }
          });
          return redirectResponse;
        }

        // Session is valid — cache the check
        supabaseResponse.cookies.set("session_checked_at", now.toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 300, // 5 minutes
        });
      }
    }
    // No session cookie but authenticated = backwards compatible (pre-session-enforcement logins)
  }

  return supabaseResponse;
}
