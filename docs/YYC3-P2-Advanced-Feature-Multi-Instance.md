# YYC3 P2 Advanced Feature: Multi-Instance Management

> **Version**: v1.0.0  
> **Date**: 2026-03-18  
> **Author**: YanYuCloudCube Team &lt;admin@0379.email&gt;  
> **Status**: Implemented (Browser-Adapted)  
> **Tags**: P2, multi-instance, workspace, session, IPC, BroadcastChannel

---

## 1. Implementation Summary

The original design spec (`multi-instance-design.md`) targeted a **Tauri desktop** environment with `@tauri-apps/api` IPC and `zustand` stores. This implementation **adapts the entire architecture** to our browser-based React application:

| Design Spec | Implementation |
|---|---|
| Tauri IPC (`invoke`, `listen`) | **BroadcastChannel API** for cross-tab messaging |
| Zustand stores | **useSyncExternalStore** + localStorage (matching `useSettingsStore.ts` pattern) |
| Native window management | Browser tab management + `window.open()` |
| Process isolation | Tab isolation (each tab = one instance) |
| Heartbeat / stale detection | BroadcastChannel heartbeat every 3s, stale after 10s |

---

## 2. Files Created

### Type Definitions
| File | Description | Lines |
|---|---|---|
| `src/app/types/multi-instance.ts` | Full type system: AppInstance, Workspace, Session, IPC types, SharedClipboard | ~160 |

### Services
| File | Description | Lines |
|---|---|---|
| `src/app/services/multi-instance/IPCManager.ts` | BroadcastChannel-based cross-tab IPC manager with heartbeat | ~100 |
| `src/app/services/multi-instance/useMultiInstanceStore.ts` | Singleton store with useSyncExternalStore, localStorage persistence, full CRUD for instances/workspaces/sessions/clipboard | ~320 |

### UI Components
| File | Description | Lines |
|---|---|---|
| `src/app/components/ai-code/MultiInstanceManager.tsx` | Full management panel with 4 tabs (Instances/Workspaces/Sessions/Clipboard), create dialogs, import/export, search | ~480 |

**Total new code**: ~1060 lines across 4 files.

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Browser Tab A (Instance)          Browser Tab B (Instance)  │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │  useMultiInstanceStore│         │  useMultiInstanceStore│  │
│  │  (useSyncExternalStore│<──────>│  (useSyncExternalStore│  │
│  │   + localStorage)     │  IPC   │   + localStorage)     │  │
│  └─────────┬────────────┘         └─────────┬────────────┘  │
│            │                                │                │
│  ┌─────────▼────────────┐         ┌─────────▼────────────┐  │
│  │  IPCManager           │         │  IPCManager           │  │
│  │  (BroadcastChannel)   │◄──────►│  (BroadcastChannel)   │  │
│  └──────────────────────┘         └──────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              localStorage (shared)                     │   │
│  │  yyc3-multi-instance: { workspaces, sessions, ... }   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User opens new tab** → `useMultiInstanceStore` auto-registers instance → broadcasts `instance-created` via BroadcastChannel
2. **Heartbeat** → every 3s each tab sends `instance-heartbeat` → other tabs update `lastActiveAt`
3. **Stale pruning** → every 10s, instances with `lastActiveAt` older than 10s are removed
4. **Workspace/Session CRUD** → localStorage persisted + broadcast to other tabs
5. **Shared clipboard** → `shareToClipboard()` → stored + broadcast → available in all tabs
6. **Tab close** → `beforeunload` → broadcasts `instance-closed` → removed from store

### IPC Message Types

| Type | Direction | Data |
|---|---|---|
| `instance-created` | Broadcast | `AppInstance` |
| `instance-closed` | Broadcast | `AppInstance` |
| `instance-heartbeat` | Broadcast | `{ alive: true }` |
| `workspace-created` | Broadcast | `Workspace` |
| `workspace-updated` | Broadcast | `{ id, updates }` |
| `workspace-closed` | Broadcast | `{ id }` |
| `session-created` | Broadcast | `Session` |
| `session-closed` | Broadcast | `{ id }` |
| `clipboard-share` | Broadcast | `SharedClipboardItem` |
| `focus-request` | Targeted | `{}` |
| `navigate-request` | Targeted | `{ route }` |

---

## 4. UI Panel: MultiInstanceManager

The panel provides a complete management interface with:

### Tab: Instances
- Lists all active browser tabs running YYC3
- Shows current tab (highlighted), main tab (badge), route path
- Live status indicator (green = alive, red = stale)
- "New Tab" button to open additional instances
- "Focus" button to bring another tab to front

