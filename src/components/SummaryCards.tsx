import { useMemo } from "react";
import type { Transaction } from "../lib/types";

interface Props {
  transactions: Transaction[];
}

const tengeFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function SummaryCards({ transactions }: Props) {
  const { totalIncome, totalExpense, balance, count } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      count: transactions.length,
    };
  }, [transactions]);

  return (
    <div className="summary-cards">
      <div className="summary-card summary-card--income">
        <span className="summary-card__label">Доход</span>
        <span className="summary-card__value">+{tengeFormatter.format(totalIncome)} ₸</span>
      </div>
      <div className="summary-card summary-card--expense">
        <span className="summary-card__label">Расход</span>
        <span className="summary-card__value">−{tengeFormatter.format(totalExpense)} ₸</span>
      </div>
      <div className={`summary-card summary-card--balance`}>
        <span className="summary-card__label">Баланс</span>
        <span className="summary-card__value">
          {balance >= 0 ? "+" : "−"}
          {tengeFormatter.format(Math.abs(balance))} ₸
        </span>
      </div>
      <div className="summary-card summary-card--count">
        <span className="summary-card__label">Операций</span>
        <span className="summary-card__value">{count}</span>
      </div>
    </div>
  );
}
