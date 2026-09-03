import { WeekCardImage } from "../lib/ports";
import { WeekCardModel } from "../lib/types";

export class HtmlToImageWeekCardAdapter implements WeekCardImage {
  async render(card: WeekCardModel, opts: { clean: boolean }): Promise<Blob> {
    if (typeof window === "undefined") {
      return new Blob([], { type: "image/png" });
    }
    const htmlToImage = await import("html-to-image");
    const node = document.getElementById("week-card-export-target");
    if (!node) {
      throw new Error("Week card target node not found");
    }
    const dataUrl = await htmlToImage.toPng(node);
    const res = await fetch(dataUrl);
    return res.blob();
  }
}
