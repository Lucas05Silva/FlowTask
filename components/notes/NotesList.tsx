"use client";

import { motion } from "framer-motion";
import { NotebookPen } from "lucide-react";
import type { Note } from "@/types";
import { NoteCard } from "./NoteCard";
import { Button } from "@/components/ui/Button";

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: () => void;
  isSearching: boolean;
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardItemVariants = {
  hidden: { y: 10, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 350, damping: 25 } },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
};

export function NotesList({
  notes,
  selectedNoteId,
  onSelectNote,
  onDeleteNote,
  onCreateNote,
  isSearching,
}: NotesListProps) {
  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);

  // If completely empty (no search query)
  if (notes.length === 0 && !isSearching) {
    return (
      <div className="flex h-[350px] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-full bg-line/10 p-5 text-muted opacity-40 mb-4 animate-bounce">
          <NotebookPen className="size-12" />
        </div>
        <h3 className="text-base font-extrabold text-content">Nenhuma nota ainda</h3>
        <p className="mt-1 text-xs text-muted max-w-[200px] leading-relaxed mb-4">
          Capture suas ideias antes que elas fujam 💡
        </p>
        <Button variant="outline" size="sm" onClick={onCreateNote}>
          + Criar primeira nota
        </Button>
      </div>
    );
  }

  // If empty due to search filter
  if (notes.length === 0 && isSearching) {
    return (
      <div className="flex h-[250px] flex-col items-center justify-center p-6 text-center">
        <h3 className="text-sm font-extrabold text-content">Nenhuma nota encontrada</h3>
        <p className="mt-1 text-xs text-muted max-w-[180px] leading-relaxed">
          Tente buscar por outro termo ou palavra-chave
        </p>
      </div>
    );
  }

  const renderCard = (note: Note) => (
    <motion.div
      key={note.id}
      variants={cardItemVariants}
      layoutId={note.id}
      className="outline-none"
    >
      <NoteCard
        note={note}
        isSelected={selectedNoteId === note.id}
        onSelect={() => onSelectNote(note.id)}
        onDelete={() => onDeleteNote(note.id)}
      />
    </motion.div>
  );

  return (
    <div className="space-y-6 overflow-y-auto pb-4 max-h-[calc(100vh-230px)] md:max-h-[calc(100vh-190px)] pr-1 scrollbar-thin">
      {/* Pinned Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 px-1 text-[10px] font-bold text-brand uppercase tracking-wider select-none">
            <span>📌 Fixadas</span>
          </div>
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-3 grid-cols-1"
          >
            {pinnedNotes.map(renderCard)}
          </motion.div>
        </div>
      )}

      {/* Others Section */}
      {otherNotes.length > 0 && (
        <div className="space-y-2">
          {pinnedNotes.length > 0 && (
            <div className="flex items-center gap-1 px-1 text-[10px] font-bold text-muted uppercase tracking-wider select-none pt-2 border-t border-line/40">
              <span>Notas</span>
            </div>
          )}
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-3 grid-cols-1"
          >
            {otherNotes.map(renderCard)}
          </motion.div>
        </div>
      )}
    </div>
  );
}
