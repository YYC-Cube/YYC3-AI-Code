---
@file: YYC3-Local-Dev-Handoff-README.md
@description: YYC³ 本地开发交接指南，包含项目概述、技术栈、开发环境配置等内容
@author: YanYuCloudCube Team <admin@0379.email>
@version: v1.0.0
@created: 2026-03-19
@updated: 2026-03-19
@status: dev
@tags: handoff,development,guide,zh-CN
@category: guide
@language: en-US
@audience: developers
@complexity: intermediate
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YANYUCLOUD (YYC3) - Local Development Handoff Guide

> **Version**: Phase 5 Closing + Phase 6 Prep + Phase 2 Multi-Instance Integration  
> **Date**: 2026-03-18 (Updated)  
> **Author**: YanYuCloudCube Team + AI Mentor  
> **Status**: Code Complete — Final Global Audit Passed, Awaiting Local `pnpm dev` Verification

---

## 1. Project Overview

**YANYUCLOUD (YYC3)** is an intelligent multi-panel visual AI programming application, built as a full-featured IDE-style web application with:

- **Multi-panel resizable workspace** (react-resizable-panels)
- **Monaco code editor** with intelligent completions (@monaco-editor/react)
- **AI-powered chat & code generation** (streaming SSE, multi-provider)
- **Visual designer** with drag-and-drop panel canvas (react-dnd)
- **Task board (Kanban)** with Gantt chart, DAG visualization, CRDT collaboration
- **Settings system** with keybinding editor, rules/skills injection
- **Dark theme IDE aesthetic** with Tailwind CSS v4

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React + TypeScript | 18.3.1 |
| Routing | react-router (Data Mode) | 7.13.0 |
| Styling | Tailwind CSS v4 | 4.1.12 |
| Code Editor | @monaco-editor/react | 4.7.0 |
| Panels | react-resizable-panels | 2.1.7 |
| Drag & Drop | react-dnd + HTML5/Touch backends | 16.0.1 |
| Animation | motion (Motion/React) | 12.23.24 |
| Date Picker | react-day-picker | 8.10.1 |
| Date Utils | date-fns | 3.6.0 |
| CRDT Collab | yjs + y-websocket + y-indexeddb | 13.6.x |
| Icons | lucide-react | 0.487.0 |
| UI Primitives | Radix UI (full suite) | various |
| Toast | sonner | 2.0.3 |
| State Mgmt | React Context + useReducer (store.tsx) | N/A |
| Settings State | useSyncExternalStore + localStorage | N/A |
| Build | Vite | 6.3.5 |

---

## 3. Project Structure

