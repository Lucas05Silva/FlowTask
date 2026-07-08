"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Pencil, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/providers/ToastProvider";
import { Avatar } from "@/components/ui/Avatar";
import { validateAvatarFile, AVATAR_ACCEPTED } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

const SIZE = 120;

export function AvatarUpload() {
  const { user } = useAuth();
  const { uploadAvatar, removeAvatar } = useProfile();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);

  if (!user) return null;

  async function handleFile(file: File) {
    setError(null);
    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    try {
      await uploadAvatar(file);
      toast({ variant: "success", title: "Foto atualizada! 📸" });
      setPulse(true);
      setTimeout(() => setPulse(false), 320);
    } catch (e) {
      let msg = e instanceof Error ? e.message : "Falha no upload da foto.";
      if (msg.toLowerCase().includes("bucket not found")) {
        msg = "O bucket 'avatars' não existe. Crie-o como Público no painel da Supabase.";
      }
      setError(msg);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
      setPreview(null);
    }
  }

  const displayUser = preview
    ? { name: user.name, avatarUrl: preview, avatarEmoji: null }
    : user;

  return (
    <div className="flex flex-col items-center">
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      <motion.button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Alterar foto de perfil"
        animate={pulse ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.32 }}
        className={cn(
          "group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          error && "ring-2 ring-danger ring-offset-2 ring-offset-surface",
        )}
        style={{ width: SIZE, height: SIZE }}
      >
        <Avatar user={displayUser} size={SIZE} className="shadow-pop" />

        {/* Hover overlay */}
        <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Camera className="size-7 text-white" aria-hidden />
        </span>

        {/* Loading overlay */}
        {uploading && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/55">
            <Loader2 className="size-8 animate-spin text-white" aria-hidden />
          </span>
        )}

        {/* Edit badge */}
        {!uploading && (
          <span className="absolute bottom-1 right-1 grid size-8 place-items-center rounded-full border-2 border-surface bg-brand text-white shadow-soft">
            <Pencil className="size-3.5" aria-hidden />
          </span>
        )}
      </motion.button>

      <p className="mt-3 text-xs text-muted">
        {uploading ? "Enviando…" : "Clique na foto para alterar"}
      </p>
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}

      {user.avatarUrl && !uploading && (
        <button
          type="button"
          onClick={() => {
            void removeAvatar();
            toast({ variant: "success", title: "Foto removida" });
          }}
          className="mt-1 text-xs text-danger/80 transition-colors hover:text-danger"
        >
          Remover foto
        </button>
      )}
    </div>
  );
}
