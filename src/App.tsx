import { useEffect, useRef, useState } from "react";
import "./App.css";
import { FileUpload } from "./components/FileUpload";
import { SummaryCards } from "./components/SummaryCards";
import { IncomeExpenseBreakdown } from "./components/IncomeExpenseBreakdown";
import { ExpensesPieChart } from "./components/ExpensesPieChart";
import { TopSpending } from "./components/TopSpending";
import { BudgetPlanner } from "./components/BudgetPlanner";
import { TransactionsTable } from "./components/TransactionsTable";
import { parseStatementFile } from "./lib/parseStatement";
import { clearTransactions, loadTransactions, saveTransactions } from "./lib/storage";
import { loadBudgetPlan, saveBudgetPlan } from "./lib/budgetStorage";
import type { BudgetPlan, FileStatus, Transaction } from "./lib/types";

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan>({ salary: 0, allocations: [] });
  const hasLoadedFromStorage = useRef(false);

  useEffect(() => {
    setTransactions(loadTransactions());
    setBudgetPlan(loadBudgetPlan());
    hasLoadedFromStorage.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedFromStorage.current) return;
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    if (!hasLoadedFromStorage.current) return;
    saveBudgetPlan(budgetPlan);
  }, [budgetPlan]);

  async function handleFilesSelected(files: File[]) {
    const newStatuses: FileStatus[] = files.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      name: f.name,
      status: "processing",
    }));
    setFileStatuses((prev) => [...prev, ...newStatuses]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const statusId = newStatuses[i].id;
      try {
        const parsed = await parseStatementFile(file);
        setTransactions((prev) => [...prev, ...parsed]);
        setFileStatuses((prev) =>
          prev.map((fs) =>
            fs.id === statusId
              ? { ...fs, status: "success", transactionCount: parsed.length }
              : fs
          )
        );
      } catch (err) {
        setFileStatuses((prev) =>
          prev.map((fs) =>
            fs.id === statusId
              ? {
                  ...fs,
                  status: "error",
                  error: err instanceof Error ? err.message : "Неизвестная ошибка разбора файла",
                }
              : fs
          )
        );
      }
    }
  }

  function handleUpdateCategory(id: string, category: string) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, category } : t)));
  }

  function handleDelete(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  function handleClearAll() {
    setTransactions([]);
    setFileStatuses([]);
    clearTransactions();
    setShowClearConfirm(false);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Учёт доходов и расходов</h1>
        <p className="app-header__subtitle">Kaspi и Halyk — загрузите PDF-выписку</p>
        {transactions.length > 0 && (
          <button type="button" className="clear-all-btn" onClick={() => setShowClearConfirm(true)}>
            Очистить все данные
          </button>
        )}
      </header>

      {showClearConfirm && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <p>Удалить все загруженные операции без возможности восстановления?</p>
            <div className="confirm-dialog__actions">
              <button type="button" onClick={() => setShowClearConfirm(false)}>
                Отмена
              </button>
              <button type="button" className="confirm-dialog__danger" onClick={handleClearAll}>
                Удалить всё
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        <FileUpload fileStatuses={fileStatuses} onFilesSelected={handleFilesSelected} />

        <BudgetPlanner plan={budgetPlan} onChange={setBudgetPlan} />

        {transactions.length > 0 && (
          <>
            <SummaryCards transactions={transactions} />
            <IncomeExpenseBreakdown transactions={transactions} />
            <ExpensesPieChart transactions={transactions} />
            <TopSpending transactions={transactions} />
            <TransactionsTable
              transactions={transactions}
              onUpdateCategory={handleUpdateCategory}
              onDelete={handleDelete}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
