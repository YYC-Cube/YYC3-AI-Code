import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  X, TestTube, Copy, Check, Play, CheckCircle2,
  AlertTriangle, FileCode2, Camera, Globe, Terminal,
  RefreshCw, GitBranch, ChevronRight, Layers,
  Sparkles, ChartBar, Clock, Zap, Bug, Wrench,
  ArrowRight, CircleDot, ChevronDown, ChevronUp, Lightbulb
} from 'lucide-react';
import { useDesigner } from '../../store';
import { copyToClipboard } from '../../utils/clipboard';
import { useThemeTokens } from './hooks/useThemeTokens';

/* ================================================================
   §8 Quality Assurance — Test Generator
   ================================================================ */

function generateUnitTests(panels: any[], components: any[]): string {
  const compTypes = [...new Set(components.map(c => c.type))];
  return `// ━━━ Auto-Generated Unit Tests ━━━
// Jest + React Testing Library
// Generated: ${new Date().toISOString()}
// Panels: ${panels.length} | Components: ${components.length}

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

${compTypes.map(type => {
  const sample = components.find(c => c.type === type);
  if (!sample) return '';
  const propsStr = Object.entries(sample.props)
    .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
    .join('\n');
  return `
// ── ${type} Component Tests ──
describe('${type}', () => {
  const defaultProps = {
${propsStr}
  };

  it('renders with default props', () => {
    render(<${type} {...defaultProps} />);
    expect(screen.getByRole('${type === 'Button' ? 'button' : type === 'Input' ? 'textbox' : 'region'}')).toBeInTheDocument();
  });

  it('handles prop changes', () => {
    const { rerender } = render(<${type} {...defaultProps} />);
    rerender(<${type} {...defaultProps} ${type === 'Button' ? 'label="Updated"' : type === 'Input' ? 'placeholder="Updated"' : ''} />);
    // Verify updated rendering
  });
${type === 'Button' ? `
  it('fires onClick handler', () => {
    const onClick = jest.fn();
    render(<${type} {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', () => {
    render(<${type} {...defaultProps} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
` : type === 'Input' ? `
  it('handles user input', () => {
    render(<${type} {...defaultProps} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    expect(input).toHaveValue('test value');
  });

  it('validates required field', () => {
    render(<${type} {...defaultProps} required />);
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    // Check validation message
  });
` : type === 'Table' ? `
  it('renders table rows', () => {
    render(<${type} {...defaultProps} data={mockData} />);
    expect(screen.getAllByRole('row')).toHaveLength(mockData.length + 1);
  });

  it('handles pagination', () => {
    render(<${type} {...defaultProps} data={mockData} pageSize={2} />);
    fireEvent.click(screen.getByText('下一页'));
    // Verify page change
  });
` : `
  it('matches snapshot', () => {
    const { container } = render(<${type} {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });
`}});
`;
}).join('\n')}

// ── Panel Integration Tests ──
${panels.map(p => {
  const panelComps = components.filter(c => c.panelId === p.id);
  return `
describe('Panel: ${p.name}', () => {
  it('renders all ${panelComps.length} components', () => {
    render(<Panel id="${p.id}" type="${p.type}" />);
${panelComps.map(c => `    expect(screen.getByTestId('${c.id}')).toBeInTheDocument();`).join('\n')}
  });

  it('handles component interaction', async () => {
    render(<Panel id="${p.id}" type="${p.type}" />);
    // Verify inter-component communication
  });
});`;
}).join('\n')}`;
}

