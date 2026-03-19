/**
 * @file Tooltip.tsx
 * @description YYC3 Tooltip 组件 — 带动画的提示框，支持快捷键显示、上下文感知
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ui,tooltip,animation,shortcut
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  shortcut?: string;
}

export function Tooltip({ label, children, side = 'bottom', shortcut }: TooltipProps) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setShow(true), 350);
  }, []);

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  }, []);

  return (
    <div className="relative inline-flex" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: side === 'bottom' ? -4 : 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === 'bottom' ? -4 : 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute left-1/2 -translate-x-1/2 z-[200] pointer-events-none ${
              side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
            }`}
          >
            <div className="bg-[#1e2030] border border-white/[0.1] rounded-lg px-2.5 py-1.5 shadow-xl shadow-black/40 whitespace-nowrap flex items-center gap-2">
              <span className="text-[11px] text-white/80">{label}</span>
              {shortcut && (
                <span className="text-[10px] text-white/25 bg-white/[0.06] px-1.5 py-0.5 rounded">{shortcut}</span>
              )}
            </div>
            {/* Arrow */}
            <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e2030] border-white/[0.1] rotate-45 ${
              side === 'bottom' ? '-top-1 border-l border-t' : '-bottom-1 border-r border-b'
            }`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
