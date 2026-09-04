import { NextRequest, NextResponse } from "next/server";
import { redeemPairingCode } from "@/adapters/server-store/pairing";
import { getEntitlementRow, updateEntitlementCrossDevice } from "@/adapters/server-store/rows";
import { logEntitlementEvent } from "@/adapters/server-store/events";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = body.code;
    const deviceAid = body.device_aid;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "code is required" }, { status: 400 });
    }

    const redeemResult = await redeemPairingCode(code, deviceAid);
    if (!redeemResult.success || !redeemResult.aid) {
      return NextResponse.json(
        {
          error: redeemResult.error || "CODE_EXPIRED",
          message:
            "That code didn't work — it may have expired. Generate a new one on the website under Unlock on Android.",
        },
        {
          status: redeemResult.status || 410,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const entitlement = await getEntitlementRow(redeemResult.aid);
    if (!entitlement || entitlement.tier !== "pro") {
      return NextResponse.json(
        { error: "ENTITLEMENT_INACTIVE" },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    await updateEntitlementCrossDevice(redeemResult.aid, true);
    await logEntitlementEvent("pairing.redeem", redeemResult.aid, entitlement.ref, code);

    return NextResponse.json(
      {
        aid: entitlement.aid,
        tier: entitlement.tier,
        plan: entitlement.plan,
        src: entitlement.src,
        ref: entitlement.ref,
        skin: entitlement.skin,
        valid_until: entitlement.valid_until,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }
}
