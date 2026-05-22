#!/usr/bin/env node

/**
 * @file security-audit.js
 * @description YYC3 安全审计脚本 — 检查依赖项漏洞和安全性
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-05-22
 * @status production
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags security,audit,dependencies,vulnerabilities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/* ================================================================
   颜色输出工具
   ================================================================ */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorLog(color, ...args) {
  console.log(`${colors[color]}`, ...args, `${colors.reset}`);
}

/* ================================================================
   安全审计配置
   ================================================================ */

const SECURITY_CONFIG = {
  // 已知有漏洞的包版本
  vulnerablePackages: {
    'lodash': '<4.17.21',
    'axios': '<0.21.1',
    'moment': '<2.29.2',
    'jquery': '<3.5.0',
    'bootstrap': '<4.6.0',
    'react': '<16.14.0',
    'react-dom': '<16.14.0',
  },

  // 需要扫描的关键词（可能包含恶意代码）
  suspiciousKeywords: [
    'eval(',
    'document.write',
    'innerHTML',
    'dangerouslySetInnerHTML',
    'exec(',
    'Function(',
    'setTimeout(',
    'setInterval(',
  ],

  // 需要检查的敏感权限
  sensitivePermissions: [
    'fs',
    'child_process',
    'net',
    'http',
    'https',
    'os',
    'path',
  ],
};

/* ================================================================
   依赖项分析
   ================================================================ */

function analyzeDependencies() {
  colorLog('cyan', '🔍 开始分析依赖项...');

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const analysis = {
      total: Object.keys(dependencies).length,
      vulnerabilities: [],
      outdated: [],
      suspicious: [],
    };

    /* ================================================================
       检查已知漏洞
       ================================================================ */

    Object.entries(dependencies).forEach(([name, version]) => {
      const cleanVersion = version.replace(/^[\^~]/, '');

      // 检查已知漏洞
      if (SECURITY_CONFIG.vulnerablePackages[name]) {
        const vulnerableRange = SECURITY_CONFIG.vulnerablePackages[name];
        if (satisfiesVersion(cleanVersion, vulnerableRange)) {
          analysis.vulnerabilities.push({
            package: name,
            version: cleanVersion,
            vulnerability: 'Known vulnerable version',
            recommendation: `Update to latest version`,
          });
        }
      }

      // 检查是否有未指定版本（通配符）
      if (version === '*' || version === 'latest') {
        analysis.suspicious.push({
          package: name,
          version: version,
          issue: 'Wildcard version - can lead to unexpected updates',
        });
      }
    });

    /* ================================================================
       检查过时的依赖项
       ================================================================ */

    try {
      const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdated = JSON.parse(outdatedOutput);

      Object.entries(outdated).forEach(([name, info]) => {
        analysis.outdated.push({
          package: name,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
        });
      });
    } catch (error) {
      // npm outdated 在有过期包时会返回非零退出码
      try {
        const errorOutput = error.stdout || error.stderr;
        const outdated = JSON.parse(errorOutput);

        Object.entries(outdated).forEach(([name, info]) => {
          analysis.outdated.push({
            package: name,
            current: info.current,
            wanted: info.wanted,
            latest: info.latest,
          });
        });
      } catch {
        // 忽略解析错误
      }
    }

    return analysis;
  } catch (error) {
    colorLog('red', '❌ 依赖项分析失败:', error.message);
    return null;
  }
}

/* ================================================================
   版本比较工具
   ================================================================ */

function satisfiesVersion(version, range) {
  // 简化的版本比较
  if (range.startsWith('<')) {
    const minVersion = range.substring(1);
    return compareVersions(version, minVersion) < 0;
  } else if (range.startsWith('>')) {
    const maxVersion = range.substring(1);
    return compareVersions(version, maxVersion) > 0;
  }
  return false;
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

/* ================================================================
   代码安全扫描
   ================================================================ */

function scanSourceCode() {
  colorLog('cyan', '🔍 开始扫描源代码...');

  const srcDir = path.join(process.cwd(), 'src');
  const results = {
    filesScanned: 0,
    issuesFound: 0,
    suspiciousPatterns: [],
  };

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        scanFile(filePath);
      }
    });
  }

  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      results.filesScanned++;

      // 检查可疑模式
      SECURITY_CONFIG.suspiciousKeywords.forEach(keyword => {
        const regex = new RegExp(keyword.replace('(', '\\(').replace(')', '\\)'), 'gi');
        const matches = content.match(regex);

        if (matches && matches.length > 0) {
          const relativePath = path.relative(process.cwd(), filePath);

          // 排除注释中的匹配
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.match(regex) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
              results.suspiciousPatterns.push({
                file: relativePath,
                line: index + 1,
                pattern: keyword,
                context: line.trim().substring(0, 100),
              });
              results.issuesFound++;
            }
          });
        }
      });
    } catch (error) {
      colorLog('yellow', `⚠️  无法扫描文件 ${filePath}: ${error.message}`);
    }
  }

  if (fs.existsSync(srcDir)) {
    scanDirectory(srcDir);
  }

  return results;
}

