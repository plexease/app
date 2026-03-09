export type Persona = "business_owner" | "support_ops" | "implementer";

export type ComfortLevel = "guided" | "docs_configs" | "writes_code";

export type PrimaryGoal = "setup" | "fixing" | "evaluating" | "exploring";

export interface UserProfile {
  id: string;
  persona: Persona;
  comfortLevel: ComfortLevel | null;
  platforms: string[];
  primaryGoal: PrimaryGoal | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PERSONA_LABELS: Record<Persona, string> = {
  business_owner: "Business Owner",
  support_ops: "Support & Operations",
  implementer: "Implementer",
};

/** Ephemeral view mode — which persona's UI to render. Stored in cookie, defaults to user's persona. */
export type ViewingAs = Persona;

export const PLATFORM_OPTIONS = [
  { id: "shopify", label: "Shopify" },
  { id: "woocommerce", label: "WooCommerce" },
  { id: "xero", label: "Xero" },
  { id: "stripe", label: "Stripe" },
  { id: "royal-mail", label: "Royal Mail" },
  { id: "quickbooks", label: "QuickBooks" },
  { id: "magento", label: "Magento" },
] as const;
