---
file: YYC3-变量-项目信息.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: design
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维


---

# YYC³ 变量词库 - 项目信息

## 📋 变量概述

本文档定义了 YYC³ AI 提示词系统中使用的所有项目信息变量。这些变量直接融入提示词中，无需额外配置。

---

## 🎯 变量分类

### 1. 项目基本信息

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{PROJECT_NAME}}` | YYC³ AI Code | 项目名称 | YYC³ AI Code |
| `{{PROJECT_SLUG}}` | yyc3-ai-code | 项目标识（kebab-case） | yyc3-ai-code |
| `{{PROJECT_VERSION}}` | 1.0.0 | 项目版本号 | 1.0.0 |
| `{{PROJECT_DESCRIPTION}}` | YYC³ AI Code - 多联式低码编程实时预览系统 | 项目描述 | YYC³ AI Code - 多联式低码编程实时预览系统 |

### 2. 团队信息

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{TEAM_NAME}}` | YanYuCloudCube Team | 团队名称 | YanYuCloudCube Team |
| `{{CONTACT_EMAIL}}` | admin@0379.email | 联系邮箱 | admin@0379.email |
| `{{CONTACT_WEBSITE}}` | https://github.com/YYC-Cube/ | 官方网站 | https://github.com/YYC-Cube/ |

### 3. 品牌标识

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{BRAND_NAME}}` | YYC³ Family AI | 品牌名称 | YYC³ Family AI |
| `{{BRAND_SLOGAN_CN}}` | 言传千行代码 \| 语枢万物智能 | 中文标语 | 言传千行代码 \| 语枢万物智能 |
| `{{BRAND_SLOGAN_EN}}` | Words Initiate Quadrants, Language Serves as Core for Future | 英文标语 | Words Initiate Quadrants, Language Serves as Core for Future |
| `{{BRAND_SUBTITLE_CN}}` | 万象归元于云枢 \| 深栈智启新纪元 | 中文副标题 | 万象归元于云枢 \| 深栈智启新纪元 |
| `{{BRAND_SUBTITLE_EN}}` | All things converge in cloud pivot; Deep stacks ignite a new era of intelligence | 英文副标题 | All things converge in cloud pivot; Deep stacks ignite a new era of intelligence |

### 4. 许可证信息

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{LICENSE}}` | MIT | 许可证类型 | MIT |
| `{{LICENSE_URL}}` | https://opensource.org/licenses/MIT | 许可证链接 | https://opensource.org/licenses/MIT |
| `{{COPYRIGHT_YEAR}}` | 2026 | 版权年份 | 2026 |
| `{{COPYRIGHT_HOLDER}}` | YanYuCloudCube Team | 版权持有人 | YanYuCloudCube Team |

### 5. 配置参数

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{PORT}}` | 3201 | 开发服务器端口 | 3201 |
| `{{HOST}}` | localhost | 开发服务器主机 | localhost |
| `{{API_TIMEOUT}}` | 30000 | API 请求超时时间（毫秒） | 30000 |
| `{{CACHE_TTL}}` | 3600 | 缓存生存时间（秒） | 3600 |
| `{{MAX_FILE_SIZE}}` | 10485760 | 最大文件大小（字节） | 10485760 |

### 6. 目录路径

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{SRC_DIR}}` | src | 源代码目录 | src |
| `{{PUBLIC_DIR}}` | public | 公共资源目录 | public |
| `{{DOCS_DIR}}` | docs | 文档目录 | docs |
| `{{TESTS_DIR}}` | tests | 测试目录 | tests |
| `{{PACKAGES_DIR}}` | packages | 包目录 | packages |
| `{{CORE_PACKAGE}}` | packages/core | 核心包路径 | packages/core |
| `{{UI_PACKAGE}}` | packages/ui | UI 包路径 | packages/ui |
| `{{SHARED_PACKAGE}}` | packages/shared | 共享包路径 | packages/shared |

---

## 🔧 变量使用方法

### 方法 1: 直接替换

在提示词中，将变量名替换为实际值：

```text
# 替换前
Project Name: {{PROJECT_NAME}}

# 替换后
Project Name: YYC³ AI Code
```

### 方法 2: 使用 sed 命令批量替换

```bash
# 替换所有变量
sed -i '' 's/{{PROJECT_NAME}}/YYC³ AI Code/g' prompt.md
sed -i '' 's/{{TEAM_NAME}}/YanYuCloudCube Team/g' prompt.md
sed -i '' 's/{{CONTACT_EMAIL}}/admin@0379.email/g' prompt.md
```

### 方法 3: 使用环境变量

```bash
# 设置环境变量
export PROJECT_NAME="YYC³ AI Code"
export TEAM_NAME="YanYuCloudCube Team"
export CONTACT_EMAIL="admin@0379.email"

# 使用 envsubst 替换
envsubst < prompt.md > prompt-replaced.md
```

### 方法 4: 使用配置文件

创建 `.env` 文件：

```env
PROJECT_NAME=YYC³ AI Code
TEAM_NAME=YanYuCloudCube Team
CONTACT_EMAIL=admin@0379.email
```

使用 `dotenv` 加载：

```javascript
import dotenv from 'dotenv';
dotenv.config();

const projectName = process.env.PROJECT_NAME;
const teamName = process.env.TEAM_NAME;
const contactEmail = process.env.CONTACT_EMAIL;
```

---

## 📝 变量模板

### 完整变量模板

