"use client";

import { useState, useMemo } from "react";
import { Plus, Home, DollarSign, TrendingUp, Search, Info } from "lucide-react";
import { useApartment } from "@/hooks/useApartment";
import { useGamification } from "@/components/providers/GamificationProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApartmentProgress } from "./ApartmentProgress";
import { RoomSection } from "./RoomSection";
import { ApartmentItemModal } from "./ApartmentItemModal";
import { formatBRL } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PriorityFilter = "todas" | "essencial" | "importante" | "desejavel";
type StatusFilter = "todas" | "pesquisando" | "orcado" | "comprado" | "entregue";

export function ApartmentPage() {
  const { celebrate } = useGamification();
  const {
    items,
    createItem,
    updateItem,
    deleteItem,
    getTotalEstimated,
    getTotalSpent,
    getProgress,
    getProgressByPriority,
    getRooms,
  } = useApartment();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("todas");
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilter>("todas");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("todas");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Derived financials
  const totalEstimated = getTotalEstimated();
  const totalSpent = getTotalSpent();

  // Savings / Excess calculation
  const completedItems = useMemo(() => {
    return items.filter((i) => i.status === "comprado" || i.status === "entregue");
  }, [items]);

  const savings = useMemo(() => {
    const estSum = completedItems.reduce((s, i) => s + i.estimatedCost, 0);
    const actSum = completedItems.reduce((s, i) => s + (i.actualCost ?? i.estimatedCost), 0);
    return estSum - actSum;
  }, [completedItems]);

  const progress = getProgress();
  const priorityBreakdown = getProgressByPriority();
  const roomsList = getRooms();

  // Handlers
  const handleCreateClick = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  // Filtered rooms & items mapping
  const filteredRoomsData = useMemo(() => {
    const dataMap: Record<string, any[]> = {};
    
    // Group all filtered items by their room name
    items.forEach((item) => {
      // Apply filters
      const matchRoom = selectedRoom === "todas" || item.room.toLowerCase() === selectedRoom.toLowerCase();
      const matchPriority = selectedPriority === "todas" || item.priority === selectedPriority;
      const matchStatus = selectedStatus === "todas" || item.status === selectedStatus;
      const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (matchRoom && matchPriority && matchStatus && matchSearch) {
        const roomKey = item.room.trim().toLowerCase();
        if (!dataMap[roomKey]) {
          dataMap[roomKey] = [];
        }
        dataMap[roomKey].push(item);
      }
    });

    return dataMap;
  }, [items, selectedRoom, selectedPriority, selectedStatus, searchQuery]);

  const hasAnyFilteredItem = useMemo(() => {
    return Object.keys(filteredRoomsData).length > 0;
  }, [filteredRoomsData]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Apartamento" subtitle="Planejamento e controle de mobília por cômodo, orçamentos e prazos." />
        <Button
          onClick={handleCreateClick}
          size="sm"
          icon={Plus}
          className="bg-brand hover:bg-brand/90 self-start sm:self-auto"
        >
          Novo item
        </Button>
      </div>

      {/* Resumo Financeiro no topo (3 cards) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Orçamento Estimado */}
        <Card className="border-line bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Orçamento Estimado</span>
            <span className="rounded-full bg-brand/10 text-brand p-2">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-content">{formatBRL(totalEstimated)}</h3>
            <p className="mt-1 text-xs text-muted">Estimativa total planejada</p>
          </div>
        </Card>

        {/* Total Já Gasto */}
        <Card className="border-line bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Total Já Gasto</span>
            <span className="rounded-full bg-success/10 text-success p-2">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-bold text-success">{formatBRL(totalSpent)}</h3>
            <p className="mt-1 text-xs text-muted">Apenas itens comprados/entregues</p>
          </div>
        </Card>

        {/* Economia / Estouro */}
        <Card className="border-line bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Economia / Estouro</span>
            <span
              className={`rounded-full p-2 ${
                savings >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              }`}
            >
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className={`text-2xl font-bold ${savings >= 0 ? "text-success" : "text-danger"}`}>
              {savings >= 0 ? "+" : ""}
              {formatBRL(savings)}
            </h3>
            <p className="mt-1 text-xs text-muted">Diferença estimado vs real</p>
          </div>
        </Card>
      </div>

      {/* Apartment General Progress dashboard */}
      <ApartmentProgress
        total={progress.total}
        completed={progress.completed}
        percentage={progress.percentage}
        priorityBreakdown={priorityBreakdown}
      />

      {/* Filters Toolbar */}
      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar item..."
            className="pl-9"
          />
        </div>

        <div className="grid gap-2 grid-cols-3 shrink-0">
          {/* Room filter */}
          <Select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
            <option value="todas">Todos cômodos</option>
            {roomsList.map((room) => (
              <option key={room} value={room}>
                {room.charAt(0).toUpperCase() + room.slice(1)}
              </option>
            ))}
          </Select>

          {/* Priority filter */}
          <Select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as PriorityFilter)}
          >
            <option value="todas">Todas prioridades</option>
            <option value="essencial">Essencial</option>
            <option value="importante">Importante</option>
            <option value="desejavel">Desejável</option>
          </Select>

          {/* Status filter */}
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
          >
            <option value="todas">Todos status</option>
            <option value="pesquisando">Pesquisando</option>
            <option value="orcado">Orçado</option>
            <option value="comprado">Comprado</option>
            <option value="entregue">Entregue</option>
          </Select>
        </div>
      </Card>

      {/* Rooms listSections accordion */}
      <div className="space-y-6">
        {!hasAnyFilteredItem ? (
          <EmptyState
            icon={Home}
            title="Seu novo lar começa aqui!"
            description={
              searchQuery || selectedRoom !== "todas" || selectedPriority !== "todas" || selectedStatus !== "todas"
                ? "Nenhum item atende aos filtros selecionados."
                : "Adicione os itens que precisa comprar para mobiliar o apê 🏠"
            }
            action={
              !searchQuery &&
              selectedRoom === "todas" &&
              selectedPriority === "todas" &&
              selectedStatus === "todas" && (
                <Button size="sm" icon={Plus} onClick={handleCreateClick}>
                  Criar primeiro item
                </Button>
              )
            }
          />
        ) : (
          roomsList.map((room) => {
            const roomItems = filteredRoomsData[room.toLowerCase()] || [];
            if (roomItems.length === 0) return null;

            return (
              <RoomSection
                key={room}
                roomName={room}
                items={roomItems}
                onItemClick={handleEditClick}
              />
            );
          })
        )}
      </div>

      {/* Add / Edit Modal Overlay */}
      <ApartmentItemModal
        open={modalOpen}
        item={editingItem}
        onClose={() => setModalOpen(false)}
        onCreate={createItem}
        onUpdate={updateItem}
        onDelete={deleteItem}
        onCelebrate={(res) => celebrate(res, { big: true })}
      />
    </div>
  );
}