/* ================================================================
   配置安全检查
   ================================================================ */

function checkConfigurationSecurity() {
  colorLog('cyan', '🔍 检查配置安全性...');

  const issues = [];

  // 检查.env文件
  const envFiles = ['.env', '.env.local', '.env.production'];
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');

      // 检查敏感信息
      const sensitivePatterns = [
        /password\s*=\s*.+/i,
        /secret\s*=\s*.+/i,
        /api[_-]?key\s*=\s*.+/i,
        /token\s*=\s*.+/i,
      ];

      sensitivePatterns.forEach(pattern => {
        if (pattern.test(content)) {
          issues.push({
            file,
            issue: 'Possible sensitive data in environment file',
            recommendation: 'Ensure sensitive data is properly secured and not committed to version control',
          });
        }
      });
    }
  });

  // 检查package.json scripts
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};

    Object.entries(scripts).forEach(([name, script]) => {
      // 检查是否有危险的脚本命令
      if (script.includes('rm -rf') || script.includes('del /')) {
        issues.push({
          file: 'package.json',
          script: name,
          issue: 'Potentially dangerous script command',
          recommendation: 'Review and ensure script is safe',
        });
      }
    });
  } catch (error) {
    colorLog('yellow', `⚠️  无法检查package.json: ${error.message}`);
  }

  return issues;
}

/* ================================================================
   生成报告
   ================================================================ */