```
src/
  app/
    App.tsx                     # Root - RouterProvider
    routes.tsx                  # 4 routes: / /designer /ai-code /settings
    store.tsx                   # Global state (Context + useReducer) ~1050 lines
    config.ts                   # Unified config center (API/WS/DB/Cache/Auth)
    apiClient.ts                # Failover API client (primary + 2 standby)
    crossRouteBridge.ts         # Cross-route communication bridge
    aiModelContext.tsx           # Global AI model context
    
    components/
      ai-code/                  # AI Code Workbench
        AICodeSystem.tsx         # Main workbench (~3600 lines) - NEEDS SPLITTING
        AIChatPanel.tsx          # AI chat with streaming
        AIProviderManager.tsx    # Multi-provider AI config
        ActivityBar.tsx          # VS Code-style activity bar
        CollabCursors.tsx        # CRDT collaboration cursors
        EditorBreadcrumb.tsx     # File path breadcrumb
        IntegratedTerminal.tsx   # Terminal extraction reference
        LayoutPresets.tsx        # IDE layout presets
        LivePreview.tsx          # Live code preview (iframe sandbox)
        QuickActionsToolbar.tsx  # Quick actions floating toolbar
        SidebarViews.tsx         # Search/Git/Debug/Run/Extensions/DB panels
        TaskBoard.tsx            # Kanban task board v5.0 (~1300 lines)
        TaskGanttChart.tsx       # Gantt/timeline view
        WindowManager.tsx        # Panel window management system
        fileTreeUtils.ts         # [NEW] Extracted file tree utilities
      
      designer/                 # Visual Designer
        DesignerLayout.tsx       # Main designer layout
        PanelCanvas.tsx          # Multi-panel drag canvas
        ComponentPalette.tsx     # Component library sidebar
        Inspector.tsx            # Property inspector
        GlobalToolbar.tsx        # Top toolbar
        StatusBar.tsx            # Bottom status bar
        AIAssistant.tsx          # AI assistant panel
        CodeGenerator.tsx        # Design JSON -> code generation
        CodePreview.tsx          # Generated code preview
        CRDTPanel.tsx            # CRDT collaboration panel
        ConflictResolver.tsx     # CRDT conflict resolution
        ModelSettings.tsx        # AI model configuration
        FigmaGuide.tsx           # Figma integration guide
        SchemaExplorer.tsx       # Database schema explorer
        DeployPanel.tsx          # Deployment management
        PluginManager.tsx        # Plugin marketplace
        RBACPermissionMatrix.tsx # Role-based access control
        AuroraLayout.tsx         # Aurora theme layout
        LiquidGlassLayout.tsx    # Liquid Glass theme layout
        hooks/                   # Designer-specific hooks
        useYjsBinding.ts         # Yjs state binding
      
      settings/                 # Settings Module
        SettingsPage.tsx         # Full settings UI (~1500+ lines)
        useSettingsStore.ts      # Settings store (useSyncExternalStore)
      
      home/
        AIHomePage.tsx           # Landing/home page
      
      ui/                       # Shared UI primitives
      ErrorBoundary.tsx          # Multi-level error boundary
    
    hooks/
      useAIService.ts            # AI service hook (streaming, multi-provider)
      useAppSettings.ts          # App-wide settings hook
      useCRDTCollab.ts           # CRDT collaboration hook (yjs)
      useCRDTAwareness.ts        # CRDT awareness (cursor sharing)
      useDesignerCRDT.ts         # Designer-specific CRDT binding
      useGlobalKeybindings.ts    # Global keyboard shortcuts
      usePerformanceMonitor.ts   # Performance monitoring
      useSettingsBridge.ts       # Settings cross-route bridge
    
    services/
      settingsSyncService.ts     # Settings sync + event system
      actions/                   # Quick Actions service
      task/                      # Task service
      multi-instance/            # [NEW] Multi-instance services
        IPCManager.ts            # BroadcastChannel IPC cross-tab messaging
        useMultiInstanceStore.ts # useSyncExternalStore + localStorage state
    
    types/
      actions.ts                 # Action types
      task.ts                    # Task/Board types
      multi-instance.ts          # [NEW] Multi-instance type definitions
    
    testing/
      fileTreeUtils.test.ts      # File tree utility tests
      taskStore.test.ts          # Task store & board tests
      ganttChart.test.ts         # Gantt chart calculation tests
      settings.test.ts           # Settings module tests
      multiInstance.test.ts      # [NEW] IPCManager + cross-tab IPC tests
      MockWSServer.ts            # Mock WebSocket server

  styles/
    theme.css                    # Tailwind v4 theme tokens + brand variables
    fonts.css                    # Font imports
    index.css                    # Main entry CSS
    aurora.css                   # Aurora theme
    liquid-glass.css             # Liquid Glass theme
    tailwind.css                 # Tailwind base

docs/
  YYC3-P5-Closing-Review-Summary.md  # Phase 5 closing review
  YYC3-Local-Dev-Handoff-README.md   # This file
```

---

## 4. Routes

| Path | Component | Description |
|---|---|---|
| `/` | AIHomePage | Landing page with project showcase |
| `/designer` | DesignerLayout | Visual multi-panel designer |
| `/ai-code` | AICodeSystem | AI code workbench (IDE) |
| `/settings` | SettingsPage | Full settings management |

**Important**: All routing uses `react-router` (NOT `react-router-dom`). The project uses React Router Data Mode with `createBrowserRouter` + `RouterProvider`.

---

## 5. Critical Constraints & Known Issues

### 5.1 Must-Know Constraints

| Constraint | Details |
|---|---|
| **No `react-router-dom`** | Use `import { ... } from 'react-router'` exclusively |
| **No `Loader2` icon** | lucide-react 0.487.0 does not have it; use `Loader` instead |
| **No `zustand`** | State management uses React Context (`store.tsx`) and `useSyncExternalStore` (`useSettingsStore.ts`) |
| **Tailwind v4** | No `tailwind.config.js`; tokens defined in `theme.css` via `@theme inline` |
| **Large files** | Use incremental edits on `AICodeSystem.tsx` (~3600 lines), `store.tsx` (~1050 lines), `SettingsPage.tsx` (~1500+ lines) to avoid truncation |

### 5.2 Brand Color Status

**Unified brand color**: `#667eea` (CSS variable: `--yyc3-brand`)

