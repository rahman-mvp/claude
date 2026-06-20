export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // always positive
  type: TransactionType;
  category: string;
  sourceFile: string;
  sourceBank: "kaspi" | "halyk";
}

export interface FileStatus {
  id: string;
  name: string;
  status: "processing" | "success" | "error";
  error?: string;
  transactionCount?: number;
}

export const INCOME_CATEGORIES = [
  "Зарплата",
  "Переводы (входящие)",
  "Возврат / кэшбэк",
  "Прочие доходы",
] as const;

export const EXPENSE_CATEGORIES = [
  "Продукты",
  "Кафе и рестораны",
  "Транспорт",
  "Коммуналка и связь",
  "Покупки",
  "Здоровье",
  "Развлечения",
  "Переводы (исходящие)",
  "Снятие наличных",
  "Кредит / займ",
  "Прочие расходы",
] as const;

export const DEFAULT_INCOME_CATEGORY = "Прочие доходы";
export const DEFAULT_EXPENSE_CATEGORY = "Прочие расходы";
