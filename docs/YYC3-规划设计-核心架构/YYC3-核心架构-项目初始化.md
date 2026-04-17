---
file: YYC3-P0-架构-项目初始化.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: architecture
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维


---

# YYC³ P0-架构 - 项目初始化

## 📋 阶段信息

- **阶段编号**: P0-01
- **阶段名称**: 项目初始化
- **优先级**: 🔴 P0-Critical
- **复杂度**: 中等
- **预计时间**: 30分钟
- **可实现性**: ✅ 一次可实现

---

## 🎯 阶段目标

初始化 YYC³ AI Code 项目，搭建基础架构，配置开发环境，确保项目可以正常启动和运行。

---

## 📝 输入定义

### 前置条件

- ✅ Node.js 20.11.0 或更高版本已安装
- ✅ pnpm 8.x 或更高版本已安装
- ✅ Git 已安装
- ✅ 代码编辑器（VS Code 推荐）已安装

### 依赖关系

- 无前置阶段依赖
- 这是项目的第一个阶段

### 输入数据

```json
{
  "projectName": "{{PROJECT_NAME}}",
  "teamName": "{{TEAM_NAME}}",
  "contactEmail": "{{CONTACT_EMAIL}}",
  "brandName": "{{BRAND_NAME}}",
  "brandSlogan": "{{BRAND_SLOGAN}}",
  "iconLibrary": "{{ICON_LIBRARY}}",
  "license": "{{LICENSE}}",
  "port": "{{PORT}}"
}
```

---

## 🚀 提示词执行

### 完整提示词

```text
You are a senior full‑stack architect and project initializer with expertise in modern web development, TypeScript, React, and desktop application development using Tauri.

## Your Role & Expertise

You are an experienced software architect who specializes in:
- **Frontend Development**: React 18.x, TypeScript 5.x, modern JavaScript
- **Build Tools**: Vite 5.x, Webpack, Babel
- **Desktop Applications**: Tauri, Electron, native system integration
- **Project Architecture**: Monorepo structure, microservices, scalable design patterns
- **Best Practices**: Clean code, SOLID principles, design patterns, testing strategies
- **Team Collaboration**: Git workflows, code reviews, documentation standards

## Your Task

Your task is to initialize a **desktop application** project for YYC³ AI Code.

## Project Information

- **Project Name**: {{PROJECT_NAME}}
- **Team**: {{TEAM_NAME}}
- **Contact**: {{CONTACT_EMAIL}}
- **Brand Identity**: {{BRAND_NAME}}
- **Brand Slogan**: {{BRAND_SLOGAN}}
- **Icon Library**: {{ICON_LIBRARY}}
- **License**: {{LICENSE}}
- **Port**: {{PORT}}

## Technical Stack

- **Frontend Framework**: React 18.3.1
- **Type System**: TypeScript 5.3.3
- **Build Tool**: Vite 5.0.12
- **Native Bridge**: Tauri (Latest)
- **Package Manager**: pnpm 8.x
- **Icon Library**: Lucide React 0.312.0

## Code Standards

**IMPORTANT**: Please ensure all generated code files follow the team requirements specified in: `guidelines/YYC3-Code-header.md`

All code files must include proper file headers with:
- @file: File name/path
- @description: Clear description of file purpose
- @author: YanYuCloudCube Team <admin@0379.email>
- @version: Semantic version (v1.0.0)
- @created: Creation date (YYYY-MM-DD)
- @updated: Last update date (YYYY-MM-DD)
- @status: File status (draft/dev/test/stable/deprecated)
- @license: License type
- @copyright: Copyright notice
- @tags: Relevant tags for categorization

## Project Structure

Create a **Monorepo** structure with the following layout:

```
{{PROJECT_NAME}}/
├── packages/
│   ├── core/                   # Core business logic
│   ├── ui/                     # UI components
│   └── shared/                 # Shared utilities
├── src/                        # Application source
│   ├── main.tsx                # Application entry point
│   ├── App.tsx                 # Root component
│   ├── app/                    # Application logic
│   │   ├── config.ts           # Configuration
│   │   ├── store.tsx           # State management
│   │   └── apiClient.ts        # API client
│   └── components/             # Shared components
├── public/                     # Static assets
│   └── logo.svg                # Application logo
├── docs/                       # Documentation
├── tests/                      # Test files
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # PNPM workspace config
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
├── tauri.conf.json             # Tauri config
├── .gitignore                  # Git ignore rules
├── .eslintrc.js                # ESLint config
├── .prettierrc                 # Prettier config
└── README.md                   # Project README
```

## Required Tasks

### 1. Initialize Project

```bash
# Create project directory
mkdir {{PROJECT_NAME}}
cd {{PROJECT_NAME}}

# Initialize Git repository
git init

