"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Pin, Share2, Trash2 } from "lucide-react";
import type { Note } from "@/types";
import { useAuth } from "@/components/providers/AuthProvider";
import { NoteColorPicker, NOTE_COLOR_MAP } from "./NoteColorPicker";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  note: Note | null;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onClose: () => void; // Used for mobile back navigation
}

export function NoteEditor({ note, onUpdate, onDelete, onClose }: NoteEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  // Keep track of the current values and note ID with refs for the debounce and cleanup (autosave on unmount/change)
  const valuesRef = useRef({ title, content, noteId: note?.id });
  useEffect(() => {
    valuesRef.current = { title, content, noteId: note?.id };
  }, [title, content, note?.id]);

  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine partner name
  const partnerName = user?.name.toLowerCase() === "lucas" ? "Thaiane" : "Lucas";

  // Check if current user is the owner
  const isOwner = note ? note.ownerId === user?.id : false;

  // Auto-resize textarea to fit content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  // Flush pending changes synchronously (helper)
  const flushChanges = useCallback(() => {
    const current = valuesRef.current;
    if (current.noteId && isOwner) {
      onUpdateRef.current(current.noteId, { title: current.title, content: current.content });
    }
  }, [isOwner]);

  // Handle Note Swap: Load new note data or flush changes from old note first
  useEffect(() => {
    // 1. Flush any pending changes of the PREVIOUS note
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      flushChanges();
    }

    // 2. Load the CURRENT note values
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setSaveStatus("saved");
    } else {
      setTitle("");
      setContent("");
    }

    // Adjust height after loading content
    setTimeout(adjustTextareaHeight, 50);
  }, [note?.id, adjustTextareaHeight]); // Triggered only when swapping note ID

  // Save changes on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      flushChanges();
    };
  }, [flushChanges]);

  // Auto-resize when typing content
  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // Handle user inputs & trigger debounce autosave
  const handleTextChange = (field: "title" | "content", value: string) => {
    if (!note) return;

    if (field === "title") setTitle(value);
    if (field === "content") setContent(value);

    // Only owner can trigger autosave
    if (!isOwner) return;

    setSaveStatus("saving");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Trigger update
      onUpdate(note.id, {
        title: field === "title" ? value : title,
        content: field === "content" ? value : content,
      });
      setSaveStatus("saved");
      debounceTimerRef.current = null;
    }, 800);
  };

  const handleTogglePin = () => {
    if (!note || !isOwner) return;
    onUpdate(note.id, { isPinned: !note.isPinned });
  };

  const handleToggleShare = () => {
    if (!note || !isOwner) return;
    onUpdate(note.id, { isShared: !note.isShared });
  };

  const handleColorChange = (color: Note["color"]) => {
    if (!note || !isOwner) return;
    onUpdate(note.id, { color });
  };

  const handleDelete = () => {
    if (!note || !isOwner) return;
    if (confirm("Excluir esta nota?")) {
      onDelete(note.id);
    }
  };

  // Render Empty State if no note is selected
  if (!note) {
    return (
      <div className="hidden h-full flex-col items-center justify-center p-8 text-center md:flex bg-panel/30 border border-line/45 rounded-card">
        <div className="rounded-full bg-line/10 p-5 text-muted opacity-40 mb-4 animate-pulse">
          <svg
            className="size-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-extrabold text-content">Sem nota selecionada</h3>
        <p className="mt-1 text-sm text-muted max-w-xs leading-relaxed">
          Selecione uma nota na lista à esquerda ou crie uma nova para começar a rascunhar.
        </p>
      </div>
    );
  }

  const colorConfig = NOTE_COLOR_MAP[note.color || "default"];

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-card transition-all duration-300 overflow-hidden border border-line/50",
        colorConfig.classes
      )}
    >
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Back button (Mobile only) */}
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-inherit transition-all md:hidden shrink-0 cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>

          {isOwner && (
            <NoteColorPicker selectedColor={note.color || "default"} onChange={handleColorChange} />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Status Indicator */}
          {isOwner && (
            <span className="text-[11px] font-bold opacity-60 mr-2 select-none">
              {saveStatus === "saving" ? "Salvando..." : "Salvo ✓"}
            </span>
          )}

          {/* Toggle Pin */}
          {isOwner && (
            <button
              onClick={handleTogglePin}
              title={note.isPinned ? "Desafixar nota" : "Fixar nota"}
              className={cn(
                "grid size-8.5 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-inherit transition-all cursor-pointer",
                note.isPinned && "bg-black/5 dark:bg-white/5 text-brand"
              )}
            >
              <Pin className={cn("size-4.5", note.isPinned && "fill-current rotate-45")} />
            </button>
          )}

          {/* Toggle Share */}
          {isOwner && (
            <button
              onClick={handleToggleShare}
              title={note.isShared ? `Deixar privada` : `Compartilhar com ${partnerName}`}
              className={cn(
                "grid size-8.5 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-inherit transition-all cursor-pointer",
                note.isShared && "bg-black/5 dark:bg-white/5 text-success"
              )}
            >
              <Share2 className="size-4.5" />
            </button>
          )}

          {/* Delete Button */}
          {isOwner && (
            <button
              onClick={handleDelete}
              title="Excluir nota"
              className="grid size-8.5 place-items-center rounded-full hover:bg-danger/10 hover:text-danger text-inherit transition-all cursor-pointer"
            >
              <Trash2 className="size-4.5" />
            </button>
          )}

          {/* Non-owner Read-only Badge */}
          {!isOwner && (
            <span className="text-xs font-black text-brand bg-brand/10 border border-brand/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Share2 className="size-3 shrink-0" />
              Somente leitura
            </span>
          )}
        </div>
      </div>

      {/* Shared Info Banner */}
      {note.isShared && (
        <div className="bg-black/5 dark:bg-white/5 px-4 py-1.5 text-[10px] font-bold opacity-75 border-b border-black/5 dark:border-white/5 flex items-center justify-between shrink-0">
          <span>
            {isOwner 
              ? `🔗 Nota compartilhada com ${partnerName}` 
              : `🔗 Nota compartilhada por ${partnerName}`}
          </span>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTextChange("title", e.target.value)}
          placeholder={isOwner ? "Título (opcional)" : "Sem título"}
          disabled={!isOwner}
          className="w-full bg-transparent border-0 p-0 font-display font-black text-xl md:text-2xl text-inherit placeholder:opacity-40 focus:ring-0 focus:outline-none focus:border-0"
        />

        {/* Content Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleTextChange("content", e.target.value)}
          placeholder={isOwner ? "Comece a escrever..." : "Nota vazia"}
          disabled={!isOwner}
          className="w-full bg-transparent border-0 p-0 font-body text-sm md:text-base leading-relaxed text-inherit placeholder:opacity-40 focus:ring-0 focus:outline-none focus:border-0 resize-none min-h-[250px]"
        />
      </div>
    </div>
  );
}
