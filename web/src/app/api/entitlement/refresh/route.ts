import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, signJwt } from "@/adapters/entitlement-jwt/jwt";
import { getEntitlementRow } from "@/adapters/server-store/rows";
import { logEntitlementEvent } from "@/adapters/server-store/events";
import { isDevEntitlement } from "@/lib/entitlement";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mirror = body.mirror;

    if (!mirror || typeof mirror !== "string") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    // Step 1: verify signature and decode claims
    const claims = await verifyJwt(mirror);
    if (!claims || !claims.sub) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    // Security guard: Dev entitlements cannot be refreshed in production
    if (process.env.NODE_ENV === "production" && isDevEntitlement(claims)) {
      return NextResponse.json(
        { error: "DEPRECATED", message: "Dev entitlement refresh is deprecated and disabled in production." },
        { status: 403 }
      );
    }

    // Step 2: verify now - iat <= 30 days
    const nowSec = Math.floor(Date.now() / 1000);
    const iat = claims.iat || 0;
    const thirtyDaysSec = 30 * 24 * 60 * 60;
    if (nowSec - iat > thirtyDaysSec) {
      return NextResponse.json({ error: "MIRROR_EXPIRED" }, { status: 401 });
    }

    // Step 3: verify server row exists and revoked_at == null
    const row = await getEntitlementRow(claims.sub);
    if (!row || (row as any).revoked_at != null) {
      return NextResponse.json({ error: "ENTITLEMENT_INACTIVE" }, { status: 403 });
    }

    if (process.env.NODE_ENV === "production" && isDevEntitlement(row)) {
      return NextResponse.json(
        { error: "DEPRECATED", message: "Dev entitlement refresh is deprecated and disabled in production." },
        { status: 403 }
      );
    }

    // Step 4: valid_until present and in the past
    if (row.valid_until && new Date(row.valid_until).getTime() < Date.now()) {
      return NextResponse.json({ error: "ENTITLEMENT_INACTIVE" }, { status: 403 });
    }

    // Re-issue same claims with same jti
    const newMirror = await signJwt({
      aid: row.aid,
      tier: row.tier,
      plan: row.plan,
      src: row.src,
      ref: row.ref,
      skin: row.skin,
      valid_until: row.valid_until,
      jti: row.jti,
    });

    await logEntitlementEvent("refresh", row.aid, row.ref, row.jti);

    const response = NextResponse.json(
      {
        aid: row.aid,
        tier: row.tier,
        plan: row.plan,
        src: row.src,
        ref: row.ref,
        skin: row.skin,
        valid_until: row.valid_until,
        jti: row.jti,
        mirror: newMirror,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

    response.cookies.set("tf_ent", newMirror, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: row.plan === "annual" ? 365 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
}
