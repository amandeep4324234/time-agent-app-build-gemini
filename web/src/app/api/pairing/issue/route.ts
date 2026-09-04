import { NextRequest, NextResponse } from "next/server";
import { issuePairingCode } from "@/adapters/server-store/pairing";
import { verifyJwt } from "@/adapters/entitlement-jwt/jwt";
import { logEntitlementEvent } from "@/adapters/server-store/events";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("tf_ent")?.value;
  if (!cookie) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const claims = await verifyJwt(cookie);
  if (!claims || !claims.sub) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  if (claims.tier !== "pro") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
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
