# YYC³ AI 部署指南

## 📖 文档概述

**主题**: 智亦师亦友亦伯乐，谱一言一语一华章  
**核心理念**: 谱奏人机共生协同的AI Family乐章  
**文档类型**: 部署指南  
**版本**: 3.0.0  
**更新时间**: 2026-03-24

---

## 📋 目录

1. [部署前准备](#部署前准备)
2. [本地部署](#本地部署)
3. [CI/CD 部署](#cicd-部署)
4. [生产环境部署](#生产环境部署)
5. [回滚策略](#回滚策略)
6. [部署验证](#部署验证)
7. [故障排查](#故障排查)

---

## 部署前准备

### 环境要求

- **Node.js**: 18.x 或 20.x
- **pnpm**: 8.x
- **Git**: 2.x
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 依赖安装

```bash
# 安装 Node.js
# 访问 https://nodejs.org/ 下载并安装

# 安装 pnpm
npm install -g pnpm@8

# 克隆仓库
git clone https://github.com/your-org/YYC3-Code-AI.git
cd YYC3-Code-AI

# 安装依赖
pnpm install
```

### 环境变量配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填写实际配置值
nano .env
```

### 必需的环境变量

| 变量名 | 说明 | 默认值 | 是否必需 |
|--------|------|--------|----------|
| `NODE_ENV` | 运行环境 | `development` | 是 |
| `VITE_APP_URL` | 应用 URL | `http://localhost:3000` | 是 |
| `VITE_API_BASE_URL` | API 基础 URL | `/api` | 是 |
| `VITE_YJS_ROOM_NAME` | Yjs 房间名称 | `yyc3-default-room` | 是 |
| `VITE_YJS_SIGNALING_SERVER` | Yjs 信令服务器 | `wss://signaling.yjs.dev` | 是 |

---

## 本地部署

### 开发环境部署

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

### 生产环境构建

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

### 本地测试

```bash
# 运行单元测试
pnpm test

# 运行 E2E 测试
pnpm test:e2e

# 运行测试并生成覆盖率报告
pnpm test:coverage
```

---

## CI/CD 部署

### GitHub Actions 配置

项目已配置完整的 CI/CD 流程：

#### CI 流程（`.github/workflows/ci.yml`）

- **触发条件**: push 到 main/develop 分支，或 PR
- **执行步骤**:
  1. 测试（Node.js 18.x, 20.x）
  2. 代码检查（lint, type-check）
  3. 安全审计（pnpm audit）
  4. 构建验证

#### CD 流程（`.github/workflows/cd.yml`）

- **触发条件**: push 到 main 分支，或手动触发
- **执行步骤**:
  1. 预览部署（PR 时）
  2. 生产部署（main 分支）
  3. E2E 测试
  4. 部署通知

### GitHub Secrets 配置

在 GitHub 仓库设置中添加以下 Secrets：

| Secret 名称 | 说明 | 示例 |
|-------------|------|------|
| `SLACK_WEBHOOK_URL` | Slack 通知 Webhook | `https://hooks.slack.com/...` |
| `DEPLOY_KEY` | 部署密钥 | SSH 私钥 |
| `CDN_TOKEN` | CDN 令牌 | CDN API 令牌 |
| `ANALYTICS_TOKEN` | 分析工具令牌 | Google Analytics 或 Mixpanel |

### 自动部署流程

1. **PR 预览部署**:
   - 提交 PR 后自动部署到预览环境
   - 在 PR 中添加预览 URL 注释

2. **生产环境部署**:
   - 合并到 main 分支后自动部署
   - 运行完整的测试流程
   - 部署成功后发送 Slack 通知

---

## 生产环境部署

### 部署选项

#### 选项 1: Vercel（推荐）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel --prod

# 配置环境变量
vercel env add
```

#### 选项 2: Netlify

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod
```

#### 选项 3: CloudBase（腾讯云）

使用 CloudBase Studio 部署：

1. 打开 CloudBase Studio
2. 创建或选择项目
3. 配置环境变量
4. 部署

#### 选项 4: 自定义服务器

```bash
# 构建项目
pnpm build

# 上传 dist 目录到服务器
rsync -avz dist/ user@server:/var/www/yyc3-ai/

# 配置 Nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/yyc3-ai;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### CDN 配置

使用 CDN 加速静态资源：

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    base: 'https://cdn.your-domain.com/',
  },
})
```

### 数据库配置（如果需要）

```bash
# 配置 IndexedDB
# 应用会自动创建 IndexedDB 数据库

# 如果使用后端数据库，配置连接字符串
DATABASE_URL=postgresql://user:password@host:port/database
```

---

## 回滚策略

### 快速回滚

```bash
# Vercel 回滚
vercel rollback

# Netlify 回滚
netlify rollback

# Git 回滚
git revert <commit-hash>
git push
```

### 数据库回滚

```bash
# 回滚数据库迁移
# 根据使用的数据库工具执行
```

### 回滚验证

1. 访问应用 URL
2. 检查基本功能
3. 查看错误日志
4. 监控性能指标

---

## 部署验证

### 基本验证

```bash
# 检查应用是否正常运行
curl https://your-domain.com

# 检查 API 是否正常
curl https://api.your-domain.com/health

# 检查静态资源
curl -I https://cdn.your-domain.com/assets/index.js
```

### 功能验证

- ✅ 用户登录功能
- ✅ 项目创建功能
- ✅ 实时协作功能
- ✅ 离线模式功能
- ✅ 性能监控功能

### 性能验证

- ✅ LCP < 2.5s
- ✅ FID < 100ms
- ✅ CLS < 0.1
- ✅ FCP < 1.8s

---

## 故障排查

### 常见问题

#### 1. 构建失败

**症状**: `pnpm build` 失败

**解决方案**:
```bash
# 清理缓存
pnpm store prune
rm -rf node_modules dist
pnpm install

# 检查 Node.js 版本
node --version  # 应该是 18.x 或 20.x
```

#### 2. 部署失败

**症状**: CI/CD 部署失败

**解决方案**:
```bash
# 检查 GitHub Actions 日志
# 检查环境变量配置
# 检查构建输出

# 本地测试构建
pnpm build
pnpm test:e2e
```

#### 3. 性能问题

**症状**: 页面加载慢

**解决方案**:
- 检查 Core Web Vitals
- 使用 Lighthouse 分析
- 优化图片和资源
- 启用 CDN
- 检查网络延迟

#### 4. 协作功能异常

**症状**: 实时协作不工作

**解决方案**:
- 检查 WebSocket 连接
- 检查 Yjs 信令服务器
- 检查 P2P 连接
- 查看浏览器控制台错误

---

## 📚 相关文档

- [运维手册](./OPERATIONS.md)
- [故障排查指南](./TROUBLESHOOTING.md)
- [升级指南](./UPGRADE.md)

---

## 🔗 相关资源

- [Vite 文档](https://vitejs.dev/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vercel 文档](https://vercel.com/docs)
- [Netlify 文档](https://docs.netlify.com/)

---

**维护者**: YYC³ AI Team  
**创建时间**: 2026-03-24  
**版本**: 3.0.0  
**状态**: 🟢 **最新**  
**核心理念**: 智亦师亦友亦伯乐，谱一言一语一华章  
**执行机制**: 五高五标五化  
**核心主题**: 谱奏人机共生协同的AI Family乐章
