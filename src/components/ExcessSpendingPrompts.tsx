import { useMemo } from "react";
import { EXPENSE_CATEGORIES } from "../lib/types";
import type { BudgetPlan, Transaction } from "../lib/types";

interface Props {
  transactions: Transaction[];
  plan: BudgetPlan;
  onAssign: (transactionId: string, allocationName: string) => void;
}

const tengeFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const OTHER_OPTION = "Другое";

export function ExcessSpendingPrompts({ transactions, plan, onAssign }: Props) {
  const pendingExcessTransactions = useMemo(() => {
    if (!plan.salaryDate || plan.salary <= 0) return [];

    const sinceSalary = transactions
      .filter((t) => t.type === "expense" && t.date >= plan.salaryDate!)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id.localeCompare(b.id)));

    const excess: Transaction[] = [];
    let cumulative = 0;
    for (const t of sinceSalary) {
      cumulative += t.amount;
      if (cumulative > plan.salary) excess.push(t);
    }

    return excess.filter((t) => !t.allocationName);
  }, [transactions, plan.salaryDate, plan.salary]);

  // Custom budget allocations (if any) come first, then the app's standard
  // expense categories, so the dropdown is always useful even if the user
  // hasn't set up custom allocations in BudgetPlanner.
  const categoryOptions = useMemo(() => {
    const customNames = plan.allocations.map((a) => a.name);
    const merged = [...customNames, ...EXPENSE_CATEGORIES];
    return Array.from(new Set(merged));
  }, [plan.allocations]);

  const assignedTotals = useMemo(() => {
    if (!plan.salaryDate || plan.salary <= 0) return [];
    const totals = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "expense" && t.allocationName && t.date >= plan.salaryDate) {
        totals.set(t.allocationName, (totals.get(t.allocationName) ?? 0) + t.amount);
      }
    }
    return Array.from(totals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, plan.salaryDate, plan.salary]);

  if (pendingExcessTransactions.length === 0 && assignedTotals.length === 0) {
    return null;
  }

  return (
    <div className="excess-card">
      <h2 className="excess-card__title">На что ушли деньги сверх зарплаты?</h2>

      {pendingExcessTransactions.length > 0 && (
        <>
          <p className="excess-card__hint">
            Эти траты после {plan.salaryDate?.split("-").reverse().join(".")} превысили сумму
            зарплаты — укажите, к какой статье их отнести.
          </p>
          <ul className="excess-list">
            {pendingExcessTransactions.map((t) => (
              <li key={t.id} className="excess-row">
                <div className="excess-row__info">
                  <span className="excess-row__date">
                    {t.date.split("-").reverse().join(".")}
                  </span>
                  <span className="excess-row__description">{t.description}</span>
                  <span className="excess-row__amount">
                    −{tengeFormatter.format(t.amount)} ₸
                  </span>
                </div>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) onAssign(t.id, e.target.value);
                  }}
                >
                  <option value="" disabled>
                    Выберите статью…
                  </option>
                  {categoryOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
                </select>
              </li>
            ))}
          </ul>
        </>
      )}

      {assignedTotals.length > 0 && (
        <div className="excess-card__assigned">
          <h3>Уже распределено</h3>
          <ul>
            {assignedTotals.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <span className="excess-card__assigned-amount">
                  {tengeFormatter.format(item.amount)} ₸
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
