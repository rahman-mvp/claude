import type { Transaction } from "./types";

const STORAGE_KEY = "finance-app:transactions:v1";

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function clearTransactions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
