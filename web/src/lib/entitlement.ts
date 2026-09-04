import { Entitlement } from "./types";

export const DEV_PRO_AID = "dev-local-user";
export const DEV_PRO_SRC = "dev-override";
export const DEV_PRO_REF = "dev_pro_access";
export const DEV_PRO_JTI = "dev_pro_jti";

/**
 * Checks whether the current runtime environment is non-production (development / test).
 */
export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Checks whether an entitlement represents a dev-override / test pro grant.
 */
export function isDevEntitlement(
  entitlement:
    | Partial<Entitlement>
    | { sub?: string; aid?: string | null; src?: string | null; ref?: string | null; jti?: string | null }
    | null
    | undefined
): boolean {
  if (!entitlement) return false;
  return (
    entitlement.src === DEV_PRO_SRC ||
    entitlement.ref === DEV_PRO_REF ||
    entitlement.aid === DEV_PRO_AID ||
    ("sub" in entitlement && entitlement.sub === DEV_PRO_AID) ||
    entitlement.jti === DEV_PRO_JTI
  );
}

/**
 * Generates a mock Pro entitlement for developer testing.
 *
 * CRITICAL SECURITY: This logic is strictly deprecated and rejected in production.
 * In production builds, attempting to create or use dev entitlements fails closed.
 */
export function createDevProEntitlement(): Entitlement {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[SECURITY DEPRECATION] createDevProEntitlement() is deprecated and forbidden in production environments."
    );
  }

  return {
    aid: DEV_PRO_AID,
    tier: "pro",
    plan: "annual",
    src: DEV_PRO_SRC,
    ref: DEV_PRO_REF,
    skin: "classic",
    valid_until: new Date(Date.now() + 365 * 86400000).toISOString(),
    jti: DEV_PRO_JTI,
  };
}

export function createFreeEntitlement(aid: string | null = null): Entitlement {
  return {
    aid,
    tier: "free",
    plan: null,
    src: null,
    ref: null,
    skin: null,
    valid_until: null,
    jti: null,
  };
}

/**
 * Evaluates whether an entitlement grants active Pro / Paid features.
 *
 * - Dev entitlements:
 *   - In dev/test: grants full Pro access so developers can test paid features.
 *   - In production: DEPRECATED & REJECTED. Returns false unconditionally to prevent unauthorized bypass.
 * - Standard entitlements:
 *   - Checks tier === "pro" and expiry timestamp against Date.now().
 */
export function isPaid(entitlement: Entitlement | null | undefined): boolean {
  if (!entitlement) return false;

  // Security guard for dev overrides: deprecated and deactivated in production
  if (isDevEntitlement(entitlement)) {
    if (process.env.NODE_ENV === "production") {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "[SECURITY DEPRECATION] Dev entitlement override attempted in production. Dev access is deprecated and disabled."
        );
      }
      return false;
    }
    return entitlement.tier === "pro";
  }

  if (entitlement.tier !== "pro") return false;

  // If valid_until is null, it is permanent (e.g. classic skin)
  if (!entitlement.valid_until) return true;

  // Check expiration timestamp
  const expiry = new Date(entitlement.valid_until).getTime();
  return expiry > Date.now();
}

