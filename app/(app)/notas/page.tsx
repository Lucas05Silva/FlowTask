"use client";

import { Suspense } from "react";
import NotesPage from "@/components/notes/NotesPage";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex h-[400px] items-center justify-center text-sm text-muted">
        Carregando notas...
      </div>
    }>
      <NotesPage />
    </Suspense>
  );
}
