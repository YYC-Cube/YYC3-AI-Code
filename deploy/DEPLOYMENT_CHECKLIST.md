# ✅ GitHub Pages 快速部署清单

> **使用此清单确保 code.yyc3.top 部署成功**

---

## 🎯 部署前准备（5分钟）

### 1️⃣ 代码仓库确认

- [ ] 仓库已推送到 GitHub
- [ ] 分支名称为 `main`
- [ ] `package.json` 和 `pnpm-lock.yaml` 已提交
- [ ] `.github/workflows/pages-deploy.yml` 已存在
- [ ] `public/CNAME` 文件内容为 `code.yyc3.top`

**验证命令**:
```bash
ls -la .github/workflows/
cat public/CNAME
```

### 2️⃣ 本地构建测试

- [ ] 依赖安装无错误：`pnpm install`
- [ ] 开发服务器正常：`pnpm dev`
- [ ] 生产构建成功：`pnpm build`
- [ ] `dist/` 目录生成且包含文件

**验证命令**:
```bash
pnpm build && ls -lh dist/
```

---

## ⚙️ GitHub 设置（3分钟）

### 3️⃣ 启用 Pages（关键步骤！）

1. 进入仓库 **Settings**
2. 左侧选择 **Pages**
3. **Source** 选择 **GitHub Actions** ⬅️ ⚠️ 必须选这个！
4. 点击 **Save**

✅ **验证**: Source 显示为 "GitHub Actions"

### 4️⃣ 配置自定义域名

在同一个 Pages 页面：

- [ ] Custom domain 输入框填入: `code.yyc3.top`
- [ ] 点击 **Save**
- [ ] 等待 DNS 验证（显示绿色 ✅）

---

## 🌐 DNS 配置（2分钟）

### 5️⃣ 添加 CNAME 记录

根据你的 DNS 服务商选择：

#### Cloudflare（推荐）
```
Type: CNAME
Name: code
Target: YOUR_GITHUB_USERNAME.github.io
Proxy status: Proxied (☁️)
TTL: Auto
```

#### 其他服务商
```
Type: CNAME
Name: code
Value: YOUR_GITHUB_USERNAME.github.io.
TTL: 3600
```

**验证 DNS 生效**:
```bash
# 等待30秒后执行
nslookup code.yyc3.top
# 应该返回 github.io 地址
```

---

## 🚀 触发首次部署（1分钟）

### 6️⃣ 推送代码或手动触发

#### 方式A：自动触发（推荐）

```bash
git add .
git commit -m "🌐 Add GitHub Pages deployment"
git push origin main
```

#### 方式B：手动触发

1. GitHub → Actions 标签
2. 找到 "🌐 Deploy to GitHub Pages (code.yyc3.top)"
3. 点击 **Run workflow**
4. Branch 选 `main`
5. 点击绿色 **Run workflow** 按钮

---

## ✅ 验证部署（5分钟后）

### 7️⃣ 检查部署状态

- [ ] Actions 工作流运行中（黄色 ●）
- [ ] Build job 完成（绿色 ✅）
- [ ] Deploy job 完成（绿色 ✅）
- [ ] 总耗时 < 10 分钟

**查看地址**: 
```
https://github.com/YOUR_USERNAME/YYC3-Code-AI/actions
```

### 8️⃣ 访问网站验证

- [ ] 浏览器打开: https://code.yyc3.top
- [ ] 页面正常加载（无白屏/错误）
- [ ] URL 栏显示 🔒 锁图标（HTTPS）
- [ ] 域名为 `code.yyc3.top`（非 github.io）
- [ ] 所有图片和资源加载正常
- [ ] 移动端访问正常

### 9️⃣ 功能测试

- [ ] 页面导航正常
- [ ] 按钮点击有响应
- [ ] 表单可交互
- [ ] 无控制台报错（F12 查看）

---

## 🎉 部署完成！

