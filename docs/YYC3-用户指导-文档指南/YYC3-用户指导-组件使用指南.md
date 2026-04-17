---
file: YYC3-用户指导-组件使用指南.md
description: YYC³ AI Code 组件使用指南 - 基础组件、业务组件、协作组件、主题组件的使用说明和示例
author: YanYuCloudCube Team
version: v3.0.0
created: 2026-03-26
updated: 2026-04-10
status: published
tags: [组件使用],[UI组件],[React组件],[组件库]
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ AI 组件使用指南

## 核心理念

**五高架构**：高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**：标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**：流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**：时间维 | 空间维 | 属性维 | 事件维 | 关联维

---

## 📖 目录

- [基础组件](#基础组件)
- [业务组件](#业务组件)
- [协作组件](#协作组件)
- [主题组件](#主题组件)

---

## 🧩 基础组件

### Button

按钮组件。

#### Props

```typescript
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}
```

#### 使用示例

```typescript
import { Button } from '@/app/components/ui/Button'

function MyComponent() {
  return (
    <div>
      <Button variant="primary" onClick={() => console.log('Clicked')}>
        Primary Button
      </Button>
      <Button variant="secondary" size="large">
        Secondary Button
      </Button>
      <Button disabled>Disabled Button</Button>
    </div>
  )
}
```

---

### Input

输入框组件。

#### Props

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  value?: string
  disabled?: boolean
  error?: string
  onChange?: (value: string) => void
}
```

#### 使用示例

```typescript
import { Input } from '@/app/components/ui/Input'

function MyComponent() {
  const [value, setValue] = useState('')

  return (
    <Input
      type="text"
      placeholder="Enter your name"
      value={value}
      onChange={setValue}
    />
  )
}
```

---

### Card

卡片组件。

#### Props

```typescript
interface CardProps {
  children: React.ReactNode
  title?: string
  footer?: React.ReactNode
}
```

#### 使用示例

```typescript
import { Card } from '@/app/components/ui/Card'

function MyComponent() {
  return (
    <Card
      title="Card Title"
      footer={<Button>Action</Button>}
    >
      <p>Card content goes here.</p>
    </Card>
  )
}
```

---

## 🏢 业务组件

### HomePage

首页组件，展示品牌标识、AI 聊天框、项目快速访问等。

#### Props

```typescript
interface HomePageProps {
  // 路由导航
  navigate?: (path: string) => void
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
  settings?: SettingsConfig
  
  // 事件处理
  onSettingsChange?: (settings: Partial<SettingsConfig>) => void
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

## 🤝 协作组件

### CollaborativeEditor

协作编辑器组件，基于 Yjs CRDT 实现。

#### Props

```typescript
interface CollaborativeEditorProps {
  // 文档 ID
  docId: string
  
  // 初始内容
  initialContent?: string
  
  // 是否只读
  readOnly?: boolean
  
  // 事件处理
  onChange?: (content: string) => void
  onSave?: (content: string) => void
}
```

#### 使用示例

```typescript
import { CollaborativeEditor } from '@/app/components/collaboration/CollaborativeEditor'

function MyComponent() {
  const [content, setContent] = useState('')

  return (
    <CollaborativeEditor
      docId="my-document"
      initialContent="Initial content"
      onChange={setContent}
      onSave={(newContent) => console.log('Saved:', newContent)}
    />
  )
}
```

---

### UserList

在线用户列表组件。

#### Props

```typescript
interface UserListProps {
  // 用户列表
  users: UserInfo[]
  
  // 当前用户
  currentUser?: UserInfo
}
```

#### 使用示例

```typescript
import { UserList } from '@/app/components/collaboration/UserList'

function MyComponent() {
  const users = [
    { id: 1, name: 'Alice', status: 'online' },
    { id: 2, name: 'Bob', status: 'offline' },
  ]

  return <UserList users={users} currentUser={users[0]} />
}
```

---

## 🎨 主题组件

### ThemeCustomizer

主题自定义器组件。

#### Props

```typescript
interface ThemeCustomizerProps {
  // 当前主题
  currentTheme: ThemeConfig
  
  // 事件处理
  onThemeChange: (theme: Partial<ThemeConfig>) => void
  onClose?: () => void
}
```

#### 使用示例

```typescript
import { ThemeCustomizer } from '@/app/components/theme/ThemeCustomizer'

function MyComponent() {
  const [theme, setTheme] = useState(defaultTheme)

  return (
    <ThemeCustomizer
      currentTheme={theme}
      onThemeChange={setTheme}
      onClose={() => console.log('Closed')}
    />
  )
}
```

---

## 📚 更多资源

- [API 参考文档](./API参考文档.md)
- [开发者快速上手指南](./开发者快速上手指南.md)
- [开发最佳实践](./开发最佳实践.md)
- [故障排查手册](./故障排查手册.md)

---

**文档维护者**：CodeBuddy AI Assistant
**最后更新**：2026-04-10

---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v3.0.0 |
| 创建日期 | 2026-03-26 |
| 更新日期 | 2026-04-10 |
| 内容校验 | SHA256:自动生成 |
| 追溯ID | DOC-COMPONENT-GUIDE-001 |
| 关联文档 | [API参考文档](./YYC3-用户指导-API参考文档.md) \| [开发最佳实践](./YYC3-用户指导-开发最佳实践.md) |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
