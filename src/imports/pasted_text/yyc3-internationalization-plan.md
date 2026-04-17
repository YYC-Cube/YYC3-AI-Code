---
file: YYC3-国际化支持-多语言方案.md
description: YYC³ AI Family 国际化支持与多语言方案，包含 i18n 配置、语言文件管理、日期格式化、货币格式化等
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-10
updated: 2026-03-10
status: stable
tags: i18n,internationalization,localization,multi-language,zh-CN
category: features
language: zh-CN
audience: developers,translators
complexity: intermediate
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ 国际化支持 - 多语言方案

## 国际化架构

### 支持语言

| 语言代码 | 语言名称 | 方向 | 状态 |
|---------|---------|------|------|
| zh-CN | 简体中文 | LTR | ✅ 完整支持 |
| en-US | 英语 | LTR | ✅ 完整支持 |
| zh-TW | 繁体中文 | LTR | 🔄 计划中 |
| ja-JP | 日语 | LTR | 🔄 计划中 |
| ko-KR | 韩语 | LTR | 🔄 计划中 |

### 技术栈

- **前端**: react-i18next v13+
- **后端**: i18next v23+
- **日期处理**: dayjs v1.11+
- **数字格式**: Intl.NumberFormat
- **货币格式**: Intl.NumberFormat

## 前端国际化

### i18n 配置

```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-CN',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
```

### 语言文件结构

```
src/locales/
├── zh-CN/
│   ├── common.json
│   ├── home.json
│   ├── project.json
│   └── settings.json
├── en-US/
│   ├── common.json
│   ├── home.json
│   ├── project.json
│   └── settings.json
└── index.ts
```

### 语言文件示例

```json
// src/locales/zh-CN/common.json
{
  "app": {
    "name": "YYC³ Family AI",
    "slogan": "言传千行代码 | 语枢万物智能"
  },
  "navigation": {
    "home": "首页",
    "projects": "项目",
    "settings": "设置",
    "logout": "退出登录"
  },
  "actions": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑",
    "create": "创建"
  },
  "messages": {
    "welcome": "欢迎使用 YYC³ Family AI",
    "success": "操作成功",
    "error": "操作失败",
    "loading": "加载中..."
  }
}
```

```json
// src/locales/en-US/common.json
{
  "app": {
    "name": "YYC³ Family AI",
    "slogan": "Words Initiate Quadrants | Language Serves as Core for Future"
  },
  "navigation": {
    "home": "Home",
    "projects": "Projects",
    "settings": "Settings",
    "logout": "Logout"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create"
  },
  "messages": {
    "welcome": "Welcome to YYC³ Family AI",
    "success": "Operation successful",
    "error": "Operation failed",
    "loading": "Loading..."
  }
}
```

### 使用示例

```typescript
// src/components/Header.tsx
import { useTranslation } from 'react-i18next';

export const Header = () => {
  const { t, i18n } = useTranslation('common');
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <header>
      <h1>{t('app.name')}</h1>
      <p>{t('app.slogan')}</p>
      
      <nav>
        <a href="/">{t('navigation.home')}</a>
        <a href="/projects">{t('navigation.projects')}</a>
        <a href="/settings">{t('navigation.settings')}</a>
      </nav>
      
      <div>
        <button onClick={() => changeLanguage('zh-CN')}>中文</button>
        <button onClick={() => changeLanguage('en-US')}>English</button>
      </div>
    </header>
  );
};
```

### 动态翻译

```typescript
// 带参数的翻译
const message = t('messages.welcomeUser', { name: 'John' });

// 复数形式
const itemCount = 5;
const itemsText = t('messages.itemCount', { count: itemCount });

// 嵌套翻译
const nestedText = t('navigation.home');
```

## 后端国际化

### i18n 配置

```typescript
// src/i18n/server.ts
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import * as path from 'path';

i18next
  .use(Backend)
  .init({
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    debug: process.env.NODE_ENV === 'development',
    
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    },
    
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
```

### API 响应国际化

```typescript
// src/controllers/project.controller.ts
import i18next from '../i18n/server';

export const getProjects = async (req: Request, res: Response) => {
  const language = req.headers['accept-language'] || 'zh-CN';
  await i18next.changeLanguage(language);
  
  const projects = await Project.findAll();
  
  res.json({
    success: true,
    data: projects,
    message: i18next.t('messages.projectsLoaded'),
  });
};
```

## 日期与时间格式化

### Dayjs 配置

```typescript
// src/utils/date.ts
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDate = (date: Date, locale: string = 'zh-CN') => {
  dayjs.locale(locale);
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatDateTime = (date: Date, locale: string = 'zh-CN') => {
  dayjs.locale(locale);
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatRelativeTime = (date: Date, locale: string = 'zh-CN') => {
  dayjs.locale(locale);
  return dayjs(date).fromNow();
};

export const formatTimeAgo = (date: Date, locale: string = 'zh-CN') => {
  dayjs.locale(locale);
  return dayjs(date).toNow();
};
```

### 使用示例

```typescript
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/date';

const date = new Date();

// 中文
formatDate(date, 'zh-CN');  // "2026-03-10"
formatDateTime(date, 'zh-CN');  // "2026-03-10 14:30:00"
formatRelativeTime(date, 'zh-CN');  // "刚刚"

// 英文
formatDate(date, 'en-US');  // "03/10/2026"
formatDateTime(date, 'en-US');  // "03/10/2026 02:30:00 PM"
formatRelativeTime(date, 'en-US');  // "a few seconds ago"
```

