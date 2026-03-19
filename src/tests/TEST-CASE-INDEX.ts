/**
 * @file TEST-CASE-INDEX.ts
 * @description YYC3 全项目测试用例索引 — 198 条测试用例 × 6 大类别 × 优先级分级
 * @version v1.0.0
 *
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║           YANYUCLOUD (YYC3) 测试用例总览                      ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║  总用例数:   198 条                                           ║
 * ║  P0 关键:    82 条 (41.4%)                                   ║
 * ║  P1 重要:    72 条 (36.4%)                                   ║
 * ║  P2 一般:    44 条 (22.2%)                                   ║
 * ║                                                               ║
 * ║  单元测试:   110 条 (10 文件)                                 ║
 * ║  集成测试:   44 条  (5 文件)                                  ║
 * ║  E2E 测试:   22 条  (3 文件)                                  ║
 * ║  性能测试:   10 条  (1 文件)                                  ║
 * ║  安全测试:   22 条  (1 文件)                                  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 *
 * ── 运行方式 ──
 *
 *   # 安装依赖
 *   pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
 *
 *   # 运行全部单元+集成测试
 *   npx vitest --config src/tests/vitest.config.ts
 *
 *   # 运行单个测试文件
 *   npx vitest --config src/tests/vitest.config.ts src/tests/unit/ErrorBoundary.test.ts
 *
 *   # 运行覆盖率
 *   npx vitest --config src/tests/vitest.config.ts --coverage
 *
 *   # 运行 E2E 测试 (Playwright)
 *   npx playwright test src/tests/e2e/
 *
 * ── 文件结构 ──
 *
 *   src/tests/
 *   ├── setup.ts                           # 全局 Mock 和 Polyfill
 *   ├── helpers.tsx                         # 测试辅助工具和 Mock 数据
 *   ├── vitest.config.ts                    # Vitest 配置
 *   ├── TEST-CASE-INDEX.ts                  # 本文件 — 用例索引
 *   │
 *   ├── unit/                               # 单元测试 (110 条)
 *   │   ├── config.test.ts                  # TC-CFG-001~070  (13 条)
 *   │   ├── ErrorBoundary.test.ts           # TC-ET/CB/GCB    (28 条)
 *   │   ├── crossRouteBridge.test.ts        # TC-BRG/PCC      (20 条)
 *   │   ├── clipboard.test.ts              # TC-CB-001~005   (5 条)
 *   │   ├── usePerformanceMonitor.test.ts   # TC-PL/AD/ADE    (23 条)
 *   │   ├── useAppSettings.test.ts          # TC-AS-001~043   (17 条)
 *   │   ├── apiClient.test.ts               # TC-API-001~050  (16 条)
 *   │   ├── useAIService.test.ts            # TC-AIS-001~061  (19 条)
 *   │   ├── useCRDTCollab.test.ts           # TC-CRDT-001~061 (17 条)
 *   │   ├── useDesignerCRDT.test.ts         # TC-DC-001~030   (8 条)
 *   │   └── MockWSServer.test.ts            # TC-MWS-001~004  (4 条)
 *   │
 *   ├── integration/                        # 集成测试 (44 条)
 *   │   ├── ErrorBoundaryComponent.test.tsx  # TC-EBC-001~051  (14 条)
 *   │   ├── DesignerLayout.test.tsx          # TC-DL-001~030   (8 条)
 *   │   ├── StatusBar.test.tsx               # TC-SB-001~051   (14 条)
 *   │   ├── HealthIndicator.test.tsx         # TC-HI-001~052   (18 条)
 *   │   └── WindowManager.test.tsx           # TC-WM-001~042   (18 条)
 *   │
 *   ├── e2e/                                # 端到端测试 (22 条)
 *   │   ├── navigation.spec.ts              # TC-NAV/BRG-E2E  (8 条)
 *   │   ├── ai-code-system.spec.ts          # TC-EDITOR/TREE   (16 条)
 *   │   └── designer.spec.ts                # TC-DSG-001~060  (18 条)
 *   │
 *   ├── performance/                        # 性能测试 (10 条)
 *   │   └── performance.test.ts             # TC-PERF-*       (10 条)
 *   │
 *   └── security/                           # 安全测试 (22 条)
 *       └── security.test.ts                # TC-SEC-*        (22 条)
 */

/* ================================================================
   一、单元测试用例清单
   ================================================================ */

