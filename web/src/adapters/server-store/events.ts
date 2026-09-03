export interface EntitlementEvent {
  id: string;
  at: string;
  type: string;
  aid: string | null;
  ref: string | null;
  entity_id: string | null;
  payload_digest: string | null;
}

const inMemoryEvents: EntitlementEvent[] = [];

export async function logEntitlementEvent(
  type: string,
  aid: string | null,
  ref: string | null,
  entityId: string | null,
  digest: string | null = null
): Promise<EntitlementEvent> {
  const event: EntitlementEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    type,
    aid,
    ref,
    entity_id: entityId,
    payload_digest: digest,
  };
  inMemoryEvents.push(event);
  return event;
}

export async function listEntitlementEvents(): Promise<EntitlementEvent[]> {
  return [...inMemoryEvents];
}
