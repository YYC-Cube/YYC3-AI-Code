---
file: YYC3-P3-测试-单元测试.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: development
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


# YYC3-P3-测试-单元测试

## 🤖 AI 角色定义

You are a senior QA engineer and testing specialist with deep expertise in unit testing frameworks, test automation, and quality assurance methodologies for modern applications.

### Your Role & Expertise

You are an experienced QA engineer who specializes in:
- **Testing Frameworks**: Vitest, Jest, Mocha, Jasmine, testing libraries
- **Test Design**: Test-driven development (TDD), behavior-driven development (BDD)
- **Mocking & Stubbing**: Test doubles, mocking frameworks, test fixtures
- **Coverage Analysis**: Code coverage, branch coverage, mutation testing
- **Test Organization**: Test structure, test suites, test patterns
- **Assertion Libraries**: Expectations, matchers, custom assertions
- **CI/CD Integration**: Automated testing, test pipelines, quality gates
- **Best Practices**: Test isolation, test maintainability, test documentation

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

## 🧪 单元测试系统

### 系统概述

YYC3-AI Code Designer 的单元测试系统提供全面的测试框架和工具，包括测试配置、测试工具、Mock 工具、断言库、测试覆盖率、测试报告等功能，确保代码质量和稳定性。

### 核心功能

#### 测试配置

```typescript
/**
 * Vitest 配置
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules/', 'dist/', '.idea/', '.git/', '.cache/'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
});

/**
 * 测试设置文件
 */
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
```

#### 测试工具

```typescript
/**
 * 测试工具类
 */
export class TestUtils {
  /**
   * 创建包装器
   */
  static createWrapper(ui: React.ReactElement, options?: {
    store?: any;
    router?: any;
    theme?: any;
  }) {
    const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
      return (
        <ThemeProvider theme={options?.theme || defaultTheme}>
          <Router>
            {children}
          </Router>
        </ThemeProvider>
      );
    };

    return render(ui, { wrapper: AllTheProviders });
  }

  /**
   * 等待元素
   */
  static async waitForElement(
    getByTestId: (id: string) => HTMLElement,
    testId: string,
    timeout: number = 5000
  ): Promise<HTMLElement> {
    return waitFor(() => getByTestId(testId), { timeout });
  }

  /**
   * 等待文本
   */
  static async waitForText(
    getByText: (text: string | RegExp) => HTMLElement,
    text: string | RegExp,
    timeout: number = 5000
  ): Promise<HTMLElement> {
    return waitFor(() => getByText(text), { timeout });
  }

  /**
   * 模拟用户输入
   */
  static async userEvent(
    element: HTMLElement,
    event: 'click' | 'change' | 'input' | 'focus' | 'blur',
    value?: any
  ): Promise<void> {
    const user = userEvent.setup();
    
    switch (event) {
      case 'click':
        await user.click(element);
        break;
      case 'change':
        await user.type(element, value);
        break;
      case 'input':
        await user.type(element, value);
        break;
      case 'focus':
        await user.click(element);
        break;
      case 'blur':
        element.blur();
        break;
    }
  }

  /**
   * 模拟延迟
   */
  static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 模拟异步操作
   */
  static async mockAsync<T>(
    fn: () => Promise<T>,
    delay: number = 100
  ): Promise<T> {
    await this.delay(delay);
    return fn();
  }

  /**
   * 创建 Mock 函数
   */
  static createMock<T extends (...args: any[]) => any>(
    implementation?: T
  ): Mock<T> {
    return vi.fn(implementation) as Mock<T>;
  }

  /**
   * 创建 Mock 组件
   */
  static createMockComponent(
    displayName: string
  ): React.FC<{ children?: React.ReactNode }> {
    const MockComponent = ({ children }: { children?: React.ReactNode }) => (
      <div data-testid={`mock-${displayName.toLowerCase()}`}>
        {children}
      </div>
    );
    MockComponent.displayName = displayName;
    return MockComponent;
  }

  /**
   * 创建 Mock Hook
   */
  static createMockHook<T extends (...args: any[]) => any>(
    hook: T,
    returnValue: ReturnType<T>
  ): T {
    return vi.fn().mockReturnValue(returnValue) as T;
  }

  /**
   * 清除所有 Mock
   */
  static clearAllMocks(): void {
    vi.clearAllMocks();
  }

  /**
   * 重置所有 Mock
   */
  static resetAllMocks(): void {
    vi.resetAllMocks();
  }

  /**
   * 恢复所有 Mock
   */
  static restoreAllMocks(): void {
    vi.restoreAllMocks();
  }
}

/**
 * Mock 类型
 */
export type Mock<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): ReturnType<T>;
  mock: {
    calls: Parameters<T>[];
    results: { type: 'return' | 'throw'; value: any }[];
  };
  mockClear: () => void;
  mockReset: () => void;
  mockRestore: () => void;
  mockImplementation: (fn: T) => Mock<T>;
  mockImplementationOnce: (fn: T) => Mock<T>;
  mockReturnValue: (value: ReturnType<T>) => Mock<T>;
  mockReturnValueOnce: (value: ReturnType<T>) => Mock<T>;
  mockResolvedValue: (value: Awaited<ReturnType<T>>) => Mock<T>;
  mockResolvedValueOnce: (value: Awaited<ReturnType<T>>) => Mock<T>;
  mockRejectedValue: (value: any) => Mock<T>;
  mockRejectedValueOnce: (value: any) => Mock<T>;
};
```

