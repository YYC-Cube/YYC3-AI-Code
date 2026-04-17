#!/usr/bin/env node

/**
 * @file add-headers.js
 * @description 批量为代码文件添加团队标头，实现版本可追溯
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

// 团队标头模板
const HEADER_TEMPLATES = {
  typescript: (filePath, description, author = 'YanYuCloudCube Team') => `/**
 * @file ${filePath}
 * @description ${description}
 * @author ${author} <admin@0379.email>
 * @version v1.0.0
 * @created ${new Date().toISOString().split('T')[0]}
 * @updated ${new Date().toISOString().split('T')[0]}
 * @status stable
 * @license MIT
 * @copyright Copyright (c) ${new Date().getFullYear()} YanYuCloudCube Team
 * @tags core,typescript
 */\n\n`,

  javascript: (filePath, description, author = 'YanYuCloudCube Team') => `/**
 * @file ${filePath}
 * @description ${description}
 * @author ${author} <admin@0379.email>
 * @version v1.0.0
 * @created ${new Date().toISOString().split('T')[0]}
 * @updated ${new Date().toISOString().split('T')[0]}
 * @status stable
 * @license MIT
 * @copyright Copyright (c) ${new Date().getFullYear()} YanYuCloudCube Team
 * @tags core,javascript
 */\n\n`,

  tsx: (filePath, description, author = 'YanYuCloudCube Team') => `/**
 * @file ${filePath}
 * @description ${description}
 * @author ${author} <admin@0379.email>
 * @version v1.0.0
 * @created ${new Date().toISOString().split('T')[0]}
 * @updated ${new Date().toISOString().split('T')[0]}
 * @status stable
 * @license MIT
 * @copyright Copyright (c) ${new Date().getFullYear()} YanYuCloudCube Team
 * @tags core,typescript,react
 */\n\n`,

  jsx: (filePath, description, author = 'YanYuCloudCube Team') => `/**
 * @file ${filePath}
 * @description ${description}
 * @author ${author} <admin@0379.email>
 * @version v1.0.0
 * @created ${new Date().toISOString().split('T')[0]}
 * @updated ${new Date().toISOString().split('T')[0]}
 * @status stable
 * @license MIT
 * @copyright Copyright (c) ${new Date().getFullYear()} YanYuCloudCube Team
 * @tags core,javascript,react
 */\n\n`,
}

// 文件描述映射
const FILE_DESCRIPTIONS = {
  // Services
  'i18n-service.ts': '国际化服务 - 轻量级 i18n 运行时，翻译查找、插值、日期/数字/货币格式化、语言切换与持久化',
  'api-service.ts': 'API 服务 - 统一的 API 请求封装，支持拦截器、重试、错误处理',
  'auth-service.ts': '认证服务 - 用户认证、授权、令牌管理',
  'crypto-service.ts': '加密服务 - 数据加密解密、哈希计算、安全存储',
  'security-service.ts': '安全服务 - 安全策略、权限验证、安全审计',
  'code-generation-service.ts': '代码生成服务 - AI 代码生成、补全、优化',
  'code-quality-service.ts': '代码质量服务 - 代码质量分析、优化建议',
  'performance-monitor-service.ts': '性能监控服务 - 性能指标收集、分析、报告',
  'local-storage-service.ts': '本地存储服务 - 本地数据持久化、缓存管理',
  'persistence-service.ts': '持久化服务 - 数据持久化、离线支持',
  'plugin-service.ts': '插件服务 - 插件管理、生命周期、通信',
  'plugin-api.ts': '插件 API - 插件接口定义、扩展点',
  'host-bridge-service.ts': '宿主机桥接服务 - 原生能力桥接、文件系统、对话框',
  'monitoring-service.ts': '监控服务 - 应用监控、日志收集、告警',
  'intent-service.ts': '意图服务 - 用户意图识别、路由决策',
  'prompt-builder.ts': '提示词构建器 - AI 提示词构建、模板管理',
  'template-engine.ts': '模板引擎 - 代码模板渲染、变量替换',
  'quality-gate-service.ts': '质量门禁服务 - 代码质量检查、门禁控制',
  'test-runner-service.ts': '测试运行服务 - 测试执行、结果收集',
  'worker-service.ts': 'Worker 服务 - Web Worker 管理、任务调度',
  'ai-cost-service.ts': 'AI 成本服务 - AI 使用成本计算、预算管理',
  'tech-stack-version-manager.ts': '技术栈版本管理 - 依赖版本管理、更新检查',
  'route-decision-service.ts': '路由决策服务 - 智能路由、页面导航',

  // Stores
  'app-store.ts': '应用状态管理 - 全局应用状态、主题、语言',
  'theme-store.ts': '主题状态管理 - 主题切换、自定义主题',
  'layout-store.ts': '布局状态管理 - 面板布局、尺寸调整',
  'collab-store.ts': '协作状态管理 - 实时协作、用户状态',
  'branding-store.ts': '品牌状态管理 - 品牌配置、自定义',
  'plugin-store.ts': '插件状态管理 - 插件状态、配置',
  'preview-store.ts': '预览状态管理 - 预览状态、历史记录',
  'heartbeat-store.ts': '心跳状态管理 - 连接状态、在线检测',
  'multi-instance-store.tsx': '多实例状态管理 - 多实例管理、状态同步',
  'task-store.tsx': '任务状态管理 - 任务列表、状态跟踪',
  'offline-store.ts': '离线状态管理 - 离线检测、数据同步',
  'sync-store.ts': '同步状态管理 - 数据同步、冲突解决',
  'db-store.ts': '数据库状态管理 - 数据库连接、查询状态',
  'settings-store.ts': '设置状态管理 - 用户设置、偏好配置',
  'quick-actions-store.tsx': '快速操作状态管理 - 快速操作、快捷键',
  'file-tree-store.ts': '文件树状态管理 - 文件树、展开状态',
  'security-store.ts': '安全状态管理 - 安全设置、权限管理',
  'ai-service-store.ts': 'AI 服务状态管理 - AI 服务、模型配置',

  // Components
  'HomePage.tsx': '首页组件 - 应用首页、欢迎页面',
  'DesignerPage.tsx': '设计器页面 - 主设计器界面',
  'SettingsPage.tsx': '设置页面 - 应用设置、配置管理',
  'ArchitecturePage.tsx': '架构页面 - 系统架构展示',
  'DevToolsPage.tsx': '开发工具页面 - 开发工具、调试面板',
  'ErrorBoundary.tsx': '错误边界组件 - 错误捕获、友好提示',
  'App.tsx': '应用根组件 - 应用入口、路由配置',

  // Designer Components
  'LeftPanel.tsx': '左侧面板组件 - 文件树、导航',
  'RightPanel.tsx': '右侧面板组件 - 属性面板、配置',
  'CenterPanel.tsx': '中间面板组件 - 代码编辑器、预览',
  'TopNavBar.tsx': '顶部导航栏组件 - 导航菜单、工具栏',
  'CodeIntelligence.tsx': '代码智能组件 - AI 代码补全、建议',
  'CodeTranslator.tsx': '代码翻译组件 - 代码翻译、转换',
  'CollabIndicator.tsx': '协作指示器组件 - 在线用户、协作状态',
  'CommandPalette.tsx': '命令面板组件 - 命令搜索、快捷操作',
  'CreateProjectDialog.tsx': '创建项目对话框组件 - 项目创建、模板选择',
  'DatabaseManager.tsx': '数据库管理器组件 - 数据库连接、查询',
  'DiffViewer.tsx': '差异查看器组件 - 代码差异、合并',
  'EnvVarsPanel.tsx': '环境变量面板组件 - 环境变量管理',
  'FileSystemManager.tsx': '文件系统管理器组件 - 文件浏览、操作',
  'FlameGraph.tsx': '火焰图组件 - 性能火焰图、分析',
  'GanttView.tsx': '甘特图组件 - 项目甘特图、时间线',
  'HeartbeatManager.tsx': '心跳管理器组件 - 连接心跳、状态监控',
  'LayoutManager.tsx': '布局管理器组件 - 布局调整、面板管理',
  'ModelSettings.tsx': '模型设置组件 - AI 模型配置、参数调整',
  'MultiInstancePanel.tsx': '多实例面板组件 - 多实例管理、切换',
  'NotificationCenter.tsx': '通知中心组件 - 通知展示、管理',
  'PerfDashboard.tsx': '性能仪表板组件 - 性能指标、图表',
  'PluginManager.tsx': '插件管理器组件 - 插件列表、管理',
  'PreviewPanel.tsx': '预览面板组件 - 实时预览、多设备',
  'QuickActionsPanel.tsx': '快速操作面板组件 - 快速操作、常用功能',
  'SecurityPanel.tsx': '安全面板组件 - 安全设置、权限管理',
  'SyncStatusBar.tsx': '同步状态栏组件 - 同步状态、进度',
  'TaskBoardPanel.tsx': '任务板面板组件 - 任务管理、看板',
  'BrandingPanel.tsx': '品牌面板组件 - 品牌配置、自定义',

  // Theme Components
  'ThemeProvider.tsx': '主题提供者组件 - 主题管理、切换',
  'ThemeCustomizer.tsx': '主题自定义组件 - 主题自定义、颜色调整',
  'LiquidGlassBackground.tsx': '液态玻璃背景组件 - 玻璃态背景、视觉效果',

  // Icon Components
  'AppIcon.tsx': '应用图标组件 - 应用图标、展示',
  'icon-registry.ts': '图标注册表 - 图标注册、管理',
  'index.ts': '图标索引 - 图标导出、统一接口',

  // Figma Components
  'ImageWithFallback.tsx': '图片回退组件 - 图片加载、回退处理',

  // Utils
  'logger.ts': '日志工具 - 统一日志接口、多级别输出',
  'validation.ts': '验证工具 - 数据验证、格式检查',
  'api-client.ts': 'API 客户端 - HTTP 客户端、请求封装',
  'data-export.ts': '数据导出工具 - 数据导出、格式转换',
  'debounce.ts': '防抖工具 - 函数防抖、性能优化',
  'useI18n.ts': '国际化 Hook - 国际化 Hook、语言切换',
  'time-format.ts': '时间格式化工具 - 时间格式化、相对时间',
  'liquid-glass.ts': '液态玻璃工具 - 玻璃态样式、视觉效果',

  // Workers
  'backup-worker.ts': '备份 Worker - 数据备份、后台处理',
  'diff-worker.ts': '差异 Worker - 代码差异、后台计算',
  'paging-worker.ts': '分页 Worker - 数据分页、后台处理',

  // Types
  'models.ts': '数据模型 - 通用数据模型定义',
  'index.ts': '类型索引 - 类型导出、统一接口',
  'security.ts': '安全类型 - 安全相关类型定义',
  'api.ts': 'API 类型 - API 相关类型定义',
  'storage.ts': '存储类型 - 存储相关类型定义',
  'architecture.ts': '架构类型 - 架构相关类型定义',
  'i18n.ts': '国际化类型 - 国际化相关类型定义',
  'codegen.ts': '代码生成类型 - 代码生成相关类型定义',
  'testing.ts': '测试类型 - 测试相关类型定义',

  // Config
  'vite.config.ts': 'Vite 配置 - 构建工具配置、插件设置',
  'vitest.config.ts': 'Vitest 配置 - 测试框架配置、覆盖率设置',

  // Routes
  'routes.ts': '路由配置 - 应用路由、导航配置',

  // Test files
  'setup.ts': '测试设置 - 测试环境配置、Mock 设置',
  'data.ts': '测试数据 - Mock 数据、测试用例',
}

// 需要跳过的文件（已有标头或不需要标头）
const SKIP_FILES = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  'YYC3-AI',
  'docs',
  'public',
  'imports',
]

// 需要特殊处理的文件（已有部分标头）
const SPECIAL_FILES = [
  'i18n-service.ts',
]

/**
 * 获取文件类型
 */
function getFileType(filePath) {
  const ext = path.extname(filePath)
  switch (ext) {
    case '.ts':
      return 'typescript'
    case '.tsx':
      return 'tsx'
    case '.js':
      return 'javascript'
    case '.jsx':
      return 'jsx'
    default:
      return 'typescript'
  }
}

/**
 * 检查文件是否已有标头
 */
function hasHeader(content) {
  return content.includes('@file') || content.includes('@description')
}

/**
 * 为文件添加标头
 */
function addHeaderToFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileName = path.basename(filePath)

    // 跳过已有标头的文件
    if (hasHeader(content)) {
      console.log(`✓ 跳过（已有标头）: ${fileName}`)
      return
    }

    // 获取文件类型和描述
    const fileType = getFileType(filePath)
    const description = FILE_DESCRIPTIONS[fileName] || `${fileType} 模块 - ${fileName}`

    // 生成标头
    const template = HEADER_TEMPLATES[fileType]
    const header = template(fileName, description)

    // 写入文件
    fs.writeFileSync(filePath, header + content, 'utf-8')
    console.log(`✓ 已添加标头: ${fileName}`)
  } catch (error) {
    console.error(`✗ 处理失败: ${filePath}`, error.message)
  }
}

/**
 * 递归遍历目录
 */
function processDirectory(dir, maxDepth = 10, currentDepth = 0) {
  if (currentDepth > maxDepth) return

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    // 跳过指定目录
    if (SKIP_FILES.some(skip => fullPath.includes(skip))) {
      continue
    }

    if (entry.isDirectory()) {
      processDirectory(fullPath, maxDepth, currentDepth + 1)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        addHeaderToFile(fullPath)
      }
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始批量添加团队标头...\n')

  const srcDir = path.join(PROJECT_ROOT, 'src')
  const testsDir = path.join(PROJECT_ROOT, 'tests')

  console.log('📁 处理 src/ 目录')
  processDirectory(srcDir)

  console.log('\n📁 处理 tests/ 目录')
  processDirectory(testsDir)

  console.log('\n📁 处理根目录配置文件')
  const configFiles = ['vite.config.ts', 'vitest.config.ts', 'tsconfig.json']
  configFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file)
    if (fs.existsSync(filePath)) {
      addHeaderToFile(filePath)
    }
  })

  console.log('\n✅ 团队标头添加完成！')
  console.log('\n📋 统计信息：')
  console.log('   - 已处理文件数：', processedCount)
  console.log('   - 跳过文件数：', skippedCount)
  console.log('   - 错误文件数：', errorCount)
}

// 统计计数器
let processedCount = 0
let skippedCount = 0
let errorCount = 0

// 覆盖 addHeaderToFile 函数以更新计数器
const originalAddHeader = addHeaderToFile
addHeaderToFile = function(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileName = path.basename(filePath)

    if (hasHeader(content)) {
      skippedCount++
      console.log(`✓ 跳过（已有标头）: ${fileName}`)
      return
    }

    const fileType = getFileType(filePath)
    const description = FILE_DESCRIPTIONS[fileName] || `${fileType} 模块 - ${fileName}`
    const template = HEADER_TEMPLATES[fileType]
    const header = template(fileName, description)

    fs.writeFileSync(filePath, header + content, 'utf-8')
    processedCount++
    console.log(`✓ 已添加标头: ${fileName}`)
  } catch (error) {
    errorCount++
    console.error(`✗ 处理失败: ${filePath}`, error.message)
  }
}

// 运行主函数
main()