```json
{
  "project": {
    "name": "{{PROJECT_NAME}}",
    "slug": "{{PROJECT_SLUG}}",
    "version": "{{PROJECT_VERSION}}",
    "description": "{{PROJECT_DESCRIPTION}}"
  },
  "team": {
    "name": "{{TEAM_NAME}}",
    "email": "{{CONTACT_EMAIL}}",
    "website": "{{CONTACT_WEBSITE}}"
  },
  "brand": {
    "name": "{{BRAND_NAME}}",
    "slogan_cn": "{{BRAND_SLOGAN_CN}}",
    "slogan_en": "{{BRAND_SLOGAN_EN}}",
    "subtitle_cn": "{{BRAND_SUBTITLE_CN}}",
    "subtitle_en": "{{BRAND_SUBTITLE_EN}}"
  },
  "license": {
    "type": "{{LICENSE}}",
    "url": "{{LICENSE_URL}}",
    "year": "{{COPYRIGHT_YEAR}}",
    "holder": "{{COPYRIGHT_HOLDER}}"
  },
  "config": {
    "port": "{{PORT}}",
    "host": "{{HOST}}",
    "api_timeout": "{{API_TIMEOUT}}",
    "cache_ttl": "{{CACHE_TTL}}",
    "max_file_size": "{{MAX_FILE_SIZE}}"
  },
  "paths": {
    "src": "{{SRC_DIR}}",
    "public": "{{PUBLIC_DIR}}",
    "docs": "{{DOCS_DIR}}",
    "tests": "{{TESTS_DIR}}",
    "packages": "{{PACKAGES_DIR}}",
    "core": "{{CORE_PACKAGE}}",
    "ui": "{{UI_PACKAGE}}",
    "shared": "{{SHARED_PACKAGE}}"
  }
}
```

---

## 🎯 使用示例

### 示例 1: 生成 package.json

```json
{
  "name": "{{PROJECT_SLUG}}",
  "version": "{{PROJECT_VERSION}}",
  "description": "{{PROJECT_DESCRIPTION}}",
  "author": "{{TEAM_NAME}} <{{CONTACT_EMAIL}}>",
  "license": "{{LICENSE}}"
}
```

### 示例 2: 生成 README.md

```markdown
# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## 团队信息

- **团队**: {{TEAM_NAME}}
- **联系**: {{CONTACT_EMAIL}}
- **网站**: {{CONTACT_WEBSITE}}

## 品牌标识

{{BRAND_NAME}}

{{BRAND_SLOGAN_CN}}

{{BRAND_SLOGAN_EN}}

## 许可证

{{LICENSE}} © {{COPYRIGHT_YEAR}} {{COPYRIGHT_HOLDER}}
```

### 示例 3: 生成应用配置

```typescript
const config = {
  project: {
    name: '{{PROJECT_NAME}}',
    version: '{{PROJECT_VERSION}}',
  },
  server: {
    host: '{{HOST}}',
    port: {{PORT}},
  },
  api: {
    timeout: {{API_TIMEOUT}},
  },
  cache: {
    ttl: {{CACHE_TTL}},
  },
  files: {
    maxSize: {{MAX_FILE_SIZE}},
  },
};
```

---

## 📊 变量验证

### 验证脚本

创建 `validate-variables.js`:

```javascript
const requiredVariables = [
  'PROJECT_NAME',
  'PROJECT_SLUG',
  'PROJECT_VERSION',
  'PROJECT_DESCRIPTION',
  'TEAM_NAME',
  'CONTACT_EMAIL',
  'CONTACT_WEBSITE',
  'BRAND_NAME',
  'BRAND_SLOGAN_CN',
  'BRAND_SLOGAN_EN',
  'BRAND_SUBTITLE_CN',
  'BRAND_SUBTITLE_EN',
  'LICENSE',
  'LICENSE_URL',
  'COPYRIGHT_YEAR',
  'COPYRIGHT_HOLDER',
  'PORT',
  'HOST',
  'API_TIMEOUT',
  'CACHE_TTL',
  'MAX_FILE_SIZE',
];

function validateVariables(env) {
  const missing = [];
  const invalid = [];

  for (const variable of requiredVariables) {
    if (!env[variable]) {
      missing.push(variable);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing variables:', missing.join(', '));
    return false;
  }

  if (invalid.length > 0) {
    console.error('❌ Invalid variables:', invalid.join(', '));
    return false;
  }

  console.log('✅ All variables are valid!');
  return true;
}

module.exports = { validateVariables };
```

---

## 🔍 变量最佳实践

### 1. 命名规范

- 使用大写字母和下划线：`{{PROJECT_NAME}}`
- 使用 kebab-case 作为标识：`{{PROJECT_SLUG}}`
- 使用描述性名称：`{{CONTACT_EMAIL}}` 而不是 `{{EMAIL}}`

### 2. 默认值

- 为所有变量提供合理的默认值
- 默认值应该反映项目的实际情况
- 避免使用空字符串作为默认值

### 3. 文档化

- 为每个变量提供清晰的说明
- 提供使用示例
- 说明变量的预期格式

### 4. 验证

- 在运行时验证变量值
- 提供有意义的错误信息
- 在开发阶段尽早发现错误

---

## 📞 联系方式

- **维护团队**: YanYuCloudCube Team
- **联系邮箱**: admin@0379.email
- **项目地址**: https://github.com/YYC-Cube/

---

<div align="center">

> **「YanYuCloudCube」**
> **言启象限 | 语枢未来**
> **Words Initiate Quadrants, Language Serves as Core for Future**
> **万象归元于云枢 | 深栈智启新纪元**
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-14 |
| 更新日期 | 2026-04-08 |
| 内容校验 | cca49f7da827ae41 |
| 追溯ID | TRC-20260408141610 |
| 关联文档 | 无 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
