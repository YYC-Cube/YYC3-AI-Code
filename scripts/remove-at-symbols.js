#!/usr/bin/env node

/**
 * @file remove-at-symbols.js
 * @description 去除文档标头中的 @ 符号
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
 */
function removeAtSymbols(filePath) {
  console.log(`📝 处理文件: ${filePath}`)

  try {
    let content = fs.readFileSync(filePath, 'utf-8')

    // 统计原始 @ 符号数量
    const originalCount = (content.match(/@/g) || []).length
    console.log(`   原始 @ 符号数量: ${originalCount}`)

    // 去除所有 @ 符号（在标头字段前的）
    content = content.replace(/^(\s*)@(\w+):/gm, '$1$2:')

    // 统计剩余 @ 符号数量
    const remainingCount = (content.match(/@/g) || []).length
    console.log(`   剩余 @ 符号数量: ${remainingCount}`)
    console.log(`   已去除 @ 符号数量: ${originalCount - remainingCount}`)

    // 写回文件
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log('✅ 处理完成\n')
  } catch (error) {
    console.error(`❌ 处理失败: ${error.message}\n`)
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始去除文档标头中的 @ 符号...\n')

  const targetFile = path.join(PROJECT_ROOT, 'YYC3-团队文档-文档标头.md')

  if (fs.existsSync(targetFile)) {
    removeAtSymbols(targetFile)
  } else {
    console.error(`❌ 文件不存在: ${targetFile}`)
  }

  console.log('✅ 所有处理完成！')
}

// 运行主函数
main()