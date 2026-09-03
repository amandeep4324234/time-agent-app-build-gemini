export interface SyncRow {
  pair_id: string;
  ciphertext: string;
  seq: number;
  updated_at: string;
}

const inMemorySyncRows = new Map<string, SyncRow>();

export async function putSyncRow(row: SyncRow): Promise<void> {
  const existing = inMemorySyncRows.get(row.pair_id);
  if (existing && existing.seq >= row.seq) {
    return; // Precedence: higher seq wins
  }
  inMemorySyncRows.set(row.pair_id, row);
}

export async function getSyncRow(pairId: string): Promise<SyncRow | null> {
  return inMemorySyncRows.get(pairId) || null;
}
