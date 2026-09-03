interface PairingCodeRow {
  code: string;
  aid: string;
  issued_at: string;
  expires_at: string;
  used_at: string | null;
  failed_attempts: number;
}

const inMemoryPairing = new Map<string, PairingCodeRow>();
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Excludes 0, O, 1, I

export function generatePairingCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[idx];
  }
  return code;
}

export async function issuePairingCode(aid: string): Promise<string> {
  const code = generatePairingCode();
  const now = Date.now();
  const issuedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString(); // 24h TTL

  inMemoryPairing.set(code, {
    code,
    aid,
    issued_at: issuedAt,
    expires_at: expiresAt,
    used_at: null,
    failed_attempts: 0,
  });

  return code;
}

export async function redeemPairingCode(code: string): Promise<{ success: boolean; aid?: string; error?: string }> {
  const cleanCode = code.trim().toUpperCase();
  const entry = inMemoryPairing.get(cleanCode);

  if (!entry) {
    return { success: false, error: "PAIRING_CODE_NOT_FOUND" };
  }

  if (entry.used_at !== null) {
    return { success: false, error: "PAIRING_CODE_ALREADY_USED" };
  }

  if (new Date(entry.expires_at).getTime() < Date.now()) {
    return { success: false, error: "PAIRING_CODE_EXPIRED" };
  }

  // Atomically mark as used
  entry.used_at = new Date().toISOString();
  return { success: true, aid: entry.aid };
}
