import { NextRequest, NextResponse } from "next/server";
import { getEntitlementRow, getEntitlementRowByRef } from "@/adapters/server-store/rows";
import { signEntitlementJwt } from "@/adapters/entitlement-jwt/jwt";
import { createFreeEntitlement } from "@/lib/entitlement";
import { Entitlement } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aid, ref } = body;

    let row = null;
    if (aid) {
      row = await getEntitlementRow(aid);
    }
    if (!row && ref) {
      row = await getEntitlementRowByRef(ref);
    }

    if (row && row.tier === "pro" && !row.revoked_at) {
      const entitlement: Entitlement = {
        aid: row.aid,
        tier: row.tier,
        plan: row.plan,
        src: row.src,
        ref: row.ref,
        skin: row.skin,
        valid_until: row.valid_until,
        jti: row.jti,
      };
      const token = signEntitlementJwt(entitlement);
      return NextResponse.json({
        status: "restored",
        token,
        entitlement,
      });
    }

    return NextResponse.json({
      status: "not_found",
      entitlement: createFreeEntitlement(),
    });
  } catch {
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
