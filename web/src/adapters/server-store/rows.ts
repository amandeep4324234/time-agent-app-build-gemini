import { Entitlement, Grant } from "../../lib/types";

export interface EntitlementDbRow {
  aid: string;
  tier: "free" | "pro";
  plan: "monthly" | "annual" | "skin" | null;
  src: string | null;
  ref: string | null;
  skin: "classic" | null;
  valid_until: string | null;
  jti: string | null;
  revoked_at: string | null;
}

const globalForRows = globalThis as unknown as {
  inMemoryRows?: Map<string, EntitlementDbRow>;
};

// In-memory backing for local development and testing
const inMemoryRows =
  globalForRows.inMemoryRows ??
  (globalForRows.inMemoryRows = new Map<string, EntitlementDbRow>());

export async function getEntitlementRow(aid: string): Promise<EntitlementDbRow | null> {
  return inMemoryRows.get(aid) || null;
}

export async function getEntitlementRowByRef(ref: string): Promise<EntitlementDbRow | null> {
  for (const row of inMemoryRows.values()) {
    if (row.ref === ref) return row;
  }
  return null;
}

export async function writeGrantRow(grant: Grant): Promise<EntitlementDbRow> {
  const row: EntitlementDbRow = {
    aid: grant.aid,
    tier: grant.tier,
    plan: grant.plan,
    src: grant.src,
    ref: grant.ref,
    skin: grant.skin,
    valid_until: grant.valid_until,
    jti: grant.jti,
    revoked_at: null,
  };
  inMemoryRows.set(grant.aid, row);
  return row;
}

export async function revokeEntitlementRow(aid: string): Promise<boolean> {
  const existing = inMemoryRows.get(aid);
  if (!existing) return false;
  existing.revoked_at = new Date().toISOString();
  existing.tier = "free";
  return true;
}

export async function updateEntitlementCrossDevice(aid: string, crossDevice = true): Promise<boolean> {
  const existing = inMemoryRows.get(aid);
  if (!existing) return false;
  (existing as any).cross_device = crossDevice;
  return true;
}

