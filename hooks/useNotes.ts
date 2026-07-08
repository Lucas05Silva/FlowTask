"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Note } from "@/types";
import { useData } from "@/hooks/useData";
import { useAuth } from "@/components/providers/AuthProvider";
import { updateData } from "@/lib/data/store";
import { uid } from "@/lib/utils";

function generateUUID(): string {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useNotes() {
  const data = useData();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = user?.id ?? null;

  // Selected note ID from query parameters (?id=...)
  const selectedNoteId = searchParams.get("id");

  const setSelectedNoteId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("id", id);
      } else {
        params.delete("id");
      }
      router.push(`/notas?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Retrieve notes: all notes
  const notes = useMemo(() => {
    if (!userId) return [];
    return (data.notes || [])
      .sort((a, b) => {
        // Pinned notes first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then by updatedAt desc
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [data.notes, userId]);

  // Selected Note object
  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  // Create a new blank note and select it
  const createNote = useCallback(() => {
    if (!userId) return null;

    const newNote: Note = {
      id: generateUUID(),
      title: "",
      content: "",
      color: "default",
      isPinned: false,
      isShared: false,
      ownerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateData((d) => ({
      ...d,
      notes: [...(d.notes || []), newNote],
    }));

    setSelectedNoteId(newNote.id);
    return newNote;
  }, [userId, setSelectedNoteId]);

  // Update note updates
  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    updateData((d) => ({
      ...d,
      notes: (d.notes || []).map((n) =>
        n.id === id
          ? {
              ...n,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : n
      ),
    }));
  }, []);

  // Delete note
  const deleteNote = useCallback(
    (id: string) => {
      updateData((d) => ({
        ...d,
        notes: (d.notes || []).filter((n) => n.id !== id),
      }));

      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
    },
    [selectedNoteId, setSelectedNoteId]
  );

  // Pin / Unpin Note
  const pinNote = useCallback(
    (id: string, isPinned: boolean) => {
      updateNote(id, { isPinned });
    },
    [updateNote]
  );

  // Set Color Note
  const setColor = useCallback(
    (id: string, color: Note["color"]) => {
      updateNote(id, { color });
    },
    [updateNote]
  );

  // Share / Unshare Note
  const shareNote = useCallback(
    (id: string, isShared: boolean) => {
      updateNote(id, { isShared });
    },
    [updateNote]
  );

  // Search notes by title or content
  const searchNotes = useCallback(
    (query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return notes;
      return notes.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          n.content.toLowerCase().includes(q)
      );
    },
    [notes]
  );

  return {
    notes,
    selectedNoteId,
    selectedNote,
    setSelectedNote: setSelectedNoteId,
    createNote,
    updateNote,
    deleteNote,
    pinNote,
    setColor,
    shareNote,
    searchNotes,
  };
}
