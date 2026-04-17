# YYC³ AI 升级指南

## 📖 文档概述

**主题**: 智亦师亦友亦伯乐，谱一言一语一华章  
**核心理念**: 谱奏人机共生协同的AI Family乐章  
**文档类型**: 升级指南  
**版本**: 3.0.0  
**更新时间**: 2026-03-24

---

## 📋 目录

1. [版本管理](#版本管理)
2. [升级流程](#升级流程)
3. [数据迁移](#数据迁移)
4. [向后兼容性](#向后兼容性)
5. [回滚流程](#回滚流程)

---

## 版本管理

### 版本号规则

遵循语义化版本（Semantic Versioning）：

```
主版本号.次版本号.修订号

示例:
3.0.0 - 主版本更新（不兼容）
3.1.0 - 次版本更新（新功能）
3.1.1 - 修订版本更新（Bug 修复）
```

### 版本标签

```bash
# 创建版本标签
git tag -a v3.0.0 -m "Release version 3.0.0"

# 推送标签到远程
git push origin v3.0.0

# 查看所有标签
git tag -l

# 删除标签
git tag -d v3.0.0
git push origin --delete v3.0.0
```

### 版本历史

| 版本 | 发布日期 | 主要更新 |
|------|----------|----------|
| 3.0.0 | 2026-03-24 | 性能优化、部署准备 |
| 2.0.0 | 2026-03-20 | AI Agent 系统 |
| 1.0.0 | 2026-03-10 | MVP 版本 |

---

## 升级流程

### 升级前准备

#### 1. 备份数据

```bash
# 备份 IndexedDB 数据
# 在性能报告中导出数据

# 备份代码
git stash

# 备份配置文件
cp .env .env.backup
```

#### 2. 检查兼容性

```bash
# 查看升级说明
cat docs/UPGRADE.md

# 检查 Node.js 版本
node --version  # 应该是 18.x 或 20.x

# 检查 pnpm 版本
pnpm --version  # 应该是 8.x
```

#### 3. 创建新分支

```bash
# 创建升级分支
git checkout -b upgrade/v3.0.0
```

### 升级步骤

#### 1. 拉取最新代码

```bash
# 拉取最新代码
git fetch origin

# 检出目标版本
git checkout v3.0.0
```

#### 2. 更新依赖

```bash
# 删除 node_modules 和 lock 文件
rm -rf node_modules pnpm-lock.yaml

# 安装新依赖
pnpm install
```

#### 3. 更新环境变量

```bash
# 比较环境变量模板
diff .env .env.example

# 更新 .env 文件
nano .env
```

#### 4. 更新配置

```typescript
// 检查配置文件是否有更新
// vite.config.ts
// tsconfig.json
// package.json
```

#### 5. 运行测试

```bash
# 运行单元测试
pnpm test

# 运行类型检查
pnpm type-check

# 运行 lint
pnpm lint
```

#### 6. 构建验证

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

### 升级后验证

#### 1. 功能验证

- ✅ 用户登录功能
- ✅ 项目创建功能
- ✅ 实时协作功能
- ✅ 离线模式功能
- ✅ 性能监控功能

#### 2. 性能验证

```bash
# 运行 Lighthouse
lighthouse http://localhost:3000 --view

# 查看性能报告
# 点击右下角性能监控按钮
```

#### 3. 数据验证

```javascript
// 检查 IndexedDB 数据
// 打开浏览器开发者工具 → Application → IndexedDB
```

---

## 数据迁移

### IndexedDB 迁移

```typescript
// 数据迁移脚本
const migrateDB = async () => {
  const request = indexedDB.open('YYC3OfflineDB', 2) // 新版本号
  
  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result
    
    // 检查是否需要迁移数据
    if (!db.objectStoreNames.contains('newStore')) {
      // 创建新存储
      const newStore = db.createObjectStore('newStore', { keyPath: 'id' })
      
      // 迁移数据
      const transaction = db.transaction(['oldStore'], 'readonly')
      const oldStore = transaction.objectStore('oldStore')
      const items = await new Promise((resolve) => {
        const request = oldStore.getAll()
        request.onsuccess = () => resolve(request.result)
      })
      
      // 插入到新存储
      const newTransaction = db.transaction(['newStore'], 'readwrite')
      const newStoreObj = newTransaction.objectStore('newStore')
      items.forEach(item => {
        newStoreObj.put(item)
      })
    }
  }
  
  await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
```

### 环境变量迁移

```bash
# 比新旧环境变量
diff .env.backup .env.example

# 迁移环境变量
cp .env.backup .env.new
nano .env.new  # 添加新的环境变量
cp .env.new .env
```

### 配置文件迁移

```typescript
// vite.config.ts 迁移
export default defineConfig({
  // 新的配置项
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 新的 chunk 配置
        },
      },
    },
  },
})
```

---

## 向后兼容性

### API 兼容性

- ✅ 保持 API 接口稳定
- ✅ 使用版本号区分 API 变更
- ✅ 废弃 API 提供迁移指南

### 数据格式兼容性

- ✅ IndexedDB 结构向后兼容
- ✅ 使用版本号管理数据结构
- ✅ 提供数据迁移工具

### 浏览器兼容性

| 浏览器 | 最低版本 | 支持状态 |
|--------|----------|----------|
| Chrome | 90+ | ✅ 完全支持 |
| Firefox | 88+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |
| Edge | 90+ | ✅ 完全支持 |

### 依赖兼容性

- **Node.js**: 18.x, 20.x
- **pnpm**: 8.x
- **React**: 18.x
- **Vite**: 5.x

---

## 回滚流程

### 回滚条件

- 严重的功能 Bug
- 性能严重下降
- 数据丢失或损坏
- 安全漏洞

### 回滚步骤

#### 1. 快速回滚（Git）

```bash
# 回滚到上一个版本
git revert HEAD

# 或者回滚到特定提交
git revert <commit-hash>

# 提交回滚
git push
```

#### 2. 完整回滚（CDN）

```bash
# Vercel 回滚
vercel rollback

# Netlify 回滚
netlify rollback

# 自定义服务器回滚
# 上传上一个版本的 dist 目录
```

#### 3. 数据回滚

```typescript
// 恢复 IndexedDB 数据
const restoreDB = async (backupData) => {
  const request = indexedDB.open('YYC3OfflineDB', 1)
  const db = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  
  const transaction = db.transaction(['models', 'inferences', 'performance'], 'readwrite')
  
  // 恢复数据
  Object.keys(backupData).forEach(storeName => {
    const store = transaction.objectStore(storeName)
    backupData[storeName].forEach(item => {
      store.put(item)
    })
  })
}
```

#### 4. 配置回滚

```bash
# 恢复环境变量
cp .env.backup .env

# 恢复配置文件
git checkout HEAD~1 vite.config.ts
```

### 回滚验证

```bash
# 运行测试
pnpm test

# 构建验证
pnpm build

# 功能验证
# 手动测试核心功能
```

---

## 升级检查清单

### 升级前

- [ ] 备份数据
- [ ] 备份代码
- [ ] 备份配置
- [ ] 检查兼容性
- [ ] 创建升级分支

### 升级中

- [ ] 拉取最新代码
- [ ] 更新依赖
- [ ] 更新环境变量
- [ ] 更新配置
- [ ] 运行测试
- [ ] 构建验证

### 升级后

- [ ] 功能验证
- [ ] 性能验证
- [ ] 数据验证
- [ ] 监控告警
- [ ] 更新文档

---

## 常见问题

### 1. 升级后构建失败

**解决方案**:
```bash
# 清理缓存
rm -rf node_modules dist .vite
pnpm install

# 检查依赖版本
pnpm list
```

### 2. 升级后功能异常

**解决方案**:
- 查看升级说明
- 检查数据迁移
- 查看浏览器控制台错误
- 必要时回滚

### 3. 升级后性能下降

**解决方案**:
- 查看性能报告
- 检查 Core Web Vitals
- 优化资源加载
- 必要时回滚

---

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md)
- [运维手册](./OPERATIONS.md)
- [故障排查指南](./TROUBLESHOOTING.md)

---

## 🔗 相关资源

- [语义化版本](https://semver.org/lang/zh-CN/)
- [Git 标签文档](https://git-scm.com/book/zh/v2/Git-%E5%9F%BA%E7%A1%80-%E6%89%93%E6%A0%87%E7%AD%BE)
- [React 升级指南](https://react.dev/learn/start-a-new-react-project)

---

**维护者**: YYC³ AI Team  
**创建时间**: 2026-03-24  
**版本**: 3.0.0  
**状态**: 🟢 **最新**  
**核心理念**: 智亦师亦友亦伯乐，谱一言一语一华章  
**执行机制**: 五高五标五化  
**核心主题**: 谱奏人机共生协同的AI Family乐章
