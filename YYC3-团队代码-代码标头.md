# YYC³ 团队代码标头格式范本

## 标头格式规范

### 通用代码标头格式

```javascript
/**
 * @file {FILE_NAME}
 * @description {FILE_DESCRIPTION}
 * @author {AUTHOR_NAME} <{AUTHOR_EMAIL}>
 * @version {VERSION}
 * @created {CREATE_DATE}
 * @updated {UPDATE_DATE}
 * @status {STATUS}
 * @license {LICENSE_TYPE}
 * @copyright Copyright (c) {YEAR} YanYuCloudCube Team
 * @tags {TAGS}
 */
```

### Python 代码标头格式

```python
"""
@file: {FILE_NAME}
@description: {FILE_DESCRIPTION}
@author: {AUTHOR_NAME} <{AUTHOR_EMAIL}>
@version: {VERSION}
@created: {CREATE_DATE}
@updated: {UPDATE_DATE}
@status: {STATUS}
@license: {LICENSE_TYPE}
@copyright: Copyright (c) {YEAR} YanYuCloudCube Team
@tags: {TAGS}
"""
```

### TypeScript/JavaScript 代码标头格式

```typescript
/**
 * @file {FILE_NAME}
 * @description {FILE_DESCRIPTION}
 * @author {AUTHOR_NAME} <{AUTHOR_EMAIL}>
 * @version {VERSION}
 * @created {CREATE_DATE}
 * @updated {UPDATE_DATE}
 * @status {STATUS}
 * @license {LICENSE_TYPE}
 * @copyright Copyright (c) {YEAR} YanYuCloudCube Team
 * @tags {TAGS}
 */
```

### Java 代码标头格式

```java
/**
 * @file {FILE_NAME}
 * @description {FILE_DESCRIPTION}
 * @author {AUTHOR_NAME} <{AUTHOR_EMAIL}>
 * @version {VERSION}
 * @created {CREATE_DATE}
 * @updated {UPDATE_DATE}
 * @status {STATUS}
 * @license {LICENSE_TYPE}
 * @copyright Copyright (c) {YEAR} YanYuCloudCube Team
 * @tags {TAGS}
 */
```

### Go 代码标头格式

```go
// @file {FILE_NAME}
// @description {FILE_DESCRIPTION}
// @author {AUTHOR_NAME} <{AUTHOR_EMAIL}>
// @version {VERSION}
// @created {CREATE_DATE}
// @updated {UPDATE_DATE}
// @status {STATUS}
// @license {LICENSE_TYPE}
// @copyright Copyright (c) {YEAR} YanYuCloudCube Team
// @tags {TAGS}
```

### Rust 代码标头格式

```rust
//! @file {FILE_NAME}
//! @description {FILE_DESCRIPTION}
//! @author {AUTHOR_NAME} <{AUTHOR_EMAIL}>
//! @version {VERSION}
//! @created {CREATE_DATE}
//! @updated {UPDATE_DATE}
//! @status {STATUS}
//! @license {LICENSE_TYPE}
//! @copyright Copyright (c) {YEAR} YanYuCloudCube Team
//! @tags {TAGS}
```

## 字段说明

### 必填字段

| 字段 | 说明 | 格式要求 | 示例 |
|------|------|----------|------|
| @file | 文件名称 | 相对路径或文件名 | `utils/logger.ts` |
| @description | 文件描述 | 简洁描述文件功能和用途 | `日志工具模块，提供统一的日志记录接口` |
| @author | 作者信息 | 姓名 <邮箱> | `张三 <zhangsan@0379.email>` |
| @version | 版本号 | 语义化版本号 (SemVer) | `v1.2.3` |
| @created | 创建日期 | YYYY-MM-DD 格式 | `2026-03-06` |
| @updated | 更新日期 | YYYY-MM-DD 格式 | `2026-03-06` |
| @status | 文件状态 | draft/dev/test/stable/deprecated | `stable` |

### 可选字段

| 字段 | 说明 | 格式要求 | 示例 |
|------|------|----------|------|
| @license | 许可证 | 标准许可证名称 | `MIT` / `Apache-2.0` |
| @copyright | 版权声明 | 版权信息 | `Copyright (c) 2026 YanYuCloudCube Team` |
| @tags | 标签 | 逗号分隔的标签列表 | `utils,logging,core` |
| @depends | 依赖项 | 文件依赖的其他模块 | `lodash,axios` |
| @see | 相关链接 | 相关文档或代码链接 | `https://github.com/YYC3/...` |
| @todo | 待办事项 | 需要完成的任务 | `添加错误处理机制` |

