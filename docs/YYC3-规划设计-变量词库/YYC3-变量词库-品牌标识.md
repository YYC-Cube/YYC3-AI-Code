---
file: YYC3-变量-品牌标识.md
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

# YYC³ 变量-品牌标识

## 📋 文档信息

| 字段 | 内容 |
|------|------|
| @file | 变量词库/YYC3-变量-品牌标识.md |
| @description | 品牌标识变量定义，包含品牌名称、标语、Logo等 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags variables,brand,identity,design |

---

## 🎯 变量分类

### 1. 品牌基本信息

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{BRAND_NAME}}` | YYC³ Family AI | 品牌名称 | YYC³ Family AI |
| `{{BRAND_NAME_SHORT}}` | YYC³ | 品牌简称 | YYC³ |
| `{{BRAND_NAME_EN}}` | YanYuCloudCube | 品牌英文名 | YanYuCloudCube |
| `{{BRAND_NAME_CN}}` | 言宇云枢 | 品牌中文名 | 言宇云枢 |
| `{{BRAND_SLOGAN}}` | 言传千行代码 | 语枢万物智能 | 品牌标语 | 言传千行代码 | 语枢万物智能 |
| `{{BRAND_SLOGAN_EN}}` | Words Initiate Quadrants, Language Serves as Core for Future | 品牌英文标语 | Words Initiate Quadrants, Language Serves as Core for Future |
| `{{BRAND_SLOGAN_CN}}` | 言启象限 | 语枢未来 | 品牌中文标语 | 言启象限 | 语枢未来 |
| `{{BRAND_DESCRIPTION}}` | YYC³ AI Code - 多联式低码编程实时预览系统 | 品牌描述 | YYC³ AI Code - 多联式低码编程实时预览系统 |
| `{{BRAND_TAGLINE}}` | 万象归元于云枢 | 深栈智启新纪元 | 品牌标签 | 万象归元于云枢 | 深栈智启新纪元 |
| `{{BRAND_TAGLINE_EN}}` | All things converge in cloud pivot; Deep stacks ignite a new era of intelligence | 品牌英文标签 | All things converge in cloud pivot; Deep stacks ignite a new era of intelligence |

---

## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维


### 2. 品牌视觉标识

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{BRAND_LOGO_PATH}}` | /public/logo.svg | Logo 文件路径 | /public/logo.svg |
| `{{BRAND_LOGO_DARK_PATH}}` | /public/logo-dark.svg | 深色主题 Logo 路径 | /public/logo-dark.svg |
| `{{BRAND_LOGO_LIGHT_PATH}}` | /public/logo-light.svg | 浅色主题 Logo 路径 | /public/logo-light.svg |
| `{{BRAND_FAVICON_PATH}}` | /public/favicon.ico | 网站图标路径 | /public/favicon.ico |
| `{{BRAND_ICON_LIBRARY}}` | Lucide React v0.312.0 | 图标库 | Lucide React v0.312.0 |
| `{{BRAND_COLOR_PRIMARY}}` | #667eea | 主色调 | #667eea |
| `{{BRAND_COLOR_SECONDARY}}` | #764ba2 | 次色调 | #764ba2 |
| `{{BRAND_COLOR_ACCENT}}` | #00d4ff | 强调色 | #00d4ff |
| `{{BRAND_COLOR_SUCCESS}}` | #00c853 | 成功色 | #00c853 |
| `{{BRAND_COLOR_WARNING}}` | #ff9800 | 警告色 | #ff9800 |
| `{{BRAND_COLOR_ERROR}}` | #f44336 | 错误色 | #f44336 |
| `{{BRAND_COLOR_INFO}}` | #2196f3 | 信息色 | #2196f3 |

### 3. 品牌联系方式

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{BRAND_EMAIL}}` | admin@0379.email | 联系邮箱 | admin@0379.email |
| `{{BRAND_WEBSITE}}` | https://yyc3.0379.email | 官方网站 | https://yyc3.0379.email |
| `{{BRAND_GITHUB}}` | https://github.com/YYC-Cube | GitHub 仓库 | https://github.com/YYC-Cube |
| `{{BRAND_GITHUB_ORG}}` | YYC-Cube | GitHub 组织名 | YYC-Cube |
| `{{BRAND_GITHUB_REPO}}` | YYC3-AI-Code | GitHub 仓库名 | YYC3-AI-Code |
| `{{BRAND_TWITTER}}` | @YYC3Family | Twitter 账号 | @YYC3Family |
| `{{BRAND_LINKEDIN}}` | YYC³ Family | LinkedIn 账号 | YYC³ Family |
| `{{BRAND_DISCORD}}` | https://discord.gg/yyc3 | Discord 社区 | https://discord.gg/yyc3 |

### 4. 品牌法律信息

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{BRAND_COMPANY_NAME}}` | YanYuCloudCube Team | 公司名称 | YanYuCloudCube Team |
| `{{BRAND_COMPANY_NAME_CN}}` | 言宇云枢团队 | 公司中文名 | 言宇云枢团队 |
| `{{BRAND_LICENSE}}` | MIT | 开源许可证 | MIT |
| `{{BRAND_LICENSE_URL}}` | https://opensource.org/licenses/MIT | 许可证 URL | https://opensource.org/licenses/MIT |
| `{{BRAND_COPYRIGHT}}` | Copyright (c) 2026 YanYuCloudCube Team | 版权声明 | Copyright (c) 2026 YanYuCloudCube Team |
| `{{BRAND_COPYHOLDER}}` | © 2026 YanYuCloudCube Team. All rights reserved. | 版权占位符 | © 2026 YanYuCloudCube Team. All rights reserved. |

