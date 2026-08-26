'use client';

import { useCallback, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 280;
const MAX_WIDTH = 640;

export function ResizableSidebar({ children }: { children: React.ReactNode }) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, width: DEFAULT_WIDTH });

  const startDragging = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      dragStart.current = { x: event.clientX, width };
      setIsDragging(true);

      function handlePointerMove(moveEvent: PointerEvent) {
        const delta = dragStart.current.x - moveEvent.clientX;
        const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStart.current.width + delta));
        setWidth(next);
      }

      function handlePointerUp() {
        setIsDragging(false);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      }

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [width]
  );

  return (
    <aside
      className="relative flex shrink-0 border-l"
      style={{ width }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={width}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        tabIndex={0}
        onPointerDown={startDragging}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') setWidth((w) => Math.min(MAX_WIDTH, w + 16));
          if (event.key === 'ArrowRight') setWidth((w) => Math.max(MIN_WIDTH, w - 16));
        }}
        className={cn(
          'absolute top-0 -left-1 z-10 h-full w-2 cursor-col-resize touch-none',
          'after:absolute after:top-0 after:left-1/2 after:h-full after:w-px after:-translate-x-1/2 after:bg-transparent after:transition-colors hover:after:bg-ring',
          isDragging && 'after:bg-ring'
        )}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </aside>
  );
}
