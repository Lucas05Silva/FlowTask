"use client";

import { useEffect, useState } from "react";
import { Wallet, ListPlus, TrendingUp } from "lucide-react";
import { useFinance } from "@/hooks/useFinance";
import { useIncomeProfile } from "@/hooks/useIncomeProfile";
import { useMonthlyExpenses } from "@/hooks/useMonthlyExpenses";
import { useGamification } from "@/components/providers/GamificationProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { FinanceOverview } from "./FinanceOverview";
import { IncomeList } from "./IncomeList";
import { ExpenseList } from "./ExpenseList";
import { DebtList } from "./DebtList";
import { FinancialGoalList } from "./FinancialGoalList";
import { FinanceSuggestions } from "./FinanceSuggestions";
import { MinhaRendaTab } from "./MinhaRendaTab";
import { PersonalFinance } from "./PersonalFinance";
import { FinanceModal } from "./FinanceModal";
import { DebtModal } from "./DebtModal";
import { GoalModal } from "./GoalModal";
import { cn } from "@/lib/utils";
import type { Assignee, FinanceEntry } from "@/types";
import type { OwnerFilter } from "@/lib/finance-filter";

type TabKey = "overview" | "incomes" | "expenses" | "debts" | "goals" | "suggestions" | "personal" | "minharenda";

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
    getEntriesByMonth,
    getMonthlyTotals,
    getLast6MonthsTotals,
    getExpensesByCategory,
    getProjection,
    getSuggestions,
  } = useFinance();

  const { isLucas, getTotalInvestment, seedIfEmpty } = useIncomeProfile();
  const { getTotalExpenses, seedIfEmpty: seedExpenses } = useMonthlyExpenses();

  // Seed Lucas's income profile + expenses so the overview figures are available.
  useEffect(() => {
    seedIfEmpty();
    seedExpenses();
  }, [seedIfEmpty, seedExpenses]);

  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Modals state
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [defaultEntryType, setDefaultEntryType] = useState<"income" | "expense">("expense");
  const [fixedOwner, setFixedOwner] = useState<Assignee | null>(null);

  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  // Ajuste 1 — mês/ano compartilhado entre Visão Geral / Entradas / Saídas / Pessoal.
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  // Ajuste 3 — visibilidade (Compartilhado por padrão) na Visão Geral + Entradas/Saídas.
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("compartilhado");

  // Derived states for sub-tabs
  const monthlyTotals = getMonthlyTotals(filterMonth, filterYear, ownerFilter);
  const last6Months = getLast6MonthsTotals();
  const expensesByCategory = getExpensesByCategory(filterMonth, filterYear, ownerFilter);
  const monthEntries = getEntriesByMonth(filterMonth, filterYear, ownerFilter);
  const projection = getProjection();
  const suggestions = getSuggestions();

  const tabs: { key: TabKey; label: string; icon?: typeof TrendingUp }[] = [
    { key: "overview", label: "Visão Geral" },
    { key: "incomes", label: "Entradas" },
    { key: "expenses", label: "Saídas" },
    { key: "debts", label: "Dívidas" },
    { key: "goals", label: "Metas" },
    { key: "suggestions", label: "Sugestões" },
    { key: "personal", label: "Pessoal" },
    // "Minha Renda" is a personal dashboard — only visible for Lucas.
    ...(isLucas ? [{ key: "minharenda" as TabKey, label: "Minha Renda", icon: TrendingUp }] : []),
  ];

  const investmentCapacity = isLucas ? getTotalInvestment() : 0;
  const fixedExpensesTotal = isLucas ? getTotalExpenses() : 0;

  // Handlers for finance entries
  const handleOpenFinanceModal = (type: "income" | "expense", owner: Assignee | null = null) => {
    setSelectedEntry(null);
    setDefaultEntryType(type);
    setFixedOwner(owner);
    setFinanceModalOpen(true);
  };

  const handleEditFinance = (entry: any) => {
    setSelectedEntry(entry);
    setFixedOwner(null); // editing keeps the Visibilidade field editable (prefilled from entry.owner)
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
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 py-3.5 text-sm font-semibold transition-all border-b-2 hover:text-content",
                  activeTab === tab.key
                    ? "border-brand text-brand-dark"
                    : "border-transparent text-muted"
                )}
              >
                {Icon && <Icon className="size-4" aria-hidden />}
                {tab.label}
                {tab.key === "suggestions" && suggestions.length > 1 && (
                  <span className="ml-1.5 rounded-full bg-danger/10 text-danger text-[10px] px-1.5 py-0.5 font-bold">
                    {suggestions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active sub-tab renders */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <FinanceOverview
            monthEntries={monthEntries}
            debts={debts}
            monthlyTotals={monthlyTotals}
            last6Months={last6Months}
            expensesByCategory={expensesByCategory}
            projection={projection}
            investmentCapacity={investmentCapacity}
            fixedExpenses={fixedExpensesTotal}
            onOpenModal={(type) => handleOpenFinanceModal(type)}
            month={filterMonth}
            year={filterYear}
            onMonthChange={setFilterMonth}
            onYearChange={setFilterYear}
            ownerFilter={ownerFilter}
            onOwnerFilterChange={setOwnerFilter}
          />
        )}
        {activeTab === "minharenda" && <MinhaRendaTab />}
        {activeTab === "incomes" && (
          <IncomeList
            entries={monthEntries}
            month={filterMonth}
            year={filterYear}
            onMonthChange={setFilterMonth}
            onYearChange={setFilterYear}
            onCreateClick={() => handleOpenFinanceModal("income")}
            onEditClick={handleEditFinance}
            onDeleteClick={deleteEntry}
          />
        )}
        {activeTab === "expenses" && (
          <ExpenseList
            entries={monthEntries}
            month={filterMonth}
            year={filterYear}
            onMonthChange={setFilterMonth}
            onYearChange={setFilterYear}
            onCreateClick={() => handleOpenFinanceModal("expense")}
            onEditClick={handleEditFinance}
            onDeleteClick={deleteEntry}
          />
        )}
        {activeTab === "personal" && (
          <PersonalFinance
            lucasEntries={getEntriesByMonth(filterMonth, filterYear, "lucas")}
            thaianeEntries={getEntriesByMonth(filterMonth, filterYear, "thaiane")}
            month={filterMonth}
            year={filterYear}
            onMonthChange={setFilterMonth}
            onYearChange={setFilterYear}
            onCreate={(owner: Assignee) => handleOpenFinanceModal("expense", owner)}
            onEdit={(entry: FinanceEntry) => {
              setSelectedEntry(entry);
              setFixedOwner(entry.owner ?? null);
              setFinanceModalOpen(true);
            }}
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
        fixedOwner={fixedOwner}
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