## 状态值说明

| 状态值 | 说明 | 使用场景 |
|--------|------|----------|
| draft | 草稿 | 初始开发阶段，功能不完整 |
| dev | 开发中 | 功能开发中，可能频繁变更 |
| test | 测试中 | 功能完成，正在测试 |
| stable | 稳定 | 功能稳定，可用于生产环境 |
| deprecated | 已废弃 | 不再维护，将被替换或删除 |

## 版本号规范

遵循语义化版本号 (SemVer) 规范：`MAJOR.MINOR.PATCH`

- **MAJOR (主版本号)**: 不兼容的 API 修改
- **MINOR (次版本号)**: 向下兼容的功能性新增
- **PATCH (修订号)**: 向下兼容的问题修正

示例：
- `v1.0.0` - 初始版本
- `v1.1.0` - 新增功能
- `v1.1.1` - 修复 bug
- `v2.0.0` - 重大更新，不兼容旧版本

## 标签规范

### 标签分类

| 分类 | 标签示例 | 说明 |
|------|----------|------|
| 模块分类 | `core`, `utils`, `api`, `ui`, `db` | 按功能模块分类 |
| 技术栈 | `typescript`, `python`, `react`, `vue` | 按技术栈分类 |
| 功能特性 | `auth`, `logging`, `cache`, `queue` | 按功能特性分类 |
| 优先级 | `critical`, `high`, `medium`, `low` | 按优先级分类 |
| 安全级别 | `public`, `internal`, `private` | 按访问权限分类 |

### 标签使用示例

```javascript
/**
 * @tags core,typescript,auth,critical,public
 */
```

## 追溯性要求

### 变更记录

每次代码更新时，必须更新以下字段：
1. **@updated**: 更新为当前日期
2. **@version**: 根据变更类型递增版本号
3. **@description**: 如有重大变更，更新描述

### 变更类型与版本号对应

| 变更类型 | 版本号变更 | 示例 |
|----------|------------|------|
| Bug 修复 | PATCH +1 | `v1.0.0` → `v1.0.1` |
| 新增功能 | MINOR +1 | `v1.0.0` → `v1.1.0` |
| 重大变更 | MAJOR +1 | `v1.0.0` → `v2.0.0` |

### Git 提交规范

提交信息应包含版本号和变更说明：

```bash
git commit -m "feat: v1.1.0 新增用户认证功能"
git commit -m "fix: v1.1.1 修复登录超时问题"
git commit -m "BREAKING CHANGE: v2.0.0 重构 API 接口"
```

## 行业标准对照

### JSDoc 规范
遵循 JSDoc 3.x 规范，支持以下标签：
- `@param` - 参数说明
- `@returns` - 返回值说明
- `@throws` - 异常说明
- `@example` - 使用示例
- `@see` - 相关链接

### Python Docstring 规范
遵循 Google Style 或 NumPy Style Docstring 规范。

### JavaDoc 规范
遵循 JavaDoc 标准规范，支持 HTML 标签。

## 质量检查清单

- [ ] 所有必填字段都已填写
- [ ] 文件描述清晰准确
- [ ] 版本号符合 SemVer 规范
- [ ] 日期格式正确 (YYYY-MM-DD)
- [ ] 状态值符合规范
- [ ] 标签分类合理
- [ ] 变更记录完整
- [ ] 作者信息准确
- [ ] 许可证信息正确

## 示例文件

### 完整示例 (TypeScript)

```typescript
/**
 * @file utils/logger.ts
 * @description 日志工具模块，提供统一的日志记录接口，支持多种日志级别和输出方式
 * @author 张三 <zhangsan@0379.email>
 * @version v1.2.0
 * @created 2026-01-15
 * @updated 2026-03-06
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,typescript,logging,core,public
 * @depends winston,dayjs
 * @see https://github.com/winstonjs/winston
 * @todo 添加日志轮转功能
 */

import winston from 'winston';
import dayjs from 'dayjs';

export class Logger {
  // 实现代码...
}
```

## 维护说明

### 更新记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-03-06 | 初始版本，建立代码标头规范 | YanYuCloudCube Team |

### 联系方式

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
