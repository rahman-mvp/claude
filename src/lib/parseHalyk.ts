import type { Transaction } from "./types";
import { categorize } from "./categorize";
import { extractRows, rowText } from "./pdfText";

// NOTE: no real Halyk Bank statement sample was available while building this
// parser (unlike Kaspi, see parseKaspi.ts). It targets the commonly seen
// layout — one row per operation with a date, free-text description and a
// signed amount — using the same coordinate-based row reconstruction as the
// Kaspi parser. If real statements use a different layout (e.g. separate
// debit/credit columns), this is the place to adjust the regexes below.

const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4}|\d{2})$/;
const AMOUNT_RE = /([+-]?)\s*([\d\s]{1,15},\d{2}|[\d\s]{1,15}\.\d{2})\s*(?:KZT|₸|тг\.?)?$/i;

const EXPENSE_HINTS = [
  "покупка", "оплата", "снятие", "перевод исх", "списание", "комиссия",
];
const INCOME_HINTS = ["пополнение", "поступление", "зачисление", "перевод вход"];

function toIsoDate(dd: string, mm: string, yyyy: string): string {
  const year = yyyy.length === 2 ? `20${yyyy}` : yyyy;
  return `${year}-${mm}-${dd}`;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/\s/g, "").replace(",", "."));
}

function inferSign(description: string, explicitSign: string): "+" | "-" {
  if (explicitSign === "+") return "+";
  if (explicitSign === "-") return "-";
  const lower = description.toLowerCase();
  if (INCOME_HINTS.some((h) => lower.includes(h))) return "+";
  if (EXPENSE_HINTS.some((h) => lower.includes(h))) return "-";
  // Default to expense — most personal-account statement lines are debits.
  return "-";
}

function parseLine(
  line: string
): Omit<Transaction, "id" | "sourceFile" | "sourceBank"> | null {
  const dateMatch = line.match(/^(\d{2}\.\d{2}\.\d{2,4})\s+(.*)$/);
  if (!dateMatch) return null;
  const dateParts = dateMatch[1].match(DATE_RE);
  if (!dateParts) return null;

  const rest = dateMatch[2].trim();
  const amountMatch = rest.match(AMOUNT_RE);
  if (!amountMatch) return null;

  const description = rest.slice(0, amountMatch.index).trim();
  if (description.length === 0) return null;

  const amount = parseAmount(amountMatch[2]);
  if (Number.isNaN(amount) || amount === 0) return null;

  const sign = inferSign(description, amountMatch[1]);
  const type = sign === "+" ? "income" : "expense";

  return {
    date: toIsoDate(dateParts[1], dateParts[2], dateParts[3]),
    description,
    amount,
    type,
    category: categorize(description, type),
  };
}

export async function parseHalykStatement(
  file: File
): Promise<Omit<Transaction, "id" | "sourceFile" | "sourceBank">[]> {
  const rows = await extractRows(file);
  const lines = rows.map(rowText).filter((t) => t.length > 0);

  const results: Omit<Transaction, "id" | "sourceFile" | "sourceBank">[] = [];
  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) results.push(parsed);
  }

  if (results.length === 0) {
    throw new Error(
      "Не удалось распознать операции в выписке Halyk. Формат файла отличается от ожидаемого — потребуется обновить парсер под этот шаблон."
    );
  }

  return results;
}
