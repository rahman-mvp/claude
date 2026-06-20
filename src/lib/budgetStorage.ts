import type { BudgetPlan } from "./types";

const STORAGE_KEY = "finance-app:budget:v1";

const EMPTY_PLAN: BudgetPlan = { salary: 0, allocations: [] };

export function loadBudgetPlan(): BudgetPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PLAN;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.salary !== "number" ||
      !Array.isArray(parsed.allocations)
    ) {
      return EMPTY_PLAN;
    }
    return parsed;
  } catch {
    return EMPTY_PLAN;
  }
}

export function saveBudgetPlan(plan: BudgetPlan): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}