function generateE2ETests(panels: any[], components: any[]): string {
  return `// ━━━ Auto-Generated E2E Tests ━━━
// Playwright
// Generated: ${new Date().toISOString()}

import { test, expect, type Page } from '@playwright/test';

// ── Test Configuration ──
test.describe.configure({ mode: 'serial' });

const BASE_URL = 'http://localhost:5173';

// ── Helper Functions ──
async function login(page: Page) {
  await page.goto(BASE_URL);
  // OpenAI OAuth flow would redirect here
  await page.waitForSelector('[data-testid="designer-canvas"]');
}

async function dragComponent(page: Page, type: string, panelId: string) {
  const palette = page.locator(\`[data-component-type="\${type}"]\`);
  const panel = page.locator(\`[data-panel-id="\${panelId}"]\`);
  await palette.dragTo(panel);
}

// ═══════════════════════════════════════
// Test Suite: Designer Core Workflow
// ═══════════════════════════════════════

test.describe('Designer Core', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('loads designer with all panels', async ({ page }) => {
    await expect(page.locator('[data-panel-id]')).toHaveCount(${panels.length});
  });

  test('can select a panel', async ({ page }) => {
    const panel = page.locator('[data-panel-id="${panels[0]?.id}"]');
    await panel.click();
    await expect(panel).toHaveClass(/border-indigo/);
  });

  test('can drag component to panel', async ({ page }) => {
    await dragComponent(page, 'Button', '${panels[0]?.id}');
    await expect(page.locator('[data-panel-id="${panels[0]?.id}"] button')).toBeVisible();
  });
});

// ═══════════════════════════════════════
// Test Suite: Panel Operations
// ═══════════════════════════════════════

test.describe('Panel Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('right-click shows context menu', async ({ page }) => {
    const panel = page.locator('[data-panel-id="${panels[0]?.id}"]');
    await panel.click({ button: 'right' });
    await expect(page.locator('text=拆分面板')).toBeVisible();
  });

  test('split panel horizontally', async ({ page }) => {
    const panel = page.locator('[data-panel-id="${panels[0]?.id}"]');
    await panel.click({ button: 'right' });
    await page.locator('text=拆分面板').hover();
    await page.locator('text=水平 2 等分').click();
    await expect(page.locator('[data-panel-id]')).toHaveCount(${panels.length + 1});
  });

  test('duplicate panel with Cmd+D', async ({ page }) => {
    const panel = page.locator('[data-panel-id="${panels[0]?.id}"]');
    await panel.click();
    await page.keyboard.press('Meta+d');
    await expect(page.locator('[data-panel-id]')).toHaveCount(${panels.length + 1});
  });

  test('double-click enters sub-canvas', async ({ page }) => {
    const panel = page.locator('[data-panel-id="${panels[0]?.id}"]');
    await panel.dblclick();
    await expect(page.locator('text=返回画布')).toBeVisible();
    await expect(page.locator('text=子画布模式')).toBeVisible();
  });

  test('Alt+arrow moves panel', async ({ page }) => {
    const panel = page.locator('[data-panel-id="${panels[0]?.id}"]');
    await panel.click();
    await page.keyboard.press('Alt+ArrowRight');
    // Verify position changed by 5px
  });

  test('merge panels via context menu', async ({ page }) => {
    const panel = page.locator('[data-panel-id="${panels[0]?.id}"]');
    await panel.click({ button: 'right' });
    await page.locator('text=合并到...').hover();
    await page.locator('text=${panels[1]?.name || '数据表格'}').click();
    await expect(page.locator('[data-panel-id]')).toHaveCount(${panels.length - 1});
  });
});

// ═══════════════════════════════════════
// Test Suite: Property Editing
// ═══════════════════════════════════════

test.describe('Inspector', () => {
  test('shows props when component selected', async ({ page }) => {
    await login(page);
    const comp = page.locator('[data-component-id="${components[0]?.id}"]');
    await comp.click();
    await expect(page.locator('[data-testid="inspector"]')).toBeVisible();
  });

  test('real-time preview updates on prop change', async ({ page }) => {
    await login(page);
    const comp = page.locator('[data-component-id="${components[0]?.id}"]');
    await comp.click();
    // Edit a prop in inspector
    // Verify preview updates within 300ms debounce
  });
});

// ═══════════════════════════════════════
// Test Suite: Code Generation → Deploy
// ═══════════════════════════════════════

test.describe('Code Generation & Deploy', () => {
  test('generates valid React code', async ({ page }) => {
    await login(page);
    await page.keyboard.press('Meta+e');
    await expect(page.locator('text=React TSX')).toBeVisible();
    const code = await page.locator('.monaco-editor').textContent();
    expect(code).toContain('import React');
  });

  test('deploy workflow completes', async ({ page }) => {
    await login(page);
    // Open deploy panel
    await page.keyboard.press('Meta+Shift+d');
    await page.locator('text=一键部署到容器').click();
    await expect(page.locator('text=部署完成')).toBeVisible({ timeout: 15000 });
  });

  test('design.json passes Zod validation', async ({ page }) => {
    await login(page);
    await page.keyboard.press('Meta+e');
    await expect(page.locator('text=Zod Schema Valid')).toBeVisible();
  });
});

// ═══════════════════════════════════════
// Test Suite: AI Assistant
// ═══════════════════════════════════════

test.describe('AI Assistant', () => {
  test('opens with F1', async ({ page }) => {
    await login(page);
    await page.keyboard.press('F1');
    await expect(page.locator('text=AI 智能助手')).toBeVisible();
  });

  test('sends message and receives response', async ({ page }) => {
    await login(page);
    await page.keyboard.press('F1');
    const input = page.locator('[data-testid="ai-input"]');
    await input.fill('帮我添加一个登录表单');
    await input.press('Enter');
    await expect(page.locator('.ai-message-assistant')).toBeVisible({ timeout: 10000 });
  });
});`;
}

