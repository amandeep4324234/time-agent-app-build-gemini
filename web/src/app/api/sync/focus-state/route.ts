import { NextRequest, NextResponse } from "next/server";
import { getSyncRow, putSyncRow } from "@/adapters/server-store/sync-kv";

export async function GET(req: NextRequest) {
  const pairId = req.nextUrl.searchParams.get("pair_id");
  if (!pairId) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "pair_id is required" }, { status: 400 });
  }

  const row = await getSyncRow(pairId);
  if (!row) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch && row.version && ifNoneMatch === row.version) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: row.version,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(
    {
      pair_id: row.pair_id,
      seq: row.seq,
      nonce: row.nonce,
      ciphertext: row.ciphertext,
      updated_at: row.updated_at,
    },
    {
      status: 200,
      headers: {
        ETag: row.version || "",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.pair_id || !body.ciphertext || typeof body.seq !== "number") {
      return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
    }

    if (body.ciphertext.length > 4096) {
      return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    }

    const res = await putSyncRow({
      pair_id: body.pair_id,
      ciphertext: body.ciphertext,
      nonce: body.nonce,
      seq: body.seq,
    });

    if (!res.ok) {
      if (res.error === "SEQ_REGRESSED") {
        return NextResponse.json({ error: "SEQ_REGRESSED" }, { status: 409 });
      }
      return NextResponse.json({ error: res.error || "SYNC_ERROR" }, { status: 400 });
    }

    return NextResponse.json(
      {
        pair_id: body.pair_id,
        seq: body.seq,
        version: res.version,
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