### 5. 品牌设计规范

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{BRAND_FONT_FAMILY}}` | system | 字体家族 | system / sans-serif / monospace |
| `{{BRAND_FONT_FAMILY_PRIMARY}}` | -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif | 主字体 | -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif |
| `{{BRAND_FONT_FAMILY_MONO}}` | 'Monaco', 'Menlo', 'Ubuntu Mono', monospace | 等宽字体 | 'Monaco', 'Menlo', 'Ubuntu Mono', monospace |
| `{{BRAND_FONT_SIZE_BASE}}` | 16 | 基础字体大小（px） | 16 |
| `{{BRAND_FONT_SIZE_SMALL}}` | 14 | 小字体大小（px） | 14 |
| `{{BRAND_FONT_SIZE_LARGE}}` | 18 | 大字体大小（px） | 18 |
| `{{BRAND_BORDER_RADIUS}}` | 8 | 边框圆角（px） | 8 |
| `{{BRAND_BORDER_RADIUS_LARGE}}` | 12 | 大边框圆角（px） | 12 |
| `{{BRAND_SPACING_BASE}}` | 8 | 基础间距（px） | 8 |
| `{{BRAND_SPACING_SMALL}}` | 4 | 小间距（px） | 4 |
| `{{BRAND_SPACING_LARGE}}` | 16 | 大间距（px） | 16 |
| `{{BRAND_SHADOW_SM}}` | 0 1px 2px rgba(0, 0, 0, 0.05) | 小阴影 | 0 1px 2px rgba(0, 0, 0, 0.05) |
| `{{BRAND_SHADOW_MD}}` | 0 4px 6px rgba(0, 0, 0, 0.1) | 中阴影 | 0 4px 6px rgba(0, 0, 0, 0.1) |
| `{{BRAND_SHADOW_LG}}` | 0 10px 15px rgba(0, 0, 0, 0.15) | 大阴影 | 0 10px 15px rgba(0, 0, 0, 0.15) |

### 6. 品牌动画规范

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{BRAND_ANIMATION_DURATION_FAST}}` | 150 | 快速动画时长（ms） | 150 |
| `{{BRAND_ANIMATION_DURATION_BASE}}` | 300 | 基础动画时长（ms） | 300 |
| `{{BRAND_ANIMATION_DURATION_SLOW}}` | 500 | 慢速动画时长（ms） | 500 |
| `{{BRAND_ANIMATION_EASING}}` | cubic-bezier(0.4, 0, 0.2, 1) | 动画缓动函数 | cubic-bezier(0.4, 0, 0.2, 1) |
| `{{BRAND_ANIMATION_EASING_IN}}` | cubic-bezier(0.4, 0, 1, 1) | 入场动画缓动 | cubic-bezier(0.4, 0, 1, 1) |
| `{{BRAND_ANIMATION_EASING_OUT}}` | cubic-bezier(0, 0, 0.2, 1) | 出场动画缓动 | cubic-bezier(0, 0, 0.2, 1) |

### 7. 品牌断点规范

| 变量名 | 默认值 | 说明 | 示例 |
|--------|--------|------|------|
| `{{BRAND_BREAKPOINT_SM}}` | 640 | 小屏幕断点（px） | 640 |
| `{{BRAND_BREAKPOINT_MD}}` | 768 | 中屏幕断点（px） | 768 |
| `{{BRAND_BREAKPOINT_LG}}` | 1024 | 大屏幕断点（px） | 1024 |
| `{{BRAND_BREAKPOINT_XL}}` | 1280 | 超大屏幕断点（px） | 1280 |
| `{{BRAND_BREAKPOINT_XXL}}` | 1536 | 超超大屏幕断点（px） | 1536 |

---

## 📝 使用示例

### 1. 在代码中使用

```typescript
// src/components/BrandHeader.tsx
import React from 'react';

export const BrandHeader: React.FC = () => {
  return (
    <header className="brand-header">
      <div className="brand-logo">
        <img src="{{BRAND_LOGO_PATH}}" alt="{{BRAND_NAME}}" />
      </div>
      <div className="brand-info">
        <h1 className="brand-name">{{BRAND_NAME}}</h1>
        <p className="brand-slogan">{{BRAND_SLOGAN}}</p>
      </div>
    </header>
  );
};
```

