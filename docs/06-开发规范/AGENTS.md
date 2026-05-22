---
@file: AGENTS.md
@description: YYC³ Codebase 指南，为 AI 代理提供代码库基本信息和快速开始指南
@author: YanYuCloudCube Team <admin@0379.email>
@version: v0.0.1
@created: 2026-03-19
@updated: 2026-03-19
@status: dev
@tags: guide,codebase,ai-agent,quick-start,zh-CN
@category: guide
@language: en-US
@audience: ai-agents,developers
@complexity: basic
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# AGENTS.md - YYC³ Codebase Guide

> **Version**: 0.0.1
> **Last Updated**: 2026-03-19
> **Project**: YANYUCLOUD (YYC³) - Intelligent Multi-Panel Visual AI Programming Application

This document provides essential information for AI agents working in this codebase.

---

## Quick Start

### Essential Commands

```bash
# Development
pnpm dev              # Start dev server on http://localhost:3160
pnpm build            # Production build to dist/
pnpm preview          # Preview production build

# Testing
pnpm test             # Run tests (Vitest)
pnpm test:ui          # Vitest UI
pnpm test:coverage    # Generate coverage report

# Code Quality
pnpm lint             # ESLint (strict: max 0 warnings)
pnpm format           # Prettier format src/**/*.{ts,tsx,css}
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Configure environment variables (API endpoints, WebSocket, AI proxy, auth)
3. Run `pnpm install` (prefer `pnpm` over `npm`)

---

## Project Overview

**YYC³** is an IDE-style web application featuring:

- **Multi-panel resizable workspace** (react-resizable-panels)
- **Monaco code editor** with completions (@monaco-editor/react)
- **AI-powered chat & code generation** (streaming SSE, multi-provider)
- **Visual designer** (drag-and-drop canvas, react-dnd)
- **Task board** (Kanban, Gantt charts, CRDT collaboration)
- **Settings system** (keybinding editor, rules/skills injection)
- **Dark theme IDE aesthetic** (Tailwind CSS v4)

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React + TypeScript | 18.3.1 |
| Routing | react-router | 7.13.0 |
| Styling | Tailwind CSS v4 | 4.1.12 |
| Build | Vite | 6.3.5 |
| Code Editor | @monaco-editor/react | 4.7.0 |
| Panels | react-resizable-panels | 2.1.7 |
| DnD | react-dnd + HTML5/Touch | 16.0.1 |
| Animation | motion (Motion/React) | 12.23.24 |
| CRDT Collab | yjs + y-websocket | 13.6.x |
| State Mgmt | React Context + useReducer | - |
| Testing | Vitest + jsdom | - |

---

## Code Organization

```
src/
├── app/
│   ├── App.tsx                    # Root - RouterProvider + Providers
│   ├── routes.tsx                 # Route definitions (/, /designer, /ai-code, /settings)
│   ├── store.tsx                  # Global state (Context + useReducer, ~1050 lines)
│   ├── config.ts                  # Unified config center (env-based)
│   ├── apiClient.ts               # API client with failover (primary + 2 standby)
│   ├── crossRouteBridge.ts        # Cross-route communication
│   ├── aiModelContext.tsx         # Global AI model context
│   │
│   ├── components/
│   │   ├── ai-code/              # AI Code Workbench (IDE)
│   │   │   ├── AICodeSystem.tsx  # Main workbench (~3600 lines) - SPLIT NEEDED
│   │   │   ├── AIChatPanel.tsx   # AI streaming chat
│   │   │   ├── TaskBoard.tsx     # Kanban task board (~1300 lines)
│   │   │   ├── WindowManager.tsx  # Panel window management
│   │   │   ├── ActivityBar.tsx   # VS Code-style activity bar
│   │   │   ├── LivePreview.tsx   # Live code preview (iframe)
│   │   │   ├── fileTreeUtils.ts  # File tree helpers
│   │   │   └── ...
│   │   ├── designer/             # Visual Designer (low-code)
│   │   │   ├── DesignerLayout.tsx # Main layout
│   │   │   ├── PanelCanvas.tsx    # Multi-panel canvas
│   │   │   ├── hooks/             # Designer-specific hooks
│   │   │   └── ...
│   │   ├── settings/             # Settings pages
│   │   ├── home/                 # Landing page
│   │   ├── ui/                   # Shared UI components
│   │   └── ErrorBoundary.tsx     # Global error handling
│   │
│   ├── hooks/                    # Custom hooks
│   │   ├── useAIService.ts       # AI service (multi-provider, fallback)
│   │   ├── useAppSettings.ts     # App settings (useSyncExternalStore)
│   │   ├── useCRDTCollab.ts     # CRDT collaboration
│   │   ├── useGlobalKeybindings.ts
│   │   ├── usePerformanceMonitor.ts
│   │   └── useSettingsBridge.ts
│   │
│   ├── services/                 # Service layer
│   │   ├── settingsSyncService.ts
│   │   ├── multi-instance/       # Multi-instance management
│   │   ├── actions/
│   │   └── task/
│   │
│   ├── types/                   # Type definitions
│   │   ├── task.ts              # Task board types
│   │   ├── actions.ts
│   │   └── multi-instance.ts
│   │
│   └── testing/                 # Test files (app-level)
│       ├── *.test.ts
│       └── MockWSServer.ts
│
├── styles/                      # Global styles
│   ├── index.css
│   ├── theme.css
│   ├── tailwind.css
│   ├── aurora.css               # Aurora theme
│   └── liquid-glass.css        # Liquid Glass theme
│
└── tests/                       # Test suites
    ├── unit/                   # Unit tests
    ├── integration/            # Integration tests
    ├── e2e/                   # E2E tests (Playwright)
    ├── performance/            # Performance tests
    └── security/              # Security tests
