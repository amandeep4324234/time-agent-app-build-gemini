import {
  Clock,
  KeyValueStore,
  LedgerSource,
  PaymentProvider,
  EntitlementProvider,
  LogPort,
} from "../../ports";
import { Envelope, Grant, Entitlement, LogEntry } from "../../types";

export class TestClock implements Clock {
  constructor(private currentMs = 1786762800000) {} // 2026-08-14T10:00:00Z
  now(): number {
    return this.currentMs;
  }
  set(ms: number) {
    this.currentMs = ms;
  }
}

export class InMemoryKeyValueStore implements KeyValueStore {
  private store = new Map<string, string>();
  get(key: string): string | null {
    return this.store.get(key) || null;
  }
  set(key: string, value: string): void {
    this.store.set(key, value);
  }
  remove(key: string): void {
    this.store.delete(key);
  }
}

export class FixtureLedgerSource implements LedgerSource {
  constructor(private envelope: Envelope) {}
  async load(): Promise<Envelope> {
    return this.envelope;
  }
}

export class ScriptedPaymentProvider implements PaymentProvider {
  async createOrder(plan: "monthly" | "annual" | "skin", aid: string): Promise<{ ref: string }> {
    return { ref: `order_fake_${plan}_${aid}` };
  }
  async verify(payload: { ref: string; proof: unknown }): Promise<Grant> {
    return {
      aid: "test-aid",
      tier: "pro",
      plan: "monthly",
      src: "test",
      ref: payload.ref,
      skin: null,
      valid_until: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      jti: "test-jti",
    };
  }
}

export class FakeEntitlementProvider implements EntitlementProvider {
  constructor(private ent: Entitlement | null = null) {}
  async current(): Promise<Entitlement | null> {
    return this.ent;
  }
  async restore(input: { paymentRef: string; aid: string }): Promise<Entitlement | null> {
    return this.ent;
  }
}

export class NoopLogPort implements LogPort {
  logs: LogEntry[] = [];
  log(entry: LogEntry): void {
    this.logs.push(entry);
  }
}
