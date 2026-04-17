#!/usr/bin/env node

/**
 * @file add-css-headers.js
 * @description 为样式文件添加团队标头
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

// CSS 文件标头模板
const CSS_HEADER = (fileName, description) => `/**
 * @file ${fileName}
 * @description ${description}
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created ${new Date().toISOString().split('T')[0]}
 * @updated ${new Date().toISOString().split('T')[0]}
 * @status stable
 * @license MIT
 * @copyright Copyright (c) ${new Date().getFullYear()} YanYuCloudCube Team
 * @tags styles,css
 */\n\n`

// 文件描述映射
const CSS_FILE_DESCRIPTIONS = {
  'index.css': '主样式入口 - 全局样式、CSS 变量、基础样式',
  'theme.css': '主题样式 - 主题变量、颜色系统、字体设置',
  'liquid-glass.css': '液态玻璃样式 - 玻璃态效果、模糊背景、渐变',
  'tailwind.css': 'Tailwind CSS 配置 - Tailwind 指令、自定义配置',
  'fonts.css': '字体样式 - 字体引入、字体族、字体加载',
}

/**
 * 检查文件是否已有标头
 */
function hasHeader(content) {
  return content.includes('@file') || content.includes('@description')
}

/**
 * 为 CSS 文件添加标头
 */
function addHeaderToCSSFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const fileName = path.basename(filePath)

    // 跳过已有标头的文件
    if (hasHeader(content)) {
      console.log(`✓ 跳过（已有标头）: ${fileName}`)
      return
    }

    // 获取描述
    const description = CSS_FILE_DESCRIPTIONS[fileName] || `CSS 样式文件 - ${fileName}`

    // 生成标头
    const header = CSS_HEADER(fileName, description)

    // 写入文件
    fs.writeFileSync(filePath, header + content, 'utf-8')
    console.log(`✓ 已添加标头: ${fileName}`)
  } catch (error) {
    console.error(`✗ 处理失败: ${filePath}`, error.message)
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🎨 开始为样式文件添加团队标头...\n')

  const stylesDir = path.join(PROJECT_ROOT, 'src', 'styles')

  if (!fs.existsSync(stylesDir)) {
    console.log('❌ 样式目录不存在')
    return
  }

  const cssFiles = ['index.css', 'theme.css', 'liquid-glass.css', 'tailwind.css', 'fonts.css']

  console.log('📁 处理 src/styles/ 目录')
  cssFiles.forEach(file => {
    const filePath = path.join(stylesDir, file)
    if (fs.existsSync(filePath)) {
      addHeaderToCSSFile(filePath)
    }
  })

  console.log('\n✅ 样式文件标头添加完成！')
}

// 运行主函数
main()