# Initialize PNPM workspace
pnpm init
```

### 2. Create Root package.json

Create `package.json` with the following content:

```json
{
  "name": "{{PROJECT_NAME}}",
  "version": "1.0.0",
  "description": "{{BRAND_SLOGAN}}",
  "author": "{{TEAM_NAME}} <{{CONTACT_EMAIL}}>",
  "license": "{{LICENSE}}",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "pnpm --filter {{PROJECT_NAME}} dev",
    "build": "pnpm --filter {{PROJECT_NAME}} build",
    "preview": "pnpm --filter {{PROJECT_NAME}} preview",
    "tauri": "tauri",
    "tauri:dev": "pnpm tauri dev",
    "tauri:build": "pnpm tauri build",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^1.5.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.2.4",
    "typescript": "^5.3.3",
    "vite": "^5.0.12"
  }
}
```

### 3. Create PNPM Workspace Config

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
```

### 4. Install Core Dependencies

```bash
# Install React and TypeScript
pnpm add react@18.3.1 react-dom@18.3.1
pnpm add -D @types/react@18.2.48 @types/react-dom@18.2.18

# Install Vite and plugins
pnpm add -D vite@5.0.12 @vitejs/plugin-react@4.2.1

# Install Tauri
pnpm add -D @tauri-apps/cli@1.5.0
pnpm add @tauri-apps/api@1.5.0

# Install TypeScript
pnpm add -D typescript@5.3.3

# Install Icon Library
pnpm add lucide-react@0.312.0
```

### 5. Create TypeScript Config

Create `tsconfig.json`:

```json
{
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
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["packages/core/src/*"],
      "@ui/*": ["packages/ui/src/*"],
      "@shared/*": ["packages/shared/src/*"]
    }
  },
  "include": ["src", "packages/*/src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 6. Create Vite Config

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './packages/core/src'),
      '@ui': path.resolve(__dirname, './packages/ui/src'),
      '@shared': path.resolve(__dirname, './packages/shared/src'),
    },
  },
  server: {
    port: {{PORT}},
    host: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
  },
});
```

### 7. Create Tauri Config

Create `tauri.conf.json`:

```json
{
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devPath": "http://localhost:{{PORT}}",
    "distDir": "../dist"
  },
  "package": {
    "productName": "{{PROJECT_NAME}}",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "createDir": true,
        "removeDir": true,
        "removeFile": true,
        "renameFile": true,
        "exists": true,
        "scope": ["**"]
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.yyc3.{{PROJECT_NAME}}",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "updater": {
      "active": false
    },
    "windows": {
      "title": "{{PROJECT_NAME}}",
      "width": 1280,
      "height": 800,
      "resizable": true,
      "fullscreen": false
    }
  }
}
```

### 8. Create Application Entry Point

Create `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 9. Create Root Component

Create `src/App.tsx`:

```typescript
import React from 'react';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>{{PROJECT_NAME}}</h1>
        <p>{{BRAND_SLOGAN}}</p>
      </header>
      <main className="app-main">
        <p>Application initialized successfully!</p>
      </main>
    </div>
  );
}

export default App;
```

### 10. Create Basic Styles

Create `src/index.css`:

```css
:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --background-color: #0f172a;
  --text-color: #f8fafc;
  --border-color: #334155;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--background-color);
  color: var(--text-color);
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.app-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.app-header p {
  font-size: 1rem;
  color: var(--secondary-color);
}

.app-main {
  flex: 1;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 11. Create HTML Template

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{PROJECT_NAME}}</title>
    <meta name="description" content="{{BRAND_SLOGAN}}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 12. Create Git Ignore

Create `.gitignore`:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/
*.log

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Tauri
src-tauri/target/
```

### 13. Create ESLint Config

Create `.eslintrc.js`:

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
};
```

### 14. Create Prettier Config

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

### 15. Create README

Create `README.md`:

```markdown
# {{PROJECT_NAME}}

{{BRAND_SLOGAN}}

## 项目信息

- **项目名称**: {{PROJECT_NAME}}
- **团队**: {{TEAM_NAME}}
- **联系**: {{CONTACT_EMAIL}}
- **许可证**: {{LICENSE}}

## 快速开始

### 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 启动开发服务器

\`\`\`bash
pnpm dev
\`\`\`

### 启动 Tauri 应用

\`\`\`bash
pnpm tauri:dev
\`\`\`

### 构建生产版本

\`\`\`bash
pnpm build
pnpm tauri:build
\`\`\`

## 技术栈

- React 18.3.1
- TypeScript 5.3.3
- Vite 5.0.12
- Tauri (Latest)
- Lucide React 0.312.0

## 项目结构

\`\`\`
{{PROJECT_NAME}}/
├── packages/
│   ├── core/
│   ├── ui/
│   └── shared/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/
│   └── components/
├── public/
├── docs/
├── tests/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── vite.config.ts
└── tauri.conf.json
\`\`\`

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

{{LICENSE}}

---

<div align="center">

> **「YanYuCloudCube」**
> **言启象限 | 语枢未来**
> **Words Initiate Quadrants, Language Serves as Core for Future**
> **万象归元于云枢 | 深栈智启新纪元**
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**

</div>
```

## Output Requirements

### Generated Files

