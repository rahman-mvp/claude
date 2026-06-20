import type { Transaction } from "./types";
import { extractRows, rowText } from "./pdfText";
import { parseKaspiStatement } from "./parseKaspi";
import { parseHalykStatement } from "./parseHalyk";

export type BankId = "kaspi" | "halyk";

async function detectBank(file: File): Promise<BankId> {
  const rows = await extractRows(file);
  const text = rows.map(rowText).join(" ").toLowerCase();
  if (text.includes("kaspi")) return "kaspi";
  if (text.includes("halyk") || text.includes("халык")) return "halyk";
  throw new Error(
    "Не удалось определить банк по содержимому файла. Поддерживаются только выписки Kaspi и Halyk."
  );
}

let nextId = 0;
function makeId(): string {
  nextId += 1;
  return `tx-${Date.now()}-${nextId}`;
}

export async function parseStatementFile(file: File): Promise<Transaction[]> {
  const bank = await detectBank(file);
  const rows =
    bank === "kaspi"
      ? await parseKaspiStatement(file)
      : await parseHalykStatement(file);

  return rows.map((row) => ({
    ...row,
    id: makeId(),
    sourceFile: file.name,
    sourceBank: bank,
  }));
}
