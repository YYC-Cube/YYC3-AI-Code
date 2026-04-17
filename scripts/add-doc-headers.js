#!/usr/bin/env node

/**
 * @file add-doc-headers.js
 * @description 批量为 Markdown 文档添加团队文档标头，实现版本可追溯
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

// 团队文档标头模板
const DOC_HEADER_TEMPLATE = (fileName, description, category, tags = 'general,zh-CN') => `---
file: ${fileName}
description: ${description}
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: ${new Date().toISOString().split('T')[0]}
updated: ${new Date().toISOString().split('T')[0]}
status: stable
tags: ${tags}
category: ${category}
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

`

// 文档描述映射
const DOC_DESCRIPTIONS = {
  // 根目录文档
  'README.md': 'YYC³ AI Code 项目主文档，包含项目介绍、快速开始、开发指南等',
  'VERSION_REPORT.md': 'YYC³ AI Code 版本追溯报告，记录所有文件的版本变更历史',
  'YYC3-AI-「文档总览」.md': 'YYC³ AI Code 文档总览，提供所有文档的索引和导航',
  'YYC3-AI-「团队标头-实施总结」.md': '团队标头实施总结文档，记录标头添加和版本追溯的实施过程',

  // 团队规范文档
  'YYC3-团队代码-代码标头.md': 'YYC³ 团队代码标头格式范本，定义代码文件的标头规范',
  'YYC3-团队文档-文档标头.md': 'YYC³ 团队文档标头格式范本，定义文档文件的标头规范',

  // 变量词库文档
  'YYC3-AI-「变量词库-环境变量配置」.md': '环境变量配置文档，定义所有环境变量的配置和使用方法',
  'YYC3-AI-「变量词库-配置参数」.md': '配置参数文档，定义所有配置参数的类型和默认值',
  'YYC3-AI-「变量词库-技术栈版本」.md': '技术栈版本文档，记录所有依赖包的版本信息',

  // 开发指南文档
  'YYC3-AI-「开发者文档-开发指南」.md': '开发者指南文档，提供完整的开发环境搭建和开发流程说明',
  'YYC3-AI-「开发指南-主题设计系统」.md': '主题设计系统文档，介绍 YYC³ 的主题架构和自定义方法',
  'YYC3-AI-「开发指南-液态玻璃设计」.md': '液态玻璃设计文档，介绍玻璃态设计系统的实现和使用',
  'YYC3-AI-「开发指南-规范01」.md': '开发规范文档第一部分，定义代码编写和项目结构规范',
  'YYC3-AI-「开发指南-规范02」.md': '开发规范文档第二部分，定义测试和部署规范',

  // 项目文档
  'YYC3-AI-「项目文档-资产清单」.md': '资产清单文档，记录项目中的所有资源和资产',
  'YYC3-AI-「项目文档-索引」.md': '项目文档索引，提供所有项目文档的导航',
  'YYC3-AI-「项目文档-开发交接」.md': '开发交接文档，提供项目交接的详细说明',
  'YYC3-AI-「项目文档-开发交接v2」.md': '开发交接文档 v2，更新交接内容和流程',
  'YYC3-AI-「项目文档-开发交接v3」.md': '开发交接文档 v3，进一步完善交接说明',
  'YYC3-AI-「项目文档-开发交接v4」.md': '开发交接文档 v4，补充技术细节',
  'YYC3-AI-「项目文档-开发交接v5」.md': '开发交接文档 v5，更新架构说明',
  'YYC3-AI-「项目文档-开发交接v6」.md': '开发交接文档 v6，最终版本',
  'YYC3-AI-「项目文档-关闭审查提醒」.md': '关闭审查提醒文档，提醒项目关闭前的审查事项',
  'YYC3-AI-「项目文档-关闭审查报告」.md': '关闭审查报告文档，记录项目关闭审查的结果',
  'YYC3-AI-「项目文档-最终阶段报告」.md': '最终阶段报告文档，总结项目最终阶段的工作成果',

  // 核心功能文档
  'YYC3-AI-「核心功能-左侧面板」.md': '左侧面板功能文档，介绍文件树和导航功能',
  'YYC3-AI-「核心功能-AI任务板」.md': 'AI 任务板功能文档，介绍 AI 任务管理和交互',
  'YYC3-AI-「核心功能-设置」.md': '设置功能文档，介绍应用的各种设置选项',
  'YYC3-AI-「核心功能-AI快速操作」.md': 'AI 快速操作功能文档，介绍快捷操作和命令面板',

  // 高级功能文档
  'YYC3-AI-「高级功能-多实例」.md': '多实例功能文档，介绍多实例管理和切换',

  // Imports 文档
  'yyc3-internationalization-plan.md': '国际化计划文档，规划 YYC³ 的多语言支持',
  'advanced-features-plan.md': '高级功能计划文档，规划 YYC³ 的高级功能开发',
  'yyc3-security-performance-opti.md': '安全和性能优化文档，记录安全和性能优化措施',
  'multi-instance-app-arch.md': '多实例应用架构文档，介绍多实例架构设计',
  'yyc3-homepage-design.md': '首页设计文档，介绍 YYC³ 首页的设计理念',
  'mvp-expansion-report.md': 'MVP 扩展报告，记录 MVP 功能扩展计划',
  'left-panel-features.md': '左侧面板功能文档，详细介绍左侧面板的功能',
  'settings-page-1.md': '设置页面文档第一部分，介绍基础设置',
  'audit-report-phase10.md': '审计报告阶段 10，记录第十阶段的审计结果',
  'tech-architecture-overview.md': '技术架构概览文档，介绍 YYC³ 的技术架构',
  'settings-page.md': '设置页面文档，介绍完整的设置功能',
  'yyc3-data-model-arch.md': '数据模型架构文档，介绍 YYC³ 的数据模型',
  'yyc3-multi-panel-layout.md': '多面板布局文档，介绍多面板布局设计',
  'core-features-and-tech-solution.md': '核心功能和技术方案文档，介绍核心功能和技术实现',
  'fe-full-stack-arch.md': '前端全栈架构文档，介绍前端架构设计',
  'figma-ai-overview.md': 'Figma AI 概览文档，介绍 Figma AI 集成',
  'project-standardization.md': '项目标准化文档，定义项目标准化规范',
  'ai-task-board-interaction.md': 'AI 任务板交互文档，介绍任务板的交互设计',
  'figma-ai-prompts.md': 'Figma AI 提示词文档，介绍 AI 提示词设计',
  'mvp-expansion-plan.md': 'MVP 扩展计划文档，规划 MVP 功能扩展',
  'yyc3-tech-stack-spec.md': '技术栈规范文档，定义 YYC³ 的技术栈',
  'yyc3-icon-design-spec.md': '图标设计规范文档，定义图标设计标准',
  'yyc3-code-gen-spec.md': '代码生成规范文档，定义代码生成标准',
  'yyc3-dev-guidelines.md': '开发指南文档，提供开发规范和最佳实践',
  'liquid-glass-design.md': '液态玻璃设计文档，介绍玻璃态设计系统',
  'project-standardization-1.md': '项目标准化文档第二部分，补充标准化内容',
  'yyc3-quality-assurance.md': '质量保证文档，介绍质量保证流程',
  'ai-task-board-interaction-1.md': 'AI 任务板交互文档第二部分，补充交互细节',
  'yyc3-ai-family-functional-spec.md': 'YYC³ AI 系列功能规范文档，定义 AI 系列功能',
}

// 文档分类映射
const DOC_CATEGORIES = {
  // 根目录文档
  'README.md': 'general',
  'VERSION_REPORT.md': 'technical',
  'YYC3-AI-「文档总览」.md': 'general',
  'YYC3-AI-「团队标头-实施总结」.md': 'technical',

  // 团队规范文档
  'YYC3-团队代码-代码标头.md': 'policy',
  'YYC3-团队文档-文档标头.md': 'policy',

  // 变量词库文档
  'YYC3-AI-「变量词库-环境变量配置」.md': 'technical',
  'YYC3-AI-「变量词库-配置参数」.md': 'technical',
  'YYC3-AI-「变量词库-技术栈版本」.md': 'technical',

  // 开发指南文档
  'YYC3-AI-「开发者文档-开发指南」.md': 'guide',
  'YYC3-AI-「开发指南-主题设计系统」.md': 'design',
  'YYC3-AI-「开发指南-液态玻璃设计」.md': 'design',
  'YYC3-AI-「开发指南-规范01」.md': 'policy',
  'YYC3-AI-「开发指南-规范02」.md': 'policy',

  // 项目文档
  'YYC3-AI-「项目文档-资产清单」.md': 'project',
  'YYC3-AI-「项目文档-索引」.md': 'project',
  'YYC3-AI-「项目文档-开发交接」.md': 'project',
  'YYC3-AI-「项目文档-开发交接v2」.md': 'project',
  'YYC3-AI-「项目文档-开发交接v3」.md': 'project',
  'YYC3-AI-「项目文档-开发交接v4」.md': 'project',
  'YYC3-AI-「项目文档-开发交接v5」.md': 'project',
  'YYC3-AI-「项目文档-开发交接v6」.md': 'project',
  'YYC3-AI-「项目文档-关闭审查提醒」.md': 'project',
  'YYC3-AI-「项目文档-关闭审查报告」.md': 'project',
  'YYC3-AI-「项目文档-最终阶段报告」.md': 'project',

  // 核心功能文档
  'YYC3-AI-「核心功能-左侧面板」.md': 'technical',
  'YYC3-AI-「核心功能-AI任务板」.md': 'technical',
  'YYC3-AI-「核心功能-设置」.md': 'technical',
  'YYC3-AI-「核心功能-AI快速操作」.md': 'technical',

  // 高级功能文档
  'YYC3-AI-「高级功能-多实例」.md': 'technical',

  // Imports 文档
  'yyc3-internationalization-plan.md': 'technical',
  'advanced-features-plan.md': 'project',
  'yyc3-security-performance-opti.md': 'technical',
  'multi-instance-app-arch.md': 'technical',
  'yyc3-homepage-design.md': 'design',
  'mvp-expansion-report.md': 'project',
  'left-panel-features.md': 'technical',
  'settings-page-1.md': 'technical',
  'audit-report-phase10.md': 'project',
  'tech-architecture-overview.md': 'technical',
  'settings-page.md': 'technical',
  'yyc3-data-model-arch.md': 'technical',
  'yyc3-multi-panel-layout.md': 'design',
  'core-features-and-tech-solution.md': 'technical',
  'fe-full-stack-arch.md': 'technical',
  'figma-ai-overview.md': 'technical',
  'project-standardization.md': 'policy',
  'ai-task-board-interaction.md': 'design',
  'figma-ai-prompts.md': 'technical',
  'mvp-expansion-plan.md': 'project',
  'yyc3-tech-stack-spec.md': 'technical',
  'yyc3-icon-design-spec.md': 'design',
  'yyc3-code-gen-spec.md': 'technical',
  'yyc3-dev-guidelines.md': 'guide',
  'liquid-glass-design.md': 'design',
  'project-standardization-1.md': 'policy',
  'yyc3-quality-assurance.md': 'technical',
  'ai-task-board-interaction-1.md': 'design',
  'yyc3-ai-family-functional-spec.md': 'technical',
}

// 需要跳过的文件（已有标头或不需要标头）
const SKIP_FILES = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
]

/**
 * 检查文档是否已有标头
 */
