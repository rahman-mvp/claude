import { useMemo, useState } from "react";
import type { BudgetAllocation, BudgetPlan } from "../lib/types";

interface Props {
  plan: BudgetPlan;
  onChange: (plan: BudgetPlan) => void;
}

const tengeFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function makeId(): string {
  return `alloc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function BudgetPlanner({ plan, onChange }: Props) {
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const totalAllocated = useMemo(
    () => plan.allocations.reduce((sum, a) => sum + a.amount, 0),
    [plan.allocations]
  );
  const remaining = plan.salary - totalAllocated;

  function updateSalary(value: string) {
    const salary = Math.max(0, Number(value.replace(/\s/g, "").replace(",", ".")) || 0);
    onChange({ ...plan, salary });
  }

  function addAllocation() {
    const amount = Number(newAmount.replace(/\s/g, "").replace(",", "."));
    if (!newName.trim() || !amount || amount <= 0) return;
    const allocation: BudgetAllocation = { id: makeId(), name: newName.trim(), amount };
    onChange({ ...plan, allocations: [...plan.allocations, allocation] });
    setNewName("");
    setNewAmount("");
  }

  function updateAllocation(id: string, patch: Partial<BudgetAllocation>) {
    onChange({
      ...plan,
      allocations: plan.allocations.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  }

  function removeAllocation(id: string) {
    onChange({ ...plan, allocations: plan.allocations.filter((a) => a.id !== id) });
  }

  return (
    <div className="budget-card">
      <h2 className="budget-card__title">Зарплата и распределение сверх неё</h2>
      <p className="budget-card__hint">
        Укажите сумму и дату зарплаты, затем заведите статьи (например, «сбережения»,
        «развлечения») — когда траты после этой даты превысят зарплату, приложение спросит, к
        какой статье отнести каждую такую транзакцию.
      </p>

      <div className="budget-card__salary-row">
        <div className="budget-card__salary">
          <label htmlFor="salary-input">Зарплата</label>
          <div className="budget-card__salary-input">
            <input
              id="salary-input"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={plan.salary === 0 ? "" : plan.salary.toString()}
              onChange={(e) => updateSalary(e.target.value)}
            />
            <span>₸</span>
          </div>
        </div>
        <div className="budget-card__salary">
          <label htmlFor="salary-date-input">Дата получения</label>
          <input
            id="salary-date-input"
            type="date"
            value={plan.salaryDate ?? ""}
            onChange={(e) => onChange({ ...plan, salaryDate: e.target.value || null })}
          />
        </div>
      </div>

      {plan.allocations.length > 0 && (
        <ul className="budget-card__allocations">
          {plan.allocations.map((a) => (
            <li key={a.id} className="budget-allocation-row">
              <input
                type="text"
                value={a.name}
                onChange={(e) => updateAllocation(a.id, { name: e.target.value })}
                className="budget-allocation-row__name"
              />
              <div className="budget-allocation-row__amount">
                <input
                  type="text"
                  inputMode="decimal"
                  value={a.amount.toString()}
                  onChange={(e) =>
                    updateAllocation(a.id, {
                      amount: Number(e.target.value.replace(/\s/g, "").replace(",", ".")) || 0,
                    })
                  }
                />
                <span>₸</span>
              </div>
              <button
                type="button"
                className="row-delete"
                aria-label={`Удалить статью ${a.name}`}
                onClick={() => removeAllocation(a.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="budget-card__add-row">
        <input
          type="text"
          placeholder="Название статьи (например, сбережения)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addAllocation()}
        />
        <div className="budget-card__add-amount">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Сумма"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAllocation()}
          />
          <span>₸</span>
        </div>
        <button type="button" onClick={addAllocation} className="budget-card__add-btn">
          Добавить
        </button>
      </div>

      {plan.salary > 0 && (
        <div className="budget-card__totals">
          <span>Распределено: {tengeFormatter.format(totalAllocated)} ₸</span>
          <span className={remaining < 0 ? "budget-card__remaining--over" : ""}>
            {remaining >= 0
              ? `Не распределено: ${tengeFormatter.format(remaining)} ₸`
              : `Превышение: ${tengeFormatter.format(Math.abs(remaining))} ₸`}
          </span>
        </div>
      )}
    </div>
  );
}
