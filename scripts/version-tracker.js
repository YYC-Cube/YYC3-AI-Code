#!/usr/bin/env node

/**
 * @file version-tracker.js
 * @description 版本追溯工具 - 跟踪文件变更历史、版本管理
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

// 版本追溯数据库文件
const VERSION_DB_PATH = path.join(PROJECT_ROOT, '.version-tracker.json')

/**
 * 版本追溯数据库结构
 * @typedef {Object} VersionEntry
 * @property {string} filePath - 文件路径
 * @property {string} version - 版本号
 * @property {string} lastModified - 最后修改时间
 * @property {string} lastAuthor - 最后作者
 * @property {string} lastCommit - 最后提交
 * @property {'major'|'minor'|'patch'|'none'} changeType - 变更类型
 * @property {VersionHistory[]} history - 历史记录
 */

/**
 * 版本历史记录
 * @typedef {Object} VersionHistory
 * @property {string} version - 版本号
 * @property {string} date - 日期
 * @property {string} author - 作者
 * @property {string} commit - 提交哈希
 * @property {string} message - 提交信息
 * @property {'major'|'minor'|'patch'} changeType - 变更类型
 */

/**
 * 初始化版本追溯数据库
 * @returns {Object} 版本数据库
 */
function initVersionDB() {
  if (fs.existsSync(VERSION_DB_PATH)) {
    try {
      const data = fs.readFileSync(VERSION_DB_PATH, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('读取版本数据库失败:', error.message)
      return {}
    }
  }
  return {}
}

/**
 * 保存版本追溯数据库
 * @param {Object} db - 版本数据库
 */
function saveVersionDB(db) {
  fs.writeFileSync(VERSION_DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
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
 * 从文件内容中提取版本信息
 * @param {string} content - 文件内容
 * @returns {string|null} 版本号
 */
function extractVersionFromContent(content) {
  const versionMatch = content.match(/@version\s+v?(\d+\.\d+\.\d+)/)
  return versionMatch ? versionMatch[1] : null
}

/**
 * 从文件内容中提取更新日期
 * @param {string} content - 文件内容
 * @returns {string|null} 日期
 */
function extractDateFromContent(content) {
  const dateMatch = content.match(/@updated\s+(\d{4}-\d{2}-\d{2})/)
  return dateMatch ? dateMatch[1] : null
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
 * 扫描项目文件并更新版本数据库
 */
function scanAndUpdateVersions() {
  console.log('🔍 开始扫描项目文件...\n')

  const db = initVersionDB()
  let updatedCount = 0
  let newCount = 0

  // 扫描 src 目录
  const srcDir = path.join(PROJECT_ROOT, 'src')
  if (fs.existsSync(srcDir)) {
    scanDirectory(srcDir, db, updatedCount, newCount)
  }

  // 扫描 tests 目录
  const testsDir = path.join(PROJECT_ROOT, 'tests')
  if (fs.existsSync(testsDir)) {
    scanDirectory(testsDir, db, updatedCount, newCount)
  }

  // 扫描根目录配置文件
  const configFiles = ['vite.config.ts', 'vitest.config.ts', 'tsconfig.json', 'package.json']
  configFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file)
    if (fs.existsSync(filePath)) {
      updateFileVersion(filePath, db, updatedCount, newCount)
    }
  })

  saveVersionDB(db)

  console.log('\n✅ 版本追溯数据库更新完成！')
  console.log(`📊 统计：新增 ${newCount} 个文件，更新 ${updatedCount} 个文件`)
}

/**
 * 递归扫描目录
 * @param {string} dir - 目录路径
 * @param {Object} db - 版本数据库
 * @param {number} updatedCount - 更新计数
 * @param {number} newCount - 新增计数
 */
function scanDirectory(
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
      scanDirectory(fullPath, db, updatedCount, newCount)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (['.ts', '.tsx', '.js', '.jsx', '.css', '.json'].includes(ext)) {
        updateFileVersion(fullPath, db, updatedCount, newCount)
      }
    }
  }
}

/**
 * 更新文件版本信息
 * @param {string} filePath - 文件路径
 * @param {Object} db - 版本数据库
 * @param {number} updatedCount - 更新计数
 * @param {number} newCount - 新增计数
 */
function updateFileVersion(
  filePath,
  db,
  updatedCount,
  newCount
) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const version = extractVersionFromContent(content)
    const updatedDate = extractDateFromContent(content)
    const gitInfo = getGitInfo(filePath)

    if (!version) {
      return // 跳过没有版本信息的文件
    }

    const relativePath = path.relative(PROJECT_ROOT, filePath)

    if (!db[relativePath]) {
      // 新文件
      db[relativePath] = {
        filePath: relativePath,
        version,
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
      // 已有文件，检查是否有更新
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
 * 生成版本报告
 */
function generateVersionReport() {
  console.log('\n📋 生成版本追溯报告...\n')

  const db = initVersionDB()
  const reportPath = path.join(PROJECT_ROOT, 'VERSION_REPORT.md')

  let report = `# YYC³ AI Code 版本追溯报告

生成时间：${new Date().toLocaleString('zh-CN')}

## 📊 统计信息

- **总文件数**：${Object.keys(db).length}
- **最近更新**：${new Date().toISOString().split('T')[0]}

## 🔄 最近变更

`

  // 获取最近更新的文件
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
- **更新时间**：${entry.lastModified}
- **作者**：${entry.lastAuthor}
- **变更类型**：${changeTypeEmoji[entry.changeType]} ${entry.changeType}
- **提交**：\`${entry.lastCommit.slice(0, 7)}\`

`
  })

  report += `## 📝 完整版本历史

`

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
  console.log(`✅ 版本报告已生成：${reportPath}`)
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2)

  if (args.includes('--report') || args.includes('-r')) {
    generateVersionReport()
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
版本追溯工具 - YYC³ AI Code

用法：
  node scripts/version-tracker.js           # 扫描并更新版本数据库
  node scripts/version-tracker.js --report   # 生成版本报告
  node scripts/version-tracker.js --help    # 显示帮助信息

功能：
  - 跟踪所有代码文件的版本变更
  - 记录文件修改历史
  - 分析变更类型（major/minor/patch）
  - 生成详细的版本报告
`)
  } else {
    scanAndUpdateVersions()
    generateVersionReport()
  }
}

// 运行主函数
main()