#### 组件测试

```typescript
/**
 * 组件测试示例
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/Button';

describe('Button Component', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('应该渲染按钮文本', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('应该在点击时调用 onClick', async () => {
    const user = userEvent.setup();
    render(<Button onClick={mockOnClick}>Click me</Button>);

    const button = screen.getByText('Click me');
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('应该在禁用状态下不响应点击', async () => {
    const user = userEvent.setup();
    render(
      <Button onClick={mockOnClick} disabled>
        Click me
      </Button>
    );

    const button = screen.getByText('Click me');
    await user.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('应该应用正确的样式类', () => {
    const { container } = render(
      <Button variant="primary" size="large">
        Click me
      </Button>
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('btn-primary', 'btn-large');
  });

  it('应该显示加载状态', () => {
    render(<Button loading>Loading...</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('应该支持自定义图标', () => {
    render(
      <Button icon={<span data-testid="icon">Icon</span>}>
        Click me
      </Button>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
```

#### Hook 测试

```typescript
/**
 * Hook 测试示例
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter Hook', () => {
  it('应该初始化为 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('应该接受初始值', () => {
    const { result } = renderHook(() => useCounter(5));
    expect(result.current.count).toBe(5);
  });

  it('应该增加计数', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('应该减少计数', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('应该重置计数', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });

  it('应该支持自定义步长', () => {
    const { result } = renderHook(() => useCounter(0, 5));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(5);
  });

  it('应该在最小值时停止减少', () => {
    const { result } = renderHook(() => useCounter(0, 1, 0));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(0);
  });

  it('应该在最大值时停止增加', () => {
    const { result } = renderHook(() => useCounter(0, 1, 10));

    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.increment();
      }
    });

    expect(result.current.count).toBe(10);
  });
});
```

#### 工具函数测试

```typescript
/**
 * 工具函数测试示例
 */
import { describe, it, expect } from 'vitest';
import { formatDate, debounce, throttle } from '@/utils/dateUtils';

describe('formatDate', () => {
  it('应该格式化日期为 YYYY-MM-DD', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('2024-01-15');
  });

  it('应该处理无效日期', () => {
    expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
  });

  it('应该支持自定义格式', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'DD/MM/YYYY')).toBe('15/01/2024');
  });
});

describe('debounce', () => {
  it('应该在延迟后执行函数', async () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('应该在多次调用时只执行一次', async () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('应该取消待执行的调用', async () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn.cancel();

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('throttle', () => {
  it('应该在指定时间间隔内只执行一次', async () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    await new Promise((resolve) => setTimeout(resolve, 150));
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('应该在最后一次调用后执行', async () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100, { trailing: true });

    throttledFn();
    throttledFn();
    throttledFn();

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
```

