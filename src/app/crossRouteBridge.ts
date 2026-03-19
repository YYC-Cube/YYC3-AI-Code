/**
 * @file crossRouteBridge.ts
 * @description 跨路由双向通信桥 — AI Code System ↔ Designer 通过 localStorage + CustomEvent 实现数据同步
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-10
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags bridge,cross-route,sync,localStorage,designer,ai-code
 */

/**
 * Cross-Route Bridge — AI Code System ↔ Designer bidirectional sync
 *
 * Uses localStorage + CustomEvent to communicate between routes
 * that live in separate React contexts (Designer has its own DesignerProvider).
 *
 * Flow A: AI Code → Designer
 *   1. AICodeSystem writes code to bridge
 *   2. Navigates to /designer
 *   3. Designer reads from bridge & imports via importDesignJSON
 *
 * Flow B: Designer → AI Code
 *   1. Designer writes Design JSON / generated TSX to bridge
 *   2. Navigates to /ai-code
 *   3. AICodeSystem reads from bridge & injects into editor
 */

/* ================================================================
   Storage Keys
   ================================================================ */

const KEY_CODE_TO_DESIGNER = 'yyc3-bridge-code-to-designer';
const KEY_DESIGNER_TO_CODE = 'yyc3-bridge-designer-to-code';
const BRIDGE_EVENT = 'yyc3-bridge-sync';

/* ================================================================
   Types
   ================================================================ */

export interface BridgePayload {
  type: 'code-to-designer' | 'designer-to-code';
  code: string;
  language: string;
  fileName?: string;
  designJSON?: string;
  timestamp: number;
  /** Optional: parsed component hints for Designer injection */
  components?: Array<{
    type: string;
    label: string;
    props: Record<string, any>;
  }>;
}

/* ================================================================
   Write / Read
   ================================================================ */

export function bridgeSendToDesigner(payload: Omit<BridgePayload, 'type' | 'timestamp'>) {
  const full: BridgePayload = {
    ...payload,
    type: 'code-to-designer',
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(KEY_CODE_TO_DESIGNER, JSON.stringify(full));
    window.dispatchEvent(new CustomEvent(BRIDGE_EVENT, { detail: full }));
  } catch { /* quota exceeded — ignore */ }
}

export function bridgeSendToCode(payload: Omit<BridgePayload, 'type' | 'timestamp'>) {
  const full: BridgePayload = {
    ...payload,
    type: 'designer-to-code',
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(KEY_DESIGNER_TO_CODE, JSON.stringify(full));
    window.dispatchEvent(new CustomEvent(BRIDGE_EVENT, { detail: full }));
  } catch { /* quota exceeded — ignore */ }
}

export function bridgeReadForDesigner(): BridgePayload | null {
  try {
    const raw = localStorage.getItem(KEY_CODE_TO_DESIGNER);
    if (!raw) return null;
    const payload = JSON.parse(raw) as BridgePayload;
    // Validate payload is an object with required fields
    if (!payload || typeof payload !== 'object' || !payload.timestamp) {
      return null;
    }
    // Only use if less than 5 minutes old
    if (Date.now() - payload.timestamp > 300_000) {
      localStorage.removeItem(KEY_CODE_TO_DESIGNER);
      return null;
    }
    return payload;
  } catch { return null; }
}

export function bridgeReadForCode(): BridgePayload | null {
  try {
    const raw = localStorage.getItem(KEY_DESIGNER_TO_CODE);
    if (!raw) return null;
    const payload = JSON.parse(raw) as BridgePayload;
    // Validate payload is an object with required fields
    if (!payload || typeof payload !== 'object' || !payload.timestamp) {
      return null;
    }
    // Only use if less than 5 minutes old
    if (Date.now() - payload.timestamp > 300_000) {
      localStorage.removeItem(KEY_DESIGNER_TO_CODE);
      return null;
    }
    return payload;
  } catch { return null; }
}

export function bridgeClearForDesigner() {
  try { localStorage.removeItem(KEY_CODE_TO_DESIGNER); } catch {}
}

export function bridgeClearForCode() {
  try { localStorage.removeItem(KEY_DESIGNER_TO_CODE); } catch {}
}

/* ================================================================
   Code → Component Parser (simple heuristic)
   ================================================================ */

/**
 * Extracts component-like definitions from TSX code for Designer injection.
 * This is a best-effort parser — not a full AST.
 */
export function parseCodeToComponents(code: string): BridgePayload['components'] {
  const components: NonNullable<BridgePayload['components']> = [];

  // Look for function/const component declarations
  const fnRe = /(?:export\s+)?(?:function|const)\s+([A-Z]\w+)/g;
  let match;
  while ((match = fnRe.exec(code)) !== null) {
    const name = match[1];
    // Try to find return JSX to determine component type
    components.push({
      type: 'Custom',
      label: name,
      props: { componentName: name, source: 'ai-code' },
    });
  }

  // Look for JSX elements to infer component types
  const jsxRe = /<(Button|Input|Table|Form|Card|Select|Modal|Image|Text|Chart|Grid)\b/gi;
  const seen = new Set<string>();
  while ((match = jsxRe.exec(code)) !== null) {
    const tag = match[1];
    const normalized = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      // Map to COMPONENT_LIBRARY types
      const typeMap: Record<string, string> = {
        'Button': 'Button', 'Input': 'Input', 'Table': 'Table',
        'Form': 'Form', 'Card': 'Card', 'Select': 'Select',
        'Modal': 'Modal', 'Image': 'Image', 'Text': 'Text',
        'Chart': 'Chart', 'Grid': 'Container',
      };
      components.push({
        type: typeMap[normalized] || normalized,
        label: `${normalized} (AI)`,
        props: { source: 'ai-code', autoGenerated: true },
      });
    }
  }

  return components.length > 0 ? components : undefined;
}