/**
 * @file generate-build-info.js
 * @description YYC3 构建信息生成器 — 生成构建元数据和版本信息
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-05-22
 * @status production
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/* ================================================================
   获取Git信息
   ================================================================ */

function getGitInfo() {
  try {
    const sha = execSync('git rev-parse --short HEAD').toString().trim();
    const branch = execSync('git branch --show-current').toString().trim();
    const commitDate = execSync('git log -1 --format=%ci').toString().trim();
    const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    const author = execSync('git log -1 --pretty=%an').toString().trim();

    return {
      sha,
      branch,
      commitDate,
      commitMessage,
      author,
    };
  } catch (error) {
    console.warn('无法获取Git信息:', error.message);
    return {
      sha: 'unknown',
      branch: 'unknown',
      commitDate: new Date().toISOString(),
      commitMessage: 'unknown',
      author: 'unknown',
    };
  }
}

/* ================================================================
   获取构建信息
   ================================================================ */

function getBuildInfo() {
  const now = new Date();
  const gitInfo = getGitInfo();

  return {
    version: process.env.npm_package_version || '2.0.0',
    buildNumber: `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`,
    timestamp: now.toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    ...gitInfo,
  };
}

/* ================================================================
   分析构建产物
   ================================================================ */

function analyzeBuild() {
  const distPath = path.join(process.cwd(), 'dist');

  if (!fs.existsSync(distPath)) {
    console.error('dist目录不存在，请先运行构建');
    process.exit(1);
  }

  const buildStats = {
    totalSize: 0,
    fileCount: 0,
    jsFiles: 0,
    cssFiles: 0,
    htmlFiles: 0,
    assetFiles: 0,
    largestFiles: [],
    chunks: [],
  };

  function analyzeDirectory(dirPath, relativePath = '') {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      const relativeFilePath = path.join(relativePath, file);

      if (stats.isDirectory()) {
        analyzeDirectory(filePath, relativeFilePath);
      } else {
        buildStats.fileCount++;
        buildStats.totalSize += stats.size;

        // 文件类型统计
        if (file.endsWith('.js')) {
          buildStats.jsFiles++;
          if (file.includes('vendor-') || file.includes('main-')) {
            buildStats.chunks.push({
              file: relativeFilePath,
              size: stats.size,
              sizeFormatted: formatBytes(stats.size),
            });
          }
        } else if (file.endsWith('.css')) {
          buildStats.cssFiles++;
        } else if (file.endsWith('.html')) {
          buildStats.htmlFiles++;
        } else {
          buildStats.assetFiles++;
        }

        // 记录最大的文件
        buildStats.largestFiles.push({
          file: relativeFilePath,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
        });
      }
    });
  }

  analyzeDirectory(distPath);

  // 排序并限制结果数量
  buildStats.largestFiles.sort((a, b) => b.size - a.size);
  buildStats.largestFiles = buildStats.largestFiles.slice(0, 10);
  buildStats.chunks.sort((a, b) => b.size - a.size);

  buildStats.totalSizeFormatted = formatBytes(buildStats.totalSize);

  return buildStats;
}

/* ================================================================
   格式化字节大小
   ================================================================ */

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/* ================================================================
   生成构建信息文件
   ================================================================ */

function generateBuildInfo() {
  console.log('📊 生成构建信息...');

  const buildInfo = getBuildInfo();
  const buildStats = analyzeBuild();

  const fullBuildInfo = {
    ...buildInfo,
    buildStats,
    generatedAt: new Date().toISOString(),
  };

  const outputPath = path.join(process.cwd(), 'dist', 'build-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(fullBuildInfo, null, 2));

  console.log('✅ 构建信息已生成:', outputPath);

  // 打印摘要信息
  console.log('\n📋 构建摘要:');
  console.log(`   版本: ${buildInfo.version}`);
  console.log(`   构建: ${buildInfo.buildNumber}`);
  console.log(`   Git SHA: ${buildInfo.sha}`);
  console.log(`   分支: ${buildInfo.branch}`);
  console.log(`   文件数: ${buildStats.fileCount}`);
  console.log(`   总大小: ${buildStats.totalSizeFormatted}`);
  console.log(`   JS文件: ${buildStats.jsFiles}`);
  console.log(`   CSS文件: ${buildStats.cssFiles}`);

  console.log('\n📦 主要chunks:');
  buildStats.chunks.slice(0, 5).forEach(chunk => {
    console.log(`   ${chunk.file}: ${chunk.sizeFormatted}`);
  });

  return fullBuildInfo;
}

/* ================================================================
   主函数
   ================================================================ */

if (require.main === module) {
  try {
    generateBuildInfo();
  } catch (error) {
    console.error('❌ 生成构建信息失败:', error.message);
    process.exit(1);
  }
}

module.exports = { generateBuildInfo, getBuildInfo, analyzeBuild };