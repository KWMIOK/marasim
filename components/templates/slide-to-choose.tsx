"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

const THUMB_WIDTH = 44;

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
  const draggingRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const completedRef = useRef(false);

  const updateOffset = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || completedRef.current) return;

      const rect = track.getBoundingClientRect();
      const max = Math.max(rect.width - THUMB_WIDTH - 8, 0);
      const next = Math.min(Math.max(clientX - rect.left - THUMB_WIDTH / 2, 0), max);
      setOffset(next);

      if (max > 0 && next >= max * 0.92) {
        completedRef.current = true;
        draggingRef.current = false;
        setOffset(max);
        onComplete();
      }
    },
    [onComplete]
  );

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (completedRef.current) return;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    updateOffset(event.clientX);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || completedRef.current) return;
    event.preventDefault();
    updateOffset(event.clientX);
  }

  function finishDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (completedRef.current) return;
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setOffset(0);
  }

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative h-11 overflow-hidden rounded-xl border border-border-gold-strong bg-surface/90 backdrop-blur-sm touch-none select-none",
        className
      )}
    >
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-12 text-xs font-medium text-gold-light">
        {label}
      </span>
      <div
        className="absolute top-1 left-1 flex h-9 w-11 cursor-grab items-center justify-center rounded-lg bg-gradient-to-br from-[#e8d5a3] to-[#c9a227] text-[#0a0a0a] shadow-md active:cursor-grabbing touch-none"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </div>
    </div>
  );
}
