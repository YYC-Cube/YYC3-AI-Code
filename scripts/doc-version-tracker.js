#!/usr/bin/env node

/**
 * @file doc-version-tracker.js
 * @description 文档版本追溯工具 - 跟踪文档变更历史、版本管理
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
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

// 文档版本数据库文件
const DOC_VERSION_DB_PATH = path.join(PROJECT_ROOT, '.doc-version-tracker.json')

/**
 * 文档版本数据库结构
 * @typedef {Object} DocVersionEntry
 * @property {string} filePath - 文件路径
 * @property {string} version - 版本号
 * @property {string} lastModified - 最后修改时间
 * @property {string} lastAuthor - 最后作者
 * @property {string} lastCommit - 最后提交
 * @property {'major'|'minor'|'patch'|'none'} changeType - 变更类型
 * @property {DocVersionHistory[]} history - 历史记录
 */

/**
 * 文档版本历史记录
 * @typedef {Object} DocVersionHistory
 * @property {string} version - 版本号
 * @property {string} date - 日期
 * @property {string} author - 作者
 * @property {string} commit - 提交哈希
 * @property {string} message - 提交信息
 * @property {'major'|'minor'|'patch'} changeType - 变更类型
 */

/**
 * 初始化文档版本数据库
 * @returns {Object} 版本数据库
 */
function initDocVersionDB() {
  if (fs.existsSync(DOC_VERSION_DB_PATH)) {
    try {
      const data = fs.readFileSync(DOC_VERSION_DB_PATH, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('读取文档版本数据库失败:', error.message)
      return {}
    }
  }
  return {}
}

/**
 * 保存文档版本数据库
 * @param {Object} db - 版本数据库
 */
function saveDocVersionDB(db) {
  fs.writeFileSync(DOC_VERSION_DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

/**
 * 获取 Git 提交信息
 * @param {string} filePath - 文件路径
 * @returns {Object} Git 信息对象
 */
function getGitInfo(filePath) {
  try {
    const log = execSync(
      `git log -1 --format="%H|%an|%ai|%s" -- "${filePath}"`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    )
    const [commit, author, date, message] = log.trim().split('|')
    return { author, commit, message, date: date.split(' ')[0] }
  } catch (error) {
    return { author: 'Unknown', commit: 'unknown', message: 'No git info', date: new Date().toISOString().split('T')[0] }
  }
}

/**
 * 从文档内容中提取版本信息
 * @param {string} content - 文档内容
 * @returns {string|null} 版本号
 */
function extractVersionFromContent(content) {
  const versionMatch = content.match(/version:\s+v?(\d+\.\d+\.\d+)/)
  return versionMatch ? versionMatch[1] : null
}

/**
 * 从文档内容中提取更新日期
 * @param {string} content - 文档内容
 * @returns {string|null} 日期
 */
function extractDateFromContent(content) {
  const dateMatch = content.match(/updated:\s+(\d{4}-\d{2}-\d{2})/)
  return dateMatch ? dateMatch[1] : null
}

/**
 * 从文档内容中提取分类
 * @param {string} content - 文档内容
 * @returns {string|null} 分类
 */
function extractCategoryFromContent(content) {
  const categoryMatch = content.match(/category:\s+(\w+)/)
  return categoryMatch ? categoryMatch[1] : null
}

/**
 * 分析变更类型
 * @param {string} oldVersion - 旧版本号
 * @param {string} newVersion - 新版本号
 * @returns {string} 变更类型
 */
function analyzeChangeType(oldVersion, newVersion) {
  if (!oldVersion || !newVersion) return 'none'

  const [oldMajor, oldMinor, oldPatch] = oldVersion.split('.').map(Number)
  const [newMajor, newMinor, newPatch] = newVersion.split('.').map(Number)

  if (newMajor > oldMajor) return 'major'
  if (newMinor > oldMinor) return 'minor'
  if (newPatch > oldPatch) return 'patch'

  return 'none'
}

/**
 * 扫描项目文档并更新版本数据库
 */
function scanAndUpdateDocVersions() {
  console.log('🔍 开始扫描项目文档...\n')

  const db = initDocVersionDB()
  let updatedCount = 0
  let newCount = 0

  // 扫描根目录文档
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
      updateDocVersion(filePath, db, updatedCount, newCount)
    }
  })

  // 扫描 docs 目录
  const docsDir = path.join(PROJECT_ROOT, 'docs')
  if (fs.existsSync(docsDir)) {
    scanDocDirectory(docsDir, db, updatedCount, newCount)
  }

  // 扫描 src/imports 目录
  const importsDir = path.join(PROJECT_ROOT, 'src', 'imports', 'pasted_text')
  if (fs.existsSync(importsDir)) {
    scanDocDirectory(importsDir, db, updatedCount, newCount)
  }

  saveDocVersionDB(db)

  console.log('\n✅ 文档版本数据库更新完成！')
  console.log(`📊 统计：新增 ${newCount} 个文档，更新 ${updatedCount} 个文档`)
}

/**
 * 递归扫描目录
 * @param {string} dir - 目录路径
 * @param {Object} db - 版本数据库
 * @param {number} updatedCount - 更新计数
 * @param {number} newCount - 新增计数
 */
function scanDocDirectory(
  dir,
  db,
  updatedCount,
  newCount
) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // 跳过 node_modules、dist、coverage 等目录
      if (['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
        continue
      }
      scanDocDirectory(fullPath, db, updatedCount, newCount)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (ext === '.md') {
        updateDocVersion(fullPath, db, updatedCount, newCount)
      }
    }
  }
}

