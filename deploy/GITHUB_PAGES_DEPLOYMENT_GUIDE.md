# 🌐 GitHub Pages 自动部署配置指南

> **"言启千行代码，语枢万物智能"**
>
> **目标**: 配置 GitHub Actions + GitHub Pages 实现自动部署到 code.yyc3.top  
> **版本**: v1.0.0  
> **更新日期**: 2026-05-22  

---

## 🎯 部署架构概览

```
┌─────────────┐    Push to     ┌──────────────────┐
│  Developer  │ ────────────► │   GitHub Repo    │
│  (Local)    │    main branch │ (YYC3-Code-AI)  │
└─────────────┘                └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  GitHub Actions   │
                               │  pages-deploy.yml │
                               │  (自动触发)       │
                               └────────┬─────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
            │ 🔨 Build      │  │ ✅ Test       │  │ 🚀 Deploy     │
            │ pnpm build    │  │ pnpm test     │  │ to GH Pages   │
            └───────┬───────┘  └───────────────┘  └───────┬───────┘
                    │                                   │
                    └───────────────┬───────────────────┘
                                    ▼
                           ┌──────────────────┐
                           │  GitHub Pages    │
                           │  code.yyc3.top   │
                           │  (HTTPS/CDN)     │
                           └──────────────────┘
```

---

## ⚙️ 第一步：GitHub 仓库设置（必须完成）

### 1️⃣ 启用 GitHub Pages

1. 打开你的 GitHub 仓库：`https://github.com/YOUR_USERNAME/YYC3-Code-AI`
2. 点击 **Settings** 标签页
3. 左侧菜单选择 **Pages**
4. 在 **Source** 部分：
   - 选择 **"GitHub Actions"** （⚠️ **重要！不是 "Deploy from a branch"**）
5. 点击 **Save**

> ✅ **验证方法**: Source 应该显示为 `GitHub Actions`

### 2️⃣ 配置自定义域名

在同一个 **Pages** 设置页面：

1. 找到 **Custom domain** 输入框
2. 输入：`code.yyc3.top`
3. 点击 **Save**
4. 等待 DNS 验证（通常 1-5 分钟）

> 💡 **提示**: 如果域名已通过 Cloudflare 或其他 DNS 服务商管理，需要添加 CNAME 记录：
> - **Type**: CNAME
> - **Name**: code
> - **Value**: `[your-username].github.io`
> - **Proxy status**: Proxied (橙色云朵)

---

## 🔐 第二步：权限配置（可选但推荐）

### 方法A：使用默认 GITHUB_TOKEN（推荐）

工作流已配置好所需权限：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

✅ **无需额外配置**，直接使用即可！

### 方法B：使用 Personal Access Token（高级场景）

如果需要访问私有仓库或其他资源：

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 生成新 Token：
   - **Note**: `YYC3-PAGES-DEPLOY`
   - **Expiration**: 90 days
   - **Scopes**: 
     - ✅ `repo` (完整仓库访问)
     - ✅ `workflow` (触发工作流)
     - ✅ `pages` (GitHub Pages)
3. 添加到 Repository Secrets：
   - Settings → Secrets and variables → Actions → New repository secret
   - Name: `PERSONAL_ACCESS_TOKEN`
   - Value: [你生成的token]

---

## 🚀 第三步：DNS 配置（如果使用自定义域名）

### 场景1：使用 Cloudflare（推荐）

登录 Cloudflare Dashboard：

1. 选择域名 `yyc3.top`
2. 点击 **Records** → **Add Record**:
   ```
   Type: CNAME
   Name: code
   Target: YOUR_GITHUB_USERNAME.github.io
   Proxy status: Proxied (☁️)
   TTL: Auto
   ```

3. 等待 DNS 生效（通常 < 30秒）

4. 验证：
   ```bash
   dig code.yyc3.top CNAME +short
   # 应该返回类似: your-username.github.io.
   ```

### 场景2：使用其他 DNS 服务商

添加以下记录：

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | code | `YOUR_USERNAME.github.io.` | 3600 |

---

## 🎯 第四步：触发首次部署

### 方式1：推送代码自动触发

```bash
# 1. 提交当前更改
git add .
git commit -m "🚀 Add GitHub Pages deployment workflow"

# 2. 推送到 main 分支
git push origin main
```

### 方式2：手动触发（推荐用于测试）