1. ✅ `package.json` - Root package configuration
2. ✅ `pnpm-workspace.yaml` - PNPM workspace configuration
3. ✅ `tsconfig.json` - TypeScript configuration
4. ✅ `vite.config.ts` - Vite configuration
5. ✅ `tauri.conf.json` - Tauri configuration
6. ✅ `src/main.tsx` - Application entry point
7. ✅ `src/App.tsx` - Root component
8. ✅ `src/index.css` - Global styles
9. ✅ `index.html` - HTML template
10. ✅ `.gitignore` - Git ignore rules
11. ✅ `.eslintrc.js` - ESLint configuration
12. ✅ `.prettierrc` - Prettier configuration
13. ✅ `README.md` - Project documentation

### Directory Structure

```
{{PROJECT_NAME}}/
├── packages/
│   ├── core/
│   ├── ui/
│   └── shared/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/
│   └── components/
├── public/
├── docs/
├── tests/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── vite.config.ts
└── tauri.conf.json
```

## Verification Steps

### 1. Install Dependencies

\`\`\`bash
cd {{PROJECT_NAME}}
pnpm install
\`\`\`

**Expected**: All dependencies installed successfully without errors.

### 2. Start Development Server

\`\`\`bash
pnpm dev
\`\`\`

**Expected**: Development server starts at http://localhost:{{PORT}} and displays the application.

### 3. Start Tauri Application

\`\`\`bash
pnpm tauri:dev
\`\`\`

**Expected**: Tauri application window opens and displays the application.

### 4. Run Type Check

\`\`\`bash
pnpm typecheck
\`\`\`

**Expected**: No TypeScript errors.

### 5. Run Lint

\`\`\`bash
pnpm lint
\`\`\`

**Expected**: No ESLint errors.

### 6. Run Format

\`\`\`bash
pnpm format
\`\`\`

**Expected**: All files formatted correctly.

## Success Criteria

- ✅ All required files are created
- ✅ Project structure matches specification
- ✅ Development server starts successfully
- ✅ Tauri application opens successfully
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ All files formatted correctly
- ✅ Application displays correctly in browser
- ✅ Application displays correctly in Tauri window

## Next Steps

After completing this stage, proceed to:

1. **P0-02-架构-目录结构**: Define detailed directory structure
2. **P0-03-架构-类型定义**: Create TypeScript type definitions
3. **P0-04-架构-构建配置**: Configure build and development tools

---

<div align="center">

> **「YanYuCloudCube」**
> **言启象限 | 语枢未来**
> **Words Initiate Quadrants, Language Serves as Core for Future**
> **万象归元于云枢 | 深栈智启新纪元**
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**

</div>
```

---

## 📤 输出生成

### 生成文件

执行上述提示词后，应该生成以下文件：

1. `package.json` - Root package configuration
2. `pnpm-workspace.yaml` - PNPM workspace configuration
3. `tsconfig.json` - TypeScript configuration
4. `vite.config.ts` - Vite configuration
5. `tauri.conf.json` - Tauri configuration
6. `src/main.tsx` - Application entry point
7. `src/App.tsx` - Root component
8. `src/index.css` - Global styles
9. `index.html` - HTML template
10. `.gitignore` - Git ignore rules
11. `.eslintrc.js` - ESLint configuration
12. `.prettierrc` - Prettier configuration
13. `README.md` - Project documentation

### 目录结构

```
{{PROJECT_NAME}}/
├── packages/
│   ├── core/
│   ├── ui/
│   └── shared/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/
│   └── components/
├── public/
├── docs/
├── tests/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── vite.config.ts
└── tauri.conf.json
```

---

## ✅ 验收标准

### 功能验收

- ✅ 项目可以正常初始化
- ✅ 所有依赖可以正常安装
- ✅ 开发服务器可以正常启动
- ✅ Tauri 应用可以正常打开
- ✅ 应用可以在浏览器中正常显示
- ✅ 应用可以在 Tauri 窗口中正常显示

### 代码质量验收

- ✅ 无 TypeScript 编译错误
- ✅ 无 ESLint 错误
- ✅ 所有文件格式正确
- ✅ 代码符合规范

### 文档验收

- ✅ README.md 完整准确
- ✅ 代码注释清晰
- ✅ 项目结构说明完整

---

## 🎯 下一步

完成本阶段后，请继续执行：

1. **[P0-02-架构-目录结构](./YYC3-P0-架构-目录结构.md)** - 定义详细的目录结构
2. **[P0-03-架构-类型定义](./YYC3-P0-架构-类型定义.md)** - 创建 TypeScript 类型定义
3. **[P0-04-架构-构建配置](./YYC3-P0-架构-构建配置.md)** - 配置构建和开发工具

---

<div align="center">

> **「YanYuCloudCube」**
> **言启象限 | 语枢未来**
> **Words Initiate Quadrants, Language Serves as Core for Future**
> **万象归元于云枢 | 深栈智启新纪元**
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-14 |
| 更新日期 | 2026-04-08 |
| 内容校验 | d1f87eaf1a0905d3 |
| 追溯ID | TRC-20260408141609 |
| 关联文档 | 无 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
