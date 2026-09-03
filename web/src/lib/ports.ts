import { Envelope, Grant, Entitlement, WeekCardModel, LogEntry, EncryptedSyncRow } from './types';

export interface Clock {
  now(): number; // epoch ms
}

export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export interface LedgerSource {
  load(): Promise<Envelope>; // v1: bundled demo/real export file; later: user file import
}

export interface PaymentProvider {
  createOrder(plan: "monthly" | "annual" | "skin", aid: string): Promise<{ ref: string }>;
  verify(payload: { ref: string; proof: unknown }): Promise<Grant>; // Grant is processor-neutral
}

export interface EntitlementProvider {
  current(): Promise<Entitlement | null>;   // GET /api/entitlement/me semantics
  restore(input: { paymentRef: string; aid: string }): Promise<Entitlement | null>;
}

export interface WeekCardImage {
  render(card: WeekCardModel, opts: { clean: boolean }): Promise<Blob>;
}

export interface LogPort {
  log(entry: LogEntry): void; // LogEntry is fence-safe (Section 8.3)
}

export interface SyncStore {
  publish(row: EncryptedSyncRow): Promise<void>; // ciphertext only; state, killer/private, seq — never labels
  poll(): Promise<EncryptedSyncRow | null>;
}
