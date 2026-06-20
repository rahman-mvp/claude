import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Transaction } from "../lib/types";

interface Props {
  transactions: Transaction[];
}

const COLORS = [
  "#3b82f6", "#f97316", "#10b981", "#ef4444", "#8b5cf6",
  "#eab308", "#06b6d4", "#ec4899", "#84cc16", "#6366f1", "#64748b",
];

const tengeFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function ExpensesPieChart({ transactions }: Props) {
  const data = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
    const total = Array.from(totals.values()).reduce((a, b) => a + b, 0);
    return Array.from(totals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="chart-card">
      <h2 className="chart-card__title">Расходы по категориям</h2>
      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => {
                const numericValue = typeof value === "number" ? value : Number(value);
                const payload = (item as { payload?: { category: string; percent: number } })
                  .payload;
                return [
                  `${tengeFormatter.format(numericValue)} ₸ (${(payload?.percent ?? 0).toFixed(1)}%)`,
                  payload?.category ?? "",
                ];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
