import { NextRequest, NextResponse } from "next/server";
import { generateWeekCardSvg } from "@/adapters/week-card-resvg";
import { buildWeekCardModel } from "@/lib/week";
import { Resvg } from "@resvg/resvg-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceSelector, metrics, isPaid } = body;

    if (!metrics) {
      return NextResponse.json({ error: "Metrics payload required" }, { status: 400 });
    }

    const cardModel = buildWeekCardModel(
      metrics,
      deviceSelector || "merged export",
      Boolean(isPaid)
    );

    const svg = generateWeekCardSvg(cardModel);

    try {
      const resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: 1080 },
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      return new NextResponse(new Uint8Array(pngBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "private, max-age=600",
        },
      });
    } catch {
      // Fallback: Return SVG
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "private, max-age=600",
        },
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate week card" },
      { status: 500 }
    );
  }
}