1. 进入 GitHub 仓库
2. 点击 **Actions** 标签
3. 左侧找到 **🌐 Deploy to GitHub Pages (code.yyc3.top)**
4. 点击 **Run workflow**
5. 选择分支：`main`
6. 可选参数：
   - Environment: `production`
   - Skip tests: `false` (建议不跳过)
7. 点击 **Run workflow**

---

## ✅ 第五步：验证部署成功

### 检查清单

- [ ] **GitHub Actions 运行成功**
  - 访问：https://github.com/YOUR_REPO/actions
  - 查看 `pages-deploy.yml` 工作流状态
  
- [ ] **网站可访问**
  - 浏览器打开：https://code.yyc3.top
  - 应该看到 YYC³ AI Code 主页面
  
- [ ] **HTTPS 正常**
  - 地址栏显示 🔒 锁图标
  - 无安全警告
  
- [ ] **自定义域名生效**
  - 页面标题正确显示
  - URL 为 `code.yyc3.top` 而非 `xxx.github.io`

### 常见问题排查

#### ❌ 问题1：DNS 解析失败

**症状**: `code.yyc3.top` 无法访问

**解决方案**:
```bash
# 检查 DNS 是否生效
nslookup code.yyc3.top

# 查看详细解析信息
dig code.yyc3.top ANY
```

**可能原因**:
- DNS 记录未生效（等待 5-10分钟）
- CNAME 值错误（检查是否包含末尾点号）
- Cloudflare 代理未开启

#### ❌ 问题2：GitHub Pages 构建失败

**症状**: Actions 显示红色 ❌

**排查步骤**:
1. 点击失败的 Run
2. 查看 **Build** job 的日志
3. 常见错误：
   - `pnpm install` 失败 → 检查 lockfile
   - `pnpm build` 失败 → 本地运行 `pnpm build` 测试
   - 权限不足 → 检查 Permissions 设置

#### ❌ 问题3：自定义域名显示 404

**症状**: 能访问 `xxx.github.io/repo-name` 但 `code.yyc3.top` 返回404

**解决方案**:
1. 确认 `public/CNAME` 文件存在且内容正确
2. GitHub Pages 设置中 Custom domain 已保存
3. 清除浏览器缓存（Ctrl+Shift+R）
4. 等待 CDN 缓存刷新（最多 24小时）

---

## 📊 工作流详解

### 文件位置

`.github/workflows/pages-deploy.yml`

### 触发条件

```yaml
on:
  push:
    branches: [main]          # 推送到main时自动触发
    paths-ignore:              # 忽略以下文件变更
      - '**.md'
      - 'docs/**'
      - '.gitignore'
  workflow_dispatch:           # 支持手动触发
    inputs:
      environment:             # 选择环境
        options:
          - production
          - preview
      skip_tests:              # 是否跳过测试
        type: boolean
```

### 执行流程

```
Push to main
    ↓
[Job: Build] ~3-5 minutes
    ├── Checkout code
    ├── Setup Node.js 20 + pnpm
    ├── Install dependencies (--frozen-lockfile)
    ├── Run tests (可跳过)
    ├── pnpm build
    ├── Verify CNAME file
    └── Upload artifact (dist/)
    ↓
[Job: Deploy] ~1-2 minutes
    ├── Download artifact
    ├── Deploy to GitHub Pages
    └── Generate summary
    ↓
[Job: Notify] (可选)
    └── Send email notification
```

### 关键特性

✅ **零配置部署** - 使用 GITHUB_TOKEN，无需手动设置密钥  
✅ **自动缓存** - Node.js 和 pnpm 缓存加速构建  
✅ **并行构建** - 多个 PR 可同时构建  
✅ **增量部署** - 只重新部署变更的分支  
✅ **回滚支持** - GitHub Pages 自动保留历史版本  
✅ **通知系统** - 支持 SMTP 邮件通知（可选）  

---

## 🔧 高级配置

### 启用邮件通知

在 Repository Secrets 中添加：

| Secret 名称 | 说明 | 示例 |
|-------------|------|------|
| `SMTP_SERVER` | SMTP服务器地址 | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP端口 | `587` |
| `SMTP_USERNAME` | 发件邮箱 | `ci@yyc3.top` |
| `SMTP_PASSWORD` | 邮箱密码/应用密码 | `xxxxxx` |
| `NOTIFICATION_EMAIL` | 收件邮箱 | `team@yyc3.top` |
| `SMTP_FROM` | 发件人名称 | `noreply@yyc3.top` |

