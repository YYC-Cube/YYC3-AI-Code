# YYC³ 团队文档标头格式范本

## 标头格式规范

### Markdown 文档标头格式

```markdown
---
@file: {FILE_NAME}
@description: {FILE_DESCRIPTION}
@author: {AUTHOR_NAME} <{AUTHOR_EMAIL}>
@version: {VERSION}
@created: {CREATE_DATE}
@updated: {UPDATE_DATE}
@status: {STATUS}
@tags: {TAGS}
@category: {CATEGORY}
@language: {LANGUAGE}
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---
```

### 技术文档标头格式

```markdown
---
@file: {FILE_NAME}
@description: {FILE_DESCRIPTION}
@author: {AUTHOR_NAME} <{AUTHOR_EMAIL}>
@version: {VERSION}
@created: {CREATE_DATE}
@updated: {UPDATE_DATE}
@status: {STATUS}
@tags: {TAGS}
@category: technical
@language: {LANGUAGE}
@audience: {AUDIENCE}
@complexity: {COMPLEXITY}
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---
```

### API 文档标头格式

```markdown
---
@file: {FILE_NAME}
@description: {FILE_DESCRIPTION}
@author: {AUTHOR_NAME} <{AUTHOR_EMAIL}>
@version: {VERSION}
@created: {CREATE_DATE}
@updated: {UPDATE_DATE}
@status: {STATUS}
@tags: {TAGS}
@category: api
@language: {LANGUAGE}
@base_url: {BASE_URL}
@authentication: {AUTH_TYPE}
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---
```

### 项目文档标头格式

```markdown
---
@file: {FILE_NAME}
@description: {FILE_DESCRIPTION}
@author: {AUTHOR_NAME} <{AUTHOR_EMAIL}>
@version: {VERSION}
@created: {CREATE_DATE}
@updated: {UPDATE_DATE}
@status: {STATUS}
@tags: {TAGS}
@category: project
@language: {LANGUAGE}
@project: {PROJECT_NAME}
@phase: {PROJECT_PHASE}
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---
```

### 设计文档标头格式

```markdown
---
@file: {FILE_NAME}
@description: {FILE_DESCRIPTION}
@author: {AUTHOR_NAME} <{AUTHOR_EMAIL}>
@version: {VERSION}
@created: {CREATE_DATE}
@updated: {UPDATE_DATE}
@status: {STATUS}
@tags: {TAGS}
@category: design
@language: {LANGUAGE}
@design_type: {DESIGN_TYPE}
@review_status: {REVIEW_STATUS}
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---
```

## 字段说明

### 必填字段

| 字段 | 说明 | 格式要求 | 示例 |
|------|------|----------|------|
| @file | 文件名称 | 相对路径或文件名 | `README.md` |
| @description | 文档描述 | 简洁描述文档内容和用途 | `项目总览文档，包含项目介绍、快速开始等内容` |
| @author | 作者信息 | 姓名 <邮箱> | `张三 <zhangsan@0379.email>` |
| @version | 版本号 | 语义化版本号 (SemVer) | `v1.2.3` |
| @created | 创建日期 | YYYY-MM-DD 格式 | `2026-03-06` |
| @updated | 更新日期 | YYYY-MM-DD 格式 | `2026-03-06` |
| @status | 文档状态 | draft/dev/review/stable/deprecated | `stable` |
| @tags | 标签 | 逗号分隔的标签列表 | `project,overview,getting-started` |
| @category | 文档分类 | technical/api/project/design/general | `technical` |
| @language | 文档语言 | zh-CN/en-US/ja-JP | `zh-CN` |

### 可选字段

| 字段 | 说明 | 格式要求 | 示例 |
|------|------|----------|------|
| @audience | 目标读者 | developers/managers/users/stakeholders | `developers` |
| @complexity | 复杂度 | basic/intermediate/advanced/expert | `intermediate` |
| @base_url | API 基础地址 | URL 地址 | `https://api.yyc3.com/v1` |
| @authentication | 认证方式 | none/api-key/oauth2/jwt | `oauth2` |
| @project | 项目名称 | 项目标识符 | `yyc3-platform` |
| @phase | 项目阶段 | planning/development/testing/production | `development` |
| @design_type | 设计类型 | architecture/ui/ux/database | `architecture` |
| @review_status | 审核状态 | pending/reviewed/approved/rejected | `approved` |
| @related_docs | 相关文档 | 逗号分隔的文档列表 | `API.md,Architecture.md` |
| @license | 许可证 | 标准许可证名称 | `MIT` |
| @copyright | 版权声明 | 版权信息 | `Copyright (c) 2026 YanYuCloudCube Team` |