function generateSnapshotTests(panels: any[], components: any[]): string {
  return `// ━━━ Auto-Generated Snapshot Tests ━━━
// Storybook + Chromatic
// Generated: ${new Date().toISOString()}

import type { Meta, StoryObj } from '@storybook/react';

${[...new Set(components.map(c => c.type))].map(type => {
  const sample = components.find(c => c.type === type);
  if (!sample) return '';
  return `
// ── ${type} Stories ──
const ${type}Meta: Meta<typeof ${type}> = {
  title: 'Components/${type}',
  component: ${type},
  tags: ['autodocs'],
  argTypes: {
${Object.entries(sample.props).map(([k, v]) => {
  const t = typeof v;
  return `    ${k}: { control: '${t === 'boolean' ? 'boolean' : t === 'number' ? 'number' : 'text'}' },`;
}).join('\n')}
  },
};

export default ${type}Meta;
type ${type}Story = StoryObj<typeof ${type}>;

export const Default: ${type}Story = {
  args: ${JSON.stringify(sample.props, null, 4).replace(/"/g, "'")},
};

export const ${type}Variants: ${type}Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <${type} {...${JSON.stringify(sample.props)}} />
    </div>
  ),
};
`;
}).join('\n')}

// ── Panel Layout Snapshots ──
${panels.map(p => `
export const Panel_${p.id.replace(/-/g, '_')}: StoryObj = {
  name: '${p.name}',
  render: () => <PanelContainer id="${p.id}" type="${p.type}" />,
  parameters: {
    chromatic: { viewports: [1280, 768] },
  },
};`).join('\n')}`;
}

function generateCIConfig(): string {
  return `# ━━━ YANYUCLOUD CI/CD Pipeline ━━━
# GitHub Actions
# Auto-generated configuration

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io

jobs:
  # ── Lint & Type Check ──
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  # ── Unit Tests ──
  unit-tests:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage --ci
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  # ── Snapshot Tests (Chromatic) ──
  snapshots:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx chromatic --project-token=\${{ secrets.CHROMATIC_TOKEN }}

  # ── E2E Tests (Playwright) ──
  e2e:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  # ── Build & Push Docker Image ──
  docker:
    runs-on: ubuntu-latest
    needs: [unit-tests, e2e]
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            \${{ env.REGISTRY }}/\${{ github.repository }}:latest
            \${{ env.REGISTRY }}/\${{ github.repository }}:\${{ github.sha }}`;
}

/* ================================================================
   Simulated Test Results
   ================================================================ */

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: string;
  assertions?: number;
}

interface PersistedTestState {
  results: TestResult[];
  timestamp: number;
}

const TEST_STORAGE_KEY = 'yanyucloud-test-results';
const FIXED_TESTS_KEY = 'yanyucloud-fixed-tests';

