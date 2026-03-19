/**
 * @file multi-instance.ts
 * @description YYC3 多实例/多开系统类型定义 — 窗口、工作区、会话、IPC 全套类型
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags multi-instance,types,window,workspace,session,ipc
 */

/* ================================================================
   Instance & Window Types
   ================================================================ */

export type InstanceType = 'main' | 'secondary' | 'popup' | 'preview';
export type WindowType = 'main' | 'editor' | 'preview' | 'terminal' | 'ai-chat' | 'settings';
export type WorkspaceType = 'project' | 'ai-session' | 'debug' | 'custom';
export type SessionType = 'ai-chat' | 'code-edit' | 'debug' | 'preview' | 'terminal';
export type SessionStatus = 'active' | 'idle' | 'suspended' | 'closed';

export interface AppInstance {
  id: string;
  type: InstanceType;
  windowId: string;
  windowType: WindowType;
  title: string;
  createdAt: number;
  lastActiveAt: number;
  isMain: boolean;
  isVisible: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  workspaceId?: string;
  sessionIds: string[];
  state: Record<string, unknown>;
  /** Browser tab identifier (used for cross-tab detection) */
  tabId: string;
  /** Route path this instance is showing */
  route: string;
}

/* ================================================================
   Workspace Types
   ================================================================ */

export interface EditorConfig {
  fontSize: number;
  fontFamily: string;
  theme: string;
  wordWrap: boolean;
  minimap: boolean;
  tabSize: number;
}

export interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface PanelLayout {
  preset: string;
  panels: Array<{ id: string; size: number; visible: boolean }>;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  accent: string;
}

export interface ShortcutConfig {
  scheme: 'vscode' | 'custom';
  custom: Record<string, string>;
}

export interface WorkspaceConfig {
  editor?: EditorConfig;
  ai?: AIConfig;
  panelLayout?: PanelLayout;
  theme?: ThemeConfig;
  shortcuts?: ShortcutConfig;
}

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  icon?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  projectPath?: string;
  config: WorkspaceConfig;
  sessionIds: string[];
  windowIds: string[];
  isActive: boolean;
}

/* ================================================================
   Session Types
   ================================================================ */

export interface SessionData {
  aiMessages?: Array<{ role: string; content: string; timestamp?: number }>;
  editedFiles?: Array<{ path: string; content: string; language?: string }>;
  terminalHistory?: Array<{ command: string; output: string; timestamp?: number }>;
  debugState?: Record<string, unknown>;
  previewUrl?: string;
}

export interface Session {
  id: string;
  type: SessionType;
  name: string;
  createdAt: number;
  updatedAt: number;
  status: SessionStatus;
  data: SessionData;
  workspaceId: string;
  windowId: string;
}

/* ================================================================
   IPC Types (BroadcastChannel-based)
   ================================================================ */

export type IPCMessageType =
  | 'instance-created'
  | 'instance-closed'
  | 'instance-heartbeat'
  | 'workspace-created'
  | 'workspace-updated'
  | 'workspace-closed'
  | 'session-created'
  | 'session-updated'
  | 'session-closed'
  | 'state-sync'
  | 'resource-share'
  | 'clipboard-share'
  | 'focus-request'
  | 'navigate-request';

export interface IPCMessage {
  id: string;
  type: IPCMessageType;
  senderId: string;
  receiverId?: string;
  data: unknown;
  timestamp: number;
}

/* ================================================================
   Resource / Shared Clipboard
   ================================================================ */

export interface SharedClipboardItem {
  id: string;
  type: 'text' | 'code' | 'file-ref' | 'component';
  content: string;
  metadata?: Record<string, unknown>;
  sourceInstanceId: string;
  timestamp: number;
}

/* ================================================================
   Aggregate Store State
   ================================================================ */

export interface MultiInstanceState {
  /** Current tab's instance */
  currentInstance: AppInstance | null;
  /** All known instances (cross-tab) */
  instances: AppInstance[];
  /** All workspaces */
  workspaces: Workspace[];
  /** All sessions */
  sessions: Session[];
  /** Shared clipboard items */
  sharedClipboard: SharedClipboardItem[];
  /** Active workspace ID */
  activeWorkspaceId: string | null;
  /** Active session ID */
  activeSessionId: string | null;
  /** IPC connection status */
  ipcConnected: boolean;
}
