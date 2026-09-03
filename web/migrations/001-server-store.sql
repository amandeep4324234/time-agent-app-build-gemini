CREATE TABLE entitlements (aid uuid PRIMARY KEY, tier text NOT NULL, plan text NOT NULL, src text NOT NULL, ref text NOT NULL, skin text, valid_until timestamptz, jti text NOT NULL, revoked_at timestamptz DEFAULT NULL);
CREATE TABLE webhook_dedupe (event_id text NOT NULL, entity_id text NOT NULL, processed_at timestamptz NOT NULL, PRIMARY KEY(event_id, entity_id));
CREATE TABLE events (id uuid PRIMARY KEY, at timestamptz NOT NULL, type text NOT NULL, aid uuid, ref text, entity_id text, payload_digest text);
CREATE INDEX events_at_id ON events (at, id);
CREATE TABLE pairing_codes (code text PRIMARY KEY, aid uuid NOT NULL, issued_at timestamptz NOT NULL, expires_at timestamptz NOT NULL, used_at timestamptz, failed_attempts int NOT NULL DEFAULT 0);
CREATE TABLE sync_rows (pair_id text PRIMARY KEY, ciphertext text NOT NULL, seq bigint NOT NULL, updated_at timestamptz NOT NULL);
