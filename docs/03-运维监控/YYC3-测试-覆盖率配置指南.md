# YYC³ AI Code - 测试覆盖率配置与指南

> **文档版本**: v1.0
> **维护团队**: YanYuCloudCube Team
> **最后更新**: 2026-03-19

---

## 📋 目录

1. [概述](#概述)
2. [配置 Vitest 覆盖率](#配置-vitest-覆盖率)
3. [生成覆盖率报告](#生成覆盖率报告)
4. [CI/CD 集成](#cicd-集成)
5. [常见问题](#常见问题)

---

## 概述

### 目标

YYC³ AI Code 项目致力于实现高测试覆盖率，以确保代码质量和稳定性。本指南详细说明了如何配置、生成和监控测试覆盖率。

### 覆盖率指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| Statements (语句) | > 80% | 代码被执行的行数比例 |
| Branches (分支) | > 80% | 条件判断的分支覆盖比例 |
| Functions (函数) | > 80% | 定义的函数被调用的比例 |
| Lines (行) | > 80% | 有效代码行的覆盖比例 |

---

## 配置 Vitest 覆盖率

### 1. 更新 `vitest.config.ts`

在项目根目录的 `vitest.config.ts` 文件中，添加 `coverage` 配置块。

**配置示例**:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts', // 如果有全局 setup
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ---------------------------------------------------------
  // 🚀 覆盖率配置 (Coverage Configuration)
  // ---------------------------------------------------------
  coverage: {
    provider: 'v8', // 使用 v8 (推荐，性能好) 或 'istanbul'
    reporter: ['text', 'json', 'html', 'lcov'], // 生成多种格式的报告
    
    // 包含的目录 (Include Directories)
    include: [
      'src/app/**',      // 包含核心应用逻辑
      'src/components/**', // 包含组件
      'src/services/**',  // 包含服务层
      'src/hooks/**',     // 包含自定义 Hooks
      'src/utils/**',     // 包含工具函数
    ],
    
    // 排除的目录 (Exclude Directories)
    exclude: [
      'node_modules/',
      'src/test/',        // 排除测试文件本身
      'src/tests/mocks/', // 排除 Mock 文件
      'dist/',
      'build/',
      '**/*.d.ts',       // 排除类型定义文件
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/index.ts',      // 通常 index.ts 只是导出，覆盖率低
      '**/types.ts',
    ],
    
    // 设置覆盖率门禁 (Thresholds)
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    
    // 其他设置
    all: true, // 覆盖所有文件，不仅仅是被测试的文件
    clean: true, // 生成报告前清理 coverage 目录
  },
});
```

### 2. 安装依赖 (如果缺失)

Vitest 默认自带 `v8` provider，但如果需要更详细的报告，可能需要安装 `@vitest/coverage-v8`。

```bash
npm install -D @vitest/coverage-v8
```

---

## 生成覆盖率报告

### 1. 命令行运行

在 `package.json` 中配置脚本：

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:coverage:watch": "vitest --coverage"
  }
}
```

### 2. 查看报告

运行以下命令：

```bash
npm run test:coverage
```

运行完成后，终端会输出类似以下的文本摘要：

```
% Coverage report from v8
--------------------------|---------|---------|---------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
--------------------------|---------|---------|---------|---------|---------|-------------------
All files           |   89.65 |    78.21 |    92.50 |   89.28 |                   
 src                |   95.00 |    82.00 |    96.00 |   95.00 |                   
 src/app            |   90.00 |    85.00 |    90.00 |   90.00 |                   
 src/app/services    |   89.65 |    65.51 |      75 |   89.28 | 139-142           
 src/components      |   85.00 |    75.00 |    85.00 |   85.00 |                   
--------------------------|---------|---------|---------|---------|---------|-------------------
```

同时，会在项目根目录下生成 `coverage/index.html`。

### 3. 查看详细 HTML 报告

在浏览器中打开生成的 HTML 文件：

1.  运行 `npm run test:coverage`。
2.  在项目根目录找到 `coverage` 文件夹。
3.  打开 `coverage/index.html`。

HTML 报告提供直观的视图：
- 🟩 绿色：已覆盖的代码。
- 🟥 红色：未覆盖的代码。
- 🟨 黄色：部分覆盖的分支。

---

## CI/CD 集成

### 1. GitHub Actions 示例

在 `.github/workflows/test.yml` 中添加覆盖率检查。

**示例配置**:

```yaml
name: Test & Coverage

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests with coverage
        run: npm run test:coverage
        
      - name: Upload coverage to Codecov (可选)
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true
```

### 2. 设置覆盖率门槛

如果覆盖率低于设定的阈值（例如 80%），CI 任务将失败。

- **在 `vitest.config.ts` 中**：设置 `coverage.thresholds`。
- **在 CI 脚本中**：检查 `test:coverage` 命令的退出码。如果低于阈值，Vitest 会返回非 0 状态码。

---

## 常见问题

### Q1: 为什么覆盖率报告显示某些文件未被覆盖？

**A**: 可能原因：
1.  **文件未被 `include` 匹配**：检查 `vitest.config.ts` 中的 `include` 数组。
2.  **文件被 `exclude` 排除**：检查是否在 `exclude` 数组中。
3.  **代码分支未触发**：例如 `else if` 或 `catch` 块，测试用例未覆盖该场景。

**解决方案**:
```typescript
// vitest.config.ts
coverage: {
  include: ['src/**/*.{ts,tsx}'], // 确保包含所有源文件
  exclude: [
    'src/**/*.test.{ts,tsx}', // 明确只排除测试文件
  ]
}
```

### Q2: 如何忽略某些特定的代码行（如 `default` case）？

**A**: 使用注释语法。

**JavaScript/TypeScript**:
```typescript
switch (val) {
  case 1:
    return 'one';
  case 2:
    return 'two';
  default:
    /* istanbul ignore next */ // 或 /* v8 ignore next */
    return 'unknown';
}
```

**ESLint 注释**:
有时使用 `eslint-disable-next-line` 可以忽略特定行的检测，但覆盖率统计通常不支持通过 ESLint 注释忽略。

### Q3: 100% 覆盖率是必须的吗？

**A**: 不是。
- **追求 100% 可能导致为了测试而测试**。
- **80-90% 是健康的黄金区间**。
- 重点应该放在**核心业务逻辑**和**复杂算法**上。

### Q4: 如何处理动态导入或异步组件？

**A**: 覆盖率工具 (如 v8) 能够追踪代码的执行。只要测试代码触发了该动态加载的逻辑，覆盖率就会统计。

如果动态导入未触发，覆盖率报告可能会显示 `import()` 行为未覆盖。

---

## 附录

### A. 推荐阅读

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [Istanbul (NYC) Documentation](https://istanbul.js.org/)
- [Codecov Documentation](https://docs.codecov.com/)

### B. 联系方式

如有问题，请联系 YanYuCloudCube Team <admin@0379.email>。

---

**文档结束** (EOF)
