import { NextRequest, NextResponse } from "next/server";
import { Entitlement } from "@/lib/types";
import { verifyEntitlementJwt } from "@/adapters/entitlement-jwt/jwt";
import { createFreeEntitlement, createDevProEntitlement, isDevEnvironment } from "@/lib/entitlement";

export async function GET(req: NextRequest) {
  // Check for dev bypass request (?dev_pro=true or header x-dev-pro: true)
  const devRequested =
    req.headers.get("x-dev-pro") === "true" ||
    req.nextUrl.searchParams.get("dev_pro") === "true";

  if (devRequested) {
    if (process.env.NODE_ENV === "production" || !isDevEnvironment()) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[SECURITY DEPRECATION] Dev pro bypass in /api/entitlement/me is deprecated and rejected in production.");
      }
    } else {
      return NextResponse.json(createDevProEntitlement(), {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      });
    }
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let entitlement: Entitlement = createFreeEntitlement();

  if (token) {
    const claims = verifyEntitlementJwt(token);
    if (claims) {
      // In production, reject tokens claiming dev override
      const isDevClaim = claims.src === "dev-override" || claims.ref === "dev_pro_access" || claims.sub === "dev-local-user";
      if (process.env.NODE_ENV === "production" && isDevClaim) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn("[SECURITY DEPRECATION] Dev token in /api/entitlement/me is deprecated and rejected in production.");
        }
        return NextResponse.json(createFreeEntitlement(), {
          status: 200,
          headers: {
            "Cache-Control": "private, no-store",
          },
        });
      }

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
