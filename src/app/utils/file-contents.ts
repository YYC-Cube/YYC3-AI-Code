/**
 * @file file-contents.ts
 * @description 模拟文件内容注册表 — 代码编辑器的模拟源码及语言检测工具
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.1.0
 * @created 2026-03-13
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags file-contents, mock, language-detection, editor
 */

/**
 * Mock file contents for the code editor
 * Maps file paths to their simulated source code
 */

export function getLanguage(path: string): string {
  if (path.endsWith('.tsx')) {return 'tsx'}
  if (path.endsWith('.ts')) {return 'typescript'}
  if (path.endsWith('.jsx')) {return 'jsx'}
  if (path.endsWith('.js')) {return 'javascript'}
  if (path.endsWith('.css') || path.endsWith('.scss') || path.endsWith('.less')) {return 'css'}
  if (path.endsWith('.json')) {return 'json'}
  if (path.endsWith('.md') || path.endsWith('.markdown')) {return 'markdown'}
  if (path.endsWith('.html') || path.endsWith('.htm')) {return 'html'}
  if (path.endsWith('.svg')) {return 'svg'}
  if (path.endsWith('.vue')) {return 'vue'}
  return 'text'
}

export const MOCK_FILE_CONTENTS: Record<string, string> = {
  'src/app/App.tsx': `import { RouterProvider } from 'react-router'
import { router } from './routes'
import { ThemeProvider } from './components/theme/ThemeProvider'

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}`,

  'src/app/routes.ts': `import { createBrowserRouter } from 'react-router'
import { HomePage } from './components/HomePage'
import { DesignerPage } from './components/DesignerPage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: HomePage,
  },
  {
    path: '/designer',
    Component: DesignerPage,
  },
  {
    path: '*',
    Component: () => (
      <div className="h-screen flex items-center justify-center">
        <h1>404 - Page Not Found</h1>
      </div>
    ),
  },
])`,

  'src/app/components/HomePage.tsx': `import { useNavigate } from 'react-router'
import { useAppStore } from '../stores/app-store'
import { Sparkles, ArrowRight, MessageSquare } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()
  const { projects } = useAppStore()

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Hero Section */}
      <div className="pt-24 pb-16 text-center">
        <h1 className="text-4xl font-bold">
          YYC³ Family AI
        </h1>
        <p className="text-white/40 mt-3">
          言启象限 | 语枢未来
        </p>
      </div>

      {/* AI Chat Input */}
      <div className="w-full max-w-2xl px-6">
        <div className="bg-white/[0.03] border border-white/[0.06] 
                        rounded-2xl p-4">
          <textarea
            placeholder="描述你想要构建的应用..."
            className="w-full bg-transparent resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button onClick={() => navigate('/designer')}>
              开始创建 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="mt-16 w-full max-w-4xl px-6">
        <h2 className="text-lg mb-4">最近项目</h2>
        <div className="grid grid-cols-4 gap-4">
          {projects.map(p => (
            <div key={p.id} className="p-4 rounded-xl border">
              <h3>{p.name}</h3>
              <p className="text-sm text-white/40">{p.description}</p>
              <span className="text-xs text-white/25">{p.updatedAt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}`,

  'src/app/components/DesignerPage.tsx': `import { useAppStore } from '../stores/app-store'
import { useThemeStore } from '../stores/theme-store'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from './ui/resizable'
import { TopNavBar } from './designer/TopNavBar'
import { ViewSwitchBar } from './designer/ViewSwitchBar'
import { LeftPanel } from './designer/LeftPanel'
import { CenterPanel } from './designer/CenterPanel'
import { RightPanel } from './designer/RightPanel'
import { PreviewPanel } from './designer/PreviewPanel'
import { ModelSettings } from './designer/ModelSettings'

export function DesignerPage() {
  const { currentView } = useAppStore()

  return (
    <div className="h-screen flex flex-col text-white overflow-hidden">
      <TopNavBar />
      <ViewSwitchBar />
      <div className="flex-1 overflow-hidden">
        {currentView === 'preview' ? (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={25} minSize={18}>
              <LeftPanel />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={75}>
              <PreviewPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : currentView === 'split' ? (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={22} minSize={18}>
              <LeftPanel />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={38}>
              <CenterPanel />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={40}>
              <PreviewPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={25} minSize={18}>
              <LeftPanel />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={45}>
              <CenterPanel />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={30}>
              <RightPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
      <ModelSettings />
    </div>
  )
}`,

  'src/app/components/designer/TopNavBar.tsx': `import { useThemeStore } from '../../stores/theme-store'
import { Settings, Bell, User, Palette } from 'lucide-react'
import logoImage from '/yyc3-logo.png'

export function TopNavBar() {
  const { openCustomizer } = useThemeStore()

  return (
    <div className="h-10 flex items-center justify-between px-4 
                    border-b border-white/[0.06]"
         style={{ background: 'var(--sidebar)' }}>
      <div className="flex items-center gap-2">
        <img src={logoImage} className="w-5 h-5" alt="Logo" />
        <span className="text-sm text-white/80">
          YYC³ Family AI
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={openCustomizer}>
          <Palette className="w-4 h-4" />
        </button>
        <button><Bell className="w-4 h-4" /></button>
        <button><Settings className="w-4 h-4" /></button>
      </div>
    </div>
  )
}`,

  'src/app/components/designer/LeftPanel.tsx': `import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../stores/app-store'
import { Send, ImagePlus, Paperclip, Copy } from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'
import { createLogger } from '../../utils/logger'
import logoImage from '/yyc3-logo.png'

const log = createLogger('LeftPanel')

const WELCOME_MSG = \`你好！我是 YYC³ AI 编程助手。

我可以帮你：
- 设计和构建 UI 组件
- 生成 React/TypeScript 代码
- 诊断和修复错误
- 编写文档和测试

请告诉我你需要什么帮助？\`

export function LeftPanel() {
  const { messages, addMessage, isAiTyping, setAiTyping,
          aiModels, activeModelId } = useAppStore()
  const [input, setInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const activeModel = aiModels.find(m => m.id === activeModelId)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiTyping])

  const handleSend = () => {
    if (!input.trim()) return
    log.info('User message sent', { length: input.length })
    addMessage({ role: 'user', content: input.trim() })
    setInput('')
    setAiTyping(true)
    // API call logic...
  }

  return (
    <div className="h-full flex flex-col"
         style={{ background: 'var(--sidebar)' }}>
      <ScrollArea className="flex-1">
        {/* Chat messages */}
      </ScrollArea>
      <div className="p-3 border-t border-white/[0.06]">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入消息..."
          className="w-full bg-transparent"
        />
      </div>
    </div>
  )
}`,

  'src/app/components/designer/CenterPanel.tsx': `import { useState } from 'react'
import { useAppStore } from '../../stores/app-store'
import { ResizablePanelGroup, ResizablePanel, 
         ResizableHandle } from '../ui/resizable'
import { ScrollArea } from '../ui/scroll-area'
import { FileCode2, FolderOpen, Folder, Plus } from 'lucide-react'

export function CenterPanel() {
  const { selectedFile, fileContents } = useAppStore()

  const content = fileContents[selectedFile || '']?.content || ''
  const lines = content.split('\\n')

  return (
    <div className="h-full flex flex-col">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={30} minSize={15}>
          {/* File Tree */}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={70}>
          {/* Code Editor with editable textarea */}
          <ScrollArea className="flex-1">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="w-10 text-right pr-3">
                  {i + 1}
                </span>
                <pre className="flex-1">
                  <code>{line}</code>
                </pre>
              </div>
            ))}
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}`,

  'src/app/components/designer/RightPanel.tsx': `import { useState, useRef } from 'react'
import { useAppStore } from '../../stores/app-store'
import { ResizablePanelGroup, ResizablePanel,
         ResizableHandle } from '../ui/resizable'
import { ScrollArea } from '../ui/scroll-area'
import { FileCode2, Terminal as TerminalIcon } from 'lucide-react'

export function RightPanel() {
  const { terminalLines, addTerminalLine, clearTerminal } = useAppStore()
  const [terminalInput, setTerminalInput] = useState('')

  const handleTerminalSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && terminalInput.trim()) {
      addTerminalLine(\`$ \${terminalInput}\`)
      const cmd = terminalInput.trim().toLowerCase()
      if (cmd === 'clear') {
        clearTerminal()
      } else if (cmd === 'help') {
        addTerminalLine('Available commands:')
        addTerminalLine('  clear  - Clear terminal')
        addTerminalLine('  help   - Show this help')
        addTerminalLine('  ls     - List files')
      } else {
        addTerminalLine(\`zsh: command not found: \${terminalInput}\`)
      }
      setTerminalInput('')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={60}>
          {/* Code Detail View */}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={40}>
          {/* Terminal */}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}`,

  'src/app/components/designer/PreviewPanel.tsx': `import { useState } from 'react'
import { Monitor, Tablet, Smartphone, 
         RefreshCw, ZoomIn, ZoomOut } from 'lucide-react'

type DeviceSize = 'desktop' | 'tablet' | 'mobile'

export function PreviewPanel() {
  const [device, setDevice] = useState<DeviceSize>('desktop')
  const [zoom, setZoom] = useState(100)

  return (
    <div className="h-full flex flex-col">
      {/* Device Toolbar */}
      <div className="h-9 flex items-center px-4 border-b">
        <span className="text-xs text-white/30">实时预览</span>
        <span className="text-xs px-1.5 bg-emerald-500/10 
                         text-emerald-400/60 rounded">LIVE</span>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 flex items-start justify-center p-6">
        <div className="bg-white rounded-lg shadow-2xl">
          {/* Mock browser chrome + content */}
        </div>
      </div>
    </div>
  )
}`,

  'src/app/components/designer/ViewSwitchBar.tsx': `import { useNavigate } from 'react-router'
import { useAppStore } from '../../stores/app-store'
import { ChevronLeft, Eye, Code2, Columns2, 
         Bot, Settings2 } from 'lucide-react'

export function ViewSwitchBar() {
  const navigate = useNavigate()
  const { currentView, setCurrentView,
          aiModels, activeModelId, openModelSettings } = useAppStore()

  const activeModel = aiModels.find(m => m.id === activeModelId)

  const views = [
    { id: 'preview', icon: Eye, label: '预览' },
    { id: 'code', icon: Code2, label: '代码' },
    { id: 'split', icon: Columns2, label: '分屏' },
  ]

  return (
    <div className="h-9 border-b border-white/[0.06] flex items-center px-3">
      <button onClick={() => navigate('/')}>
        <ChevronLeft className="w-3.5 h-3.5" /> 返回
      </button>
      <div className="flex items-center gap-0.5 ml-2">
        {views.map(v => (
          <button key={v.id} onClick={() => setCurrentView(v.id)}>
            <v.icon className="w-3.5 h-3.5" /> {v.label}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <button onClick={openModelSettings}>
        <Bot className="w-3.5 h-3.5" />
        {activeModel ? activeModel.name : '未选择模型'}
        <Settings2 className="w-3 h-3" />
      </button>
    </div>
  )
}`,

  'src/app/components/designer/ModelSettings.tsx': `import { useState } from 'react'
import { useAppStore } from '../../stores/app-store'
import { X, Plus, Trash2, TestTube, Wifi, WifiOff } from 'lucide-react'

export function ModelSettings() {
  const { modelSettingsOpen, closeModelSettings,
          aiModels, activeModelId, activateAIModel,
          addAIModel, removeAIModel, updateAIModel } = useAppStore()

  if (!modelSettingsOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" 
           onClick={closeModelSettings} />
      <div className="relative w-[640px] max-h-[80vh] bg-[#15151f] 
                      border border-white/10 rounded-2xl">
        {/* Modal content: model list, add/edit/delete/test */}
      </div>
    </div>
  )
}`,

  'src/app/stores/app-store.ts': `import { create } from 'zustand'

export type ViewMode = 'code' | 'preview' | 'split'

export interface AIModel {
  id: string
  name: string
  provider: 'zhipu' | 'ollama' | 'custom'
  endpoint: string
  apiKey: string
  isActive: boolean
}

interface AppState {
  // Navigation
  currentView: ViewMode
  setCurrentView: (view: ViewMode) => void

  // AI Chat
  messages: ChatMessage[]
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void

  // AI Models (full CRUD)
  aiModels: AIModel[]
  activeModelId: string | null

  // File Tree
  selectedFile: string | null
  expandedFolders: Set<string>

  // Open Tabs
  openTabs: string[]
  openFileTab: (path: string) => void
  closeFileTab: (path: string) => void

  // File Contents (editable)
  fileContents: Record<string, FileContent>
  updateFileContent: (path: string, content: string) => void

  // Terminal
  terminalLines: string[]
  addTerminalLine: (l: string) => void
  clearTerminal: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // ... store implementation with localStorage persistence
}))`,

  'src/app/stores/theme-store.ts': `import { create } from 'zustand'

export interface ThemeConfig {
  name: string
  type: 'light' | 'dark'
  colors: Record<string, string>
  fonts: { sans: string; serif: string; mono: string }
  layout: { radius: string; shadow: string }
  branding: {
    logo: string
    slogan: string
    backgroundColor: string
  }
}

// 6 Preset themes using OKLch color space
const PRESET_THEMES: ThemeConfig[] = [
  { name: '基础色调', type: 'light', colors: { primary: 'oklch(0.55 0.22 264)' } },
  { name: '宇宙之夜', type: 'dark',  colors: { primary: 'oklch(0.65 0.22 264)' } },
  { name: '柔和流行', type: 'light', colors: { primary: 'oklch(0.70 0.18 320)' } },
  { name: '赛博朋克', type: 'dark',  colors: { primary: 'oklch(0.60 0.25 300)' } },
  { name: '现代极简', type: 'light', colors: { primary: 'oklch(0.30 0.00 0)' } },
  { name: '未来科技', type: 'dark',  colors: { primary: 'oklch(0.55 0.25 200)' } },
]

interface ThemeState {
  currentTheme: ThemeConfig
  presets: ThemeConfig[]
  applyTheme: (theme: ThemeConfig) => void
  // Version history (max 50)
  history: ThemeConfig[]
  undo: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: PRESET_THEMES[1], // 宇宙之夜 (dark)
  presets: PRESET_THEMES,
  applyTheme: (theme) => {
    set(s => ({
      currentTheme: theme,
      history: [...s.history.slice(-49), s.currentTheme],
    }))
    // Apply CSS variables to :root
    applyThemeCSSVariables(theme)
  },
  history: [],
  undo: () => set(s => {
    if (s.history.length === 0) return s
    const prev = s.history[s.history.length - 1]
    return {
      currentTheme: prev,
      history: s.history.slice(0, -1),
    }
  }),
}))

function applyThemeCSSVariables(theme: ThemeConfig) {
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(\`--color-\${key}\`, value)
  })
}`,

  'src/app/utils/logger.ts': `/**
 * YYC³ Global Logger System
 * Module-level colored output with memory buffer
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LogEntry {
  timestamp: Date
  level: LogLevel
  module: string
  message: string
  data?: unknown
}

const LOG_BUFFER: LogEntry[] = []
const MAX_BUFFER_SIZE = 500

const COLORS: Record<LogLevel, string> = {
  DEBUG: '#6366f1', // indigo
  INFO:  '#22c55e', // green
  WARN:  '#f59e0b', // amber
  ERROR: '#ef4444', // red
}

export function createLogger(module: string) {
  function log(level: LogLevel, message: string, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      module,
      message,
      data,
    }

    // Memory buffer (ring buffer)
    LOG_BUFFER.push(entry)
    if (LOG_BUFFER.length > MAX_BUFFER_SIZE) {
      LOG_BUFFER.shift()
    }

    // Console output with module color
    const color = COLORS[level]
    console.log(
      \`%c[\${module}] %c\${level}%c \${message}\`,
      \`color: \${color}; font-weight: bold\`,
      \`color: \${color}; background: \${color}22; padding: 1px 4px; border-radius: 3px\`,
      'color: inherit',
      data || ''
    )
  }

  return {
    debug: (msg: string, data?: unknown) => log('DEBUG', msg, data),
    info:  (msg: string, data?: unknown) => log('INFO', msg, data),
    warn:  (msg: string, data?: unknown) => log('WARN', msg, data),
    error: (msg: string, data?: unknown) => log('ERROR', msg, data),
  }
}

/** Export buffered logs as JSON */
export function exportLogs(): string {
  return JSON.stringify(LOG_BUFFER, null, 2)
}`,

  'src/styles/theme.css': `:root {
  /* === YYC³ Theme System (OKLch) === */

  /* Base Colors */
  --color-primary: oklch(0.55 0.22 264);
  --color-primary-foreground: oklch(0.98 0.01 264);
  --color-secondary: oklch(0.65 0.15 200);
  --color-accent: oklch(0.60 0.25 30);
  --color-background: oklch(0.98 0.01 264);
  --color-card: oklch(1.00 0.00 0);
  --color-border: oklch(0.85 0.02 264);

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-6: 24px;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.10);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.10);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.10);

  /* Font Families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 
               'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Fira Code', 'Courier New', monospace;
}`,

  'src/styles/index.css': `@import './theme.css';
@import './fonts.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,

  'package.json': `{
  "name": "@yyc3/family-ai",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.13.0",
    "react-resizable-panels": "^2.1.7",
    "zustand": "^5.0.11",
    "lucide-react": "^0.487.0",
    "motion": "^12.23.24",
    "recharts": "^2.15.2",
    "sonner": "^2.0.3",
    "tailwind-merge": "^3.2.0"
  }
}`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}`,

  'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: true,
  },
})`,
}