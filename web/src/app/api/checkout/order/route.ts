import { NextRequest, NextResponse } from "next/server";
import { RazorpayPaymentAdapter } from "@/adapters/payments-razorpay/sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const plan = body.plan || "monthly";
    const aid = body.aid || `aid-${Date.now()}`;

    const adapter = new RazorpayPaymentAdapter();
    const order = await adapter.createOrder(plan, aid);

    return NextResponse.json({
      order_id: order.ref,
      plan,
      currency: "INR",
      amount: plan === "annual" ? 299900 : plan === "skin" ? 59900 : 49900,
    });
  } catch (err) {
    return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  }
}
