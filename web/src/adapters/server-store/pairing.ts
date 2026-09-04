import crypto from "crypto";

interface PairingCodeRow {
  codeHash: string;
  aid: string;
  issued_at: string;
  expires_at: string;
  used_at: string | null;
  failed_attempts: number;
}

const globalForPairing = globalThis as unknown as {
  inMemoryPairing?: Map<string, PairingCodeRow>;
};

const inMemoryPairing =
  globalForPairing.inMemoryPairing ??
  (globalForPairing.inMemoryPairing = new Map<string, PairingCodeRow>());
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 glyphs, excludes 0, O, 1, I
const SECRET = process.env.ENTITLEMENT_SECRET || "dev-secret-entitlement-key-must-be-32-chars-minimum";

function hashCode(code: string): string {
  return crypto.createHmac("sha256", SECRET).update(`pairing:v1:${code}`).digest("hex");
}

export function generatePairingCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[idx];
  }
  return code;
}

export async function issuePairingCode(aid: string): Promise<{ code: string; expires_at: string }> {
  for (const [key, row] of inMemoryPairing.entries()) {
    if (row.aid === aid) {
      inMemoryPairing.delete(key);
    }
  }

  const code = generatePairingCode();
  const codeHash = hashCode(code);
  const now = Date.now();
  const issuedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + 15 * 60 * 1000).toISOString(); // 15-min TTL

  inMemoryPairing.set(codeHash, {
    codeHash,
    aid,
    issued_at: issuedAt,
    expires_at: expiresAt,
    used_at: null,
    failed_attempts: 0,
  });

  return { code, expires_at: expiresAt };
}

export async function redeemPairingCode(
  code: string,
  deviceAid?: string
): Promise<{ success: boolean; aid?: string; error?: string; status?: number }> {
  const cleanCode = code.trim().toUpperCase();
  const codeHash = hashCode(cleanCode);
  const entry = inMemoryPairing.get(codeHash);

  if (!entry) {
    return { success: false, error: "CODE_EXPIRED", status: 410 };
  }

  if (entry.failed_attempts >= 5) {
    return { success: false, error: "CODE_BURNED", status: 410 };
  }

  if (entry.used_at !== null) {
    return { success: false, error: "CODE_USED", status: 410 };
  }

  if (new Date(entry.expires_at).getTime() < Date.now()) {
    return { success: false, error: "CODE_EXPIRED", status: 410 };
  }

  // Atomically mark as used
  entry.used_at = new Date().toISOString();
  return { success: true, aid: entry.aid, status: 200 };
}
