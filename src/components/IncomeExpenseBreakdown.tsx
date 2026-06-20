import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Transaction } from "../lib/types";

interface Props {
  transactions: Transaction[];
}

const tengeFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function IncomeExpenseBreakdown({ transactions }: Props) {
  const { totalIncome, totalExpense, incomeByCategory } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCategory = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "income") {
        income += t.amount;
        byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
      } else {
        expense += t.amount;
      }
    }
    const incomeCategories = Array.from(byCategory.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
    return { totalIncome: income, totalExpense: expense, incomeByCategory: incomeCategories };
  }, [transactions]);

  if (totalIncome === 0 && totalExpense === 0) {
    return null;
  }

  const chartData = [
    { name: "Поступило", amount: totalIncome, fill: "#10b981" },
    { name: "Потрачено", amount: totalExpense, fill: "#ef4444" },
  ];

  const spentShare = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : null;

  return (
    <div className="income-expense-card">
      <h2 className="income-expense-card__title">Сколько поступило и сколько потрачено</h2>

      <div className="income-expense-card__body">
        <div className="income-expense-card__chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                tickFormatter={(v) => tengeFormatter.format(v)}
                fontSize={12}
              />
              <YAxis type="category" dataKey="name" width={90} fontSize={13} />
              <Tooltip
                formatter={(value) => `${tengeFormatter.format(Number(value))} ₸`}
              />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={36}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {spentShare !== null && (
            <p className="income-expense-card__note">
              Вы тратите <strong>{spentShare.toFixed(0)}%</strong> от того, что поступает.
            </p>
          )}
        </div>

        {incomeByCategory.length > 0 && (
          <div className="income-expense-card__income-list">
            <h3>Из чего складывается доход</h3>
            <ul>
              {incomeByCategory.map((item) => (
                <li key={item.category}>
                  <span>{item.category}</span>
                  <span className="income-expense-card__income-amount">
                    +{tengeFormatter.format(item.amount)} ₸
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