function generateReport(dependencyAnalysis, codeScanResults, configIssues) {
  colorLog('bright', '\n📊 YYC3 安全审计报告\n');

  let totalIssues = 0;
  let criticalIssues = 0;

  /* ================================================================
     依赖项分析结果
     ================================================================ */

  if (dependencyAnalysis) {
    colorLog('bright', '📦 依赖项分析:');
    colorLog('dim', `   总依赖项: ${dependencyAnalysis.total}`);

    if (dependencyAnalysis.vulnerabilities.length > 0) {
      colorLog('red', `   ❌ 发现 ${dependencyAnalysis.vulnerabilities.length} 个已知漏洞:`);
      dependencyAnalysis.vulnerabilities.forEach(vuln => {
        colorLog('red', `      - ${vuln.package}@${vuln.version}`);
        colorLog('dim', `        ${vuln.recommendation}`);
      });
      totalIssues += dependencyAnalysis.vulnerabilities.length;
      criticalIssues += dependencyAnalysis.vulnerabilities.length;
    } else {
      colorLog('green', '   ✅ 未发现已知漏洞');
    }

    if (dependencyAnalysis.outdated.length > 0) {
      colorLog('yellow', `   ⚠️  ${dependencyAnalysis.outdated.length} 个过时的包:`);
      dependencyAnalysis.outdated.slice(0, 5).forEach(pkg => {
        colorLog('dim', `      - ${pkg.package}: ${pkg.current} → ${pkg.latest}`);
      });
      if (dependencyAnalysis.outdated.length > 5) {
        colorLog('dim', `      ... 还有 ${dependencyAnalysis.outdated.length - 5} 个`);
      }
      totalIssues += dependencyAnalysis.outdated.length;
    } else {
      colorLog('green', '   ✅ 所有依赖项都是最新版本');
    }

    if (dependencyAnalysis.suspicious.length > 0) {
      colorLog('yellow', `   ⚠️  ${dependencyAnalysis.suspicious.length} 个可疑的包版本:`);
      dependencyAnalysis.suspicious.forEach(sus => {
        colorLog('dim', `      - ${sus.package}@${sus.version}: ${sus.issue}`);
      });
      totalIssues += dependencyAnalysis.suspicious.length;
    }
  }

  /* ================================================================
     代码扫描结果
     ================================================================ */

  if (codeScanResults) {
    colorLog('bright', '\n🔍 代码安全扫描:');
    colorLog('dim', `   扫描文件: ${codeScanResults.filesScanned}`);
    colorLog('dim', `   发现问题: ${codeScanResults.issuesFound}`);

    if (codeScanResults.suspiciousPatterns.length > 0) {
      colorLog('yellow', '   发现可疑模式:');
      codeScanResults.suspiciousPatterns.slice(0, 10).forEach(pattern => {
        colorLog('dim', `      - ${pattern.file}:${pattern.line}`);
        colorLog('dim', `        ${pattern.pattern}: ${pattern.context}`);
      });
      if (codeScanResults.suspiciousPatterns.length > 10) {
        colorLog('dim', `      ... 还有 ${codeScanResults.suspiciousPatterns.length - 10} 个`);
      }
      totalIssues += codeScanResults.issuesFound;
    } else {
      colorLog('green', '   ✅ 未发现可疑模式');
    }
  }

  /* ================================================================
     配置安全检查结果
     ================================================================ */

  if (configIssues.length > 0) {
    colorLog('bright', '\n⚙️  配置安全:');
    colorLog('yellow', `   发现 ${configIssues.length} 个配置问题:`);
    configIssues.forEach(issue => {
      colorLog('dim', `      - ${issue.file || issue.script}: ${issue.issue}`);
      colorLog('dim', `        ${issue.recommendation}`);
    });
    totalIssues += configIssues.length;
  } else {
    colorLog('green', '\n✅ 配置安全检查通过');
  }

  /* ================================================================
     总结
     ================================================================ */

  colorLog('bright', '\n📋 审计总结:');
  colorLog('dim', `   总问题数: ${totalIssues}`);
  colorLog('dim', `   严重问题: ${criticalIssues}`);

  if (criticalIssues > 0) {
    colorLog('red', '   状态: ❌ 需要立即修复');
  } else if (totalIssues > 0) {
    colorLog('yellow', '   状态: ⚠️  需要关注');
  } else {
    colorLog('green', '   状态: ✅ 安全');
  }

  /* ================================================================
     修复建议
     ================================================================ */

  if (totalIssues > 0) {
    colorLog('bright', '\n🔧 修复建议:');

    if (dependencyAnalysis?.vulnerabilities.length > 0) {
      colorLog('cyan', '   1. 更新有漏洞的依赖项:');
      colorLog('dim', '      npm update <package-name>');
      colorLog('dim', '      npm audit fix --force');
    }

    if (dependencyAnalysis?.outdated.length > 0) {
      colorLog('cyan', '   2. 更新过时的依赖项:');
      colorLog('dim', '      npm update');
      colorLog('dim', '      npx npm-check-updates -u');
    }

    if (codeScanResults?.issuesFound > 0) {
      colorLog('cyan', '   3. 检查并修复代码中的安全问题:');
      colorLog('dim', '      - 使用安全的替代方案替换危险模式');
      colorLog('dim', '      - 添加输入验证和输出编码');
      colorLog('dim', '      - 实施内容安全策略(CSP)');
    }

    if (configIssues.length > 0) {
      colorLog('cyan', '   4. 加强配置安全:');
      colorLog('dim', '      - 使用环境变量管理敏感信息');
      colorLog('dim', '      - 确保 .env 文件不被提交');
      colorLog('dim', '      - 审查和更新脚本命令');
    }
  }

  /* ================================================================
     返回退出码
     ================================================================ */

  return criticalIssues > 0 ? 1 : 0;
}

/* ================================================================
   主函数
   ================================================================ */

function main() {
  colorLog('bright', '\n🔒 YYC3 安全审计工具');
  colorLog('dim', '版本: 1.0.0 | 作者: YanYuCloudCube Team\n');

  const dependencyAnalysis = analyzeDependencies();
  const codeScanResults = scanSourceCode();
  const configIssues = checkConfigurationSecurity();

  const exitCode = generateReport(dependencyAnalysis, codeScanResults, configIssues);

  process.exit(exitCode);
}

/* ================================================================
   运行主函数
   ================================================================ */

if (require.main === module) {
  main();
}

module.exports = {
  analyzeDependencies,
  scanSourceCode,
  checkConfigurationSecurity,
  SECURITY_CONFIG,
};