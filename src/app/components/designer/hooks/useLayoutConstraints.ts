import { useMemo } from 'react';

/* ================================================================
   Panel Layout Constraint Engine
   Based on 12-column grid, detects overlaps and auto-rearranges
   ================================================================ */

interface PanelRect {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CollisionInfo {
  panelA: string;
  panelB: string;
  panelAName: string;
  panelBName: string;
  overlapArea: number;
  severity: 'error' | 'warning';
  message: string;
}

export interface ConstraintViolation {
  panelId: string;
  panelName: string;
  type: 'overflow' | 'negative' | 'zero-size' | 'out-of-bounds';
  message: string;
}

export interface LayoutAnalysis {
  collisions: CollisionInfo[];
  violations: ConstraintViolation[];
  occupancy: number; // 0-100%
  suggestedLayout: PanelRect[] | null;
  isValid: boolean;
}

const GRID_COLS = 12;

/**
 * Detect rectangle overlap area between two panels
 */
function getOverlapArea(a: PanelRect, b: PanelRect): number {
  const overlapX = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return overlapX * overlapY;
}

/**
 * Auto-rearrange panels to eliminate overlaps using greedy packing
 */
function autoRearrange(panels: PanelRect[]): PanelRect[] {
  if (panels.length === 0) return [];

  // Sort by area (largest first) for better packing
  const sorted = [...panels].sort((a, b) => (b.w * b.h) - (a.w * a.h));

  // Track occupied grid cells
  const maxRows = Math.max(20, sorted.reduce((s, p) => s + p.h, 0));
  const grid: boolean[][] = Array.from({ length: maxRows }, () => Array(GRID_COLS).fill(false));

  const result: PanelRect[] = [];

  for (const panel of sorted) {
    const w = Math.min(panel.w, GRID_COLS);
    let placed = false;

    // Try to find first available slot
    for (let row = 0; row < maxRows - panel.h + 1 && !placed; row++) {
      for (let col = 0; col <= GRID_COLS - w && !placed; col++) {
        // Check if the entire panel area is free
        let fits = true;
        for (let dy = 0; dy < panel.h && fits; dy++) {
          for (let dx = 0; dx < w && fits; dx++) {
            if (grid[row + dy]?.[col + dx]) fits = false;
          }
        }

        if (fits) {
          // Mark grid cells as occupied
          for (let dy = 0; dy < panel.h; dy++) {
            for (let dx = 0; dx < w; dx++) {
              if (grid[row + dy]) grid[row + dy][col + dx] = true;
            }
          }
          result.push({ ...panel, x: col, y: row, w });
          placed = true;
        }
      }
    }

    // Fallback: place at bottom
    if (!placed) {
      const bottomY = result.reduce((max, p) => Math.max(max, p.y + p.h), 0);
      result.push({ ...panel, x: 0, y: bottomY, w });
    }
  }

  return result;
}

/**
 * Main hook: analyze panel layout and provide constraint feedback
 */
export function useLayoutConstraints(panels: PanelRect[]): LayoutAnalysis {
  return useMemo(() => {
    const collisions: CollisionInfo[] = [];
    const violations: ConstraintViolation[] = [];

    // 1. Check individual panel constraints
    for (const p of panels) {
      if (p.w <= 0 || p.h <= 0) {
        violations.push({
          panelId: p.id,
          panelName: p.name,
          type: 'zero-size',
          message: `面板「${p.name}」尺寸无效 (${p.w}x${p.h})`,
        });
      }
      if (p.x < 0 || p.y < 0) {
        violations.push({
          panelId: p.id,
          panelName: p.name,
          type: 'negative',
          message: `面板「${p.name}」位置为负值 (${p.x},${p.y})`,
        });
      }
      if (p.x + p.w > GRID_COLS) {
        violations.push({
          panelId: p.id,
          panelName: p.name,
          type: 'overflow',
          message: `面板「${p.name}」超出 ${GRID_COLS} 列栅格 (x=${p.x}, w=${p.w})`,
        });
      }
    }

    // 2. Check pair-wise collisions
    for (let i = 0; i < panels.length; i++) {
      for (let j = i + 1; j < panels.length; j++) {
        const overlap = getOverlapArea(panels[i], panels[j]);
        if (overlap > 0) {
          collisions.push({
            panelA: panels[i].id,
            panelB: panels[j].id,
            panelAName: panels[i].name,
            panelBName: panels[j].name,
            overlapArea: overlap,
            severity: overlap > 4 ? 'error' : 'warning',
            message: `「${panels[i].name}」与「${panels[j].name}」重叠 (面积=${overlap})`,
          });
        }
      }
    }

    // 3. Calculate grid occupancy
    const totalCells = GRID_COLS * Math.max(1, panels.reduce((max, p) => Math.max(max, p.y + p.h), 0));
    const occupiedCells = panels.reduce((sum, p) => sum + (p.w * p.h), 0);
    const occupancy = totalCells > 0 ? Math.min(100, Math.round((occupiedCells / totalCells) * 100)) : 0;

    // 4. Generate suggested layout only if there are collisions
    const suggestedLayout = collisions.length > 0 ? autoRearrange(panels) : null;

    const isValid = collisions.length === 0 && violations.length === 0;

    return { collisions, violations, occupancy, suggestedLayout, isValid };
  }, [panels]);
}

/**
 * Helper: apply suggested layout to panels
 */
export function applySuggestedLayout(
  suggestedLayout: PanelRect[],
  setPanels: (fn: (prev: any[]) => any[]) => void
) {
  setPanels(prev => prev.map(p => {
    const suggested = suggestedLayout.find(s => s.id === p.id);
    if (suggested) {
      return { ...p, x: suggested.x, y: suggested.y, w: suggested.w };
    }
    return p;
  }));
}
