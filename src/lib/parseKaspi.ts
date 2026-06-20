import type { Transaction } from "./types";
import { categorize } from "./categorize";
import { extractRows, rowText } from "./pdfText";

const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{2})$/;
const AMOUNT_RE = /^([+-])\s*([\d\s]+,\d{2})\s*₸?/;

// Longest first so "Перевод на свой счет" is matched before plain "Перевод".
const OPERATION_TYPES = [
  "Перевод на свой счет",
  "Пополнение",
  "Покупка",
  "Перевод",
  "Снятие",
  "Разное",
];

function toIsoDate(dd: string, mm: string, yy: string): string {
  return `20${yy}-${mm}-${dd}`;
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/\s/g, "").replace(",", "."));
}

interface ParsedLine {
  date: string;
  sign: "+" | "-";
  amount: number;
  operation: string;
  details: string;
}

function parseTransactionLine(line: string): ParsedLine | null {
  const dateMatch = line.match(/^(\d{2}\.\d{2}\.\d{2})\s+(.*)$/);
  if (!dateMatch) return null;
  const dateRe = dateMatch[1].match(DATE_RE);
  if (!dateRe) return null;
  const rest = dateMatch[2];

  const amountMatch = rest.match(AMOUNT_RE);
  if (!amountMatch) return null;
  const sign = amountMatch[1] as "+" | "-";
  const amount = parseAmount(amountMatch[2]);
  let remainder = rest.slice(amountMatch[0].length).trim();

  let operation = "Разное";
  for (const opType of OPERATION_TYPES) {
    if (remainder.startsWith(opType)) {
      operation = opType;
      remainder = remainder.slice(opType.length).trim();
      break;
    }
  }

  return {
    date: toIsoDate(dateRe[1], dateRe[2], dateRe[3]),
    sign,
    amount,
    operation,
    details: remainder,
  };
}

export async function parseKaspiStatement(
  file: File
): Promise<Omit<Transaction, "id" | "sourceFile" | "sourceBank">[]> {
  const rows = await extractRows(file);
  const rawLines = rows.map(rowText).filter((t) => t.length > 0);

  // Merge wrapped continuation lines (e.g. "Перевод на свой" / "счет") into
  // the previous transaction line — a continuation line never starts with a
  // dd.mm.yy date.
  const isNoiseLine = (line: string): boolean =>
    /^АО\s*«Kaspi Bank»/i.test(line) ||
    /^Приложение к Справке/i.test(line) ||
    /^-?\s*Сумма заблокирована/i.test(line) ||
    /^Раздел\s*«Краткое содержание/i.test(line);

  const merged: string[] = [];
  for (const line of rawLines) {
    if (isNoiseLine(line)) continue;
    const looksLikeNewRow = /^\d{2}\.\d{2}\.\d{2}\s/.test(line);
    if (!looksLikeNewRow && merged.length > 0) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${line}`;
    } else {
      merged.push(line);
    }
  }

  const results: Omit<Transaction, "id" | "sourceFile" | "sourceBank">[] = [];
  for (const line of merged) {
    const parsed = parseTransactionLine(line);
    if (!parsed) continue;

    const type = parsed.sign === "+" ? "income" : "expense";
    const description =
      parsed.details.length > 0 ? parsed.details : parsed.operation;
    const categorizationInput = `${parsed.operation} ${parsed.details}`;

    results.push({
      date: parsed.date,
      description,
      amount: parsed.amount,
      type,
      category: categorize(categorizationInput, type),
    });
  }

  if (results.length === 0) {
    throw new Error(
      "Не удалось распознать ни одной операции в файле. Проверьте, что это текстовая (не сканированная) выписка Kaspi."
    );
  }

  return results;
}