### 2. 在样式中使用

```css
/* src/styles/brand.css */
:root {
  --brand-primary: {{BRAND_COLOR_PRIMARY}};
  --brand-secondary: {{BRAND_COLOR_SECONDARY}};
  --brand-accent: {{BRAND_COLOR_ACCENT}};
  --brand-success: {{BRAND_COLOR_SUCCESS}};
  --brand-warning: {{BRAND_COLOR_WARNING}};
  --brand-error: {{BRAND_COLOR_ERROR}};
  --brand-info: {{BRAND_COLOR_INFO}};

  --brand-font-family-primary: {{BRAND_FONT_FAMILY_PRIMARY}};
  --brand-font-family-mono: {{BRAND_FONT_FAMILY_MONO}};

  --brand-spacing-base: {{BRAND_SPACING_BASE}}px;
  --brand-spacing-small: {{BRAND_SPACING_SMALL}}px;
  --brand-spacing-large: {{BRAND_SPACING_LARGE}}px;

  --brand-border-radius: {{BRAND_BORDER_RADIUS}}px;
  --brand-border-radius-large: {{BRAND_BORDER_RADIUS_LARGE}}px;

  --brand-shadow-sm: {{BRAND_SHADOW_SM}};
  --brand-shadow-md: {{BRAND_SHADOW_MD}};
  --brand-shadow-lg: {{BRAND_SHADOW_LG}};

  --brand-animation-duration-fast: {{BRAND_ANIMATION_DURATION_FAST}}ms;
  --brand-animation-duration-base: {{BRAND_ANIMATION_DURATION_BASE}}ms;
  --brand-animation-duration-slow: {{BRAND_ANIMATION_DURATION_SLOW}}ms;
}
```

### 3. 在配置文件中使用

```typescript
// src/config/brand.config.ts
export const brandConfig = {
  name: '{{BRAND_NAME}}',
  nameShort: '{{BRAND_NAME_SHORT}}',
  nameEn: '{{BRAND_NAME_EN}}',
  nameCn: '{{BRAND_NAME_CN}}',
  slogan: '{{BRAND_SLOGAN}}',
  sloganEn: '{{BRAND_SLOGAN_EN}}',
  sloganCn: '{{BRAND_SLOGAN_CN}}',
  description: '{{BRAND_DESCRIPTION}}',
  tagline: '{{BRAND_TAGLINE}}',
  taglineEn: '{{BRAND_TAGLINE_EN}}',

  logo: {
    path: '{{BRAND_LOGO_PATH}}',
    darkPath: '{{BRAND_LOGO_DARK_PATH}}',
    lightPath: '{{BRAND_LOGO_LIGHT_PATH}}',
    faviconPath: '{{BRAND_FAVICON_PATH}}',
  },

  colors: {
    primary: '{{BRAND_COLOR_PRIMARY}}',
    secondary: '{{BRAND_COLOR_SECONDARY}}',
    accent: '{{BRAND_COLOR_ACCENT}}',
    success: '{{BRAND_COLOR_SUCCESS}}',
    warning: '{{BRAND_COLOR_WARNING}}',
    error: '{{BRAND_COLOR_ERROR}}',
    info: '{{BRAND_COLOR_INFO}}',
  },

  contact: {
    email: '{{BRAND_EMAIL}}',
    website: '{{BRAND_WEBSITE}}',
    github: '{{BRAND_GITHUB}}',
    twitter: '{{BRAND_TWITTER}}',
    linkedin: '{{BRAND_LINKEDIN}}',
    discord: '{{BRAND_DISCORD}}',
  },

  legal: {
    companyName: '{{BRAND_COMPANY_NAME}}',
    companyNameCn: '{{BRAND_COMPANY_NAME_CN}}',
    license: '{{BRAND_LICENSE}}',
    licenseUrl: '{{BRAND_LICENSE_URL}}',
    copyright: '{{BRAND_COPYRIGHT}}',
    copyholder: '{{BRAND_COPYHOLDER}}',
  },
} as const;
```

---

## ✅ 验收标准

### 变量完整性

- ✅ 所有品牌标识变量都已定义
- ✅ 变量命名符合规范
- ✅ 默认值准确
- ✅ 说明文档完整

### 品牌一致性

- ✅ 品牌名称一致
- ✅ 品牌标语一致
- ✅ 品牌颜色一致
- ✅ 品牌字体一致

### 可用性

- ✅ 变量可以在代码中使用
- ✅ 变量可以在样式中使用
- ✅ 变量可以在配置中使用
- ✅ 变量值格式正确

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-03-14 | 初始版本，建立品牌标识变量 | YanYuCloudCube Team |

---

## 📞 联系方式

- **维护团队**: YanYuCloudCube Team
- **联系邮箱**: admin@0379.email
- **项目地址**: https://github.com/YYC-Cube/

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-04-08 |
| 更新日期 | 2026-04-08 |
| 内容校验 | d794520c3b900d96 |
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
