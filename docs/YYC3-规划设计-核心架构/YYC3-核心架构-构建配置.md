---
file: YYC3-P0-架构-构建配置.md
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


# YYC³ P0-架构-构建配置

## 🤖 AI 角色定义

You are a senior build engineer and DevOps specialist with deep expertise in modern build tools, bundlers, and continuous integration/continuous deployment (CI/CD) pipelines.

### Your Role & Expertise

You are an experienced DevOps engineer who specializes in:
- **Build Tools**: Vite 5.x, Webpack 5.x, Rollup, esbuild, Turbopack
- **Bundlers & Optimizers**: Code splitting, tree shaking, minification, compression
- **Package Managers**: npm, yarn, pnpm, bun, dependency management
- **CI/CD**: GitHub Actions, GitLab CI, Jenkins, automated deployments
- **Development Tools**: Babel, PostCSS, TypeScript, ESLint, Prettier
- **Performance Optimization**: Bundle analysis, lazy loading, caching strategies
- **Cross-Platform Builds**: Electron, Tauri, multi-platform packaging
- **Best Practices**: Build caching, incremental builds, parallel processing

### Code Standards

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

---

## 📋 文档信息

| 字段 | 内容 |
|------|------|
| @file | P0-核心架构/YYC3-P0-架构-构建配置.md |
| @description | Vite 和 Tauri 构建配置，包含开发和生产环境配置 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags P0,architecture,build,vite,tauri |

---

## 🎯 配置目标

### 核心目标

1. **快速开发**：优化开发体验，提高开发效率
2. **高效构建**：优化构建速度和产物大小
3. **类型安全**：完整的 TypeScript 支持
4. **代码规范**：集成 ESLint 和 Prettier
5. **测试支持**：集成测试框架

---

## ⚙️ Vite 配置

### 1. 基础配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: {{PORT}},
    host: true,
    open: true,
    hmr: {
      overlay: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'editor-vendor': ['@tiptap/react', '@tiptap/starter-kit'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'utils-vendor': ['dayjs', 'lodash-es'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'dayjs',
      'zustand',
    ],
  },
});
```

### 2. TypeScript 配置

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
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 🦀 Tauri 配置

### 1. Tauri 配置

```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:{{PORT}}",
    "distDir": "../dist"
  },
  "package": {
    "productName": "{{PROJECT_NAME}}",
    "version": "{{PROJECT_VERSION}}"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "dialog": {
        "all": false,
        "open": true,
        "save": true
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
        "exists": true
      },
      "path": {
        "all": false,
        "resolve": true
      },
      "notification": {
        "all": false,
        "send": true
      }
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.{{PROJECT_SLUG}}.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": "default-src 'self'"
    },
    "updater": {
      "active": false
    },
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    }
  }
}
```

### 2. Cargo 配置

```toml
[package]
name = "{{PROJECT_SLUG}}"
version = "{{PROJECT_VERSION}}"
description = "{{PROJECT_DESCRIPTION}}"
authors = ["{{TEAM_NAME}}"]
license = "MIT"
repository = "https://github.com/YYC-Cube/{{PROJECT_SLUG}}"
edition = "2021"

[build-dependencies]
tauri-build = { version = "{{TAURI_CLI_VERSION}}", features = [] }

[dependencies]
tauri = { version = "{{TAURI_API_VERSION}}", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

---

## 🔧 ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
```

---

## 💅 Prettier 配置

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## 📦 Package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri dev",
    "tauri:build": "tauri build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## ✅ 验收标准

### 配置完整性

- ✅ Vite 配置正确
- ✅ TypeScript 配置正确
- ✅ Tauri 配置正确
- ✅ ESLint 配置正确
- ✅ Prettier 配置正确

### 构建功能

- ✅ 开发服务器正常启动
- ✅ 生产构建成功
- ✅ 类型检查通过
- ✅ 代码规范检查通过
- ✅ 测试可以运行

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-03-14 | 初始版本，建立构建配置 | YanYuCloudCube Team |

---

## 📞 联系方式

- **维护团队**: YanYuCloudCube Team
- **联系邮箱**: admin@0379.email
- **项目地址**: https://github.com/YYC-Cube/

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-04-08 |
| 更新日期 | 2026-04-08 |
| 内容校验 | 10bf848baa2b0aa6 |
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
