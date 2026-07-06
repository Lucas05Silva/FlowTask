"use client";

/* Reset broken-image state when the avatar URL changes — intentional. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

interface AvatarProps {
  user: Pick<User, "name" | "avatarUrl" | "avatarEmoji">;
  size?: number;
  className?: string;
  ring?: boolean;
}

export function Avatar({ user, size = 40, className, ring = false }: AvatarProps) {
  const [broken, setBroken] = useState(false);

  // Reset the error state when the URL changes (e.g. after a new upload).
  useEffect(() => setBroken(false), [user.avatarUrl]);

  const showImage = user.avatarUrl && !broken;

  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand/15 font-semibold text-brand-dark select-none",
        ring && "ring-2 ring-brand ring-offset-2 ring-offset-surface",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl as string}
          alt=""
          width={size}
          height={size}
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : user.avatarEmoji ? (
        <span style={{ fontSize: size * 0.5 }}>{user.avatarEmoji}</span>
      ) : (
        user.name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