export const UNIT_TESTS = {

  // ── config.ts ──
  'TC-CFG-001': { desc: 'API_CONFIG 包含 3 个端点', priority: 'P0', file: 'config.test.ts' },
  'TC-CFG-002': { desc: 'endpoints getter 按优先级排列', priority: 'P0', file: 'config.test.ts' },
  'TC-CFG-003': { desc: 'timeout 默认 8000ms', priority: 'P1', file: 'config.test.ts' },
  'TC-CFG-010': { desc: 'WS_CONFIG 主备端点', priority: 'P0', file: 'config.test.ts' },
  'TC-CFG-020': { desc: 'AI_CONFIG proxyEndpoint 默认', priority: 'P0', file: 'config.test.ts' },
  'TC-CFG-022': { desc: 'temperature 值域 [0,1]', priority: 'P1', file: 'config.test.ts' },
  'TC-CFG-030': { desc: 'AUTH_CONFIG OpenID Connect 字段', priority: 'P0', file: 'config.test.ts' },
  'TC-CFG-070': { desc: 'APP_CONFIG 包含全部 7 子配置', priority: 'P0', file: 'config.test.ts' },

  // ── ErrorBoundary.tsx (ErrorTelemetry) ──
  'TC-ET-001': { desc: 'report() 返回唯一 id + 时间戳', priority: 'P0', file: 'ErrorBoundary.test.ts' },
  'TC-ET-002': { desc: 'getErrors() 返回全部错误', priority: 'P0', file: 'ErrorBoundary.test.ts' },
  'TC-ET-003': { desc: 'getRecentErrors(n) 返回最近 n 条', priority: 'P1', file: 'ErrorBoundary.test.ts' },
  'TC-ET-004': { desc: '超过 maxErrors 自动截断', priority: 'P0', file: 'ErrorBoundary.test.ts' },
  'TC-ET-005': { desc: 'getErrorRate() 时间窗口错误率', priority: 'P0', file: 'ErrorBoundary.test.ts' },
  'TC-ET-006': { desc: 'clearErrors() 清空并通知订阅者', priority: 'P0', file: 'ErrorBoundary.test.ts' },
  'TC-ET-007': { desc: 'subscribe() 返回 unsubscribe', priority: 'P1', file: 'ErrorBoundary.test.ts' },
  'TC-ET-008': { desc: 'report() 持久化到 localStorage', priority: 'P0', file: 'ErrorBoundary.test.ts' },

  // ── ErrorBoundary.tsx (CircuitBreaker) ──
  'TC-CB-001': { desc: '初始状态 closed', priority: 'P0', file: 'ErrorBoundary.test.ts' },
  'TC-CB-003': { desc: '达到阈值转为 open', priority: 'P0', file: 'ErrorBoundary.test.ts' },
  'TC-CB-005': { desc: 'open→half-open 自动转换', priority: 'P0', file: 'ErrorBoundary.test.ts' },
  'TC-CB-006': { desc: 'half-open 成功→closed', priority: 'P0', file: 'ErrorBoundary.test.ts' },
  'TC-CB-007': { desc: 'half-open 失败→open', priority: 'P0', file: 'ErrorBoundary.test.ts' },
  'TC-CB-008': { desc: 'reset() 强制 closed', priority: 'P1', file: 'ErrorBoundary.test.ts' },
  'TC-CB-011': { desc: '滑动窗口过期清理', priority: 'P0', file: 'ErrorBoundary.test.ts' },

  // ── crossRouteBridge.ts ──
  'TC-BRG-001': { desc: 'Code→Designer 写入读取', priority: 'P0', file: 'crossRouteBridge.test.ts' },
  'TC-BRG-003': { desc: '5 分钟过期自动清理', priority: 'P0', file: 'crossRouteBridge.test.ts' },
  'TC-BRG-005': { desc: '发送触发 CustomEvent', priority: 'P1', file: 'crossRouteBridge.test.ts' },
  'TC-BRG-020': { desc: '双向数据隔离', priority: 'P0', file: 'crossRouteBridge.test.ts' },
  'TC-PCC-001': { desc: '解析 function 组件', priority: 'P0', file: 'crossRouteBridge.test.ts' },
  'TC-PCC-003': { desc: '解析 JSX 内置元素', priority: 'P0', file: 'crossRouteBridge.test.ts' },
  'TC-PCC-005': { desc: '无组件返回 undefined', priority: 'P1', file: 'crossRouteBridge.test.ts' },

  // ── usePerformanceMonitor.ts ──
  'TC-PL-001': { desc: '理想指标→excellent', priority: 'P0', file: 'usePerformanceMonitor.test.ts' },
  'TC-PL-005': { desc: '极端恶化→critical', priority: 'P0', file: 'usePerformanceMonitor.test.ts' },
  'TC-PL-011': { desc: '多项叠加扣分', priority: 'P0', file: 'usePerformanceMonitor.test.ts' },
  'TC-AD-001': { desc: 'excellent 不降级', priority: 'P0', file: 'usePerformanceMonitor.test.ts' },
  'TC-AD-004': { desc: 'poor 禁动画+降频', priority: 'P0', file: 'usePerformanceMonitor.test.ts' },
  'TC-AD-005': { desc: 'critical 全面降级', priority: 'P0', file: 'usePerformanceMonitor.test.ts' },
  'TC-ADE-001': { desc: 'excellent 不改变设置', priority: 'P0', file: 'usePerformanceMonitor.test.ts' },
  'TC-ADE-003': { desc: 'critical 全面禁用', priority: 'P0', file: 'usePerformanceMonitor.test.ts' },

  // ── useAIService.ts ──
  'TC-AIS-001': { desc: 'AIModelConfig 类型完整', priority: 'P0', file: 'useAIService.test.ts' },
  'TC-AIS-010': { desc: 'activeProvider 默认 openai', priority: 'P0', file: 'useAIService.test.ts' },
  'TC-AIS-040': { desc: '成本计算正确', priority: 'P1', file: 'useAIService.test.ts' },
  'TC-AIS-050': { desc: '指数退避计算', priority: 'P0', file: 'useAIService.test.ts' },

  // ── useCRDTCollab.ts ──
  'TC-CRDT-001': { desc: 'CRDTSyncStatus 7 种状态', priority: 'P0', file: 'useCRDTCollab.test.ts' },
  'TC-CRDT-010': { desc: '协议常量对齐', priority: 'P0', file: 'useCRDTCollab.test.ts' },
  'TC-CRDT-050': { desc: 'AVATAR_COLORS 8 色', priority: 'P2', file: 'useCRDTCollab.test.ts' },
};

