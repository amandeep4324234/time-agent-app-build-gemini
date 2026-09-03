import { NextRequest, NextResponse } from "next/server";
import { getSyncRow, putSyncRow, SyncRow } from "@/adapters/server-store/sync-kv";

export async function GET(req: NextRequest) {
  const pairId = req.nextUrl.searchParams.get("pair_id");
  if (!pairId) {
    return NextResponse.json({ error: "pair_id is required" }, { status: 400 });
  }

  const row = await getSyncRow(pairId);
  return NextResponse.json(
    { row },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SyncRow;
    if (!body.pair_id || !body.ciphertext) {
      return NextResponse.json({ error: "Invalid sync payload" }, { status: 400 });
    }

    await putSyncRow({
      pair_id: body.pair_id,
      ciphertext: body.ciphertext,
      seq: body.seq || 1,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Sync write failed" }, { status: 500 });
  }
}
