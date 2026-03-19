# YYC3 Multi-Instance Feature — Local Development Handoff Guide

> **Phase**: P2 Advanced Feature — Multi-Instance Management  
> **Date**: 2026-03-18  
> **Author**: YanYuCloudCube Team + AI Mentor  
> **Status**: Implementation Complete, Awaiting Local Compilation Verification

---

## 1. What Was Delivered

This phase implemented the **Multi-Instance Management System** as specified in the design document `multi-instance-design.md`, fully adapted from the Tauri desktop architecture to our browser-based React application.

### New Files (4 files, ~1060 lines total)

| File | Purpose |
|---|---|
| `src/app/types/multi-instance.ts` | Type definitions for instances, workspaces, sessions, IPC messages |
| `src/app/services/multi-instance/IPCManager.ts` | Cross-tab communication via BroadcastChannel API |
| `src/app/services/multi-instance/useMultiInstanceStore.ts` | Singleton state store (useSyncExternalStore + localStorage) |
| `src/app/components/ai-code/MultiInstanceManager.tsx` | Full management UI panel (4-tab interface) |

### Documentation (2 files)

| File | Purpose |
|---|---|
| `docs/YYC3-P2-Advanced-Feature-Multi-Instance.md` | Complete design & implementation document |
| `docs/YYC3-P2-MultiInstance-Handoff-README.md` | This handoff guide |

---

## 2. Key Adaptation Decisions

The original spec used Tauri + zustand. Our adaptations:

| Original | Adapted To | Why |
|---|---|---|
| `@tauri-apps/api` invoke/listen | `BroadcastChannel` API | Browser environment, no native shell |
| `zustand` + `persist` middleware | `useSyncExternalStore` + `localStorage` | Project constraint: no zustand installed |
| Native window create/close/focus | `window.open()` + `window.focus()` | Browser tab = instance |
| Process-level isolation | Tab-level isolation via `sessionStorage` tab IDs | Each tab auto-registers on mount |

---

## 3. Local Verification Steps

### Step 1: Compile Check
```bash
pnpm dev
# Verify no TypeScript errors in terminal
```

### Step 2: Type Check
```bash
# If tsc is available:
npx tsc --noEmit
# Check for errors in new files
```

### Step 3: Functional Test — Single Tab
1. Navigate to `/ai-code`
2. Import `MultiInstanceManager` in any sidebar or test it standalone:
   ```tsx
   import { MultiInstanceManager } from './components/ai-code/MultiInstanceManager';
   ```
3. Verify the panel renders with "Instances" tab showing 1 current instance

### Step 4: Functional Test — Multi Tab
1. Open YYC3 in **Tab A** (`http://localhost:5173/ai-code`)
2. Open YYC3 in **Tab B** (`http://localhost:5173/designer`)
3. Both tabs should show 2 instances in the Instances panel
4. Close Tab B → Tab A should show 1 instance within ~10 seconds (stale pruning)

### Step 5: Workspace + Session Test
1. In the **Workspaces** tab, click "New" → create a workspace
2. In the **Sessions** tab, click "New" → create a session (select the workspace)
3. Refresh the page → workspace and session should persist
4. Open a second tab → the same workspaces/sessions should appear

### Step 6: Cross-Tab Clipboard Test
In browser console of Tab A:
```javascript
// This will be visible in Tab B's Clipboard tab
// (Note: you'd call this via the store in real usage)
```

### Step 7: Export/Import Test
1. Create a workspace with sessions
2. Click "..." menu → Export → downloads a JSON file
3. Delete the workspace
4. Click "Import" → paste the JSON → workspace restored

---

## 4. Integration Into AICodeSystem

The `MultiInstanceManager` component is ready to be added as a sidebar view. When you're ready to integrate:

**Option A**: Add to `SidebarViews.tsx` as a new view type  
**Option B**: Add to `ActivityBar.tsx` as a new activity icon  
**Option C**: Add as a new route panel at `/multi-instance`

Suggested activity bar icon: `AppWindow` from lucide-react (already imported in the component).

The component is self-contained — just render `<MultiInstanceManager />` anywhere and it auto-registers the tab, starts IPC, and manages state.

---

## 5. Dependencies

**No new packages required.** All APIs used are browser-native:
- `BroadcastChannel` (supported in all modern browsers)
- `crypto.randomUUID()` (supported in secure contexts)
- `sessionStorage` / `localStorage`
- `useSyncExternalStore` (React 18)

---

## 6. Known Items to Address After Verification

| Item | Priority | Notes |
|---|---|---|
| Integrate panel into AICodeSystem sidebar | P1 | Add `'multi-instance'` view to ActivityBar + SidebarViews |
| Add `navigate-request` handler | P2 | Currently broadcasts but needs `react-router` `useNavigate()` integration |
| Add resource usage stats per instance | P3 | `performance.memory` (Chrome only) |
| Add workspace template presets | P3 | Pre-configured workspaces for common workflows |
| Write unit tests for IPCManager and store | P2 | Add to `src/app/testing/multiInstance.test.ts` |
| Consider IndexedDB for large session data | P3 | localStorage 5MB limit may be hit with many AI chat messages |

---

## 7. File Tree After This Phase

```
src/app/
  types/
    multi-instance.ts          [NEW] Multi-instance type system
  services/
    multi-instance/
      IPCManager.ts            [NEW] BroadcastChannel IPC
      useMultiInstanceStore.ts [NEW] Singleton state store
  components/
    ai-code/
      MultiInstanceManager.tsx [NEW] Management UI panel

docs/
  YYC3-P2-Advanced-Feature-Multi-Instance.md  [NEW] Design doc
  YYC3-P2-MultiInstance-Handoff-README.md     [NEW] This file
```

---

## 8. Quick Reference: Store API

```typescript
const {
  // State
  currentInstance,    // This tab's AppInstance
  instances,          // All known tab instances
  workspaces,         // All workspaces
  sessions,           // All sessions
  sharedClipboard,    // Cross-tab clipboard items
  activeWorkspaceId,  // Currently active workspace
  activeSessionId,    // Currently active session
  ipcConnected,       // IPC channel status

  // Workspace CRUD
  createWorkspace(name, type, config?),
  updateWorkspace(id, updates),
  deleteWorkspace(id),
  activateWorkspace(id),
  duplicateWorkspace(id),
  exportWorkspace(id),      // Returns JSON string
  importWorkspace(json),    // Returns Workspace

  // Session CRUD
  createSession(name, type, workspaceId, data?),
  updateSession(id, updates),
  deleteSession(id),
  activateSession(id),
  suspendSession(id),
  resumeSession(id),
  updateSessionData(id, partialData),

  // Cross-tab
  shareToClipboard(type, content, metadata?),
  requestFocusInstance(tabId),
  requestNavigate(tabId, route),
  getIPC(),           // Raw IPCManager access
  getTabId(),         // This tab's unique ID
} = useMultiInstanceStore();
```

---

> *Bring back: compilation logs, any TypeScript errors encountered, screenshots of the multi-tab instance detection working, and any integration decisions made. Looking forward to the report!*

---

<div align="center">

> "YanYuCloudCube"  
> admin@0379.email  
> Words Initiate Quadrants, Language Serves as Core for Future

</div>
