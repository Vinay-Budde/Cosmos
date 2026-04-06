import React, { useCallback } from 'react';
import { keys } from '../hooks/useMovement';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

// Maps a direction to the key it simulates
const DIR_KEYS = {
  up:    'ArrowUp',
  down:  'ArrowDown',
  left:  'ArrowLeft',
  right: 'ArrowRight',
};

function DPadButton({ direction, icon }) {
  const press   = useCallback(() => { keys[DIR_KEYS[direction]] = true;  }, [direction]);
  const release = useCallback(() => { keys[DIR_KEYS[direction]] = false; }, [direction]);

  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); press(); }}
      onTouchEnd={(e)   => { e.preventDefault(); release(); }}
      onMouseDown={press}
      onMouseUp={release}
      onMouseLeave={release}
      className="w-12 h-12 rounded-xl flex items-center justify-center active:scale-90 transition-transform select-none touch-none"
      style={{
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
      aria-label={`Move ${direction}`}
    >
      {icon}
    </button>
  );
}

export default function MobileControls() {
  return (
    <div
      className="fixed left-4 z-50 select-none touch-none"
      style={{ bottom: 'calc(70px + env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Up */}
        <DPadButton direction="up"    icon={<ChevronUp    className="w-6 h-6 text-white" />} />

        {/* Middle row: Left + Down + Right */}
        <div className="flex gap-1">
          <DPadButton direction="left"  icon={<ChevronLeft  className="w-6 h-6 text-white" />} />
          <DPadButton direction="down"  icon={<ChevronDown  className="w-6 h-6 text-white" />} />
          <DPadButton direction="right" icon={<ChevronRight className="w-6 h-6 text-white" />} />
        </div>
      </div>
    </div>
  );
}
