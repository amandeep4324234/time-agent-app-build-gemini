import { NextRequest, NextResponse } from "next/server";
import { issuePairingCode } from "@/adapters/server-store/pairing";
import { verifyJwt } from "@/adapters/entitlement-jwt/jwt";
import { logEntitlementEvent } from "@/adapters/server-store/events";
import { isDevEntitlement } from "@/lib/entitlement";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("tf_ent")?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookie || bearerToken;

  if (!token) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const claims = await verifyJwt(token);
  if (!claims || !claims.sub) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  if (claims.tier !== "pro") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // In production, reject tokens that claim dev override
  if (process.env.NODE_ENV === "production" && isDevEntitlement(claims)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Dev entitlement access is deprecated and disabled in production." },
      { status: 403 }
    );
  }

  const result = await issuePairingCode(claims.sub);
  await logEntitlementEvent("pairing.issue", claims.sub, null, result.code);

  return NextResponse.json(
    {
      code: result.code,
      expires_at: result.expires_at,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