Defined in `/src/styles/theme.css`:
```css
:root {
  --yyc3-brand: #667eea;
  --yyc3-brand-rgb: 102, 126, 234;
  --yyc3-bg-deep: #0a0b10;
  --yyc3-bg-surface: #0d0e14;
  --yyc3-bg-elevated: #14151e;
  --yyc3-bg-panel: #1a1b26;
}
```

**Migration status**:
- PanelCanvas.tsx primary/checkbox colors: DONE (updated to `#667eea`)
- StatusBar.tsx default avatar color: DONE
- ModelSettings.tsx default avatar color: DONE
- FigmaGuide.tsx design token value: DONE
- CRDTPanel.tsx self-peer color: DONE (partial - first occurrence)
- **Remaining**: ~30+ instances of `#667eea` in TaskBoard.tsx/AIChatPanel.tsx (already using correct color)
- **Remaining**: ~6 inline HTML template literals in PanelCanvas.tsx with `#6366f1` in embedded HTML strings (low priority, these are sandboxed iframe renders)
- **Remaining**: ConflictResolver.tsx has 3 instances of `#6366f1`

**Recommended next step**: Global find-replace remaining `#6366f1` -> `#667eea` in:
- `/src/app/components/designer/ConflictResolver.tsx`
- `/src/app/components/designer/CRDTPanel.tsx` (remaining instances)
- `/src/app/components/designer/PanelCanvas.tsx` (inline HTML strings)

### 5.3 File Splitting Plan for `AICodeSystem.tsx`

The file has these clearly separable sections:

| Section | Lines | Target File | Status |
|---|---|---|---|
| Types + FileNode | 44-90 | `fileTreeUtils.ts` | DONE (types + utilities extracted) |
| TipIcon component | 92-116 | `TipIcon.tsx` | TODO |
| File tree utilities | 118-222 | `fileTreeUtils.ts` | DONE |
| Initial file tree data | 224-281 | `initialFileTree.ts` | TODO |
| ContextMenu | 283-345 | `FileContextMenu.tsx` | TODO |
| VersionHistoryDialog | 347-393 | `VersionHistoryDialog.tsx` | TODO |
| InlineCreateInput | 395-422 | `InlineCreateInput.tsx` | TODO |
| FileTreeNode | 424-517 | `FileTreeNode.tsx` | TODO |
| IntegratedTerminal | 518-958 | `IntegratedTerminal.tsx` | Placeholder created |
| AI Chat Sidebar | 960-1380 | `AIChatSidebar.tsx` | TODO |
| SearchOverlay | 1382-1471 | `SearchOverlay.tsx` | TODO |
| MoreMenu | 1473-1509 | `MoreMenu.tsx` | TODO |
| ShortcutsDialog | 1511-1562 | `ShortcutsDialog.tsx` | TODO |
| ProjectsPanel | 1564-1618 | `ProjectsPanel.tsx` | TODO |
| NotificationsPanel | 1620-1671 | `NotificationsPanel.tsx` | TODO |
| SettingsDialog | 1673-1853 | `SettingsDialog.tsx` | TODO |
| UserProfilePanel | 1855-1915 | `UserProfilePanel.tsx` | TODO |
| AddFunctionMenu | 1917-1956 | `AddFunctionMenu.tsx` | TODO |
| Main Component | 1958-3601 | `AICodeSystem.tsx` (remains) | Stays |

**Extraction approach**:
1. Create each file with the component + its local dependencies
2. Export from each file
3. Import in AICodeSystem.tsx
4. Test that routes still work
5. Repeat until main file is under ~1200 lines

---

## 6. Environment Configuration

Create a `.env` file at project root:

```env
# API Backend (Primary + 2 Standby)
VITE_API_PRIMARY=https://api-primary.yanyucloud.local
VITE_API_STANDBY_1=https://api-standby1.yanyucloud.local
VITE_API_STANDBY_2=https://api-standby2.yanyucloud.local
VITE_API_TIMEOUT=8000
VITE_API_RETRY_COUNT=2

# WebSocket (CRDT Collaboration)
VITE_WS_PRIMARY=wss://ws-primary.yanyucloud.local
VITE_WS_STANDBY=wss://ws-standby.yanyucloud.local
VITE_WS_RECONNECT_INTERVAL=3000
VITE_WS_MAX_RECONNECT=10

# AI Proxy
VITE_AI_PROXY_ENDPOINT=/api/ai-proxy
VITE_AI_MAX_TOKENS=4096
VITE_AI_TEMPERATURE=0.7

# Auth (OpenID Connect)
VITE_AUTH_ISSUER=https://auth.yanyucloud.local
VITE_AUTH_CLIENT_ID=yanyucloud-designer
VITE_AUTH_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_AUTH_SCOPE=openid profile email

# Storage
VITE_STORAGE_DESIGN_PATH=/app/designs
VITE_STORAGE_BACKUP_ENABLED=true
VITE_STORAGE_BACKUP_INTERVAL=300

# PostgreSQL (optional - for backend)
VITE_PG_PRIMARY_HOST=pg-primary.yanyucloud.local
VITE_PG_PRIMARY_PORT=5432
VITE_PG_DATABASE=yanyucloud_designer

# Redis Cache (optional - for backend)
VITE_CACHE_PRIMARY=redis-primary.yanyucloud.local:6379
VITE_CACHE_TTL=3600
```