### Tab: Workspaces
- CRUD for workspaces with 4 types: Project, AI Session, Debug, Custom
- Color-coded type badges
- Duplicate, Export (JSON download), Import (paste JSON)
- Activate/deactivate workspace
- Session count per workspace

### Tab: Sessions
- Create sessions attached to workspaces
- 5 session types: AI Chat, Code Edit, Debug, Preview, Terminal
- Status management: Active / Idle / Suspended / Closed
- Play/Pause/Delete controls

### Tab: Clipboard
- Cross-tab shared clipboard
- Supports text, code, file-ref, component types
- One-click copy to system clipboard
- Auto-capped at 50 items

---

## 5. Integration Guide

### Quick Integration into AICodeSystem

To add the multi-instance panel as a sidebar view in the AI Code Workbench:

```tsx
import { MultiInstanceManager } from './MultiInstanceManager';

// In the sidebar view switch:
case 'multi-instance':
  return <MultiInstanceManager />;
```

### Using the Store Programmatically

```tsx
import { useMultiInstanceStore } from '../../services/multi-instance/useMultiInstanceStore';

function MyComponent() {
  const { 
    instances, workspaces, sessions,
    createWorkspace, createSession,
    shareToClipboard 
  } = useMultiInstanceStore();
  
  // Create a new workspace
  const ws = createWorkspace('My Project', 'project');
  
  // Create a session in that workspace
  const session = createSession('AI Chat 1', 'ai-chat', ws.id);
  
  // Share content to cross-tab clipboard
  shareToClipboard('code', 'const x = 42;', { language: 'typescript' });
}
```

### Cross-Tab Communication

```tsx
const { getIPC } = useMultiInstanceStore();

// Listen for custom events
const unsub = getIPC().on('state-sync', (msg) => {
  console.log('Received state sync from tab:', msg.senderId, msg.data);
});

// Broadcast to all tabs
getIPC().broadcast('state-sync', { fileTree: [...] });
```

---

## 6. Design Decisions

| Decision | Rationale |
|---|---|
| **BroadcastChannel over SharedWorker** | Simpler API, better browser support, no worker lifecycle management |
| **useSyncExternalStore over Context** | Singleton store needed across potential multiple mount points; matches `useSettingsStore.ts` pattern |
| **localStorage for persistence** | Workspaces/sessions survive page refresh; instances are ephemeral |
| **sessionStorage for tab ID** | Each tab gets a unique ID that persists across refreshes of that tab |
| **Heartbeat-based liveness** | No native "tab closed" event is 100% reliable; heartbeat + stale pruning ensures accuracy |
| **50-item clipboard cap** | Prevents localStorage quota issues |

---

## 7. Constraints & Known Limitations

1. **BroadcastChannel** requires same-origin; won't work across different domains
2. **localStorage** has a ~5MB limit; large session data (e.g., many AI messages) should be pruned
3. **`beforeunload`** is not guaranteed to fire (e.g., browser crash); heartbeat handles this
4. **No `zustand`** — the project uses React Context (`store.tsx`) and `useSyncExternalStore`; this implementation follows the same pattern
5. **No Tauri** — all `@tauri-apps/api` calls from the design spec are replaced with browser APIs
6. **`window.focus()`** may be blocked by browsers for security; `focus-request` is best-effort

---

## 8. Acceptance Criteria (from Design Spec)

| Criteria | Status | Notes |
|---|---|---|
| Multi-window management | DONE | Browser tab-based, auto-registration |
| Workspace isolation | DONE | Independent config, sessions, persistence |
| Session management | DONE | Full lifecycle: create/activate/suspend/resume/delete |
| IPC communication | DONE | BroadcastChannel with typed messages |
| Resource sharing | DONE | Shared clipboard with cross-tab sync |
| Window switching smooth | DONE | Focus request + status indicators |
| Workspace switching fast | DONE | Instant activation with localStorage |
| Session recovery | DONE | Persisted to localStorage, survives refresh |
| Performance | DONE | Lightweight singleton, no re-renders on other tabs' state changes |

---

## 9. Version History

| Version | Date | Changes | Author |
|---|---|---|---|
| v1.0.0 | 2026-03-18 | Initial implementation adapted for browser environment | YanYuCloudCube Team |

---

<div align="center">

> "YanYuCloudCube"  
> admin@0379.email  
> Words Initiate Quadrants, Language Serves as Core for Future  
> All things converge in cloud pivot; Deep stacks ignite a new era of intelligence

</div>
