import { PaymentProvider } from "../../lib/ports";
import { Grant } from "../../lib/types";
import { writeGrantRow } from "../server-store/rows";
import { logEntitlementEvent } from "../server-store/events";

export class RazorpayPaymentAdapter implements PaymentProvider {
  async createOrder(
    plan: "monthly" | "annual" | "skin",
    aid: string
  ): Promise<{ ref: string }> {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return { ref: orderId };
  }

  async verify(payload: { ref: string; proof: unknown }): Promise<Grant> {
    const proof = payload.proof as Record<string, unknown> | undefined;
    const paymentId = (proof?.payment_id as string) || `pay_${Date.now()}`;
    const plan = (proof?.plan as "monthly" | "annual" | "skin") || "monthly";
    const aid = (proof?.aid as string) || `aid-${Date.now()}`;

    const now = Date.now();
    let validUntil: string | null = null;
    if (plan === "monthly") {
      validUntil = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (plan === "annual") {
      validUntil = new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString();
    } // skin -> null (forever)

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
    await logEntitlementEvent("grant.created", aid, paymentId, paymentId);

    return grant;
  }
}