/**
 * 更新文档版本信息
 * @param {string} filePath - 文件路径
 * @param {Object} db - 版本数据库
 * @param {number} updatedCount - 更新计数
 * @param {number} newCount - 新增计数
 */
function updateDocVersion(
  filePath,
  db,
  updatedCount,
  newCount
) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const version = extractVersionFromContent(content)
    const updatedDate = extractDateFromContent(content)
    const category = extractCategoryFromContent(content)
    const gitInfo = getGitInfo(filePath)

    if (!version) {
      return // 跳过没有版本信息的文档
    }

    const relativePath = path.relative(PROJECT_ROOT, filePath)

    if (!db[relativePath]) {
      // 新文档
      db[relativePath] = {
        filePath: relativePath,
        version,
        category: category || 'general',
        lastModified: updatedDate || gitInfo.date,
        lastAuthor: gitInfo.author,
        lastCommit: gitInfo.commit,
        changeType: 'none',
        history: [
          {
            version,
            date: updatedDate || gitInfo.date,
            author: gitInfo.author,
            commit: gitInfo.commit,
            message: gitInfo.message,
            changeType: 'none'
          }
        ]
      }
      newCount++
      console.log(`✓ 新增: ${relativePath} (v${version})`)
    } else {
      // 已有文档，检查是否有更新
      const oldEntry = db[relativePath]
      const changeType = analyzeChangeType(oldEntry.version, version)

      if (changeType !== 'none' || oldEntry.lastCommit !== gitInfo.commit) {
        // 添加历史记录
        oldEntry.history.unshift({
          version,
          date: updatedDate || gitInfo.date,
          author: gitInfo.author,
          commit: gitInfo.commit,
          message: gitInfo.message,
          changeType
        })

        // 保留最近 10 条历史记录
        if (oldEntry.history.length > 10) {
          oldEntry.history = oldEntry.history.slice(0, 10)
        }

        // 更新当前信息
        oldEntry.version = version
        oldEntry.category = category || oldEntry.category
        oldEntry.lastModified = updatedDate || gitInfo.date
        oldEntry.lastAuthor = gitInfo.author
        oldEntry.lastCommit = gitInfo.commit
        oldEntry.changeType = changeType

        updatedCount++
        console.log(`✓ 更新: ${relativePath} v${oldEntry.version} → v${version} (${changeType})`)
      }
    }
  } catch (error) {
    console.error(`✗ 处理失败: ${filePath}`, error.message)
  }
}

/**
 * 生成文档版本报告
 */
function generateDocVersionReport() {
  console.log('\n📋 生成文档版本追溯报告...\n')

  const db = initDocVersionDB()
  const reportPath = path.join(PROJECT_ROOT, 'DOC_VERSION_REPORT.md')

  let report = `# YYC³ AI Code 文档版本追溯报告

生成时间：${new Date().toLocaleString('zh-CN')}

## 📊 统计信息

- **总文档数**：${Object.keys(db).length}
- **最近更新**：${new Date().toISOString().split('T')[0]}

## 📁 文档分类

`

  // 按分类统计
  const categoryStats = {}
  Object.values(db).forEach(entry => {
    const category = entry.category || 'general'
    categoryStats[category] = (categoryStats[category] || 0) + 1
  })

  Object.entries(categoryStats).forEach(([category, count]) => {
    report += `- **${category}**：${count} 个文档\n`
  })

  report += `\n## 🔄 最近变更\n\n`

  // 获取最近更新的文档
  const recentUpdates = Object.values(db)
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .slice(0, 20)

  recentUpdates.forEach((entry, index) => {
    const changeTypeEmoji = {
      major: '🔴',
      minor: '🟡',
      patch: '🟢',
      none: '⚪'
    }
    report += `### ${index + 1}. ${entry.filePath}

- **版本**：v${entry.version}
- **分类**：${entry.category}
- **更新时间**：${entry.lastModified}
- **作者**：${entry.lastAuthor}
- **变更类型**：${changeTypeEmoji[entry.changeType]} ${entry.changeType}
- **提交**：\`${entry.lastCommit.slice(0, 7)}\`

`
  })

  report += `\n## 📝 完整版本历史\n\n`

  Object.values(db).forEach(entry => {
    report += `### ${entry.filePath}

| 版本 | 日期 | 作者 | 变更类型 | 提交 |
|------|------|------|----------|------|
`
    entry.history.forEach(h => {
      const changeTypeEmoji = {
        major: '🔴',
        minor: '🟡',
        patch: '🟢'
      }
      report += `| v${h.version} | ${h.date} | ${h.author} | ${changeTypeEmoji[h.changeType]} ${h.changeType} | \`${h.commit.slice(0, 7)}\` |\n`
    })
    report += '\n'
  })

  fs.writeFileSync(reportPath, report, 'utf-8')
  console.log(`✅ 文档版本报告已生成：${reportPath}`)
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2)

  if (args.includes('--report') || args.includes('-r')) {
    generateDocVersionReport()
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
文档版本追溯工具 - YYC³ AI Code

用法：
  node scripts/doc-version-tracker.js           # 扫描并更新文档版本数据库
  node scripts/doc-version-tracker.js --report   # 生成文档版本报告
  node scripts/doc-version-tracker.js --help    # 显示帮助信息

功能：
  - 跟踪所有 Markdown 文档的版本变更
  - 记录文档修改历史
  - 分析变更类型（major/minor/patch）
  - 生成详细的文档版本报告
`)
  } else {
    scanAndUpdateDocVersions()
    generateDocVersionReport()
  }
}

// 运行主函数
main()