---
file: YYC3-用户指导-API参考文档.md
description: YYC³ AI Code API 参考文档 - Store API、服务 API、组件 API、Hook API、工具函数 API、类型定义
author: YanYuCloudCube Team
version: v3.0.0
created: 2026-03-26
updated: 2026-04-10
status: published
tags: [API参考],[接口文档],[Store],[Service],[Component]
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ AI API 参考文档

## 核心理念

**五高架构**：高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**：标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**：流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**：时间维 | 空间维 | 属性维 | 事件维 | 关联维

---

## 📖 目录

- [Store API](#store-api)
- [服务 API](#服务-api)
- [组件 API](#组件-api)
- [Hook API](#hook-api)
- [工具函数 API](#工具函数-api)
- [类型定义](#类型定义)

---

## 🏪 Store API

### App Store

应用全局状态管理，管理项目、消息、AI 模型等。

#### State

```typescript
interface AppState {
  // 项目管理
  projects: ProjectItem[]
  activeProjectId: string | null
  
  // 消息管理
  messages: MessageItem[]
  
  // AI 模型管理
  aiModels: AIModel[]
  activeModelId: string | null
  
  // UI 状态
  isLoading: boolean
  error: string | null
}
```

#### Actions

```typescript
// 项目操作
addProject(project: Partial<ProjectItem>): void
updateProject(id: string, updates: Partial<ProjectItem>): void
deleteProject(id: string): void
archiveProject(id: string): void
renameProject(id: string, newName: string): void
setActiveProject(id: string): void

// 消息操作
addMessage(message: Partial<MessageItem>): void
updateMessage(id: string, updates: Partial<MessageItem>): void
deleteMessage(id: string): void
clearMessages(): void

// AI 模型操作
addModel(model: Partial<AIModel>): void
updateModel(id: string, updates: Partial<AIModel>): void
deleteModel(id: string): void
setActiveModel(id: string): void
openModelSettings(): void

// UI 操作
setLoading(loading: boolean): void
setError(error: string | null): void
clearError(): void
```

#### 使用示例

```typescript
import { useAppStore } from '@/app/stores/app-store'

function MyComponent() {
  const {
    projects,
    activeProjectId,
    addProject,
    deleteProject,
  } = useAppStore()

  const handleAddProject = () => {
    addProject({
      id: crypto.randomUUID(),
      name: 'New Project',
      status: 'active',
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.name}</h3>
          <button onClick={() => deleteProject(project.id)}>
            Delete
          </button>
        </div>
      ))}
      <button onClick={handleAddProject}>Add Project</button>
    </div>
  )
}
```

---

### Theme Store

主题状态管理，管理主题、颜色、字体等。

#### State

```typescript
interface ThemeState {
  currentTheme: ThemeConfig
  availableThemes: ThemeConfig[]
  
  // 主题配置
  branding: BrandingConfig
  glass: GlassConfig
  typography: TypographyConfig
  
  // 自定义主题
  customThemes: ThemeConfig[]
}
```

#### Actions

```typescript
// 主题操作
setTheme(themeName: string): void
setThemeConfig(config: Partial<ThemeConfig>): void
addCustomTheme(theme: ThemeConfig): void
removeCustomTheme(themeName: string): void

// 品牌配置
setBranding(config: Partial<BrandingConfig>): void
setLogoUrl(url: string): void
setAppName(name: string): void
setSlogan(primary: string, secondary?: string): void

// Glass 效果
setGlassConfig(config: Partial<GlassConfig>): void
setGlassEnabled(enabled: boolean): void
setGlassBlur(blur: number): void

// 排版配置
setTypography(config: Partial<TypographyConfig>): void
setFontFamily(fontFamily: string): void
setFontSize(fontSize: number): void

// 自定义器
openCustomizer(): void
closeCustomizer(): void
}
```

#### 使用示例

```typescript
import { useThemeStore } from '@/app/stores/theme-store'

function MyComponent() {
  const { currentTheme, setTheme, setGlassEnabled } = useThemeStore()

  const handleToggleDarkTheme = () => {
    setTheme('dark')
  }

  const handleToggleGlass = () => {
    setGlassEnabled(!currentTheme.glass.enabled)
  }

  return (
    <div>
      <h1>Current Theme: {currentTheme.name}</h1>
      <button onClick={handleToggleDarkTheme}>
        Toggle Dark Theme
      </button>
      <button onClick={handleToggleGlass}>
        Toggle Glass Effect
      </button>
    </div>
  )
}
```

---

### Settings Store

设置状态管理，管理用户设置、偏好等。

#### State

```typescript
interface SettingsState {
  // 通用设置
  autoSave: boolean
  autoSaveInterval: number
  showNotifications: boolean
  
  // 编辑器设置
  fontSize: number
  tabSize: number
  wordWrap: boolean
  
  // AI 设置
  defaultAIModel: string
  maxTokens: number
  temperature: number
  
  // 协作设置
  enableCollaboration: boolean
  autoSync: boolean
  
  // 语言设置
  language: string
  dateFormat: string
}
```

#### Actions

```typescript
// 通用设置
setAutoSave(enabled: boolean): void
setAutoSaveInterval(interval: number): void
setShowNotifications(enabled: boolean): void

// 编辑器设置
setFontSize(size: number): void
setTabSize(size: number): void
setWordWrap(enabled: boolean): void

// AI 设置
setDefaultAIModel(model: string): void
setMaxTokens(tokens: number): void
setTemperature(temperature: number): void

// 协作设置
setEnableCollaboration(enabled: boolean): void
setAutoSync(enabled: boolean): void

// 语言设置
setLanguage(language: string): void
setDateFormat(format: string): void

// 重置设置
resetSettings(): void
resetCategory(category: string): void
```

#### 使用示例

```typescript
import { useSettingsStore } from '@/app/stores/settings-store'

function MyComponent() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()

  const handleToggleAutoSave = () => {
    updateSettings({ autoSave: !settings.autoSave })
  }

  const handleReset = () => {
    resetSettings()
  }

  return (
    <div>
      <h1>Settings</h1>
      <label>
        <input
          type="checkbox"
          checked={settings.autoSave}
          onChange={handleToggleAutoSave}
        />
        Auto Save
      </label>
      <button onClick={handleReset}>Reset All Settings</button>
    </div>
  )
}
```

---

### AI Service Store

AI 服务状态管理，管理 AI 模型、聊天、响应等。

#### State

```typescript
interface AIServiceState {
  // AI 提供商
  providers: AIProvider[]
  activeProvider: string
  
  // 聊天状态
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  
  // 模型配置
  models: AIModel[]
  activeModel: string
  
  // 使用统计
  usageStats: UsageStats
}
```

#### Actions

```typescript
// 提供商操作
setProvider(provider: string): void
addProvider(provider: AIProvider): void
removeProvider(providerId: string): void

// 聊天操作
sendMessage(message: string): Promise<void>
addMessage(message: ChatMessage): void
clearMessages(): void

// 模型操作
setModel(model: string): void
setModelConfig(modelId: string, config: any): void

// 流式响应
streamMessage(message: string): AsyncGenerator<ChatMessage, void, unknown>

// 错误处理
setError(error: string | null): void
clearError(): void
```

#### 使用示例

```typescript
import { useAIServiceStore } from '@/app/stores/ai-service-store'

function ChatComponent() {
  const { messages, isLoading, sendMessage } = useAIServiceStore()
  const [input, setInput] = useState('')

  const handleSend = async () => {
    await sendMessage(input)
    setInput('')
  }

  return (
    <div>
      <ul>
        {messages.map(msg => (
          <li key={msg.id}>{msg.content}</li>
        ))}
      </ul>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={handleSend} disabled={isLoading}>
        Send
      </button>
    </div>
  )
}
```

---

## 🛠️ 服务 API

### AI Service

AI 服务，提供统一的 AI 模型调用接口。

#### 方法

```typescript
class AIService {
  // 初始化
  constructor(options: AIServiceOptions)
  
  // 聊天完成
  async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>
  
  // 流式聊天
  async *chatCompletionStream(params: ChatCompletionParams): AsyncGenerator<ChatCompletionChunk>
  
  // 嵌入生成
  async createEmbedding(params: EmbeddingParams): Promise<EmbeddingResponse>
  
  // 图像生成
  async createImage(params: ImageGenerationParams): Promise<ImageGenerationResponse>
  
  // 模型列表
  async listModels(): Promise<Model[]>
  
  // 使用统计
  getUsageStats(): UsageStats
  
  // 缓存管理
  clearCache(): void
  setCacheEnabled(enabled: boolean): void
}
```

#### 使用示例

```typescript
import { AIService } from '@/app/services/ai-service'

const aiService = new AIService({
  openaiApiKey: process.env.VITE_OPENAI_API_KEY,
  anthropicApiKey: process.env.VITE_ANTHROPIC_API_KEY,
})

// 聊天完成
const response = await aiService.chatCompletion({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello!' },
  ],
})

console.log(response.choices[0].message.content)

// 流式聊天
for await (const chunk of aiService.chatCompletionStream({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Tell me a story' }],
})) {
  console.log(chunk.choices[0].delta.content)
}
```

---

### Yjs Service

Yjs 协作服务，提供 CRDT 实时协作功能。

#### 方法

```typescript
class YjsService {
  // 初始化
  constructor(options: YjsServiceOptions)
  
  // 文档操作
  getDoc(): Y.Doc
  getText(name: string): Y.Text
  getArray(name: string): Y.Array<any>
  getMap(name: string): Y.Map<any>
  
  // 连接管理
  connect(): void
  disconnect(): void
  isConnected(): boolean
  
  // 感知管理
  getAwareness(): Awareness
  setLocalStateField(field: string, value: any): void
  getLocalState(): any
  getStates(): Map<number, any>
  
  // 持久化
  saveToIndexedDB(docName: string): Promise<void>
  loadFromIndexedDB(docName: string): Promise<void>
  
  // 事件监听
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
}
```

#### 使用示例

```typescript
import { YjsService } from '@/app/services/yjs/yjs-service'

const yjsService = new YjsService({
  docId: 'my-document',
  wsUrl: 'ws://localhost:1234',
})

// 获取文档
const doc = yjsService.getDoc()
const ytext = yjsService.getText('content')

// 设置内容
ytext.insert(0, 'Hello, World!')

// 监听变化
ytext.observe((event) => {
  console.log('Content changed:', ytext.toString())
})

// 连接到服务器
yjsService.connect()
```

---

## 🧩 组件 API

### HomePage

首页组件，展示品牌标识、AI 聊天框、项目快速访问等。

#### Props

```typescript
interface HomePageProps {
  // 路由导航
  navigate: (path: string) => void
  
  // 主题配置
  branding: BrandingConfig
  glass: GlassConfig
  isDarkMode: boolean
  
  // 事件处理
  onThemeToggle: () => void
  onShortcutsClick: () => void
  onNotificationsClick: () => void
}
```

#### 使用示例

```typescript
import { HomePage } from '@/app/components/HomePage'

function App() {
  return <HomePage />
}
```

---

### BrandHeader

品牌头部组件，展示 Logo、标题、主题切换等。

#### Props

```typescript
interface BrandHeaderProps {
  // 品牌配置
  branding: BrandingConfig
  glass: GlassConfig
  
  // 主题
  isDarkMode: boolean
  
  // 事件处理
  onThemeToggle: () => void
  onShortcutsClick: () => void
  onNotificationsClick: () => void
}
```

#### 使用示例

```typescript
import { BrandHeader } from '@/app/components/home/BrandHeader'

function MyPage() {
  return (
    <BrandHeader
      branding={brandingConfig}
      glass={glassConfig}
      isDarkMode={true}
      onThemeToggle={() => {}}
      onShortcutsClick={() => {}}
      onNotificationsClick={() => {}}
    />
  )
}
```

---

### SettingsPage

设置页面，提供完整的设置界面。

#### Props

```typescript
interface SettingsPageProps {
  // 设置
  settings: SettingsConfig
  
  // 事件处理
  onSettingsChange: (settings: Partial<SettingsConfig>) => void
}
```

#### 使用示例

```typescript
import { SettingsPage } from '@/app/components/SettingsPage'

function App() {
  const [settings, setSettings] = useState(defaultSettings)

  return (
    <SettingsPage
      settings={settings}
      onSettingsChange={setSettings}
    />
  )
}
```

---

## 🪝 Hook API

### useCollaboration

协作 Hook，提供 CRDT 协作功能。

#### 返回值

```typescript
interface UseCollaborationReturn {
  // 文档状态
  isConnected: boolean
  isSynced: boolean
  
  // 感知信息
  onlineUsers: UserInfo[]
  localUser: UserInfo
  
  // 文档操作
  getText: (name: string) => Y.Text
  getArray: (name: string) => Y.Array<any>
  getMap: (name: string) => Y.Map<any>
  
  // 事件
  onTextChange: (name: string, callback: (text: Y.Text) => void) => () => void
  onUserJoin: (callback: (user: UserInfo) => void) => () => void
  onUserLeave: (callback: (userId: number) => void) => () => void
}
```

#### 使用示例

```typescript
import { useCollaboration } from '@/app/hooks/useCollaboration'

function MyComponent() {
  const { isConnected, getText, onTextChange } = useCollaboration()

  const ytext = getText('content')

  useEffect(() => {
    const unsubscribe = onTextChange('content', (text) => {
      console.log('Content changed:', text.toString())
    })

    return unsubscribe
  }, [onTextChange])

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <textarea value={ytext.toString()} onChange={(e) => {
        ytext.delete(0, ytext.length)
        ytext.insert(0, e.target.value)
      }} />
    </div>
  )
}
```

---

### useLiquidGlass

液态玻璃效果 Hook，提供现代化 UI 效果。

#### 返回值

```typescript
interface UseLiquidGlassReturn {
  // 主题信息
  isLG: boolean
  isXL: boolean
  
  // 样式类名
  brandGradientClass: string
  logoGlow: string
  logoGlowLg: string
  focusGlowClass: string
  sendBtnClass: string
  cardLiftClass: string
  shimmerClass: string
  
  // 颜色
  aiIconColor: string
  accentColor: string
}
```

#### 使用示例

```typescript
import { useLiquidGlass } from '@/app/utils/liquid-glass'

function MyComponent() {
  const { brandGradientClass, focusGlowClass, aiIconColor } = useLiquidGlass()

  return (
    <div className={`p-4 ${focusGlowClass}`}>
      <h1 className={brandGradientClass}>YYC³ AI</h1>
      <div style={{ color: aiIconColor }}>
        AI Powered
      </div>
    </div>
  )
}
```

---

## 🔧 工具函数 API

### createLogger

创建日志记录器。

#### 签名

```typescript
function createLogger(name: string): Logger
```

#### 返回值

```typescript
interface Logger {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}
```

#### 使用示例

```typescript
import { createLogger } from '@/app/utils/logger'

const log = createLogger('MyComponent')

log.debug('Debug message')
log.info('Info message')
log.warn('Warning message')
log.error('Error message')
```

---

### formatFileSize

格式化文件大小。

#### 签名

```typescript
function formatFileSize(bytes: number): string
```

#### 使用示例

```typescript
import { formatFileSize } from '@/app/utils/format'

const size = formatFileSize(1024 * 1024) // "1 MB"
```

---

### debounce

防抖函数。

#### 签名

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void
```

#### 使用示例

```typescript
import { debounce } from '@/app/utils/debounce'

const handleSearch = debounce((query: string) => {
  console.log('Searching:', query)
}, 300)

handleSearch('hello')
handleSearch('hello world') // 只有这个会执行
```

---

### throttle

节流函数。

#### 签名

```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void
```

#### 使用示例

```typescript
import { throttle } from '@/app/utils/throttle'

const handleScroll = throttle(() => {
  console.log('Scrolling...')
}, 100)

window.addEventListener('scroll', handleScroll)
```

---

## 📋 类型定义

### ProjectItem

项目项类型。

```typescript
interface ProjectItem {
  id: string
  name: string
  description?: string
  status: 'active' | 'draft' | 'archived'
  createdAt: string
  updatedAt: string
  thumbnail?: string
}
```

### MessageItem

消息项类型。

```typescript
interface MessageItem {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: Record<string, any>
}
```

### AIModel

AI 模型类型。

```typescript
interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'local'
  type: 'chat' | 'completion' | 'embedding'
  capabilities: string[]
  maxTokens: number
  costPer1kTokens: number
}
```

### BrandingConfig

品牌配置类型。

```typescript
interface BrandingConfig {
  logoUrl: string
  logoSize: number
  logoRadius: number
  logoOpacity: number
  sloganPrimary: string
  sloganSecondary: string
  appName: string
  titleTemplate: string
  backgroundType: 'solid' | 'gradient' | 'image'
  backgroundColor: string
  backgroundGradient: string
  backgroundImage: string
  backgroundBlur: number
  backgroundOpacity: number
}
```

### GlassConfig

玻璃效果配置类型。

```typescript
interface GlassConfig {
  enabled: boolean
  blur: number
  opacity: number
  borderOpacity: number
  saturation: number
  tint: string
}
```

---

## 📚 更多资源

- [开发者快速上手指南](./开发者快速上手指南.md)
- [组件使用指南](./组件使用指南.md)
- [开发最佳实践](./开发最佳实践.md)
- [故障排查手册](./故障排查手册.md)
- [全局审核报告](./全局审核报告-2026-03-26.md)

---

**文档维护者**：CodeBuddy AI Assistant
**最后更新**：2026-04-10
**反馈渠道**：GitHub Issues

---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v3.0.0 |
| 创建日期 | 2026-03-26 |
| 更新日期 | 2026-04-10 |
| 内容校验 | SHA256:自动生成 |
| 追溯ID | DOC-API-REFERENCE-001 |
| 关联文档 | [快速上手指南](./YYC3-用户指导-快速上手指南.md) \| [组件使用指南](./YYC3-用户指导-组件使用指南.md) |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
