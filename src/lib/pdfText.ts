import * as pdfjsLib from "pdfjs-dist";
// eslint-disable-next-line import/no-unresolved
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PositionedItem {
  text: string;
  x: number;
  y: number;
}

export interface PageRow {
  y: number;
  items: PositionedItem[];
}

const ROW_Y_TOLERANCE = 2.5;

/** Reconstructs table rows from a PDF's text layer using item coordinates,
 * since text extraction order can be column-major rather than row-major. */
export async function extractRows(file: File): Promise<PageRow[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const allRows: PageRow[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items: PositionedItem[] = content.items
      .map((it) => it as { str?: unknown; transform?: number[] })
      .filter(
        (it): it is { str: string; transform: number[] } =>
          typeof it.str === "string" && it.str.trim() !== "" && Array.isArray(it.transform)
      )
      .map((it) => ({
        text: it.str,
        x: it.transform[4],
        y: it.transform[5],
      }));

    const sorted = [...items].sort((a, b) => b.y - a.y);
    const rows: PageRow[] = [];
    for (const item of sorted) {
      const row = rows.find((r) => Math.abs(r.y - item.y) <= ROW_Y_TOLERANCE);
      if (row) {
        row.items.push(item);
      } else {
        rows.push({ y: item.y, items: [item] });
      }
    }
    for (const row of rows) {
      row.items.sort((a, b) => a.x - b.x);
    }
    allRows.push(...rows);
  }

  return allRows;
}

export function rowText(row: PageRow): string {
  return row.items
    .map((i) => i.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
