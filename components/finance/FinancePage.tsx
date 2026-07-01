"use client";

import { useState } from "react";
import { Wallet, ListPlus } from "lucide-react";
import { useFinance } from "@/hooks/useFinance";
import { useGamification } from "@/components/providers/GamificationProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { FinanceOverview } from "./FinanceOverview";
import { IncomeList } from "./IncomeList";
import { ExpenseList } from "./ExpenseList";
import { DebtList } from "./DebtList";
import { FinancialGoalList } from "./FinancialGoalList";
import { FinanceSuggestions } from "./FinanceSuggestions";
import { FinanceModal } from "./FinanceModal";
import { DebtModal } from "./DebtModal";
import { GoalModal } from "./GoalModal";
import { cn } from "@/lib/utils";

type TabKey = "overview" | "incomes" | "expenses" | "debts" | "goals" | "suggestions";

export function FinancePage() {
  const { celebrate } = useGamification();
  const {
    finances,
    debts,
    goals,
    createEntry,
    updateEntry,
    deleteEntry,
    createDebt,
    updateDebt,
    deleteDebt,
    payDebtInstallment,
    createGoal,
    updateGoal,
    deleteGoal,
    depositToGoal,
    getMonthlyTotals,
    getLast6MonthsTotals,
    getExpensesByCategory,
    getProjection,
    getSuggestions,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Modals state
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [defaultEntryType, setDefaultEntryType] = useState<"income" | "expense">("expense");

  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  const now = new Date();
  const currentM = now.getMonth() + 1;
  const currentY = now.getFullYear();

  // Derived states for sub-tabs
  const monthlyTotals = getMonthlyTotals(currentM, currentY);
  const last6Months = getLast6MonthsTotals();
  const expensesByCategory = getExpensesByCategory(currentM, currentY);
  const projection = getProjection();
  const suggestions = getSuggestions();

  const tabs = [
    { key: "overview", label: "Visão Geral" },
    { key: "incomes", label: "Entradas" },
    { key: "expenses", label: "Saídas" },
    { key: "debts", label: "Dívidas" },
    { key: "goals", label: "Metas" },
    { key: "suggestions", label: "Sugestões" },
  ] as const;

  // Handlers for finance entries
  const handleOpenFinanceModal = (type: "income" | "expense") => {
    setSelectedEntry(null);
    setDefaultEntryType(type);
    setFinanceModalOpen(true);
  };

  const handleEditFinance = (entry: any) => {
    setSelectedEntry(entry);
    setFinanceModalOpen(true);
  };

  const handleCreateFinance = (form: any) => {
    const res = createEntry(form);
    if (res) {
      celebrate(res);
    }
  };

  // Handlers for debts
  const handleOpenDebtModal = () => {
    setSelectedDebt(null);
    setDebtModalOpen(true);
  };

  const handleEditDebt = (debt: any) => {
    setSelectedDebt(debt);
    setDebtModalOpen(true);
  };

  // Handlers for goals
  const handleOpenGoalModal = () => {
    setSelectedGoal(null);
    setGoalModalOpen(true);
  };

  const handleEditGoal = (goal: any) => {
    setSelectedGoal(goal);
    setGoalModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Financeiro" subtitle="Gerenciamento de receitas, despesas, dívidas e economias do casal." />
        <div className="flex gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            icon={ListPlus}
            onClick={() => handleOpenFinanceModal("expense")}
            className="text-danger border-danger/10 hover:bg-danger/5"
          >
            Nova saída
          </Button>
          <Button
            size="sm"
            icon={ListPlus}
            onClick={() => handleOpenFinanceModal("income")}
            className="bg-success hover:bg-success/90"
          >
            Nova entrada
          </Button>
        </div>
      </div>

      {/* Tabs bar internally (scrollable in mobile) */}
      <div className="border-b border-line overflow-x-auto scrollbar-none flex">
        <div className="flex space-x-6 min-w-max pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative py-3.5 text-sm font-semibold transition-all border-b-2 hover:text-content",
                activeTab === tab.key
                  ? "border-brand text-brand-dark"
                  : "border-transparent text-muted"
              )}
            >
              {tab.label}
              {tab.key === "suggestions" && suggestions.length > 1 && (
                <span className="ml-1.5 rounded-full bg-danger/10 text-danger text-[10px] px-1.5 py-0.5 font-bold">
                  {suggestions.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active sub-tab renders */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <FinanceOverview
            finances={finances}
            debts={debts}
            monthlyTotals={monthlyTotals}
            last6Months={last6Months}
            expensesByCategory={expensesByCategory}
            projection={projection}
            onOpenModal={handleOpenFinanceModal}
          />
        )}
        {activeTab === "incomes" && (
          <IncomeList
            entries={finances}
            onCreateClick={() => handleOpenFinanceModal("income")}
            onEditClick={handleEditFinance}
            onDeleteClick={deleteEntry}
          />
        )}
        {activeTab === "expenses" && (
          <ExpenseList
            entries={finances}
            onCreateClick={() => handleOpenFinanceModal("expense")}
            onEditClick={handleEditFinance}
            onDeleteClick={deleteEntry}
          />
        )}
        {activeTab === "debts" && (
          <DebtList
            debts={debts}
            onCreateClick={handleOpenDebtModal}
            onEditClick={handleEditDebt}
            onPayInstallment={payDebtInstallment}
            onDeleteClick={deleteDebt}
            onCelebrate={(res) => celebrate(res, { big: true })}
          />
        )}
        {activeTab === "goals" && (
          <FinancialGoalList
            goals={goals}
            onCreateClick={handleOpenGoalModal}
            onEditClick={handleEditGoal}
            onDeposit={depositToGoal}
            onDeleteClick={deleteGoal}
            onCelebrate={(res) => celebrate(res, { big: true })}
          />
        )}
        {activeTab === "suggestions" && (
          <FinanceSuggestions
            finances={finances}
            debts={debts}
            goals={goals}
            expensesByCategory={expensesByCategory}
            suggestions={suggestions}
          />
        )}
      </div>

      {/* Modal overlays */}
      <FinanceModal
        open={financeModalOpen}
        entry={selectedEntry}
        defaultType={defaultEntryType}
        onClose={() => setFinanceModalOpen(false)}
        onCreate={handleCreateFinance}
        onUpdate={updateEntry}
        onDelete={deleteEntry}
      />

      <DebtModal
        open={debtModalOpen}
        debt={selectedDebt}
        onClose={() => setDebtModalOpen(false)}
        onCreate={createDebt}
        onUpdate={updateDebt}
        onPayInstallment={payDebtInstallment}
        onDelete={deleteDebt}
        onCelebrate={(res) => celebrate(res, { big: true })}
      />

      <GoalModal
        open={goalModalOpen}
        goal={selectedGoal}
        onClose={() => setGoalModalOpen(false)}
        onCreate={createGoal}
        onUpdate={updateGoal}
        onDelete={deleteGoal}
      />
    </div>
  );
}
