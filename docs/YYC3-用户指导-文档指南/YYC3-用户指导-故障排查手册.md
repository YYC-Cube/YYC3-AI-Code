---
file: YYC3-用户指导-故障排查手册.md
description: YYC³ AI Code 故障排查手册 - 常见问题诊断、构建问题、开发服务器问题、测试问题、性能问题等解决方案
author: YanYuCloudCube Team
version: v3.0.0
created: 2026-03-26
updated: 2026-04-10
status: published
tags: [故障排查],[问题诊断],[调试技巧],[常见问题]
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ AI 故障排查手册

## 核心理念

**五高架构**：高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**：标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**：流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**：时间维 | 空间维 | 属性维 | 事件维 | 关联维

---

## 📖 目录

- [常见问题](#常见问题)
- [构建问题](#构建问题)
- [开发服务器问题](#开发服务器问题)
- [测试问题](#测试问题)
- [性能问题](#性能问题)
- [协作问题](#协作问题)
- [AI 服务问题](#ai-服务问题)
- [样式问题](#样式问题)
- [调试技巧](#调试技巧)

---

## ❓ 常见问题

### Q1: 项目无法启动

**症状**：运行 `pnpm dev` 时报错

**可能原因**：
- 依赖未正确安装
- 端口被占用
- Node.js 版本不兼容

**解决方案**：
```bash
# 1. 检查 Node.js 版本
node --version  # 应该是 v20.0.0 或更高

# 2. 清除缓存并重新安装
rm -rf node_modules .vite dist
pnpm install

# 3. 检查端口占用
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# 4. 更换端口
pnpm dev -- --port 3000
```

---

### Q2: 依赖安装失败

**症状**：运行 `pnpm install` 时报错

**可能原因**：
- pnpm 版本过旧
- 网络问题
- 缓存损坏

**解决方案**：
```bash
# 1. 更新 pnpm
npm install -g pnpm@latest

# 2. 清除 pnpm 缓存
pnpm store prune

# 3. 使用国内镜像
pnpm config set registry https://registry.npmmirror.com

# 4. 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 🔨 构建问题

### 构建失败

**症状**：运行 `pnpm build` 时报错

**解决方案**：
```bash
# 1. 检查 TypeScript 错误
npx tsc --noEmit

# 2. 清除缓存
rm -rf dist .vite

# 3. 重新构建
pnpm build

# 4. 查看详细错误信息
pnpm build --debug
```

### 构建速度慢

**症状**：构建时间超过 30 秒

**解决方案**：
```bash
# 1. 清除缓存
rm -rf node_modules/.vite

# 2. 增加并行构建
pnpm build -- --mode production

# 3. 使用增量构建
# vite.config.ts
export default defineConfig({
  build: {
    sourcemap: false,  // 关闭 source map
    minify: 'terser',  // 使用 terser 压缩
  },
})
```

---

## 🚀 开发服务器问题

### 热更新不工作

**症状**：修改代码后页面不自动更新

**解决方案**：
```bash
# 1. 重启开发服务器
# Ctrl+C 停止服务器
pnpm dev

# 2. 清除 Vite 缓存
rm -rf node_modules/.vite
pnpm dev

# 3. 检查文件监听限制
# macOS/Linux
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 页面空白

**症状**：访问 `http://localhost:5173` 显示空白页面

**解决方案**：
```bash
# 1. 检查控制台错误
# 打开 Chrome DevTools (F12) 查看 Console 面板

# 2. 检查网络请求
# 打开 Network 面板，查看是否有加载失败的资源

# 3. 检查入口文件
cat src/main.tsx

# 4. 重新启动开发服务器
pnpm dev
```

---

## 🧪 测试问题

### 测试失败

**症状**：运行 `pnpm test` 时测试失败

**解决方案**：
```bash
# 1. 查看详细错误信息
pnpm test --reporter=verbose

# 2. 运行单个测试文件
pnpm test tests/unit/components/MyComponent.test.tsx

# 3. 清除测试缓存
pnpm test --clearCache

# 4. 调试测试
pnpm test --inspect-brk --inspect
```

### 测试超时

**症状**：测试运行超时

**解决方案**：
```typescript
// 增加测试超时时间
it('应该完成操作', { timeout: 10000 }, async () => {
  // 测试代码
})

// 或全局配置
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
```

---

## ⚡ 性能问题

### 首屏加载慢

**症状**：首次访问页面加载时间超过 3 秒

**解决方案**：
```typescript
// 1. 代码分割
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  )
}

// 2. 预加载关键资源
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" />

// 3. 使用 CDN
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
```

### 页面卡顿

**症状**：滚动或交互时页面卡顿

**解决方案**：
```typescript
// 1. 使用 React.memo
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // 昂贵的渲染逻辑
  return <div>{/* ... */}</div>
})

// 2. 虚拟化长列表
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualList({ items }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })
  // ...
}

// 3. 使用 Web Workers
const worker = new Worker(new URL('./worker.ts', import.meta.url))
worker.postMessage({ data: heavyData })
```

---

## 🤝 协作问题

### 协作功能不工作

**症状**：Yjs 协作功能不工作

**解决方案**：
```bash
# 1. 检查 WebSocket 服务器
pnpm ws-server

# 2. 检查环境变量
cat .env | grep WS_URL

# 3. 检查网络连接
ping localhost
ping ws://localhost:1234

# 4. 查看浏览器控制台
# 打开 Chrome DevTools → Network → WS
# 查看 WebSocket 连接状态
```

### 数据不同步

**症状**：多用户编辑时数据不同步

**解决方案**：
```typescript
// 1. 检查 Yjs 文档状态
import * as Y from 'yjs'

const doc = new Y.Doc()
const ytext = doc.getText('content')

// 监听变化
ytext.observe((event) => {
  console.log('Content changed:', ytext.toString())
})

// 2. 检查 WebSocket 连接
const wsProvider = new WebsocketProvider('ws://localhost:1234', 'doc-id', doc)

wsProvider.on('status', (event) => {
  console.log('Connection status:', event.status)
})

// 3. 重启连接
wsProvider.disconnect()
wsProvider.connect()
```

---

## 🤖 AI 服务问题

### AI 服务不响应

**症状**：AI 服务调用失败

**解决方案**：
```bash
# 1. 检查 API 密钥
cat .env | grep API_KEY

# 2. 检查网络连接
ping api.openai.com
ping api.anthropic.com

# 3. 查看错误日志
console.error(error)

# 4. 检查 API 配额
# 登录 OpenAI/Anthropic 控制台查看使用情况
```

### AI 响应慢

**症状**：AI 响应时间超过 10 秒

**解决方案**：
```typescript
// 1. 减少请求大小
const response = await aiService.chatCompletion({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Short prompt' },
  ],
  max_tokens: 100,  // 减少最大 token 数
})

// 2. 使用流式响应
for await (const chunk of aiService.chatCompletionStream(params)) {
  console.log(chunk.choices[0].delta.content)
}

// 3. 使用缓存
import { AIService } from '@/app/services/ai-service'

const aiService = new AIService({
  cache: {
    enabled: true,
    ttl: 60000,  // 60 秒缓存
  },
})
```

---

## 🎨 样式问题

### 样式不生效

**症状**：CSS 样式不生效

**解决方案**：
```bash
# 1. 检查 CSS 文件是否正确导入
cat src/main.tsx | grep css

# 2. 清除浏览器缓存
# Chrome: Ctrl+Shift+Delete
# macOS: Cmd+Shift+Delete

# 3. 检查 CSS 优先级
# 使用 Chrome DevTools → Elements 查看
```

### 响应式布局不正确

**症状**：移动端布局显示异常

**解决方案**：
```css
/* 1. 检查媒体查询 */
@media (max-width: 768px) {
  .container {
    width: 100%;
    padding: 1rem;
  }
}

/* 2. 使用相对单位 */
.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

/* 3. 使用 Flexbox */
.container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

/* 4. 检查 viewport 设置 */
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

---

## 🐛 调试技巧

### Chrome DevTools

1. **打开 DevTools**：`F12` 或 `Cmd+Option+I`

2. **查看组件状态**：React DevTools
   - 安装：React Developer Tools 扩展
   - 使用：切换到 Components 标签查看组件树和状态

3. **查看网络请求**：Network 面板
   - 查看 HTTP 请求
   - 检查请求和响应
   - 分析性能

4. **查看控制台日志**：Console 面板
   - 查看 console.log 输出
   - 查看错误信息
   - 执行 JavaScript 代码

5. **性能分析**：Performance 面板
   - 录制性能数据
   - 分析渲染时间
   - 识别性能瓶颈

### VS Code 调试

1. **创建启动配置**：`.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

2. **设置断点**：在代码行号左侧点击

3. **启动调试**：`F5` 或点击调试按钮

4. **查看变量**：在 Variables 面板查看

### 日志系统

```typescript
import { createLogger } from '@/app/utils/logger'

const log = createLogger('MyComponent')

// Debug 级别
log.debug('This is a debug message')

// Info 级别
log.info('This is an info message')

// Warn 级别
log.warn('This is a warning message')

// Error 级别
log.error('This is an error message')
```

---

## 📞 获取帮助

如果以上方法都无法解决问题，请：

1. **查看文档**：
   - [开发者快速上手指南](./开发者快速上手指南.md)
   - [API 参考文档](./API参考文档.md)
   - [开发最佳实践](./开发最佳实践.md)

2. **搜索问题**：
   - [GitHub Issues](https://github.com/your-org/YYC3-Code-AI/issues)
   - [Stack Overflow](https://stackoverflow.com/)

3. **提交问题**：
   - 创建 GitHub Issue
   - 提供详细的错误信息
   - 提供复现步骤

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
| 追溯ID | DOC-TROUBLESHOOTING-001 |
| 关联文档 | [快速上手指南](./YYC3-用户指导-快速上手指南.md) \| [开发最佳实践](./YYC3-用户指导-开发最佳实践.md) |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
