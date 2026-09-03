import { NextRequest, NextResponse } from "next/server";
import { RazorpayPaymentAdapter } from "@/adapters/payments-razorpay/sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const adapter = new RazorpayPaymentAdapter();
    const grant = await adapter.verify({
      ref: body.razorpay_payment_id || `pay_${Date.now()}`,
      proof: body,
    });

    return NextResponse.json({
      status: "verified",
      grant,
    });
  } catch (err) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }
}
