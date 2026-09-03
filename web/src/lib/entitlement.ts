import { Entitlement } from "./types";

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

export function isPaid(entitlement: Entitlement | null | undefined): boolean {
  if (!entitlement) return false;
  if (entitlement.tier !== "pro") return false;

  // If valid_until is null, it is permanent (e.g. classic skin)
  if (!entitlement.valid_until) return true;

  // Check expiration timestamp
  const expiry = new Date(entitlement.valid_until).getTime();
  return expiry > Date.now();
}
