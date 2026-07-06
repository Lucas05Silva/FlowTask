export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2MB
export const AVATAR_ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export interface ImageValidationError {
  message: string;
}

/** Validate an avatar file (type + size). Returns an error message or null. */
export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_ACCEPTED.includes(file.type)) {
    return "Use uma imagem JPG, PNG ou WEBP.";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "A foto deve ter no máximo 2MB.";
  }
  return null;
}

/**
 * Resize an image client-side to fit within `maxSize`x`maxSize` (keeping aspect
 * ratio) and encode as JPEG at 85% quality. Keeps uploads tiny (~50–100KB).
 */
export function resizeImage(file: File, maxSize = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxSize / img.width, maxSize / img.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas indisponível"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao processar a imagem"))),
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem"));
    };
    img.src = url;
  });
}
