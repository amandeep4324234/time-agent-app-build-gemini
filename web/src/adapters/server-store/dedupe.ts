interface DedupeEntry {
  eventId: string;
  entityId: string;
  processedAt: string;
}

const globalForDedupe = globalThis as unknown as {
  inMemoryDedupe?: Map<string, DedupeEntry>;
};

const inMemoryDedupe =
  globalForDedupe.inMemoryDedupe ??
  (globalForDedupe.inMemoryDedupe = new Map<string, DedupeEntry>());

function dedupeKey(eventId: string, entityId: string): string {
  return `${eventId}:${entityId}`;
}

/**
 * Checks if a webhook event was already processed.
 * If not, records it idempotently and returns true (new).
 * If already processed, returns false.
 */
export async function recordWebhookProcessed(eventId: string, entityId: string): Promise<boolean> {
  const key = dedupeKey(eventId, entityId);
  if (inMemoryDedupe.has(key)) {
    return false; // Already processed
  }
  inMemoryDedupe.set(key, {
    eventId,
    entityId,
    processedAt: new Date().toISOString(),
  });
  return true;
}

export async function isWebhookProcessed(eventId: string, entityId: string): Promise<boolean> {
  return inMemoryDedupe.has(dedupeKey(eventId, entityId));
}
