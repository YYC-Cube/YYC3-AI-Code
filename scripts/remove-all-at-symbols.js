#!/usr/bin/env node

/**
 * @file remove-all-at-symbols.js
 * @description 去除所有 Markdown 文档标头中的 @ 符号
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-20
 * @updated 2026-03-20
 * @status stable
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

/**
 * 去除文件中的 @ 符号
 * @param {string} filePath - 文件路径
 * @returns {Object} 处理结果
 */
function removeAtSymbols(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')

    // 统计原始 @ 符号数量
    const originalCount = (content.match(/@/g) || []).length

    // 去除标头中的 @ 符号（在标头字段前的）
    content = content.replace(/^(\s*)@(\w+):/gm, '$1$2:')

    // 统计剩余 @ 符号数量
    const remainingCount = (content.match(/@/g) || []).length
    const removedCount = originalCount - remainingCount

    // 写回文件
    fs.writeFileSync(filePath, content, 'utf-8')

    return {
      success: true,
      originalCount,
      remainingCount,
      removedCount
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 递归扫描目录
 * @param {string} dir - 目录路径
 * @param {Array} results - 结果数组
 */
function scanDirectory(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // 跳过 node_modules、dist、coverage 等目录
      if (['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
        continue
      }
      scanDirectory(fullPath, results)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (ext === '.md') {
        results.push(fullPath)
      }
    }
  }

  return results
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始去除所有 Markdown 文档标头中的 @ 符号...\n')

  const markdownFiles = scanDirectory(PROJECT_ROOT)
  console.log(`📊 找到 ${markdownFiles.length} 个 Markdown 文件\n`)

  let successCount = 0
  let failCount = 0
  let totalRemoved = 0

  markdownFiles.forEach(filePath => {
    const relativePath = path.relative(PROJECT_ROOT, filePath)
    const result = removeAtSymbols(filePath)

    if (result.success) {
      if (result.removedCount > 0) {
        console.log(`✓ ${relativePath}`)
        console.log(`   原始: ${result.originalCount}, 剩余: ${result.remainingCount}, 去除: ${result.removedCount}\n`)
        successCount++
        totalRemoved += result.removedCount
      }
    } else {
      console.log(`✗ ${relativePath}`)
      console.log(`   错误: ${result.error}\n`)
      failCount++
    }
  })

  console.log('✅ 处理完成！')
  console.log(`📊 统计：`)
  console.log(`   - 处理文件数: ${successCount}`)
  console.log(`   - 失败文件数: ${failCount}`)
  console.log(`   - 总共去除 @ 符号: ${totalRemoved}`)
}

// 运行主函数
main()