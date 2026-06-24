import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";

interface CursorGlowProps {
  children: ReactNode;
  className?: string;
  /** CSS color (or token var) the spotlight gradient fades in from. */
  glowColor?: string;
  /** Hero treatment: glow stays visible instead of only appearing on hover. */
  alwaysOn?: boolean;
}

// Wraps children in a surface whose background spotlight follows the
// pointer (see .cursor-glow in index.css) — used on the hero and on
// feature/auth cards, never on the clinic data table.
export function CursorGlow({ children, className = "", glowColor, alwaysOn = false }: CursorGlowProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--y", `${e.clientY - rect.top}px`);
    if (!alwaysOn) el.style.setProperty("--glow-opacity", "1");
  }

  function handlePointerLeave() {
    if (!alwaysOn) ref.current?.style.setProperty("--glow-opacity", "0");
  }

  return (
    <div
      ref={ref}
      className={`cursor-glow ${className}`}
      style={
        {
          ...(glowColor ? { "--glow-color": glowColor } : {}),
          ...(alwaysOn ? { "--glow-opacity": "1" } : {}),
        } as CSSProperties
      }
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </div>
  );
}