function loadTestResults(): PersistedTestState | null {
  try {
    const raw = localStorage.getItem(TEST_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTestState;
  } catch { return null; }
}

function saveTestResults(results: TestResult[]) {
  try {
    const state: PersistedTestState = { results, timestamp: Date.now() };
    localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function loadFixedTests(): Set<string> {
  try {
    const raw = localStorage.getItem(FIXED_TESTS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveFixedTests(names: Set<string>) {
  try { localStorage.setItem(FIXED_TESTS_KEY, JSON.stringify([...names])); } catch {}
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return `${Math.floor(diff / 86400_000)} 天前`;
}

const MOCK_RESULTS: TestResult[] = [
  { name: 'Button > renders with default props', status: 'pass', duration: '12ms', assertions: 2 },
  { name: 'Button > fires onClick handler', status: 'pass', duration: '8ms', assertions: 1 },
  { name: 'Button > respects disabled state', status: 'pass', duration: '5ms', assertions: 1 },
  { name: 'Input > handles user input', status: 'pass', duration: '15ms', assertions: 2 },
  { name: 'Input > validates required field', status: 'fail', duration: '22ms', assertions: 1 },
  { name: 'Table > renders table rows', status: 'pass', duration: '45ms', assertions: 3 },
  { name: 'Table > handles pagination', status: 'fail', duration: '52ms', assertions: 2 },
  { name: 'Chart > renders with default props', status: 'pass', duration: '34ms', assertions: 1 },
  { name: 'Stat > matches snapshot', status: 'pass', duration: '6ms', assertions: 1 },
  { name: 'Panel: 用户仪表盘 > renders all 3 components', status: 'pass', duration: '68ms', assertions: 3 },
  { name: 'Panel: 数据表格 > renders all 2 components', status: 'pass', duration: '42ms', assertions: 2 },
  { name: 'Panel: 分析图表 > renders all 1 components', status: 'pass', duration: '28ms', assertions: 1 },
  { name: 'Panel: 表单模块 > renders all 3 components', status: 'pass', duration: '55ms', assertions: 3 },
  { name: 'E2E > loads designer with all panels', status: 'pass', duration: '1.2s', assertions: 1 },
  { name: 'E2E > drag component to panel', status: 'pass', duration: '2.4s', assertions: 1 },
  { name: 'E2E > code generation valid', status: 'pass', duration: '3.1s', assertions: 2 },
  { name: 'E2E > deploy workflow', status: 'skip', duration: '0ms' },
];

/* ================================================================
   Component
   ================================================================ */

export function QualityPanel() {
  const { qualityPanelOpen, toggleQualityPanel, panels, components } = useDesigner();
  const t = useThemeTokens();
  const [activeTab, setActiveTab] = useState<'results' | 'unit' | 'e2e' | 'snapshot' | 'ci'>('results');
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [lastRunTimestamp, setLastRunTimestamp] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Array<{
    testName: string;
    diagnosis: string;
    rootCause: string;
    suggestion: string;
    fixCode: string;
    confidence: number;
    expanded: boolean;
  }>>([]);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [fixApplied, setFixApplied] = useState(false);

  // Load persisted test results on mount
  useEffect(() => {
    const persisted = loadTestResults();
    if (persisted && persisted.results.length > 0) {
      setResults(persisted.results);
      setLastRunTimestamp(persisted.timestamp);
    }
  }, []);

  const handleCopy = useCallback((text: string) => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleRunTests = useCallback(() => {
    setRunning(true);
    setResults([]);
    setLastRunTimestamp(null);
    setAnalysisResults([]);
    setFixApplied(false);
    setAnalysisStep(0);
    let idx = 0;
    const accumulated: TestResult[] = [];
    // Load fixed tests — tests that were previously auto-fixed should stay passing
    const fixedSet = loadFixedTests();
    const interval = setInterval(() => {
      if (idx < MOCK_RESULTS.length) {
        const item = MOCK_RESULTS[idx];
        idx++;
        if (item) {
          // If this test was previously fixed, override to pass
          const effective: TestResult = fixedSet.has(item.name) && item.status === 'fail'
            ? { ...item, status: 'pass' as const, duration: '48ms' }
            : item;
          accumulated.push(effective);
          setResults(prev => [...prev, effective]);
        }
      } else {
        setRunning(false);
        clearInterval(interval);
        saveTestResults(accumulated);
        setLastRunTimestamp(Date.now());
      }
    }, 200);
  }, []);

  const passCount = results.filter(r => r?.status === 'pass').length;
  const failCount = results.filter(r => r?.status === 'fail').length;
  const skipCount = results.filter(r => r?.status === 'skip').length;
  const failedTests = results.filter(r => r?.status === 'fail');

  // AI Smart Analysis handler
  const handleSmartAnalysis = useCallback(() => {
    if (failedTests.length === 0) return;
    setAnalyzing(true);
    setAnalysisResults([]);
    setFixApplied(false);
    setAnalysisStep(0);
    const steps = [
      { delay: 600 },  // Collecting error context
      { delay: 800 },  // Analyzing AST
      { delay: 1000 }, // Matching patterns
      { delay: 700 },  // Generating fix
    ];
    let totalDelay = 0;
    steps.forEach((s, i) => {
      totalDelay += s.delay;
      setTimeout(() => { setAnalysisStep(i + 1); }, totalDelay);
    });
    totalDelay += 500;
    setTimeout(() => {
      setAnalyzing(false);
      const failed = failedTests[0];
      setAnalysisResults(prev => [
        ...prev,
        {
          testName: failed.name,
          diagnosis: "fireEvent.click(screen.getByText('\u4e0b\u4e00\u9875')) \u629b\u51fa\u5f02\u5e38\uff1a\u672a\u627e\u5230\u5305\u542b\u6587\u672c\u300c\u4e0b\u4e00\u9875\u300d\u7684\u5143\u7d20\u3002Table \u7ec4\u4ef6\u7684\u5206\u9875\u6309\u94ae\u4f7f\u7528\u4e86 aria-label \u800c\u975e\u53ef\u89c1\u6587\u672c\u3002",
          rootCause: "Table \u7ec4\u4ef6\u7684\u5206\u9875\u63a7\u4ef6\u5728 v2.3 \u4e2d\u91cd\u6784\u4e3a\u56fe\u6807\u6309\u94ae\uff0c\u539f\u6765\u7684\u6587\u5b57\u6309\u94ae\u300c\u4e0a\u4e00\u9875 / \u4e0b\u4e00\u9875\u300d\u5df2\u66ff\u6362\u4e3a ChevronLeft / ChevronRight \u56fe\u6807\uff0c\u5e76\u4f7f\u7528 aria-label=\"\u4e0b\u4e00\u9875\" \u4f5c\u4e3a\u65e0\u969c\u788d\u6807\u6ce8\u3002\u6d4b\u8bd5\u4ee3\u7801\u4ecd\u7528 getByText \u67e5\u627e\uff0c\u5bfc\u81f4\u5339\u914d\u5931\u8d25\u3002",
          suggestion: "\u5c06 screen.getByText('\u4e0b\u4e00\u9875') \u66ff\u6362\u4e3a screen.getByRole('button', { name: '\u4e0b\u4e00\u9875' })\uff0c\u8fd9\u6837\u53ef\u4ee5\u540c\u65f6\u5339\u914d aria-label \u548c\u53ef\u89c1\u6587\u672c\uff0c\u63d0\u9ad8\u6d4b\u8bd5\u7684\u5065\u806f\u6027\u3002",
          fixCode: "// Before (failing):\nfireEvent.click(screen.getByText('\u4e0b\u4e00\u9875'));\n\n// After (fixed):\nfireEvent.click(\n  screen.getByRole('button', { name: '\u4e0b\u4e00\u9875' })\n);\n\n// Also update the assertion:\nawait waitFor(() => {\n  expect(screen.getByText('\u7b2c 2 \u9875')).toBeInTheDocument();\n});",
          confidence: 96,
          expanded: true,
        },
      ]);
    }, totalDelay);
  }, [failedTests]);

  // Apply fix handler
  const handleApplyFix = useCallback(() => {
    setFixApplied(true);
    // Persist fixed test names so they stay passing on re-run
    const fixedSet = loadFixedTests();
    results.filter(r => r.status === 'fail').forEach(r => fixedSet.add(r.name));
    saveFixedTests(fixedSet);
    // Simulate fixing the test and re-running
    setTimeout(() => {
      const fixedResults = results.map(r =>
        r.status === 'fail'
          ? { ...r, status: 'pass' as const, duration: '48ms' }
          : r
      );
      setResults(fixedResults);
      saveTestResults(fixedResults);
    }, 1500);
  }, [results]);

  if (!qualityPanelOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className={`absolute inset-0 ${t.overlayBg} backdrop-blur-md`} onClick={toggleQualityPanel} />
      <div
        className={`relative w-[860px] max-h-[90vh] ${t.modalBg} border ${t.modalBorder} rounded-2xl flex flex-col overflow-hidden`}
        style={{ boxShadow: t.modalShadow }}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.sectionBorder}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 flex items-center justify-center">
            <TestTube className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className={`text-[14px] ${t.textPrimary}`}>质量保障 · §8</div>
            <div className={`text-[11px] ${t.textTertiary}`}>Jest + RTL + Playwright + Storybook + Chromatic + GitHub Actions</div>
          </div>
          <button onClick={toggleQualityPanel} className={`p-2 rounded-lg ${t.textMuted} hover:text-white/60 ${t.hoverBg} transition-all`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 px-5 pt-3 pb-0 border-b ${t.sectionBorder} overflow-x-auto`}>
          {([
            { key: 'results' as const, label: '测试运行', icon: Play },
            { key: 'unit' as const, label: '单元测试', icon: FileCode2 },
            { key: 'e2e' as const, label: 'E2E 测试', icon: Globe },
            { key: 'snapshot' as const, label: '快照测试', icon: Camera },
            { key: 'ci' as const, label: 'CI/CD', icon: GitBranch },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11px] transition-all border-b-2 whitespace-nowrap ${
                activeTab === key
                  ? `${t.activeTabText} border-current ${t.activeBg}`
                  : `${t.textTertiary} border-transparent hover:text-white/50`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          {activeTab === 'results' && (
            <div className="space-y-4">
              {/* Run button & stats */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunTests}
                  disabled={running}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-green-500/15 border border-emerald-500/20 text-emerald-400 text-[12px] hover:from-emerald-500/25 hover:to-green-500/25 transition-all disabled:opacity-50"
                >
                  {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {running ? '运行中...' : '运行全部测试'}
                </button>
                {results.length > 0 && (
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-400">{passCount} 通过</span>
                    {failCount > 0 && <span className="text-red-400">{failCount} 失败</span>}
                    {skipCount > 0 && <span className={t.textMuted}>{skipCount} 跳过</span>}
                    <span className={t.textMuted}>共 {results.length}/{MOCK_RESULTS.length}</span>
                  </div>
                )}
                {/* Persisted timestamp */}
                {lastRunTimestamp && !running && (
                  <div className={`flex items-center gap-1 ml-auto text-[10px] ${t.textMuted}`}>
                    <Clock className="w-3 h-3" />
                    <span>上次运行: {formatRelativeTime(lastRunTimestamp)}</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {(running || results.length > 0) && (
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${failCount > 0 ? 'bg-gradient-to-r from-emerald-500 to-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(results.length / MOCK_RESULTS.length) * 100}%` }}
                  />
                </div>
              )}

              {/* Results list */}
              <div className="space-y-1">
                {results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all ${
                    r.status === 'fail' ? 'bg-red-500/[0.04]' : r.status === 'skip' ? 'bg-white/[0.01]' : 'hover:bg-white/[0.02]'
                  }`}>
                    {r.status === 'pass' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> :
                     r.status === 'fail' ? <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" /> :
                     <div className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0" />}
                    <span className={`text-[11px] flex-1 ${r.status === 'fail' ? 'text-red-400/80' : r.status === 'skip' ? 'text-white/20' : 'text-white/50'}`}>
                      {r.name}
                    </span>
                    {r.assertions && <span className="text-[9px] text-white/15">{r.assertions} assert</span>}
                    <span className="text-[9px] text-white/20 font-mono w-10 text-right">{r.duration}</span>
                  </div>
                ))}
                {running && (
                  <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-white/25">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    运行中...
                  </div>
                )}
              </div>

              {/* Coverage summary */}
              {results.length === MOCK_RESULTS.length && (
                <div className="grid grid-cols-4 gap-3 mt-3">
                  {[
                    { label: '语句覆盖', value: '87.3%', color: 'emerald' },
                    { label: '分支覆盖', value: '72.1%', color: 'amber' },
                    { label: '函数覆盖', value: '91.5%', color: 'emerald' },
                    { label: '行覆盖', value: '85.8%', color: 'emerald' },
                  ].map(m => (
                    <div key={m.label} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                      <div className={`text-[14px] text-${m.color}-400`}>{m.value}</div>
                      <div className="text-[9px] text-white/20 mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Coverage Suggestions */}
              {results.length === MOCK_RESULTS.length && !running && (
                <div className="rounded-xl border border-indigo-500/15 bg-gradient-to-br from-indigo-500/[0.03] to-violet-500/[0.02] p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-indigo-400" />
                    <span className="text-[12px] text-indigo-400/80">AI 覆盖率优化建议</span>
                  </div>
                  <div className="space-y-2 pl-6">
                    <div className="flex items-start gap-1.5 text-[10px] text-white/35">
                      <ChartBar className="w-3 h-3 text-amber-400/50 shrink-0 mt-0.5" />
                      <span><strong className="text-amber-400/60">分支覆盖率偏低 (72.1%)</strong>：建议为 Table 组件增加分页边界条件测试（空数据、单页、最后一页），并为 Input 组件添加 disabled/readonly/maxLength 等状态分支。</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[10px] text-white/35">
                      <Bug className="w-3 h-3 text-cyan-400/50 shrink-0 mt-0.5" />
                      <span><strong className="text-cyan-400/60">错误路径覆盖不足</strong>：Chart 组件缺少 data=null、data=[] 的异常渲染测试；Panel 集成测试未覆盖子面板嵌套和合并场景。</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-[10px] text-white/35">
                      <Sparkles className="w-3 h-3 text-emerald-400/50 shrink-0 mt-0.5" />
                      <span><strong className="text-emerald-400/60">快速提升建议</strong>：增加 5 个针对性用例可将分支覆盖率提升至约 85%+。可在「单元测试」标签页中自动生成推荐用例。</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Analysis */}
              {failedTests.length > 0 && !running && (
                <div className="rounded-xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.02] p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="text-[12px] text-amber-400/90">AI 智能分析修复</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/50">
                        {failedTests.length} 个失败
                      </span>
                    </div>
                    <button
                      onClick={handleSmartAnalysis}
                      disabled={analyzing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/20 text-amber-400 text-[11px] hover:from-amber-500/25 hover:to-orange-500/25 transition-all disabled:opacity-50"
                    >
                      {analyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {analyzing ? '分析中...' : analysisResults.length > 0 ? '重新分析' : '开始分析'}
                    </button>
                  </div>

                  {/* Analysis progress steps */}
                  {analyzing && (
                    <div className="flex items-center gap-2 px-1">
                      {[
                        { label: '收集错误上下文', icon: Bug },
                        { label: '分析 AST 结构', icon: Layers },
                        { label: '匹配修复模式', icon: Sparkles },
                        { label: '生成修复方案', icon: Wrench },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5 flex-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                            analysisStep > i
                              ? 'bg-amber-500/20 text-amber-400'
                              : analysisStep === i
                              ? 'bg-amber-500/10 text-amber-400/60 animate-pulse'
                              : 'bg-white/[0.03] text-white/15'
                          }`}>
                            {analysisStep > i ? (
                              <Check className="w-2.5 h-2.5" />
                            ) : (
                              <s.icon className="w-2.5 h-2.5" />
                            )}
                          </div>
                          <span className={`text-[9px] truncate ${
                            analysisStep >= i ? 'text-amber-400/60' : 'text-white/15'
                          }`}>{s.label}</span>
                          {i < 3 && (
                            <div className={`w-4 h-px ${analysisStep > i ? 'bg-amber-500/30' : 'bg-white/[0.06]'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Analysis Result Card */}
                  {analysisResults.map((result, index) => (
                    <div key={index} className="space-y-3">
                      {/* Collapsible header */}
                      <button
                        onClick={() => setAnalysisResults(prev => prev.map((r, i) => i === index ? { ...r, expanded: !r.expanded } : r))}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {result.expanded ? <ChevronDown className="w-3 h-3 text-white/30" /> : <ChevronRight className="w-3 h-3 text-white/30" />}
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span className="text-[11px] text-red-400/80 flex-1 truncate">{result.testName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/70">
                          置信度 {result.confidence}%
                        </span>
                      </button>

                      {result.expanded && (
                        <div className="space-y-2.5 pl-5">
                          {/* Diagnosis */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Bug className="w-3 h-3 text-red-400/60" />
                              <span className="text-[10px] text-red-400/60 uppercase tracking-wider">错误诊断</span>
                            </div>
                            <p className="text-[11px] text-white/45 leading-relaxed pl-4.5">{result.diagnosis}</p>
                          </div>

                          {/* Root cause */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <CircleDot className="w-3 h-3 text-amber-400/60" />
                              <span className="text-[10px] text-amber-400/60 uppercase tracking-wider">根本原因</span>
                            </div>
                            <p className="text-[11px] text-white/45 leading-relaxed pl-4.5">{result.rootCause}</p>
                          </div>

                          {/* Suggestion */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Lightbulb className="w-3 h-3 text-emerald-400/60" />
                              <span className="text-[10px] text-emerald-400/60 uppercase tracking-wider">修复建议</span>
                            </div>
                            <p className="text-[11px] text-emerald-400/50 leading-relaxed pl-4.5">{result.suggestion}</p>
                          </div>

                          {/* Fix code */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Terminal className="w-3 h-3 text-cyan-400/60" />
                                <span className="text-[10px] text-cyan-400/60 uppercase tracking-wider">修复代码</span>
                              </div>
                              <button
                                onClick={() => handleCopy(result.fixCode)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all"
                              >
                                {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                {copied ? '已复制' : '复制'}
                              </button>
                            </div>
                            <pre className="p-3 rounded-lg bg-black/20 border border-white/[0.04] text-[10px] leading-relaxed font-mono text-white/40 overflow-x-auto">
                              {result.fixCode}
                            </pre>
                          </div>

                          {/* Apply fix button */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={handleApplyFix}
                              disabled={fixApplied}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] transition-all ${
                                fixApplied
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/70 cursor-default'
                                  : 'bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border border-amber-500/20 text-amber-400 hover:from-amber-500/25 hover:to-emerald-500/25'
                              }`}
                            >
                              {fixApplied ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  已应用修复 · 重新运行通过
                                </>
                              ) : (
                                <>
                                  <Wrench className="w-3.5 h-3.5" />
                                  应用修复并重新测试
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                </>
                              )}
                            </button>
                            {fixApplied && (
                              <span className="text-[10px] text-emerald-400/40">全部 {results.length} 项测试通过</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'unit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/70">__tests__/components.test.tsx</span>
                <button
                  onClick={() => handleCopy(generateUnitTests(panels, components))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <pre className="p-4 text-[10px] leading-relaxed font-mono text-white/40 overflow-x-auto max-h-[50vh] overflow-y-auto">
                  {generateUnitTests(panels, components)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'e2e' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/70">e2e/designer.spec.ts</span>
                <button
                  onClick={() => handleCopy(generateE2ETests(panels, components))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <pre className="p-4 text-[10px] leading-relaxed font-mono text-white/40 overflow-x-auto max-h-[50vh] overflow-y-auto">
                  {generateE2ETests(panels, components)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'snapshot' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/70">stories/components.stories.tsx</span>
                <button
                  onClick={() => handleCopy(generateSnapshotTests(panels, components))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <pre className="p-4 text-[10px] leading-relaxed font-mono text-white/40 overflow-x-auto max-h-[50vh] overflow-y-auto">
                  {generateSnapshotTests(panels, components)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'ci' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/70">.github/workflows/ci.yml</span>
                <button
                  onClick={() => handleCopy(generateCIConfig())}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <pre className="p-4 text-[10px] leading-relaxed font-mono text-white/40 overflow-x-auto max-h-[50vh] overflow-y-auto">
                  {generateCIConfig()}
                </pre>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/[0.04] border border-blue-500/10 flex items-start gap-2">
                <GitBranch className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] text-blue-400/80">CI/CD 流水线</div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    PR 合并前自动运行: ESLint → 单元测试 → 快照测试 → E2E → Docker 构建推送。
                    需要配置 <code className="text-cyan-400/50 bg-white/[0.04] px-1 py-0.5 rounded">CHROMATIC_TOKEN</code> Secret。
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 py-3 border-t ${t.sectionBorder} ${t.surfaceInset}`}>
          <span className={`text-[10px] ${t.textMuted}`}>
            Jest + RTL + Playwright + Storybook + Chromatic + GitHub Actions
          </span>
          <button onClick={toggleQualityPanel} className={`px-4 py-1.5 rounded-lg ${t.badgeBg} ${t.textTertiary} text-[11px] ${t.hoverBg} transition-all`}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}