```

---

## Critical Coding Conventions

### 1. File Headers (REQUIRED)

All `.ts`, `.tsx` source files MUST include this header:

```typescript
/**
 * @file filename.tsx
 * @description 文件描述
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags tag1,tag2,tag3
 */
```

### 2. TypeScript Configuration

- **Strict mode enabled**: `strict: true`
- **Additional strict checks**:
  - `noUnusedLocals`: true
  - `noUnusedParameters`: true
  - `noImplicitAny`: true
  - `noImplicitReturns`: true
- **ESLint**: `--max-warnings 0` (zero warnings policy)

### 3. Component Patterns

```typescript
// 1. Imports (external, internal, types, styles)
import React, { useState, useCallback } from 'react';
import { useDesigner } from '@/app/store';

// 2. Types/interfaces
interface ComponentProps {
  prop: string;
  onAction: () => void;
}

// 3. Helper functions (outside component)
function helperFn(value: string): string {
  return value.trim();
}

// 4. Main component
export default function ComponentName({ prop, onAction }: ComponentProps) {
  // Hooks
  const [state, setState] = useState('');

  // Callbacks (useCallback for perf)
  const handleClick = useCallback(() => {
    onAction();
  }, [onAction]);

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

// 5. Subcomponents (if any)
function SubComponent() {
  return <div>...</div>;
}
```

### 4. State Management

**Global state**: `src/app/store.tsx` (Context + useReducer)

```typescript
import { useDesigner } from '@/app/store';

function MyComponent() {
  const {
    panels,
    addPanel,
    removePanel,
    selectPanel,
  } = useDesigner();
  // ...
}
```

**Settings state**: `useAppSettings()` (useSyncExternalStore + localStorage)

**Multi-instance state**: `useMultiInstanceStore()`

### 5. Import Path Aliases

```typescript
// Use @ alias for src/ directory
import { Component } from '@/app/components/ui/Button';
import { hook } from '@/app/hooks/useAIService';
import { type Task } from '@/app/types/task';

// NOT:
import { Component } from '../../app/components/ui/Button';
```

### 6. Styling Conventions

- **Primary**: Tailwind CSS v4 (utility classes)
- **Custom CSS**: In `src/styles/` or component-scoped CSS modules
- **Theming**: Support 'classic' | 'liquid-glass' | 'aurora' themes
- **Dark mode**: Default, dark-themed IDE aesthetic

```tsx
<div className="p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
  {/* Use translucent colors with backdrop-blur for glass effect */}
</div>
```

---

## Testing Guidelines

### Test Framework

- **Unit**: Vitest + React Testing Library
- **E2E**: Playwright
- **Environment**: `jsdom` (Vitest config)

### Test File Locations

```
src/app/testing/              # App-level unit tests
src/app/components/**/*.{ts,tsx}  # Co-located component tests
src/tests/unit/              # Additional unit tests
src/tests/integration/       # Integration tests
src/tests/e2e/             # E2E tests (Playwright)
```

### Test Patterns

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FeatureName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = { foo: 'bar' };

    // Act
    const result = doSomething(input);

    // Assert
    expect(result).toEqual({ baz: 'qux' });
  });
});
```

### Mocking

```typescript
// localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// API client mock
vi.mock('@/app/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));
```

---

## API Integration

### API Client

`src/app/apiClient.ts` provides a failover-aware API client:

```typescript
import { api } from '@/app/apiClient';

// GET (with automatic caching and request deduplication)
const response = await api.get('/api/designs');

// POST
const response = await api.post('/api/designs', data);

// Configured endpoints
await api.designs.list();
await api.crdt.getDoc('room-id');
await api.ai.chat({ messages });
await api.db.health();
```

### Environment Variables

All configuration from `src/app/config.ts` reads from `.env`:

```bash
# API (primary + 2 standby for failover)
VITE_API_PRIMARY=https://api-primary.yanyucloud.local
VITE_API_STANDBY_1=https://api-standby1.yanyucloud.local
VITE_API_STANDBY_2=https://api-standby2.yanyucloud.local

# WebSocket (CRDT)
VITE_WS_PRIMARY=wss://ws-primary.yanyucloud.local
VITE_WS_STANDBY=wss://ws-standby.yanyucloud.local

# AI Proxy
VITE_AI_PROXY_ENDPOINT=/api/ai-proxy
VITE_AI_MAX_TOKENS=4096
VITE_AI_TEMPERATURE=0.7

# Database (PostgreSQL)
VITE_PG_PRIMARY_HOST=pg-primary.yanyucloud.local
VITE_PG_REPLICA_HOST=pg-replica.yanyucloud.local

# Cache (Redis)
VITE_CACHE_PRIMARY=redis-primary.yanyucloud.local:6379
VITE_CACHE_REPLICA=redis-replica.yanyucloud.local:6379

# Auth (OpenID Connect)
VITE_AUTH_ISSUER=https://auth.yanyucloud.local
VITE_AUTH_CLIENT_ID=yanyucloud-designer

# Storage
VITE_STORAGE_DESIGN_PATH=/app/designs
```

### Failover Pattern

API client automatically tries: primary → standby1 → standby2

```typescript
// Response includes failover info
interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  endpoint: string;        // Which endpoint was actually used
  latency: number;         // Request time (ms)
  fromCache: boolean;      // From cache?
  failoverCount: number;   // How many endpoints failed before success
}
```

---

## Key Features & Patterns

### AI Service Hook

`src/app/hooks/useAIService.ts` - Multi-provider AI management:

```typescript
import { useAIService } from '@/app/hooks/useAIService';

function AIChat() {
  const {
    config,
    chat,
    chatStream,
    isLoading,
    addProvider,
    setActiveProvider,
    activeProvider,
    metrics,
  } = useAIService();

  // Add custom provider
  addProvider({
    id: 'provider-id',
    name: 'Custom Provider',
    baseURL: 'https://api.example.com',
    apiKey: 'sk-xxx',
    type: 'cloud',
    enabled: true,
    priority: 1,
    models: [],
  });

  // Chat with streaming
  const stream = chatStream([{ role: 'user', content: 'Hello' }]);
  // Or simple chat
  const response = await chat([{ role: 'user', content: 'Hello' }]);
}
```

### CRDT Collaboration

`src/app/hooks/useCRDTCollab.ts` - Real-time collaboration:

```typescript
import { useCRDTCollab } from '@/app/hooks/useCRDTCollab';

function CollaborativePanel() {
  const { doc, awareness, connected, peers } = useCRDTCollab('room-id');

  // doc is a Yjs document (shared state)
  // awareness shows connected users (cursors, names)
  // peers: CRDTPeer[] with cursor positions

  return (
    <div>
      {peers.map(peer => (
        <CollabCursor key={peer.id} user={peer} />
      ))}
    </div>
  );
}
```

### Error Handling

**Global Error Boundary**: `src/app/components/ErrorBoundary.tsx`

- Auto-recovery after crashes (configurable)
- Error telemetry (circuit breaker)
- Graceful fallback UI

```typescript
// Route-level error boundaries
<ErrorBoundary level="route" name="Designer" autoRecoveryMs={3000} maxAutoRecovery={3}>
  <DesignerLayout />
</ErrorBoundary>
```

**API Circuit Breaker**: Prevents cascading failures

```typescript
import { apiCircuitBreaker } from '@/app/components/ErrorBoundary';

// Check if circuit is open
if (!apiCircuitBreaker.canPass()) {
  // Show degraded UI
}
```

### Drag & Drop

Using `react-dnd` + HTML5/Touch backends:

```typescript
import { useDrop, useDrag } from 'react-dnd';

function DraggableItem({ id }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ITEM',
    item: { id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return <div ref={drag}>Drag me</div>;
}

function DropZone() {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'ITEM',
    drop: (item) => console.log('Dropped:', item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return <div ref={drop}>Drop here</div>;
}
```

### Panel Resizing

`react-resizable-panels` for resizable layouts:

```typescript
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

function ResizableLayout() {
  return (
    <PanelGroup direction="horizontal">
      <Panel defaultSize={30} minSize={20}>
        Left Panel
      </Panel>
      <PanelResizeHandle />
      <Panel defaultSize={70}>
        Right Panel
      </Panel>
    </PanelGroup>
  );
}
```

---

## Important Gotchas

### 1. Large Components Need Splitting

- `AICodeSystem.tsx` (~3600 lines) - NEEDS SPLITTING
- `TaskBoard.tsx` (~1300 lines) - Consider splitting
- Extract subcomponents and utilities

### 2. State Management Complexity

`store.tsx` is large (~1050 lines). When modifying:

- Update both state AND context type
- Add new state variables with initial values
- Add corresponding actions (useCallback)
- Update persistence (localStorage save/load)
- Test state self-healing (orphaned components, stale refs)

### 3. File Header Requirement

**Never skip file headers** - they're required for all `.ts`, `.tsx` files.

### 4. ESLint Zero Warnings

```bash
# This must pass with 0 warnings
pnpm lint
```

Fix all warnings before committing.

### 5. Test First or Test With

Tests located in:
- `src/app/testing/*.test.ts` (app-level)
- `src/app/components/**/*.{ts,tsx}` (co-located)
- `src/tests/unit/` (unit tests)
- `src/tests/integration/` (integration tests)

Run `pnpm test` after changes.

### 6. Import Paths

Use `@/` alias consistently:

```typescript
// ✅ Correct
import { Component } from '@/app/components/ui/Button';

// ❌ Wrong
import { Component } from '../../../app/components/ui/Button';
```

### 7. TypeScript Strict Mode

The codebase uses strict TypeScript. Avoid `any` types, use proper type definitions from `src/app/types/`.

### 8. API Failover

API client has automatic failover. When testing API integration:

- Test failover scenarios (unreachable primary)
- Check `response.failoverCount` in tests
- Verify `response.endpoint` matches expected fallback

### 9. CRDT State Conflicts

When working with CRDT (yjs):

- Use `setPanelsFromCRDT()` / `setComponentsFromCRDT()` to bypass undo history
- Handle conflict resolution (`conflictResolverOpen`, `resolveConflict`)
- Test concurrent edits scenarios

### 10. AI Provider Fallback

AI service has automatic provider fallback. Configure multiple providers for reliability.

---

## Development Workflow

### 1. Adding a New Feature

1. Read relevant existing code for patterns
2. Create types in `src/app/types/` (if needed)
3. Implement feature in appropriate component
4. Add tests (co-located or in `src/app/testing/`)
5. Run `pnpm lint` and `pnpm test`
6. Update this document if new conventions introduced

### 2. Modifying Existing Code

1. Read the entire file first
2. Use exact text matching for edits (include whitespace)
3. Maintain file header (update version/date as needed)
4. Run tests after changes
5. Fix any failing tests before proceeding

### 3. Adding Dependencies

1. Check if library already exists in `package.json`
2. Install with `pnpm add <package>`
3. Verify peer dependencies
4. Run `pnpm test` to ensure compatibility

### 4. Debugging

- Console logs: Use `console.debug()`, `console.warn()`, `console.error()` appropriately
- Error telemetry: Automatically collected by error boundary
- Performance: Use `usePerformanceMonitor()` hook for expensive operations

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `AIHomePage` | Landing page |
| `/designer` | `DesignerLayout` | Visual low-code designer |
| `/ai-code` | `AICodeSystem` | AI-powered IDE workbench |
| `/settings` | `SettingsPage` | Settings management |

All routes have error boundaries and appropriate providers.

---

## UI Themes

Three visual themes available:

1. **Classic** - Default dark theme
2. **Aurora** - Aurora borealis-inspired gradient theme
3. **Liquid Glass** - Glassmorphism with blur effects

Theme is stored in `localStorage` key `yyc3-ui-theme` and applied via context.

---

## Documentation References

- [README.md](../README.md) - Project overview and setup
- [docs/Guidelines.md](../docs/Guidelines.md) - Design guidelines and architecture
- [docs/YYC3-Local-Dev-Handoff-README.md](../docs/YYC3-Local-Dev-Handoff-README.md) - Development handoff guide
- [docs/YYC3-P1-Settings.md](../docs/YYC3-P1-Settings.md) - Settings documentation
- [docs/YYC3-P2-Advanced-Feature-Multi-Instance.md](../docs/YYC3-P2-Advanced-Feature-Multi-Instance.md) - Multi-instance feature docs

---

## Contact

**Team**: YanYuCloudCube Team
**Email**: admin@0379.email

---

**Last Updated**: 2026-03-19
