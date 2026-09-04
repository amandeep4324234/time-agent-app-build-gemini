export interface SyncRow {
  pair_id: string;
  ciphertext: string;
  nonce?: string;
  seq: number;
  updated_at: string;
  expires_at?: string;
  version?: string;
}

const inMemorySyncRows = new Map<string, SyncRow>();

export async function putSyncRow(row: {
  pair_id: string;
  ciphertext: string;
  nonce?: string;
  seq: number;
}): Promise<{ ok: boolean; version?: string; error?: string }> {
  const existing = inMemorySyncRows.get(row.pair_id);
  if (existing && row.seq <= existing.seq) {
    return { ok: false, error: "SEQ_REGRESSED" };
  }

  const now = Date.now();
  const updated_at = new Date(now).toISOString();
  const expires_at = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
  const version = `W/"sync-${row.seq}-${now}"`;

  const record: SyncRow = {
    pair_id: row.pair_id,
    ciphertext: row.ciphertext,
    nonce: row.nonce,
    seq: row.seq,
    updated_at,
    expires_at,
    version,
  };

  inMemorySyncRows.set(row.pair_id, record);
  return { ok: true, version };
}

export async function getSyncRow(pairId: string): Promise<SyncRow | null> {
  const row = inMemorySyncRows.get(pairId);
  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    inMemorySyncRows.delete(pairId);
    return null;
  }
  return row;
}