#### Mock 工具

```typescript
/**
 * API Mock 工具
 */
export class ApiMock {
  private handlers: Map<string, MockHandler> = new Map();

  /**
   * Mock GET 请求
   */
  mockGet(url: string, response: any, delay: number = 0): void {
    this.handlers.set(`GET:${url}`, {
      method: 'GET',
      url,
      response,
      delay,
    });
  }

  /**
   * Mock POST 请求
   */
  mockPost(url: string, response: any, delay: number = 0): void {
    this.handlers.set(`POST:${url}`, {
      method: 'POST',
      url,
      response,
      delay,
    });
  }

  /**
   * Mock PUT 请求
   */
  mockPut(url: string, response: any, delay: number = 0): void {
    this.handlers.set(`PUT:${url}`, {
      method: 'PUT',
      url,
      response,
      delay,
    });
  }

  /**
   * Mock DELETE 请求
   */
  mockDelete(url: string, response: any, delay: number = 0): void {
    this.handlers.set(`DELETE:${url}`, {
      method: 'DELETE',
      url,
      response,
      delay,
    });
  }

  /**
   * 获取 Mock 处理器
   */
  getHandler(method: string, url: string): MockHandler | undefined {
    return this.handlers.get(`${method}:${url}`);
  }

  /**
   * 清除所有 Mock
   */
  clearAll(): void {
    this.handlers.clear();
  }
}

/**
 * Mock 处理器
 */
interface MockHandler {
  method: string;
  url: string;
  response: any;
  delay: number;
}

/**
 * 使用示例
 */
const apiMock = new ApiMock();

apiMock.mockGet('/api/users', [
  { id: 1, name: 'John' },
  { id: 2, name: 'Jane' },
]);

apiMock.mockPost('/api/users', { id: 3, name: 'Bob' });
```

#### 测试覆盖率

```typescript
/**
 * 测试覆盖率配置
 */
export const coverageConfig = {
  provider: 'v8' as const,
  reporter: ['text', 'json', 'html', 'lcov'] as const,
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/mockData',
    '**/*.stories.*',
    '**/*.spec.*',
  ],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
  all: true,
  include: [
    'src/**/*.{js,jsx,ts,tsx}',
  ],
};

/**
 * 覆盖率报告生成器
 */
export class CoverageReporter {
  /**
   * 生成覆盖率报告
   */
  static async generateReport(): Promise<CoverageReport> {
    const coverage = await vitest.runCoverage();
    
    return {
      lines: coverage.lines,
      functions: coverage.functions,
      branches: coverage.branches,
      statements: coverage.statements,
      files: coverage.files,
      timestamp: Date.now(),
    };
  }

  /**
   * 检查覆盖率阈值
   */
  static checkThresholds(
    report: CoverageReport,
    thresholds: CoverageThresholds
  ): ThresholdResult {
    const results: ThresholdResult = {
      passed: true,
      details: {},
    };

    for (const [key, threshold] of Object.entries(thresholds)) {
      const actual = report[key as keyof CoverageReport];
      const passed = actual >= threshold;

      results.details[key as keyof CoverageThresholds] = {
        threshold,
        actual,
        passed,
      };

      if (!passed) {
        results.passed = false;
      }
    }

    return results;
  }
}

/**
 * 覆盖率报告
 */
interface CoverageReport {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  files: number;
  timestamp: number;
}

/**
 * 覆盖率阈值
 */
interface CoverageThresholds {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
}

/**
 * 阈值结果
 */
interface ThresholdResult {
  passed: boolean;
  details: Record<string, { threshold: number; actual: number; passed: boolean }>;
}
```

