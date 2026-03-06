const friendlyMessages: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "Email not confirmed": "Please check your email and confirm your account.",
  "User already registered": "An account with this email already exists.",
  "Password should be at least 6 characters":
    "Password must be at least 6 characters.",
  "Email rate limit exceeded": "Too many attempts. Please try again later.",
  "For security purposes, you can only request this after 60 seconds":
    "Please wait 60 seconds before trying again.",
};

export function friendlyAuthError(message: string): string {
  return friendlyMessages[message] ?? "Something went wrong. Please try again.";
}
