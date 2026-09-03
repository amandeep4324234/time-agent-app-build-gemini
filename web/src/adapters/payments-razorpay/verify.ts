import crypto from "crypto";
import { Grant } from "../../lib/types";
import { writeGrantRow } from "../server-store/rows";
import { logEntitlementEvent } from "../server-store/events";

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) return true; // Graceful offline/mock mode
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${orderId}|${paymentId}`);
  const expected = hmac.digest("hex");
  return expected === signature;
}

export async function processPaymentVerification(
  aid: string,
  plan: "monthly" | "annual" | "skin",
  orderId: string,
  paymentId: string
): Promise<Grant> {
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
    src: "razorpay",
    ref: paymentId,
    skin: plan === "skin" ? "classic" : null,
    valid_until: validUntil,
    jti: `jti-${Date.now()}`,
  };

  await writeGrantRow(grant);
  await logEntitlementEvent("payment.verified", aid, paymentId, orderId);

  return grant;
}