## 数字与货币格式化

### 数字格式化

```typescript
// src/utils/number.ts
export const formatNumber = (
  value: number,
  locale: string = 'zh-CN',
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat(locale, options).format(value);
};

export const formatCurrency = (
  value: number,
  locale: string = 'zh-CN',
  currency: string = 'CNY'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
};

export const formatPercent = (
  value: number,
  locale: string = 'zh-CN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
```

### 使用示例

```typescript
import { formatNumber, formatCurrency, formatPercent } from '@/utils/number';

// 中文
formatNumber(1234567.89, 'zh-CN');  // "1,234,567.89"
formatCurrency(1234.56, 'zh-CN', 'CNY');  // "¥1,234.56"
formatPercent(0.85, 'zh-CN');  // "85.00%"

// 英文
formatNumber(1234567.89, 'en-US');  // "1,234,567.89"
formatCurrency(1234.56, 'en-US', 'USD');  // "$1,234.56"
formatPercent(0.85, 'en-US');  // "85.00%"
```

## 语言切换

### 语言选择器组件

```typescript
// src/components/LanguageSelector.tsx
import { useTranslation } from 'react-i18next';

export const LanguageSelector = () => {
  const { i18n } = useTranslation();
  
  const languages = [
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
  ];
  
  const currentLanguage = languages.find(
    (lang) => lang.code === i18n.language
  );
  
  return (
    <div className="language-selector">
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### 持久化语言设置

```typescript
// src/utils/language.ts
import i18n from '@/i18n/config';

const LANGUAGE_KEY = 'yyc3_language';

export const getSavedLanguage = (): string => {
  return localStorage.getItem(LANGUAGE_KEY) || 'zh-CN';
};

export const saveLanguage = (language: string): void => {
  localStorage.setItem(LANGUAGE_KEY, language);
  i18n.changeLanguage(language);
};

export const initLanguage = (): void => {
  const savedLanguage = getSavedLanguage();
  i18n.changeLanguage(savedLanguage);
};
```

## 翻译管理

### 翻译文件提取

```typescript
// scripts/extract-translations.ts
import { extractTranslations } from 'i18next-scanner';
import * as fs from 'fs';
import * as path from 'path';

const extractTranslations = () => {
  const result = extractTranslations({
    input: ['src/**/*.{ts,tsx}'],
    output: 'src/locales',
    options: {
      debug: true,
      sort: true,
      func: {
        list: ['t'],
        extensions: ['.ts', '.tsx'],
      },
      lngs: ['zh-CN', 'en-US'],
      defaultNs: 'common',
      resource: {
        loadPath: 'locales/{{lng}}/{{ns}}.json',
        savePath: 'locales/{{lng}}/{{ns}}.json',
        jsonIndent: 2,
      },
    },
  });
  
  console.log('Translations extracted successfully');
};

extractTranslations();
```

### 翻译验证

```typescript
// scripts/validate-translations.ts
import * as fs from 'fs';
import * as path from 'path';

const validateTranslations = () => {
  const localesPath = path.join(__dirname, '../src/locales');
  const languages = ['zh-CN', 'en-US'];
  const namespaces = ['common', 'home', 'project', 'settings'];
  
  const baseKeys = new Set<string>();
  
  // 收集基础语言的所有键
  const baseLanguage = languages[0];
  namespaces.forEach((ns) => {
    const filePath = path.join(localesPath, baseLanguage, `${ns}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    Object.keys(content).forEach((key) => baseKeys.add(`${ns}:${key}`));
  });
  
  // 验证其他语言
  languages.slice(1).forEach((lang) => {
    const missingKeys: string[] = [];
    
    namespaces.forEach((ns) => {
      const filePath = path.join(localesPath, lang, `${ns}.json`);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      baseKeys.forEach((key) => {
        const [namespace, keyName] = key.split(':');
        if (!content[keyName]) {
          missingKeys.push(key);
        }
      });
    });
    
    if (missingKeys.length > 0) {
      console.error(`Missing keys in ${lang}:`, missingKeys);
      process.exit(1);
    }
  });
  
  console.log('All translations are valid');
};

validateTranslations();
```

## 最佳实践

### 翻译原则

1. **使用有意义的键名**: 避免使用简写或缩写
2. **保持键名一致**: 相同概念使用相同的键名
3. **提供上下文**: 使用命名空间组织翻译
4. **避免硬编码**: 所有用户可见文本都应翻译
5. **考虑文化差异**: 日期、货币、数字格式本地化

### 性能优化

1. **按需加载语言**: 只加载当前使用的语言
2. **缓存翻译结果**: 避免重复翻译
3. **使用 CDN**: 静态语言文件使用 CDN 加速
4. **预加载常用语言**: 提前加载用户可能使用的语言

### 维护建议

1. **定期更新翻译**: 及时更新新增功能的翻译
2. **使用翻译工具**: 使用专业的翻译管理工具
3. **建立翻译流程**: 制定翻译审核和发布流程
4. **收集反馈**: 收集用户对翻译质量的反馈

---

**文档版本**: v1.0.0
**最后更新**: 2026-03-10
**维护团队**: YanYuCloudCube Team

---

<div align="center">

> **「YanYuCloudCube」**
> **言启象限 | 语枢未来**
> **Words Initiate Quadrants, Language Serves as Core for Future**
> **万象归元于云枢 | 深栈智启新纪元**
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**

</div>
