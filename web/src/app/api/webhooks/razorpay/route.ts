import { NextRequest, NextResponse } from "next/server";
import { handleRazorpayWebhook } from "@/adapters/payments-razorpay/webhook";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    const result = await handleRazorpayWebhook(rawBody, signature, secret);

    if (result.status === "invalid_signature") {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
