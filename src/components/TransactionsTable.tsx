import { useMemo, useState } from "react";
import type { Transaction, TransactionType } from "../lib/types";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../lib/types";

interface Props {
  transactions: Transaction[];
  onUpdateCategory: (id: string, category: string) => void;
  onDelete: (id: string) => void;
}

const tengeFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function TransactionsTable({ transactions, onUpdateCategory, onDelete }: Props) {
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const categoriesPresent = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category))).sort(),
    [transactions]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions
      .filter((t) => typeFilter === "all" || t.type === typeFilter)
      .filter((t) => categoryFilter === "all" || t.category === categoryFilter)
      .filter((t) => query === "" || t.description.toLowerCase().includes(query))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, typeFilter, categoryFilter, search]);

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="table-card">
      <div className="table-controls">
        <input
          type="search"
          placeholder="Поиск по описанию…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="table-controls__search"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TransactionType | "all")}
        >
          <option value="all">Все типы</option>
          <option value="income">Доходы</option>
          <option value="expense">Расходы</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">Все категории</option>
          {categoriesPresent.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Описание</th>
              <th>Категория</th>
              <th>Сумма</th>
              <th aria-label="Действия"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>{t.date.split("-").reverse().join(".")}</td>
                <td>{t.description}</td>
                <td>
                  <select
                    value={t.category}
                    onChange={(e) => onUpdateCategory(t.id, e.target.value)}
                    className={`category-select category-select--${t.type}`}
                  >
                    {(t.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </td>
                <td className={`amount amount--${t.type}`}>
                  {t.type === "income" ? "+" : "−"}
                  {tengeFormatter.format(t.amount)} ₸
                </td>
                <td>
                  <button
                    type="button"
                    className="row-delete"
                    aria-label={`Удалить операцию ${t.description}`}
                    onClick={() => onDelete(t.id)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="table-empty">Нет операций по заданным фильтрам.</p>}
      </div>
    </div>
  );
}
