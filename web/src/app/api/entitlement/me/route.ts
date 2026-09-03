import { NextRequest, NextResponse } from "next/server";
import { Entitlement } from "@/lib/types";
import { verifyEntitlementJwt } from "@/adapters/entitlement-jwt/jwt";
import { createFreeEntitlement } from "@/lib/entitlement";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let entitlement: Entitlement = createFreeEntitlement();

  if (token) {
    const claims = verifyEntitlementJwt(token);
    if (claims) {
      entitlement = {
        aid: claims.sub,
        tier: claims.tier,
        plan: claims.plan,
        src: claims.src,
        ref: claims.ref,
        skin: claims.skin,
        valid_until: new Date(claims.exp * 1000).toISOString(),
        jti: claims.jti,
      };
    }
  }

  return NextResponse.json(entitlement, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