### 自定义构建命令

修改 `.github/workflows/pages-deploy.yml`:

```yaml
- name: Build project
  run: |
    # 默认: pnpm build
    
    # 示例1: 使用环境变量
    VITE_API_URL=https://api.yyc3.top pnpm build
    
    # 示例2: 自定义输出目录
    pnpm build --outDir custom-dist
```

### 添加预览环境

对于 Pull Request 自动预览：

```yaml
# 在 workflow 中添加
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - run: pnpm install && pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
        id: deployment
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview: ${{ steps.deployment.outputs.page_url }}`
            })
```

---

## 📈 性能优化建议

### 1. 启用 GitHub Pages 缓存

在 `vite.config.ts` 中已配置：
```typescript
base: './',  // 相对路径，适合子目录部署
```

### 2. 优化构建产物大小

```bash
# 分析包大小
pnpm build --mode analyze

# 启用压缩（Vite 默认已启用）
# vite.config.ts 中确认:
build: {
  minify: 'terser',  // 或 'esbuild'
}
```

### 3. CDN 加速（Cloudflare 已自动提供）

使用 Cloudflare 代理后，自动获得：
- 全球 CDN 节点分布
- DDoS 防护
- SSL/TLS 加密
- HTTP/2 和 HTTP/3 支持
- 图片优化（Polish/Mirage）

---

## 🔒 安全最佳实践

### ✅ 已实现的安全措施

1. **最小权限原则**
   ```yaml
   permissions:
     contents: read      # 只读代码
     pages: write        # 仅写入Pages
     id-token: write     # OIDC认证
   ```

2. **依赖锁定**
   - 使用 `--frozen-lockfile` 确保一致性
   - `pnpm-lock.yaml` 提交到仓库

3. **无硬编码密钥**
   - 所有敏感信息通过 Secrets 管理
   - 不在代码中暴露凭证

4. **CI/CD 审计日志**
   - GitHub Actions 完整记录每次执行
   - 可追溯谁触发了部署

### 🔒 推荐的额外安全措施

1. **分支保护规则**
   - Settings → Branches → Add rule
   - Protect `main` 分支
   - Require PR review
   - Require CI to pass before merge

2. **Secrets 轮换**
   - 定期更新 PAT（Personal Access Token）
   - 使用短期有效的 token

3. **依赖扫描**
   - 启用 Dependabot alerts
   - 自动检测漏洞依赖

---

## 🛠️ 故障排除速查表

| 错误现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| `Permission denied` | 权限不足 | 检查 workflow permissions 字段 |
| `DNS_PROBE_FINISHED_NXDOMAIN` | DNS 未配置 | 添加 CNAME 记录 |
| `404 Not Found` | 构建产物缺失 | 检查 dist 目录是否生成 |
| `SSL_ERROR_BAD_CERT_DOMAIN` | 证书错误 | 等待 Let's Encrypt 签发（< 1小时） |
| `Build timeout` | 构建超时 | 优化构建速度或增加 timeout |
| `pnpm not found` | pnpm 未安装 | 检查 action-setup 版本 |

---

## 📚 相关资源

- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Cloudflare DNS 设置](https://developers.cloudflare.com/dns/)
- [自定义域名故障排除](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains)

---

## 🎉 部署成功标志

当你在浏览器中看到以下内容时，说明部署成功！✅

```
🌐 https://code.yyc3-top
├── ✅ YYC³ AI Code 主页正常加载
├── ✅ HTTPS 安全连接（锁图标）
├── ✅ 自定义域名生效（非 github.io）
├── ✅ 所有静态资源加载正常
├── ✅ 页面交互功能可用
└── ✅ 移动端适配正常
```

---

## 📞 技术支持

如遇到问题，请按顺序检查：

1. **查看 Actions 日志** - 最详细的错误信息来源
2. **检查 DNS 配置** - 使用在线工具如 [DNSChecker](https://dnschecker.org/)
3. **查阅本文档** - 故障排除部分
4. **GitHub Community** - [GitHub Discussions](https://github.com/community/discussions)
5. **联系团队** - 通过项目 Issue 反馈

---

> **最后更新**: 2026-05-22  
> **维护者**: YYC³ AI Team  
> **文档状态**: ✅ Production Ready  

**祝部署顺利！🚀**
