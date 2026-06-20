import { useMemo, useState } from "react";
import type { Transaction } from "../lib/types";

interface Props {
  transactions: Transaction[];
}

type GroupBy = "merchant" | "category";

const tengeFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function normalizeMerchant(description: string): string {
  // Strip trailing card/account fragments and excess whitespace so the same
  // merchant in different transactions groups together.
  return description.replace(/\s+/g, " ").trim();
}

export function TopSpending({ transactions }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>("merchant");

  const ranked = useMemo(() => {
    const totals = new Map<string, { total: number; count: number }>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const key = groupBy === "merchant" ? normalizeMerchant(t.description) : t.category;
      const entry = totals.get(key) ?? { total: 0, count: 0 };
      entry.total += t.amount;
      entry.count += 1;
      totals.set(key, entry);
    }
    return Array.from(totals.entries())
      .map(([name, { total, count }]) => ({ name, total, count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [transactions, groupBy]);

  if (ranked.length === 0) {
    return null;
  }

  const maxTotal = ranked[0].total;

  return (
    <div className="top-spending-card">
      <div className="top-spending-card__header">
        <h2 className="top-spending-card__title">Куда вы чаще тратите</h2>
        <div className="top-spending-card__toggle">
          <button
            type="button"
            className={groupBy === "merchant" ? "active" : ""}
            onClick={() => setGroupBy("merchant")}
          >
            По получателям
          </button>
          <button
            type="button"
            className={groupBy === "category" ? "active" : ""}
            onClick={() => setGroupBy("category")}
          >
            По категориям
          </button>
        </div>
      </div>

      <ul className="top-spending-list">
        {ranked.map((item, index) => (
          <li key={item.name} className="top-spending-row">
            <span className="top-spending-row__rank">{index + 1}</span>
            <div className="top-spending-row__main">
              <div className="top-spending-row__info">
                <span className="top-spending-row__name">{item.name}</span>
                <span className="top-spending-row__meta">
                  {tengeFormatter.format(item.total)} ₸ · {item.count}{" "}
                  {item.count === 1 ? "операция" : "операций"}
                </span>
              </div>
              <div className="top-spending-row__bar-track">
                <div
                  className="top-spending-row__bar"
                  style={{ width: `${(item.total / maxTotal) * 100}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