### 成功标志

如果以上所有项目都 ✅，恭喜你！

```
🌐 https://code.yyc3.top
├── ✅ 自动部署已启用
├── ✅ 自定义域名生效
├── ✅ HTTPS 安全连接
├── ✅ 全球 CDN 加速
└── ✅ 推送即自动更新
```

---

## ❓ 常见问题快速修复

### Q1: Pages 设置找不到 "GitHub Actions" 选项？

**原因**: GitHub 账户可能需要先启用 Actions 权限

**解决**: 
1. 先推送任意一个 workflow 文件
2. 刷新 Settings → Pages 页面
3. 选项应该出现

### Q2: DNS 配置后仍无法访问？

**排查步骤**:
```bash
# 检查DNS解析
dig code.yyc3.top CNAME +short

# 测试连通性
curl -I https://code.yyc3.top

# 清除本地缓存
sudo dscacheutil -flushcache  # macOS
ipconfig /flushdns            # Windows
```

### Q3: 构建失败怎么办？

**最常见原因及解决**:

| 错误信息 | 解决方案 |
|----------|----------|
| `pnpm: command not found` | 检查 action-setup 版本 |
| `lockfile mismatch` | 运行 `pnpm install` 更新 lockfile |
| `out of memory` | 增加 Node.js 内存限制 |
| `permission denied` | 检查 permissions 字段 |

### Q4: 自定义域名显示 404？

**按顺序尝试**:
1. 确认 `public/CNAME` 文件存在
2. GitHub Pages 设置中重新保存域名
3. 清除浏览器缓存 (Ctrl+Shift+R)
4. 等待 CDN 缓存刷新（最长24小时）

### Q5: 如何回滚到上一版本？

GitHub Pages 自动保留历史版本：

1. 进入 **Actions** 页面
2. 找到之前成功的部署 Run
3. 点击 **Re-run all jobs**
4. 或者手动选择特定 commit 重新部署

---

## 📊 性能基准

部署完成后，应该达到以下指标：

| 指标 | 目标值 | 优秀值 |
|------|--------|--------|
| **首屏加载时间** | < 3秒 | < 1.5秒 |
| **Lighthouse 性能分** | > 90 | > 95 |
| **HTTPS 安全性** | A+ | A+ |
| **全球访问延迟** | < 200ms | < 100ms |

**测试工具**:
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

---

## 🔧 后续维护

### 每次发布新版本时：

1. ✅ 本地测试通过 (`pnpm dev`, `pnpm test`)
2. ✅ 推送到 main 分支
3. ✅ 自动触发部署（无需手动操作）
4. ✅ 2-5分钟后自动上线

### 定期检查项：

- [ ] 每月审查 Actions 日志是否有失败记录
- [ ] 每季度更新依赖 (`pnpm update`)
- [ ] 监控域名续期时间
- [ ] 备份重要数据

---

## 📞 获取帮助

如果遇到本文档未覆盖的问题：

1. **首选**: 查看 Actions 日志（最详细）
2. **其次**: [GitHub Pages 官方文档](https://docs.github.com/en/pages)
3. **社区**: [GitHub Discussions](https://github.com/community/discussions)
4. **最后**: 在本仓库提 Issue

---

## ✨ 高级功能（可选）

完成基础部署后，可以考虑：

- [ ] **添加预览环境** - PR 自动创建预览链接
- [ ] **性能监控** - 集成 Lighthouse CI
- [ ] **错误追踪** - 接入 Sentry
- [ ] **分析统计** - Google Analytics / Plausible
- [ ] **A/B 测试** - 使用 Cloudflare Workers

详见完整文档: `deploy/GITHUB_PAGES_DEPLOYMENT_GUIDE.md`

---

> **最后检查时间**: _____________  
> **部署状态**: □ 待开始 □ 进行中 □ 已完成  
> **验证人**: _____________  

**祝你部署顺利！🚀**