## 状态值说明

### 文档状态 (@status)

| 状态值 | 说明 | 使用场景 |
|--------|------|----------|
| draft | 草稿 | 初始编写阶段，内容不完整 |
| dev | 开发中 | 内容编写中，可能频繁变更 |
| review | 审核中 | 内容完成，等待审核 |
| stable | 稳定 | 内容稳定，可供参考 |
| deprecated | 已废弃 | 不再维护，将被替换或删除 |

### 审核状态 (@review_status)

| 状态值 | 说明 | 使用场景 |
|--------|------|----------|
| pending | 待审核 | 提交审核，等待处理 |
| reviewed | 已审核 | 审核完成，待确认 |
| approved | 已批准 | 审核通过，正式发布 |
| rejected | 已拒绝 | 审核未通过，需要修改 |

### 项目阶段 (@phase)

| 阶段值 | 说明 | 使用场景 |
|--------|------|----------|
| planning | 规划阶段 | 项目立项和需求分析 |
| design | 设计阶段 | 技术方案和架构设计 |
| development | 开发阶段 | 功能开发和实现 |
| testing | 测试阶段 | 功能测试和质量保证 |
| production | 生产阶段 | 上线运行和维护 |

## 分类规范

### 文档分类 (@category)

| 分类 | 说明 | 示例文档 |
|------|------|----------|
| general | 通用文档 | README.md,CHANGELOG.md |
| technical | 技术文档 | Architecture.md,Database.md |
| api | API 文档 | API.md,Endpoints.md |
| project | 项目文档 | Project-Plan.md,Roadmap.md |
| design | 设计文档 | UI-Design.md,UX-Design.md |
| guide | 指南文档 | Getting-Started.md,Tutorial.md |
| policy | 策略文档 | Coding-Standard.md,Security-Policy.md |

### 复杂度等级 (@complexity)

| 等级 | 说明 | 目标读者 |
|------|------|----------|
| basic | 基础 | 初学者，非技术人员 |
| intermediate | 中级 | 有一定经验的开发者 |
| advanced | 高级 | 经验丰富的开发者 |
| expert | 专家 | 架构师、技术专家 |

### 目标读者 (@audience)

| 读者类型 | 说明 | 文档特点 |
|----------|------|----------|
| developers | 开发者 | 技术细节、代码示例 |
| managers | 管理者 | 项目概览、进度报告 |
| users | 用户 | 使用指南、操作说明 |
| stakeholders | 利益相关者 | 业务价值、投资回报 |

## 版本号规范

遵循语义化版本号 (SemVer) 规范：`MAJOR.MINOR.PATCH`

- **MAJOR (主版本号)**: 文档结构重大变更，不兼容旧版本
- **MINOR (次版本号)**: 新增内容，向下兼容
- **PATCH (修订号)**: 内容修正，向下兼容

示例：
- `v1.0.0` - 初始版本
- `v1.1.0` - 新增章节
- `v1.1.1` - 修正错误
- `v2.0.0` - 重大重组

## 标签规范

### 标签分类

| 分类 | 标签示例 | 说明 |
|------|----------|------|
| 文档类型 | `guide`, `reference`, `tutorial` | 按文档类型分类 |
| 技术领域 | `frontend`, `backend`, `devops` | 按技术领域分类 |
| 功能模块 | `auth`, `logging`, `cache` | 按功能模块分类 |
| 优先级 | `critical`, `high`, `medium`, `low` | 按优先级分类 |
| 语言 | `zh-CN`, `en-US`, `ja-JP` | 按文档语言分类 |

### 标签使用示例

```markdown
---
@tags: guide,frontend,getting-started,critical,zh-CN
---
```

## 追溯性要求

### 变更记录

每次文档更新时，必须更新以下字段：
1. **@updated**: 更新为当前日期
2. **@version**: 根据变更类型递增版本号
3. **@description**: 如有重大变更，更新描述

### 变更类型与版本号对应

| 变更类型 | 版本号变更 | 示例 |
|----------|------------|------|
| 内容修正 | PATCH +1 | `v1.0.0` → `v1.0.1` |
| 新增内容 | MINOR +1 | `v1.0.0` → `v1.1.0` |
| 结构重组 | MAJOR +1 | `v1.0.0` → `v2.0.0` |

### 文档历史记录

建议在文档末尾添加变更历史记录：

```markdown
## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.2.0 | 2026-03-06 | 新增 API 认证章节 | 张三 |
| v1.1.0 | 2026-02-28 | 更新架构设计章节 | 李四 |
| v1.0.0 | 2026-01-15 | 初始版本 | YanYuCloudCube Team |
```

