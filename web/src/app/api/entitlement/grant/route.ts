import { NextRequest, NextResponse } from "next/server";
import { signEntitlementJwt } from "@/adapters/entitlement-jwt/jwt";
import { Grant, Entitlement } from "@/lib/types";
import { writeGrantRow } from "@/adapters/server-store/rows";

export async function POST(req: NextRequest) {
  // Security guard: Dev/manual grant endpoint is strictly deprecated and disabled in production.
  if (process.env.NODE_ENV === "production") {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[SECURITY DEPRECATION] Manual /api/entitlement/grant attempted in production environment.");
    }
    return NextResponse.json(
      {
        error: "DEPRECATED",
        message: "Dev / manual entitlement grant logic is deprecated and strictly disabled in production.",
      },
      { status: 403 }
    );
  }

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
