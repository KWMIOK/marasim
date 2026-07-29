"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function SlideToChoose({
  label,
  onComplete,
  className,
}: {
  label: string;
  onComplete: () => void;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const completedRef = useRef(false);

  const updateOffset = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track || completedRef.current) return;

    const rect = track.getBoundingClientRect();
    const thumbWidth = 44;
    const max = Math.max(rect.width - thumbWidth - 8, 0);
    const next = Math.min(Math.max(clientX - rect.left - thumbWidth / 2, 0), max);
    setOffset(next);

    if (max > 0 && next >= max * 0.92) {
      completedRef.current = true;
      setOffset(max);
      onComplete();
    }
  }, [onComplete]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (completedRef.current) return;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateOffset(event.clientX);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || completedRef.current) return;
    updateOffset(event.clientX);
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (completedRef.current) return;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    setOffset(0);
  }

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative h-11 overflow-hidden rounded-xl border border-border-gold-strong bg-surface/90 backdrop-blur-sm",
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-12 text-xs font-medium text-gold-light">
        {label}
      </span>
      <div
        className="absolute top-1 left-1 flex h-9 w-11 cursor-grab items-center justify-center rounded-lg bg-gradient-to-br from-[#e8d5a3] to-[#c9a227] text-[#0a0a0a] shadow-md active:cursor-grabbing"
        style={{ transform: `translateX(${offset}px)` }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </div>
    </div>
  );
}