### Git 提交规范

提交信息应包含版本号和变更说明：

```bash
git commit -m "docs: v1.1.0 新增 API 认证章节"
git commit -m "docs: v1.1.1 修正错误描述"
git commit -m "docs: v2.0.0 重组文档结构"
```

## 行业标准对照

### Markdown 规范
遵循 CommonMark 规范，支持以下特性：
- 标题层级 (H1-H6)
- 列表 (有序、无序)
- 代码块 (支持语法高亮)
- 表格
- 链接和图片
- 引用块

### 文档结构规范
遵循以下文档结构标准：
- **ISO/IEC 18019**: 软件文档标准
- **IEEE 1063**: 软件用户文档标准
- **DITA Darwin Information Typing Architecture**

### 元数据规范
遵循以下元数据标准：
- **Dublin Core**: 元数据元素集
- **Schema.org**: 结构化数据
- **JSON-LD**: 链接数据格式

## 质量检查清单

### 内容质量
- [ ] 所有必填字段都已填写
- [ ] 文档描述清晰准确
- [ ] 版本号符合 SemVer 规范
- [ ] 日期格式正确 (YYYY-MM-DD)
- [ ] 状态值符合规范
- [ ] 标签分类合理
- [ ] 变更记录完整
- [ ] 作者信息准确

### 结构质量
- [ ] 标题层级清晰
- [ ] 段落结构合理
- [ ] 列表格式正确
- [ ] 代码块语法高亮
- [ ] 表格格式规范
- [ ] 链接有效
- [ ] 图片显示正常

### 语言质量
- [ ] 语言统一 (中文/英文)
- [ ] 术语一致
- [ ] 语法正确
- [ ] 拼写无误
- [ ] 表达清晰

### 技术质量
- [ ] 技术信息准确
- [ ] 代码示例可运行
- [ ] API 接口正确
- [ ] 配置参数完整
- [ ] 依赖关系明确

## 示例文件

### 完整示例 (项目总览文档)

```markdown
---
@file: YYC³-Platform-项目总览.md
@description: YYC³ 平台项目总览文档，包含项目介绍、架构设计、技术栈、快速开始等内容
@author: 张三 <zhangsan@0379.email>
@version: v1.2.0
@created: 2026-01-15
@updated: 2026-03-06
@status: stable
@tags: project,overview,getting-started,critical,zh-CN
@category: project
@language: zh-CN
@project: yyc3-platform
@phase: production
@audience: developers,managers,stakeholders
@complexity: intermediate
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ Platform 项目总览

## 概述

YYC³ Platform 是一个基于云原生架构的企业级平台...

## 架构设计

### 系统架构

...

## 快速开始

### 环境要求

...

### 安装步骤

...

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.2.0 | 2026-03-06 | 新增部署章节 | 张三 |
| v1.1.0 | 2026-02-28 | 更新架构设计 | 李四 |
| v1.0.0 | 2026-01-15 | 初始版本 | YanYuCloudCube Team |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
```

### API 文档示例

```markdown
---
@file: YYC³-Platform-API文档.md
@description: YYC³ Platform API 接口文档，包含所有 RESTful API 的详细说明
@author: 李四 <lisi@0379.email>
@version: v2.1.0
@created: 2026-02-01
@updated: 2026-03-06
@status: stable
@tags: api,restful,reference,critical,zh-CN
@category: api
@language: zh-CN
@base_url: https://api.yyc3.com/v1
@authentication: oauth2
@audience: developers
@complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ Platform API 文档

## 概述

YYC³ Platform 提供完整的 RESTful API 接口...

## 认证

所有 API 请求都需要通过 OAuth2 认证...

## 接口列表

### 用户认证

#### 登录

**请求**

```
POST /api/v1/auth/login
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
```

## 维护说明

### 更新记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-03-06 | 初始版本，建立文档标头规范 | YanYuCloudCube Team |

### 联系方式

- **维护团队**: YanYuCloudCube Team
- **联系邮箱**: admin@0379.email
- **项目地址**: https://github.com/YYC3/

## 附录

### 相关资源

- [Markdown 语法规范](https://commonmark.org/)
- [语义化版本号规范](https://semver.org/)
- [Dublin Core 元数据标准](https://www.dublincore.org/)
- [IEEE 1063 软件用户文档标准](https://standards.ieee.org/)

### 工具推荐

- **编辑器**: VS Code, Typora
- **语法检查**: markdownlint
- **文档生成**: MkDocs, Docusaurus
- **版本控制**: Git

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
