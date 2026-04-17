---
title: 贡献指南
description: YYC³ AI Code 开源项目贡献指南
author: YanYuCloudCube Team
version: 1.0.0
created: 2026-04-08
updated: 2026-04-08
license: MIT
tags: [contributing, open-source, community]
---

# 🤝 贡献指南

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

感谢您考虑为 YYC³ AI Code 做出贡献！我们欢迎所有形式的贡献，包括但不限于代码、文档、问题报告和功能建议。

---

## 📋 目录

- [行为准则](#行为准则)
- [我能做什么贡献？](#我能做什么贡献)
- [开发流程](#开发流程)
- [提交规范](#提交规范)
- [代码规范](#代码规范)
- [测试规范](#测试规范)
- [文档规范](#文档规范)
- [Pull Request 流程](#pull-request-流程)
- [问题报告](#问题报告)
- [功能建议](#功能建议)
- [社区支持](#社区支持)

---

## 🌟 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们作为贡献者和维护者承诺：无论年龄、体型、残疾、种族、性别认同和表达、经验水平、教育程度、社会经济地位、国籍、外貌、种族、宗教或性取向如何，参与我们的项目和社区都将为每个人提供无骚扰的体验。

### 我们的标准

**积极行为示例：**

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

**不可接受的行为示例：**

- 使用性化的语言或图像，以及不受欢迎的性关注或性骚扰
- 捣乱、侮辱/贬损评论以及人身或政治攻击
- 公开或私下的骚扰
- 未经明确许可，发布他人的私人信息，例如物理地址或电子地址
- 在专业环境中可能被合理认为不适当的其他行为

---

## 💡 我能做什么贡献？

### 🐛 报告 Bug

发现 Bug？请通过 [GitHub Issues](https://github.com/yanyucloudcube/yyc3-code-ai/issues) 提交问题报告。

**Bug 报告应包含：**

- 清晰的标题和描述
- 复现步骤
- 预期行为
- 实际行为
- 截图（如果适用）
- 环境信息（操作系统、浏览器、版本等）

### 💡 提出新功能

有好的想法？我们很乐意听取您的建议！

**功能建议应包含：**

- 功能描述
- 使用场景
- 预期效果
- 可能的实现方案（可选）

### 📝 改进文档

文档改进包括：

- 修正拼写或语法错误
- 添加缺失的文档
- 改进现有文档的清晰度
- 翻译文档

### 🔧 提交代码

我们欢迎代码贡献！请遵循以下流程：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 🔄 开发流程

### 环境准备

```bash
# 克隆仓库
git clone https://github.com/yanyucloudcube/yyc3-code-ai.git
cd yyc3-code-ai

# 安装依赖（推荐使用 pnpm）
pnpm install

# 启动开发服务器
pnpm dev
```

### 分支策略

- `main` - 主分支，保持稳定可发布状态
- `develop` - 开发分支，集成最新功能
- `feature/*` - 功能分支，开发新功能
- `bugfix/*` - 修复分支，修复 Bug
- `docs/*` - 文档分支，改进文档

### 开发步骤

1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **编写代码**
   - 遵循代码规范
   - 编写单元测试
   - 更新相关文档

3. **本地测试**
   ```bash
   # 运行测试
   pnpm test

   # 类型检查
   pnpm typecheck

   # 代码检查
   pnpm lint
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```

---

## 📝 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（Type）

| 类型 | 说明 | 示例 |
|:-----|:-----|:-----|
| `feat` | 新功能 | `feat: add user authentication` |
| `fix` | Bug 修复 | `fix: resolve login timeout issue` |
| `docs` | 文档更新 | `docs: update API documentation` |
| `style` | 代码格式（不影响功能） | `style: format code with prettier` |
| `refactor` | 重构（不添加功能或修复 Bug） | `refactor: optimize database queries` |
| `perf` | 性能优化 | `perf: improve rendering performance` |
| `test` | 添加或修改测试 | `test: add unit tests for auth module` |
| `chore` | 构建过程或辅助工具的变动 | `chore: update dependencies` |
| `ci` | CI/CD 配置变更 | `ci: add GitHub Actions workflow` |
| `revert` | 回退之前的提交 | `revert: revert commit abc123` |

### 范围（Scope）

可选的范围用于指定提交影响的模块：

- `core` - 核心功能
- `ui` - 用户界面
- `api` - API 相关
- `db` - 数据库
- `auth` - 认证授权
- `i18n` - 国际化

### 示例

```bash
# 新功能
feat(auth): add OAuth2 authentication support

# Bug 修复
fix(ui): resolve button alignment issue on mobile devices

# 文档更新
docs(api): add authentication endpoint documentation

# 性能优化
perf(core): optimize state management with useMemo
```

---

## 📏 代码规范

### TypeScript 规范

```typescript
// ✅ 推荐：使用接口定义类型
interface User {
  id: string
  name: string
  email: string
}

// ✅ 推荐：使用类型别名定义联合类型
type Status = 'pending' | 'active' | 'inactive'

// ✅ 推荐：使用可选链和空值合并
const userName = user?.profile?.name ?? 'Anonymous'

// ✅ 推荐：使用 const 断言
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
} as const

// ❌ 避免：使用 any 类型
const data: any = fetchData() // 不推荐

// ✅ 推荐：使用具体类型或泛型
const data: UserData = fetchData()
```

### React 规范

```tsx
// ✅ 推荐：使用函数组件和 Hooks
import { useState, useCallback } from 'react'

interface ButtonProps {
  label: string
  onClick: () => void
}

export function Button({ label, onClick }: ButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = useCallback(async () => {
    setIsLoading(true)
    try {
      await onClick()
    } finally {
      setIsLoading(false)
    }
  }, [onClick])

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Loading...' : label}
    </button>
  )
}

// ✅ 推荐：使用 memo 优化性能
import { memo } from 'react'

export const ExpensiveComponent = memo(({ data }: Props) => {
  return <div>{/* 复杂渲染逻辑 */}</div>
})
```

### 文件命名规范

```
组件文件：PascalCase.tsx（如：UserProfile.tsx）
工具函数：camelCase.ts（如：formatDate.ts）
类型定义：camelCase.ts（如：userTypes.ts）
样式文件：kebab-case.css（如：user-profile.css）
测试文件：*.test.ts 或 *.spec.ts
```

### ESLint 和 Prettier

项目已配置 ESLint 和 Prettier，请在提交前运行：

```bash
# 代码检查
pnpm lint

# 自动修复
pnpm lint --fix
```

---

## 🧪 测试规范

### 单元测试

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('should render with correct label', () => {
    render(<Button label="Click me" onClick={() => {}} />)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button label="Click me" onClick={handleClick} />)
    
    screen.getByText('Click me').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when loading', () => {
    render(<Button label="Click me" onClick={() => {}} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### 测试覆盖率

我们期望测试覆盖率达到：

- 语句覆盖率：≥ 80%
- 分支覆盖率：≥ 75%
- 函数覆盖率：≥ 80%
- 行覆盖率：≥ 80%

运行覆盖率报告：

```bash
pnpm test:coverage
```

### E2E 测试

```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  
  await page.fill('input[name="email"]', 'user@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
})
```

---

## 📚 文档规范

### Markdown 规范

所有文档应包含：

1. **YAML Front Matter**
   ```markdown
   ---
   title: 文档标题
   description: 文档描述
   author: 作者名称
   version: 1.0.0
   created: 2026-04-08
   updated: 2026-04-08
   license: MIT
   tags: [tag1, tag2, tag3]
   ---
   ```

2. **目录结构**
   ```markdown
   # 标题

   ## 目录
   - [章节1](#章节1)
   - [章节2](#章节2)

   ## 章节1
   内容...

   ## 章节2
   内容...
   ```

3. **代码示例**
   - 提供完整的、可运行的代码示例
   - 添加必要的注释
   - 说明代码的作用和注意事项

### 注释规范

```typescript
/**
 * 格式化日期
 * @param date - 日期对象或时间戳
 * @param format - 格式字符串（默认：'YYYY-MM-DD'）
 * @returns 格式化后的日期字符串
 * @example
 * ```typescript
 * formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
 * // 返回：'2026-04-08 12:30:45'
 * ```
 */
export function formatDate(
  date: Date | number,
  format: string = 'YYYY-MM-DD'
): string {
  // 实现代码...
}
```

---

## 🔀 Pull Request 流程

### PR 检查清单

在提交 PR 前，请确保：

- [ ] 代码通过所有测试 (`pnpm test`)
- [ ] 代码通过类型检查 (`pnpm typecheck`)
- [ ] 代码通过 ESLint 检查 (`pnpm lint`)
- [ ] 更新了相关文档
- [ ] 添加了必要的测试
- [ ] 遵循了代码规范
- [ ] 提交信息符合规范

### PR 标题格式

```
<type>(<scope>): <subject>
```

示例：
- `feat(auth): add OAuth2 authentication`
- `fix(ui): resolve button alignment issue`
- `docs(api): update authentication documentation`

### PR 描述模板

```markdown
## 变更类型
- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试相关 (test)
- [ ] 其他 (chore)

## 变更说明
简要描述本次变更的内容和原因。

## 相关 Issue
关闭 #issue_number

## 测试说明
描述如何测试本次变更。

## 截图
如果有 UI 变更，请提供截图。

## 其他说明
其他需要说明的内容。
```

### 审核流程

1. **自动检查**
   - CI/CD 自动运行测试
   - 代码质量检查
   - 构建验证

2. **代码审核**
   - 至少需要 1 位审核者批准
   - 解决所有审核意见

3. **合并**
   - 使用 Squash and Merge
   - 确保提交信息规范

---

## 🐛 问题报告

### 报告模板

```markdown
## Bug 描述
清晰简洁地描述这个 Bug。

## 复现步骤
1. 进入 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

## 预期行为
描述你期望发生的事情。

## 实际行为
描述实际发生的事情。

## 截图
如果适用，添加截图帮助解释问题。

## 环境信息
- 操作系统：[如：macOS 14.0]
- 浏览器：[如：Chrome 120.0]
- 项目版本：[如：v0.0.1]

## 其他说明
添加任何其他有助于理解问题的信息。
```

---

## 💡 功能建议

### 建议模板

```markdown
## 功能描述
清晰简洁地描述你希望添加的功能。

## 使用场景
描述这个功能的使用场景和价值。

## 预期效果
描述这个功能的预期行为。

## 可能的实现方案
如果有的话，描述可能的实现方案。

## 其他说明
添加任何其他相关信息或截图。
```

---

## 👥 社区支持

### 获取帮助

- 📖 [文档](./docs/)
- 💬 [GitHub Discussions](https://github.com/yanyucloudcube/yyc3-code-ai/discussions)
- 🐛 [问题追踪](https://github.com/yanyucloudcube/yyc3-code-ai/issues)

### 联系方式

- 项目主页：https://github.com/yanyucloudcube/yyc3-code-ai
- 邮箱：yanyucloudcube@example.com

---

## 📄 许可证

通过向本项目贡献代码，您同意您的贡献将根据 [MIT 许可证](LICENSE) 进行许可。

---

<div align="center">

**感谢您的贡献！🎉**

让智能协同极致信任，使人机共进成为和谐

*智亦师亦友亦伯乐，谱一言一语一华章*

</div>
