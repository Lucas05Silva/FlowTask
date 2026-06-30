import Image from "next/image";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

interface AvatarProps {
  user: Pick<User, "name" | "avatarUrl" | "avatarEmoji">;
  size?: number;
  className?: string;
  ring?: boolean;
}

export function Avatar({ user, size = 40, className, ring = false }: AvatarProps) {
  const dimension = { width: size, height: size };
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand/15 font-semibold text-brand-dark select-none",
        ring && "ring-2 ring-brand ring-offset-2 ring-offset-surface",
        className,
      )}
      style={{ ...dimension, fontSize: size * 0.45 }}
      aria-hidden
    >
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt="" width={size} height={size} className="size-full object-cover" />
      ) : user.avatarEmoji ? (
        <span style={{ fontSize: size * 0.5 }}>{user.avatarEmoji}</span>
      ) : (
        user.name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