function hasDocHeader(content) {
  return content.includes('@file:') || content.includes('@description:')
}

/**
 * 为 Markdown 文档添加标头
 */
function addHeaderToDoc(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileName = path.basename(filePath)

    // 跳过已有标头的文件
    if (hasDocHeader(content)) {
      console.log(`✓ 跳过（已有标头）: ${fileName}`)
      return
    }

    // 获取描述和分类
    const description = DOC_DESCRIPTIONS[fileName] || `文档 - ${fileName}`
    const category = DOC_CATEGORIES[fileName] || 'general'

    // 生成标头
    const header = DOC_HEADER_TEMPLATE(fileName, description, category)

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
      if (ext === '.md') {
        addHeaderToDoc(fullPath)
      }
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('📚 开始为 Markdown 文档添加团队标头...\n')

  // 处理根目录文档
  console.log('📁 处理根目录文档')
  const rootDocs = [
    'README.md',
    'VERSION_REPORT.md',
    'YYC3-AI-「文档总览」.md',
    'YYC3-AI-「团队标头-实施总结」.md',
    'YYC3-团队代码-代码标头.md',
    'YYC3-团队文档-文档标头.md',
  ]
  rootDocs.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file)
    if (fs.existsSync(filePath)) {
      addHeaderToDoc(filePath)
    }
  })

  // 处理 docs 目录
  console.log('\n📁 处理 docs/ 目录')
  const docsDir = path.join(PROJECT_ROOT, 'docs')
  if (fs.existsSync(docsDir)) {
    processDirectory(docsDir)
  }

  // 处理 src/imports 目录
  console.log('\n📁 处理 src/imports/ 目录')
  const importsDir = path.join(PROJECT_ROOT, 'src', 'imports', 'pasted_text')
  if (fs.existsSync(importsDir)) {
    processDirectory(importsDir)
  }

  console.log('\n✅ 文档标头添加完成！')
}

// 运行主函数
main()