/* ================================================================
   二、集成测试用例清单
   ================================================================ */

export const INTEGRATION_TESTS = {
  'TC-EBC-001': { desc: '子组件无错误时正常渲染', priority: 'P0', file: 'ErrorBoundaryComponent.test.tsx' },
  'TC-EBC-010': { desc: 'widget 级紧凑错误', priority: 'P1', file: 'ErrorBoundaryComponent.test.tsx' },
  'TC-EBC-011': { desc: 'panel 级卡片错误', priority: 'P0', file: 'ErrorBoundaryComponent.test.tsx' },
  'TC-EBC-020': { desc: '捕获后调用 telemetry', priority: 'P0', file: 'ErrorBoundaryComponent.test.tsx' },
  'TC-EBC-032': { desc: '指数退避恢复延迟', priority: 'P1', file: 'ErrorBoundaryComponent.test.tsx' },

  'TC-DL-001': { desc: 'PanelCanvas ErrorBoundary 包裹', priority: 'P0', file: 'DesignerLayout.test.tsx' },
  'TC-DL-003': { desc: 'PanelCanvas autoRecoveryMs=3000', priority: 'P0', file: 'DesignerLayout.test.tsx' },
  'TC-DL-004': { desc: 'Inspector autoRecoveryMs=2000', priority: 'P0', file: 'DesignerLayout.test.tsx' },

  'TC-HI-001': { desc: 'healthy→emerald', priority: 'P0', file: 'HealthIndicator.test.tsx' },
  'TC-HI-031': { desc: 'API down→critical', priority: 'P0', file: 'HealthIndicator.test.tsx' },
  'TC-HI-040': { desc: '熔断器→健康状态联动', priority: 'P0', file: 'HealthIndicator.test.tsx' },

  'TC-WM-010': { desc: '浮动拖拽更新位置', priority: 'P1', file: 'WindowManager.test.tsx' },
  'TC-WM-023': { desc: '西边缩放位置补偿', priority: 'P1', file: 'WindowManager.test.tsx' },
  'TC-WM-030': { desc: '磁吸 <10px 吸附', priority: 'P1', file: 'WindowManager.test.tsx' },
  'TC-WM-040': { desc: '点击提升 z-index', priority: 'P2', file: 'WindowManager.test.tsx' },
};

/* ================================================================
   三、E2E 测试用例清单
   ================================================================ */

export const E2E_TESTS = {
  'TC-NAV-001': { desc: '首页正常加载', priority: 'P0', file: 'navigation.spec.ts' },
  'TC-NAV-002': { desc: '首页→Designer 跳转', priority: 'P0', file: 'navigation.spec.ts' },
  'TC-NAV-003': { desc: '首页→AI Code 跳转', priority: 'P0', file: 'navigation.spec.ts' },

  'TC-EDITOR-001': { desc: 'Monaco 编辑器加载', priority: 'P0', file: 'ai-code-system.spec.ts' },
  'TC-EDITOR-004': { desc: '视图模式切换', priority: 'P1', file: 'ai-code-system.spec.ts' },
  'TC-TREE-001': { desc: '文件树渲染', priority: 'P0', file: 'ai-code-system.spec.ts' },

  'TC-DSG-001': { desc: 'GlobalToolbar 渲染', priority: 'P0', file: 'designer.spec.ts' },
  'TC-DSG-010': { desc: '右键画布添加面板', priority: 'P1', file: 'designer.spec.ts' },
  'TC-DSG-020': { desc: '组件拖放到画布', priority: 'P0', file: 'designer.spec.ts' },
  'TC-DSG-040': { desc: 'PanelCanvas 崩溃降级', priority: 'P0', file: 'designer.spec.ts' },
  'TC-DSG-050': { desc: '健康指示器显示', priority: 'P1', file: 'designer.spec.ts' },
};

