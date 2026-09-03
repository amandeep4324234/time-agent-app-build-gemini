import crypto from "crypto";
import { recordWebhookProcessed } from "../server-store/dedupe";
import { writeGrantRow } from "../server-store/rows";
import { logEntitlementEvent } from "../server-store/events";
import { Grant } from "../../lib/types";

export interface WebhookResult {
  status: "success" | "duplicate" | "invalid_signature" | "ignored";
  grant?: Grant;
}

export async function handleRazorpayWebhook(
  rawBody: string,
  signature: string,
  secret: string
): Promise<WebhookResult> {
  // Validate signature if secret is configured
  if (secret) {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (expected !== signature) {
      return { status: "invalid_signature" };
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { status: "ignored" };
  }

  const event = payload.event as string | undefined;
  const eventId = (payload.id as string) || `evt-${Date.now()}`;
  const paymentEntity = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown> | undefined;
  const entity = paymentEntity?.entity as Record<string, unknown> | undefined;
  const paymentId = (entity?.id as string) || `pay-${Date.now()}`;

  // Check deduplication (W18: same event delivered 3x -> exactly one grant)
  const isNew = await recordWebhookProcessed(eventId, paymentId);
  if (!isNew) {
    return { status: "duplicate" };
  }

  if (event === "payment.captured" || event === "order.paid") {
    const notes = (entity?.notes as Record<string, string>) || {};
    const aid = notes.aid || `aid-${Date.now()}`;
    const plan = (notes.plan as "monthly" | "annual" | "skin") || "monthly";

    const now = Date.now();
    let validUntil: string | null = null;
    if (plan === "monthly") {
      validUntil = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (plan === "annual") {
      validUntil = new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    const grant: Grant = {
      aid,
      tier: "pro",
      plan,
      src: "razorpay_webhook",
      ref: paymentId,
      skin: plan === "skin" ? "classic" : null,
      valid_until: validUntil,
      jti: eventId,
    };

    await writeGrantRow(grant);
    await logEntitlementEvent("webhook.grant", aid, paymentId, eventId);

    return { status: "success", grant };
  }

  return { status: "ignored" };
}
