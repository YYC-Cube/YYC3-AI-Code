# 🚀 YYC³ AI - CI/CD 部署配置指南

## 📋 必需的 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets（Settings → Secrets and variables → Actions → New repository secret）：

### 1. 服务器部署相关（必需）

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `DEPLOY_SERVER_HOST` | 服务器 IP 或域名 | `192.168.1.100` 或 `your-server.com` |
| `DEPLOY_SERVER_USER` | SSH 用户名 | `deploy` 或 `root` |
| `DEPLOY_SSH_PRIVATE_KEY` | SSH 私钥内容 | 完整的私钥文本 |

**生成 SSH 密钥对：**
```bash
# 在本地生成密钥对
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/code_yyc3_deploy

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/code_yyc3_deploy.pub deploy@YOUR_SERVER_IP

# 将私钥内容复制到 GitHub Secret (DEPLOY_SSH_PRIVATE_KEY)
cat ~/.ssh/code_yyc3_deploy
```

---

### 2. 邮件通知相关（必需）

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `SMTP_SERVER` | SMTP 服务器地址 | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USERNAME` | SMTP 用户名 | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP 密码/应用专用密码 | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | 发件人地址 | `cicd@yyc3.top` |
| `NOTIFICATION_EMAIL` | 收件人地址（多个用逗号分隔） | `team@yyc3.top,dev@yyc3.top` |

**常用 SMTP 配置：**

#### Gmail
```yaml
SMTP_SERVER: smtp.gmail.com
SMTP_PORT: 587
# 需要在 Google 账户设置中启用"应用专用密码"
```

#### QQ 邮箱
```yaml
SMTP_SERVER: smtp.qq.com
SMTP_PORT: 587
# 需要在 QQ 邮箱设置中开启 SMTP 并获取授权码
```

#### 企业邮箱
```yaml
SMTP_SERVER: smtp.exmail.qq.com  # 根据实际服务商调整
SMTP_PORT: 465
```

---

## 🖥️ 服务器端准备

### 1. 安装必要软件

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nginx curl

# 安装 Certbot (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

### 2. 创建部署目录

```bash
sudo mkdir -p /var/www/code.yyc3.top
sudo mkdir -p /var/backups/code.yyc3.top
sudo chown -R www-data:www-data /var/www/code.yyc3.top
sudo chmod -R 755 /var/www/code.yyc3.top
```

### 3. 配置 Nginx

将项目中的 Nginx 配置文件复制到服务器：

```bash
# 从 GitHub Actions 中自动处理，或手动：
sudo cp nginx-code.yyc3.top.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/code.yyc3.top /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 配置 SSL 证书（Let's Encrypt）

```bash
# 自动获取和配置 SSL
sudo certbot --nginx -d code.yyc3.top -d www.code.yyc3.top

# 设置自动续期
sudo systemctl enable certbot.timer
```

### 5. 上传部署脚本（可选）

```bash
# 将 deploy.sh 上传到服务器的 /usr/local/bin/
sudo cp deploy.sh /usr/local/bin/yyc3-deploy
sudo chmod +x /usr/local/bin/yyc3-deploy
```

---

## 🔧 SSH 用户权限配置

确保部署用户具有以下 sudo 权限：

编辑 `/etc/sudoers.d/deploy`：
```
deploy ALL=(ALL) NOPASSWD: \
    /bin/cp, \
    /bin/mkdir, \
    /bin/chown, \
    /bin/chmod, \
    /bin/rm, \
    /usr/bin/systemctl reload nginx, \
    /usr/sbin/nginx, \
    /usr/bin/certbot
```

或使用更宽松的配置（开发环境）：
```
deploy ALL=(ALL) NOPASSWD: ALL
```

---

## ✅ 部署前检查清单

在首次部署前，请确认以下事项：

- [ ] GitHub Secrets 已全部配置
- [ ] 服务器已安装 Nginx 和 Certbot
- [ ] SSH 密钥已添加到服务器
- [ ] 部署目录已创建并设置正确权限
- [ ] SSL 证书已获取（或使用 HTTP 模式测试）
- [ ] DNS 已指向服务器 IP（code.yyc3.top）
- [ ] 服务器防火墙允许 80/443 端口

---

## 🚀 测试部署

### 手动触发部署

1. 进入 GitHub 仓库的 **Actions** 页面
2. 选择 **🚀 Deploy to Production (code.yyc3.top)** 工作流
3. 点击 **Run workflow**
4. 选择环境（production/staging）和是否跳过测试
5. 点击 **Run workflow**

### 监控部署过程

- 查看 **Actions** 页面的实时日志
- 部署成功后会收到邮件通知
- 可访问 https://code.yyc3.top 验证

---

## ⏪ 回滚操作

### 自动回滚

如果健康检查失败，系统会**自动回滚**到上一个版本。

### 手动回滚

SSH 到服务器执行：
```bash
sudo /usr/local/bin/yyc3-deploy restore
# 或指定备份版本
sudo /usr/local/bin/yyc3-deploy restore backup-20260122_143022
```

或在 GitHub Actions 中重新运行之前的成功工作流。

---

## 🔍 故障排查

### 常见问题

#### 1. SSH 连接失败
```
检查项：
- DEPLOY_SERVER_HOST 是否正确
- DEPLOY_SERVER_USER 是否存在
- DEPLOY_SSH_PRIVATE_KEY 是否完整（包含 BEGIN/END 行）
- 服务器防火墙是否开放 22 端口
```

#### 2. 部署失败但无回滚
```
检查项：
- /var/backups/code.yyc3.top 目录是否存在
- 备份文件是否完整
- 手动执行：sudo yyc3-deploy restore
```

#### 3. 邮件通知未收到
```
检查项：
- SMTP 配置是否正确
- 是否使用了应用专用密码（非登录密码）
- 检查垃圾邮件文件夹
- 查看 Actions 日志中的错误信息
```

#### 4. HTTPS 不生效
```
检查项：
- SSL 证书是否过期：sudo certbot certificates
- Nginx 配置是否正确：sudo nginx -t
- DNS 是否正确解析：dig code.yyc3.top
```

---

## 📊 监控和维护

### 定期维护任务

1. **更新依赖**: 定期运行 `pnpm update` 并提交
2. **清理旧备份**: 工作流会自动保留最近 5 个备份
3. **SSL 续期**: Certbot 会自动续期（建议每季度手动检查）
4. **监控日志**: 
   ```bash
   # 查看访问日志
   tail -f /var/log/nginx/code.yyc3.top.access.log
   
   # 查看错误日志
   tail -f /var/log/nginx/code.yyc3.top.error.log
   ```

---

## 🎯 性能优化建议

### 已启用的优化

✅ Gzip 压缩  
✅ 静态资源长期缓存  
✅ HTTP/2 支持  
✅ 安全头配置  

### 进一步优化（可选）

- **CDN 加速**: 使用 Cloudflare 或阿里云 CDN
- **Brotli 压缩**: 比 Gzip 更高效的压缩算法
- **HTTP/3 (QUIC)**: 更快的协议支持
- **预加载关键资源**: 在 HTML 中添加 `<link rel="preload">`

---

## 📞 技术支持

如遇到问题，请检查：
1. GitHub Actions 日志（最详细）
2. 服务器 Nginx 错误日志
3. 部署脚本输出
4. 邮件通知中的错误信息

---

**最后更新**: 2026-05-22  
**版本**: v1.0.0  
**适用范围**: code.yyc3.top 生产环境部署
