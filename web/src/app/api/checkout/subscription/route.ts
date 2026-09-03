import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const plan = body.plan || "monthly";
    const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      subscription_id: subId,
      plan,
      status: "created",
    });
  } catch {
    return NextResponse.json({ error: "Subscription creation failed" }, { status: 500 });
  }
}