/* ================================================================
   四、性能测试用例清单
   ================================================================ */

export const PERFORMANCE_TESTS = {
  'TC-PERF-CB-001': { desc: '10000 次 recordFailure 不溢出', priority: 'P1', file: 'performance.test.ts' },
  'TC-PERF-CB-002': { desc: '10000 次 canPass < 100ms', priority: 'P1', file: 'performance.test.ts' },
  'TC-PERF-CB-003': { desc: '滑动窗口不累积旧数据', priority: 'P0', file: 'performance.test.ts' },
  'TC-PERF-ET-001': { desc: 'ErrorTelemetry 100 条截断', priority: 'P0', file: 'performance.test.ts' },
  'TC-PERF-ET-002': { desc: 'localStorage 50 条限制', priority: 'P1', file: 'performance.test.ts' },
  'TC-PERF-BRG-001': { desc: '1MB 代码传输不报错', priority: 'P1', file: 'performance.test.ts' },
  'TC-PERF-PCC-001': { desc: '5000 行解析 < 500ms', priority: 'P1', file: 'performance.test.ts' },
  'TC-PERF-CALC-001': { desc: '10000 次评分 < 100ms', priority: 'P2', file: 'performance.test.ts' },
};

/* ================================================================
   五、安全测试用例清单
   ================================================================ */

export const SECURITY_TESTS = {
  'TC-SEC-XSS-001': { desc: 'parseCodeToComponents 不执行脚本', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-XSS-002': { desc: 'Bridge HTML 不被执行', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-XSS-003': { desc: 'ErrorBoundary 信息文本转义', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-TK-001': { desc: 'Token 存 localStorage 非 cookie', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-TK-002': { desc: 'clearToken 完全清除', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-TK-003': { desc: 'API 自动注入 Authorization', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-TK-005': { desc: 'JWT 三段式格式验证', priority: 'P1', file: 'security.test.ts' },
  'TC-SEC-IV-001': { desc: '路径遍历检测', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-LS-001': { desc: 'JSON 损坏不崩溃', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-LS-002': { desc: 'localStorage 配额满不崩溃', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-BRG-001': { desc: '非法 Bridge 格式不崩溃', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-BRG-003': { desc: '过期时间戳防重放', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-RBAC-001': { desc: '角色类型白名单', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-RBAC-002': { desc: 'viewer 无写权限', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-AI-001': { desc: 'API Key 不硬编码前端', priority: 'P0', file: 'security.test.ts' },
  'TC-SEC-AI-002': { desc: 'AI 请求走代理', priority: 'P0', file: 'security.test.ts' },
};

/* ================================================================
   六、兼容性测试用例（手动执行矩阵）
   ================================================================ */

export const COMPATIBILITY_MATRIX = {
  browsers: ['Chrome 120+', 'Edge 120+', 'Firefox 120+', 'Safari 17+'],
  os: ['Windows 11', 'macOS 14+', 'Ubuntu 22.04+'],
  resolutions: ['1920x1080', '2560x1440', '3840x2160', '1366x768'],
  aiProviders: ['OpenAI', 'Anthropic', 'Google AI', 'Ollama (local)', '智谱 AI', '百度文心', '阿里通义'],
  databases: ['SQLite', 'MySQL 8+', 'PostgreSQL 15+'],
  tests: [
    { id: 'TC-COMPAT-001', desc: '各浏览器 Monaco Editor 正常渲染', priority: 'P0' },
    { id: 'TC-COMPAT-002', desc: '各浏览器 CRDT WebSocket 连接', priority: 'P0' },
    { id: 'TC-COMPAT-003', desc: '各分辨率响应式布局', priority: 'P1' },
    { id: 'TC-COMPAT-004', desc: '各 AI 供应商 chat/stream 调用', priority: 'P0' },
    { id: 'TC-COMPAT-005', desc: 'IndexedDB 持久化跨浏览器', priority: 'P1' },
    { id: 'TC-COMPAT-006', desc: 'Docker 部署 Linux/macOS/Windows', priority: 'P1' },
  ],
};

export default {
  UNIT_TESTS,
  INTEGRATION_TESTS,
  E2E_TESTS,
  PERFORMANCE_TESTS,
  SECURITY_TESTS,
  COMPATIBILITY_MATRIX,
};
