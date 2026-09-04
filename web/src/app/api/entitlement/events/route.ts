import { NextRequest, NextResponse } from "next/server";
import { listEntitlementEvents } from "@/adapters/server-store/events";

export async function GET(req: NextRequest) {
  const operatorToken = req.headers.get("x-operator-token");
  const expectedToken = process.env.OPERATOR_TOKEN || "test_operator_token";

  if (!operatorToken || operatorToken !== expectedToken) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const aid = searchParams.get("aid");
  const ref = searchParams.get("ref");
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

  let events = await listEntitlementEvents();

  if (aid) {
    events = events.filter((e) => e.aid === aid);
  }
  if (ref) {
    events = events.filter((e) => e.ref === ref);
  }

  const items = events.slice(0, limit);

  return NextResponse.json(
    {
      items,
      next_cursor: events.length > limit ? Buffer.from(`${items[items.length - 1].at},${items[items.length - 1].id}`).toString("base64") : null,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