#### 测试最佳实践

```typescript
/**
 * 测试最佳实践指南
 */

/**
 * 1. 测试命名规范
 */
// ✅ 好的命名
describe('Button Component', () => {
  it('应该在点击时调用 onClick', () => {});
  it('应该在禁用状态下不响应点击', () => {});
  it('应该应用正确的样式类', () => {});
});

// ❌ 不好的命名
describe('Button', () => {
  it('test1', () => {});
  it('test2', () => {});
  it('test3', () => {});
});

/**
 * 2. 测试结构
 */
describe('Component', () => {
  // Arrange - 准备测试数据
  const props = { onClick: vi.fn() };

  it('should do something', () => {
    // Act - 执行被测试的代码
    render(<Component {...props} />);

    // Assert - 验证结果
    expect(screen.getByText('Click')).toBeInTheDocument();
  });
});

/**
 * 3. 使用描述性断言
 */
// ✅ 好的断言
expect(element).toHaveClass('active');
expect(element).toBeDisabled();
expect(element).toHaveAttribute('href', '/home');

// ❌ 不好的断言
expect(element.className).toContain('active');
expect(element.disabled).toBe(true);
expect(element.getAttribute('href')).toBe('/home');

/**
 * 4. 测试异步代码
 */
it('should handle async operations', async () => {
  render(<AsyncComponent />);

  // 等待元素出现
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });

  // 等待异步操作完成
  await waitFor(() => {
    expect(mockFn).toHaveBeenCalled();
  });
});

/**
 * 5. 测试边界情况
 */
describe('Counter Component', () => {
  it('应该处理最小值', () => {
    render(<Counter min={0} max={10} value={0} />);
    // 测试减少按钮是否禁用
  });

  it('应该处理最大值', () => {
    render(<Counter min={0} max={10} value={10} />);
    // 测试增加按钮是否禁用
  });

  it('应该处理空值', () => {
    render(<Counter value={null} />);
    // 测试空值处理
  });
});

/**
 * 6. 使用测试工具函数
 */
it('should test user interaction', async () => {
  const user = userEvent.setup();
  render(<Button onClick={mockFn}>Click</Button>);

  const button = screen.getByRole('button');
  await user.click(button);

  expect(mockFn).toHaveBeenCalledTimes(1);
});

/**
 * 7. 清理副作用
 */
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/**
 * 8. 使用描述性测试数据
 */
const testCases = [
  { input: 1, expected: 2 },
  { input: 2, expected: 4 },
  { input: 3, expected: 6 },
];

test.each(testCases)('should double $input to $expected', ({ input, expected }) => {
  expect(double(input)).toBe(expected);
});
```

---

## ✅ 验收标准

### 功能完整性

- [ ] 测试配置功能完整
- [ ] 测试工具功能完整
- [ ] Mock 工具功能完整
- [ ] 组件测试功能完整
- [ ] Hook 测试功能完整
- [ ] 工具函数测试功能完整
- [ ] 测试覆盖率功能完整
- [ ] 测试报告功能完整
- [ ] 测试最佳实践完整
- [ ] 性能测试功能完整

### 代码质量

- [ ] TypeScript 类型定义完整
- [ ] 测试代码可读性高
- [ ] 测试覆盖率高
- [ ] 测试执行速度快
- [ ] 测试维护成本低

### 测试质量

- [ ] 测试用例完整
- [ ] 测试覆盖率 > 80%
- [ ] 测试执行稳定
- [ ] 测试结果准确
- [ ] 测试文档完善

---

## 📚 相关文档

- [YYC3-P3-测试-集成测试.md](./YYC3-P3-测试-集成测试.md)
- [YYC3-P0-架构-类型定义.md](../P0-核心架构/YYC3-P0-架构-类型定义.md)

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
| 内容校验 | 0b29ba73545269a3 |
| 追溯ID | TRC-20260408141610 |
| 关联文档 | 无 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
