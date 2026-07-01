interface CalendarDotProps {
  color: string;
  size?: number;
}

/** Small colored dot indicating an item on a day cell. */
export function CalendarDot({ color, size = 6 }: CalendarDotProps) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, backgroundColor: color }}
      aria-hidden
    />
  );
}
