import { NextRequest, NextResponse } from "next/server";
import { signEntitlementJwt } from "@/adapters/entitlement-jwt/jwt";
import { Grant, Entitlement } from "@/lib/types";
import { writeGrantRow } from "@/adapters/server-store/rows";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const aid = body.aid || `aid-${Date.now()}`;
    const plan = body.plan || "monthly";

    const grant: Grant = {
      aid,
      tier: "pro",
      plan,
      src: "admin",
      ref: `grant-${Date.now()}`,
      skin: plan === "skin" ? "classic" : null,
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
      jti: `jti-${Date.now()}`,
    };

    await writeGrantRow(grant);
    const token = signEntitlementJwt(grant as Entitlement);

    return NextResponse.json({
      status: "granted",
      token,
      entitlement: grant,
    });
  } catch {
    return NextResponse.json({ error: "Grant failed" }, { status: 500 });
  }
}
