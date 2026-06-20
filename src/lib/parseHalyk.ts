import type { Transaction } from "./types";
import { categorize } from "./categorize";
import { extractRows } from "./pdfText";
import type { PageRow } from "./pdfText";

// Halyk statement table columns (left to right):
// Дата проведения | Дата обработки | Описание операции [+ Сумма операции + Валюта операции,
// both ignored here] | Приход в валюте счета | Расход в валюте счета | Комиссия операции |
// № карточки/счета
//
// Each cell is rendered as a single PDF text item, but the "Сумма операции"/"Валюта операции"
// cells are sometimes blank (e.g. when the operation amount is 0,00), which shifts how many
// items a row has. Counting columns from the END of the row is reliable because the last four
// cells (Приход, Расход, Комиссия, № карточки/счета) are always present. Multi-line
// descriptions wrap onto their own row with no leading date — those are merged into the
// description of the transaction above.

const DATE_RE = /^\d{2}\.\d{2}\.\d{4}$/;
const AMOUNT_RE = /^-?[\d\s]+,\d{2}$/;

function isDate(text: string): boolean {
  return DATE_RE.test(text.trim());
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/\s/g, "").replace(",", "."));
}

function toIsoDate(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split(".");
  return `${yyyy}-${mm}-${dd}`;
}

interface Draft {
  date: string;
  descriptionParts: string[];
  income: number;
  expense: number;
  commission: number;
}

function isNoiseLine(text: string): boolean {
  return (
    /Выписка по счету/i.test(text) ||
    /Место печати Банка/i.test(text) ||
    /Выписка действительна/i.test(text) ||
    /^Дата Дата$/i.test(text) ||
    /^Сумма( Валюта)?( Приход в)?( Расход в)?$/i.test(text) ||
    /^проведения обработки Описание операции/i.test(text) ||
    /^операции операции/i.test(text)
  );
}

function startsNewTransaction(row: PageRow): boolean {
  if (row.items.length < 7) return false;
  return isDate(row.items[0].text) && isDate(row.items[1].text);
}

function buildDraft(row: PageRow): Draft {
  const texts = row.items.map((i) => i.text.trim());
  const date = toIsoDate(texts[0]);
  const trailing = texts.slice(-4); // [income, expense, commission, card/account]
  const [incomeRaw, expenseRaw, commissionRaw] = trailing;

  const income = AMOUNT_RE.test(incomeRaw) ? parseAmount(incomeRaw) : 0;
  const expense = AMOUNT_RE.test(expenseRaw) ? parseAmount(expenseRaw) : 0;
  const commission = AMOUNT_RE.test(commissionRaw) ? parseAmount(commissionRaw) : 0;

  // Description is the first free-text cell after the two dates; any
  // "Сумма операции"/"Валюта операции" cells in between are ignored since we
  // use Приход/Расход (already converted to account currency) for the amount.
  const description = texts[2] ?? "";

  return { date, descriptionParts: [description], income, expense, commission };
}

function finalizeDraft(
  draft: Draft
): Omit<Transaction, "id" | "sourceFile" | "sourceBank"> | null {
  const description = draft.descriptionParts.join(" ").replace(/\s+/g, " ").trim();
  let type: "income" | "expense";
  let amount: number;

  if (draft.income > 0) {
    type = "income";
    amount = draft.income;
  } else if (draft.expense !== 0) {
    type = "expense";
    amount = Math.abs(draft.expense);
  } else if (draft.commission !== 0) {
    type = "expense";
    amount = Math.abs(draft.commission);
  } else {
    return null;
  }

  if (description.length === 0) return null;

  return {
    date: draft.date,
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
  const results: Omit<Transaction, "id" | "sourceFile" | "sourceBank">[] = [];
  let currentDraft: Draft | null = null;

  for (const row of rows) {
    if (row.items.length === 0) continue;

    if (startsNewTransaction(row)) {
      if (currentDraft) {
        const finalized = finalizeDraft(currentDraft);
        if (finalized) results.push(finalized);
      }
      currentDraft = buildDraft(row);
    } else if (currentDraft) {
      // Continuation of a wrapped description (or trailing account number) —
      // append free text, skipping cells that are pure amounts/currency codes
      // or page header/footer boilerplate that repeats on every page.
      const text = row.items
        .map((i) => i.text.trim())
        .filter((t) => t.length > 0)
        .join(" ");
      if (text.length > 0 && !isNoiseLine(text)) {
        currentDraft.descriptionParts.push(text);
      }
    }
  }

  if (currentDraft) {
    const finalized = finalizeDraft(currentDraft);
    if (finalized) results.push(finalized);
  }

  if (results.length === 0) {
    throw new Error(
      "Не удалось распознать операции в выписке Halyk. Формат файла отличается от ожидаемого — потребуется обновить парсер под этот шаблон."
    );
  }

  return results;
}