---

## 7. Local Development Setup

### 7.1 Prerequisites

- Node.js >= 20.x
- pnpm >= 9.x (recommended) or npm >= 10.x
- Git

### 7.2 Quick Start

```bash
# Clone the project
git clone <repo-url> yyc3-cloudpivot-ai
cd yyc3-cloudpivot-ai

# Install dependencies
pnpm install

# Create .env file (see Section 6)
cp .env.example .env

# Start development server
pnpm dev
# or: npm run dev

# Open browser
open http://localhost:5173
```

### 7.3 Build

```bash
pnpm build
# Output: dist/
```

### 7.4 Run Tests (when Vitest is set up)

```bash
# Install Vitest first (not yet in package.json)
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Add to package.json scripts:
# "test": "vitest",
# "test:ui": "vitest --ui",
# "test:coverage": "vitest --coverage"

# Run tests
pnpm test

# Test files location:
# src/app/testing/settings.test.ts
# src/app/testing/fileTreeUtils.test.ts
# src/app/testing/taskStore.test.ts
# src/app/testing/ganttChart.test.ts
```

### 7.5 Vitest Configuration (To Be Created)

Create `vitest.config.ts` at project root:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/app/**/*.{ts,tsx}'],
      exclude: ['src/app/testing/**', '**/*.test.*'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

---

## 8. Test Suite Overview

| Test File | Coverage Area | Test Count |
|---|---|---|
| `settings.test.ts` | Settings store, sync service, keybinding parser, rules injection, search | ~20+ |
| `fileTreeUtils.test.ts` | File tree CRUD, traversal, filtering, path resolution, cloning | ~22 |
| `taskStore.test.ts` | Task types, filtering, sorting, dependencies, statistics, persistence | ~18 |
| `ganttChart.test.ts` | Time calculation, bar positioning, drag resize, priority sorting | ~12 |
| `multiInstance.test.ts` | IPCManager broadcast/sendTo/wildcard, type validation, cross-tab 3+ tabs | ~15 |

**Total**: ~87+ test cases covering core utilities and business logic.

---

## 9. Completed Features (Phase 1-5)

### Phase 1-3: Foundation
- Multi-panel IDE workspace with resizable panels
- Monaco editor integration with syntax highlighting
- File tree with CRUD, context menu, drag-to-terminal
- Integrated terminal (multi-tab, command history, shell selection)
- AI chat with streaming SSE responses
- Live preview (iframe sandbox)
- Component palette & property inspector
- Three theme variants (Classic, Aurora, Liquid Glass)

### Phase 4: TaskBoard v4.0
- Kanban board with react-dnd cross-column drag
- react-day-picker date selection
- Task description editing modal
- Dependency graph DAG visualization
- Touch device DnD support
- AI service integration for task analysis

### Phase 5: Advanced Features
- Gantt chart / timeline view with drag-to-resize bars
- Multi-user collaborative editing (yjs CRDT)
- DAG interactive node dragging & rearrangement
- DAG right-click context menu for quick dependency editing
- Gantt left-edge drag to adjust start dates
- Collaboration conflict/remote event toast notifications (sonner)
- Settings module: keybinding editor with conflict detection
- Settings module: rules & skills injection into AI system prompts
- API key validation via real `/v1/models` endpoint
- Quick Actions toolbar module
- Performance monitoring hook

### Phase 5 Closing
- Brand color CSS variables defined (`--yyc3-brand: #667eea`)
- Partial brand color migration (#6366f1 -> #667eea) across designer components
- File tree utilities extracted to `fileTreeUtils.ts`
- IntegratedTerminal extraction reference created
- 4 test files created (72+ test cases)
- Comprehensive handoff documentation (this file)

### Phase 2: Multi-Instance Management System
- **IPCManager** — BroadcastChannel-based cross-tab IPC with heartbeat, targeted messaging, wildcard handlers
- **useMultiInstanceStore** — useSyncExternalStore + localStorage persistence for instances/workspaces/sessions/shared clipboard
- **MultiInstanceManager UI** — 4-tab panel (Instances / Workspaces / Sessions / Clipboard) with full CRUD
- **Type system** — comprehensive types for AppInstance, Workspace, Session, IPCMessage, SharedClipboardItem
- **ActivityBar integration** — `AppWindow` icon in AI Code System sidebar, `'multi-instance'` view in SidebarViews
- **Unit tests** — 15+ test cases for IPCManager (broadcast, sendTo, wildcard, unsubscribe, destroy) + type validation + cross-tab integration

### Final Global Audit (2026-03-18)
- **`Loader2` eradicated** — All 5 source files (Inspector, AIAssistant, ModelSettings, PluginManager, LivePreview) updated to `Loader`
- **Brand color audit** — ConflictResolver (3 instances), AIHomePage, store.tsx, useCRDTAwareness, useCRDTCollab, useDesignerCRDT, liquid-glass.css updated from `#6366f1` to `#667eea`
- **Import chain verified** — All module imports intact across App.tsx → routes.tsx → all page components
- **No `react-router-dom`** in runtime source (only in CodePreview.tsx generated template, which is expected)

---

## 10. Recommended Next Steps (Phase 6)

### Priority 1: Compilation Verification
1. Run `pnpm install` locally
2. Run `pnpm dev` and verify all 4 routes render correctly
3. Fix any TypeScript compilation errors
4. Report back with results

### Priority 2: Complete Brand Color Migration
1. Global search for remaining `#6366f1` instances
2. Replace with `#667eea` or `var(--yyc3-brand)` where appropriate
3. Verify visual consistency across all themes

### Priority 3: File Splitting
1. Follow the extraction plan in Section 5.3
2. Start with the smallest components (TipIcon, InlineCreateInput, ShortcutsDialog)
3. Progress to larger extractions (IntegratedTerminal, AI Chat Sidebar)
4. Target: reduce `AICodeSystem.tsx` from ~3600 to ~1200 lines

### Priority 4: Testing Infrastructure
1. Install Vitest + testing-library
2. Create `vitest.config.ts` (see Section 7.5)
3. Run existing test files to verify
4. Add component rendering tests (React Testing Library)
5. Add E2E smoke tests for route navigation

### Priority 5: Performance & Quality
1. React.lazy() for route-level code splitting
2. Add Suspense boundaries with loading skeletons
3. Memoize expensive computations in TaskBoard and AICodeSystem
4. Add ESLint + Prettier configuration
5. Enable TypeScript strict mode checks

---

## 11. API Architecture Reference

```
Frontend (Vite dev server :5173)
  |
  +-- /api/ai-proxy --> AI Backend (gpt-4o-mini / custom models)
  |
  +-- REST API (failover):
  |     Primary:  https://api-primary.yanyucloud.local
  |     Standby1: https://api-standby1.yanyucloud.local  
  |     Standby2: https://api-standby2.yanyucloud.local
  |
  +-- WebSocket (CRDT):
  |     Primary:  wss://ws-primary.yanyucloud.local
  |     Standby:  wss://ws-standby.yanyucloud.local
  |
  +-- Auth (OpenID Connect):
        Issuer: https://auth.yanyucloud.local
```

The `apiClient.ts` implements automatic failover: tries primary, falls back to standby1, then standby2.

---

## 12. Key File Size Reference

| File | Lines | Complexity | Notes |
|---|---|---|---|
| `AICodeSystem.tsx` | ~3600 | HIGH | Main IDE workbench - splitting in progress |
| `SettingsPage.tsx` | ~1500+ | HIGH | Full settings UI |
| `TaskBoard.tsx` | ~1300 | HIGH | Kanban + DnD + AI + CRDT |
| `store.tsx` | ~1050 | MEDIUM | Global state management |
| `config.ts` | ~183 | LOW | Clean configuration center |
| `routes.tsx` | ~79 | LOW | Simple 4-route setup |

---

## 13. Contact & Support

- **Team**: YanYuCloudCube Team
- **Email**: admin@0379.email
- **Project**: YANYUCLOUD (YYC3) Intelligent Multi-Panel Visual AI Programming Application

---

> *This document was generated as part of the Phase 5 -> Phase 6 handoff. It serves as the single source of truth for local development continuation. When returning from local testing, bring back: compilation logs, any error fixes applied, and screenshots of running routes.*