import { NextRequest, NextResponse } from "next/server";
import {
  createDevProEntitlement,
  createFreeEntitlement,
  isDevEnvironment,
  DEV_PRO_AID,
} from "@/lib/entitlement";
import { signEntitlementJwt } from "@/adapters/entitlement-jwt/jwt";
import { writeGrantRow, revokeEntitlementRow } from "@/adapters/server-store/rows";
import { Grant } from "@/lib/types";

/**
 * GET /api/dev/entitlement
 *
 * Developer inspection endpoint:
 * In development, provides a ready-to-use Dev Pro entitlement and JWT token.
 * In production, strictly deprecated, fails closed, and returns 403 Forbidden.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production" || !isDevEnvironment()) {
    return NextResponse.json(
      {
        error: "DEPRECATED",
        message: "Dev access logic is deprecated and strictly disabled in production.",
      },
      { status: 403 }
    );
  }

  const entitlement = createDevProEntitlement();
  await writeGrantRow(entitlement as Grant);
  const token = signEntitlementJwt(entitlement);

  const res = NextResponse.json({
    status: "ok",
    isDev: true,
    entitlement,
    token,
  });

  res.cookies.set("tf_ent", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });

  return res;
}

/**
 * POST /api/dev/entitlement
 *
 * Allows developers to test granting or revoking Pro tier access.
 * In production, strictly deprecated and returns 403 Forbidden.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || !isDevEnvironment()) {
    return NextResponse.json(
      {
        error: "DEPRECATED",
        message: "Dev access logic is deprecated and strictly disabled in production.",
      },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || "grant";

  if (action === "revoke") {
    await revokeEntitlementRow(DEV_PRO_AID);
    const free = createFreeEntitlement();
    const res = NextResponse.json({
      status: "revoked",
      entitlement: free,
      token: null,
    });
    res.cookies.set("tf_ent", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  const pro = createDevProEntitlement();
  await writeGrantRow(pro as Grant);
  const token = signEntitlementJwt(pro);
  const res = NextResponse.json({
    status: "granted",
    entitlement: pro,
    token,
  });
  res.cookies.set("tf_ent", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return res;
}
