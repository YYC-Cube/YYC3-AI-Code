import React from 'react';
import { useDragLayer } from 'react-dnd';
import {
  RectangleHorizontal, Type, ImageIcon, Square, Minus, Circle,
  TextCursorInput, ChevronDown, CheckSquare, ToggleLeft, Calendar, AlignLeft,
  Table, ChartBar, List, TrendingUp, Loader,
  User, Play, Smile,
  MapPin, GitBranch, FileText, Code, GripVertical
} from 'lucide-react';
import { useThemeTokens } from './hooks/useThemeTokens';

const iconMap: Record<string, React.ElementType> = {
  RectangleHorizontal, Type, Image: ImageIcon, Square, Minus, Circle,
  TextCursorInput, ChevronDown, CheckSquare, ToggleLeft, Calendar, AlignLeft,
  Table, ChartBar, List, TrendingUp, Loader,
  User, Play, Smile,
  MapPin, GitBranch, FileText, Code,
};

/* ================================================================
   Snap Grid Guide Lines — shown near cursor during drag
   ================================================================ */

function SnapGuideLines({ x, y }: { x: number; y: number }) {
  const gridSize = 24; // matches PanelCanvas grid dot spacing
  const nearestCol = Math.round(x / gridSize) * gridSize;
  const nearestRow = Math.round(y / gridSize) * gridSize;
  const snapThreshold = 8;
  const showVertical = Math.abs(x - nearestCol) < snapThreshold;
  const showHorizontal = Math.abs(y - nearestRow) < snapThreshold;

  return (
    <>
      {showVertical && (
        <div
          className="fixed top-0 bottom-0 pointer-events-none z-[9998]"
          style={{
            left: nearestCol,
            width: 1,
            background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.25) 20%, rgba(99,102,241,0.4) 50%, rgba(99,102,241,0.25) 80%, transparent 100%)',
          }}
        />
      )}
      {showHorizontal && (
        <div
          className="fixed left-0 right-0 pointer-events-none z-[9998]"
          style={{
            top: nearestRow,
            height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.25) 20%, rgba(99,102,241,0.4) 50%, rgba(99,102,241,0.25) 80%, transparent 100%)',
          }}
        />
      )}
      {/* Snap intersection dot */}
      {showVertical && showHorizontal && (
        <div
          className="fixed pointer-events-none z-[9998] w-2 h-2 rounded-full"
          style={{
            left: nearestCol - 4,
            top: nearestRow - 4,
            background: 'rgba(99,102,241,0.6)',
            boxShadow: '0 0 8px rgba(99,102,241,0.4)',
          }}
        />
      )}
    </>
  );
}

/* ================================================================
   Ghost Preview Card — translucent component preview
   ================================================================ */

function GhostCard({ componentDef }: { componentDef: any }) {
  const t = useThemeTokens();
  const IconComp = iconMap[componentDef?.icon] || Square;
  const label = componentDef?.label || componentDef?.type || '组件';
  const category = componentDef?.category || 'basic';

  const categoryColors: Record<string, string> = {
    basic: 'from-indigo-500/20 to-indigo-500/5',
    form: 'from-emerald-500/20 to-emerald-500/5',
    data: 'from-cyan-500/20 to-cyan-500/5',
    media: 'from-pink-500/20 to-pink-500/5',
    advanced: 'from-amber-500/20 to-amber-500/5',
  };

  const borderColors: Record<string, string> = {
    basic: 'border-indigo-500/30',
    form: 'border-emerald-500/30',
    data: 'border-cyan-500/30',
    media: 'border-pink-500/30',
    advanced: 'border-amber-500/30',
  };

  const iconColors: Record<string, string> = {
    basic: 'text-indigo-400',
    form: 'text-emerald-400',
    data: 'text-cyan-400',
    media: 'text-pink-400',
    advanced: 'text-amber-400',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${borderColors[category] || 'border-indigo-500/30'} bg-gradient-to-r ${categoryColors[category] || categoryColors.basic} backdrop-blur-xl`}
      style={{
        boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05), 0 0 40px -10px rgba(99,102,241,0.2)',
        minWidth: 180,
      }}
    >
      <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center border border-white/[0.08]">
        <IconComp className={`w-4.5 h-4.5 ${iconColors[category] || 'text-indigo-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-white/80">{label}</div>
        <div className="text-[9px] text-white/25 mt-0.5">释放到目标面板</div>
      </div>
      <GripVertical className="w-3.5 h-3.5 text-white/15" />
    </div>
  );
}

/* ================================================================
   DragPreviewGhost — custom DragLayer overlay
   ================================================================ */

export function DragPreviewGhost() {
  const { isDragging, item, currentOffset, initialOffset } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem(),
    currentOffset: monitor.getClientOffset(),
    initialOffset: monitor.getInitialClientOffset(),
  }));

  if (!isDragging || !currentOffset || !item?.componentDef) {
    return null;
  }

  const x = currentOffset.x;
  const y = currentOffset.y;

  // Calculate distance from initial position for subtle scale animation
  const dx = initialOffset ? x - initialOffset.x : 0;
  const dy = initialOffset ? y - initialOffset.y : 0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const scale = Math.min(1.05, 1 + dist * 0.0001);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Snap guide lines */}
      <SnapGuideLines x={x} y={y} />

      {/* Ghost card */}
      <div
        style={{
          position: 'absolute',
          left: x - 90,
          top: y - 20,
          transform: `scale(${scale}) rotate(${Math.max(-2, Math.min(2, dx * 0.01))}deg)`,
          transition: 'transform 0.1s ease-out',
          opacity: 0.92,
        }}
      >
        <GhostCard componentDef={item.componentDef} />
      </div>

      {/* Trailing glow */}
      <div
        className="absolute w-24 h-24 rounded-full blur-[40px] pointer-events-none"
        style={{
          left: x - 48,
          top: y - 48,
          background: 'rgba(99,102,241,0.08)',
          transition: 'left 0.15s, top 0.15s',
        }}
      />

      {/* Coordinate indicator */}
      <div
        className="absolute px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-[9px] text-white/40"
        style={{
          left: x + 16,
          top: y + 20,
        }}
      >
        {Math.round(x)}, {Math.round(y)}
      </div>
    </div>
  );
}