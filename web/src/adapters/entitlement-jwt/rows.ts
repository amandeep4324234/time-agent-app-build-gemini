import { Entitlement } from "../../lib/types";
import { getEntitlementRow, getEntitlementRowByRef } from "../server-store/rows";

export async function fetchEntitlementByAid(aid: string): Promise<Entitlement | null> {
  const row = await getEntitlementRow(aid);
  if (!row || row.revoked_at !== null) return null;
  return {
    aid: row.aid,
    tier: row.tier,
    plan: row.plan,
    src: row.src,
    ref: row.ref,
    skin: row.skin,
    valid_until: row.valid_until,
    jti: row.jti,
  };
}

export async function fetchEntitlementByPaymentRef(ref: string): Promise<Entitlement | null> {
  const row = await getEntitlementRowByRef(ref);
  if (!row || row.revoked_at !== null) return null;
  return {
    aid: row.aid,
    tier: row.tier,
    plan: row.plan,
    src: row.src,
    ref: row.ref,
    skin: row.skin,
    valid_until: row.valid_until,
    jti: row.jti,
  };
}
