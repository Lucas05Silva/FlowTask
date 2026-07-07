"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { NotesList } from "./NotesList";
import { NoteEditor } from "./NoteEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

export function NotesPage() {
  const {
    selectedNoteId,
    selectedNote,
    setSelectedNote,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
  } = useNotes();

  const [searchQuery, setSearchQuery] = useState("");

  // Filtered notes based on search query
  const filteredNotes = searchNotes(searchQuery);

  const handleSelectNote = (id: string) => {
    setSelectedNote(id);
  };

  const handleCloseEditor = () => {
    setSelectedNote(null);
  };

  const handleCreateNote = () => {
    createNote();
  };

  const isEditorOpen = selectedNoteId !== null;

  return (
    <div className="mx-auto max-w-6xl h-full flex flex-col space-y-6">
      {/* Header (Hidden on mobile when editing a note) */}
      <div className={isEditorOpen ? "hidden md:flex md:items-center md:justify-between" : "flex items-center justify-between"}>
        <PageHeader 
          title="Notas" 
          subtitle="Rascunhe ideias rápidos, organize pensamentos ou compartilhe lembretes." 
        />
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleCreateNote}
          className="flex items-center gap-1.5 font-bold cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Nova nota</span>
        </Button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex gap-6 min-h-[500px] items-stretch">
        
        {/* Left Column: List + Search (Hidden on mobile when editing a note) */}
        <div 
          className={isEditorOpen 
            ? "hidden md:flex w-full md:w-[320px] shrink-0 flex-col gap-4 border-r border-line/45 pr-0 md:pr-6" 
            : "flex w-full md:w-[320px] shrink-0 flex-col gap-4 md:border-r md:border-line/45 pr-0 md:pr-6"
          }
        >
          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nas notas..."
              className="w-full h-10 pl-9 pr-4 rounded-input border border-line bg-panel/30 text-sm focus:border-brand focus:ring-0 focus:outline-none placeholder:opacity-50"
            />
          </div>

          {/* Notes list */}
          <div className="flex-1">
            <NotesList
              notes={filteredNotes}
              selectedNoteId={selectedNoteId}
              onSelectNote={handleSelectNote}
              onDeleteNote={deleteNote}
              onCreateNote={handleCreateNote}
              isSearching={searchQuery.trim().length > 0}
            />
          </div>
        </div>

        {/* Right Column: Editor (Hidden on mobile if no note is selected) */}
        <div 
          className={isEditorOpen 
            ? "flex-1 flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-210px)]" 
            : "hidden md:flex flex-1 flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-210px)]"
          }
        >
          <NoteEditor
            note={selectedNote}
            onUpdate={updateNote}
            onDelete={deleteNote}
            onClose={handleCloseEditor}
          />
        </div>

      </div>
    </div>
  );
}
export default NotesPage;
