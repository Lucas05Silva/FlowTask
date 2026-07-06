"use client";

import { useCallback } from "react";
import { updateData } from "@/lib/data/store";
import { useAuth } from "@/components/providers/AuthProvider";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/image-utils";

const BUCKET = "avatars";

export function useProfile() {
  const { user } = useAuth();

  /** Resize → upload (overwrite) → save cache-busted public URL on the profile. */
  const uploadAvatar = useCallback(
    async (file: File): Promise<void> => {
      if (!user) throw new Error("Sem usuário logado.");
      if (!supabaseConfigured) throw new Error("Supabase não configurado.");

      const blob = await resizeImage(file, 400);
      const path = `${user.id}.jpg`;
      const sb = getSupabase();

      const { error } = await sb.storage
        .from(BUCKET)
        .upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
      if (error) throw error;

      const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
      const bustedUrl = `${data.publicUrl}?t=${Date.now()}`;

      // Persist on the profile (diff-sync writes to the users table + updates global state).
      updateData((d) => ({
        ...d,
        users: d.users.map((u) => (u.id === user.id ? { ...u, avatarUrl: bustedUrl } : u)),
      }));
    },
    [user],
  );

  const removeAvatar = useCallback(async (): Promise<void> => {
    if (!user) return;
    if (supabaseConfigured) {
      try {
        await getSupabase().storage.from(BUCKET).remove([`${user.id}.jpg`]);
      } catch {
        /* ignore storage errors — still clear the profile url */
      }
    }
    updateData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === user.id ? { ...u, avatarUrl: null } : u)),
    }));
  }, [user]);

  return { uploadAvatar, removeAvatar };
}
