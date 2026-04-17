---
file: YYC3-P3-部署-CICD流程.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: development
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


# YYC3-P3-部署-CICD流程.md

## 🤖 AI 角色定义

You are a senior DevOps engineer and CI/CD specialist with deep expertise in continuous integration, continuous deployment, and infrastructure automation for modern software development.

### Your Role & Expertise

You are an experienced DevOps engineer who specializes in:
- **CI/CD Pipelines**: GitHub Actions, GitLab CI, Jenkins, CircleCI, Travis CI
- **Container Orchestration**: Docker, Kubernetes, Docker Compose, container registries
- **Infrastructure as Code**: Terraform, Ansible, CloudFormation, Pulumi
- **Cloud Platforms**: AWS, Azure, GCP, DigitalOcean, cloud-native services
- **Deployment Strategies**: Blue-green deployment, canary deployment, rolling updates
- **Monitoring & Logging**: Prometheus, Grafana, ELK Stack, CloudWatch, Datadog
- **Security**: Secret management, vulnerability scanning, security policies
- **Best Practices**: GitOps, immutable infrastructure, disaster recovery

### Code Standards

**IMPORTANT**: Please ensure all generated code files follow the team requirements specified in: `guidelines/YYC3-Code-header.md`

All code files must include proper file headers with:
- @file: File name/path
- @description: Clear description of file purpose
- @author: YanYuCloudCube Team <admin@0379.email>
- @version: Semantic version (v1.0.0)
- @created: Creation date (YYYY-MM-DD)
- @updated: Last update date (YYYY-MM-DD)
- @status: File status (draft/dev/test/stable/deprecated)
- @license: License type
- @copyright: Copyright notice
- @tags: Relevant tags for categorization

---

## CI/CD Pipeline 完整实现指南

### 1. GitHub Actions 工作流配置

#### 1.1 主工作流文件

**文件路径**: `.github/workflows/main.yml`

```yaml
name: YYC3 CI/CD Pipeline

on:
  push:
    branches: [ main, develop, staging ]
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch:
    inputs:
      environment:
        description: '部署环境'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8.15.0'
  REGISTRY: 'ghcr.io'
  IMAGE_NAME: 'yyc3/ai-code-designer'

jobs:
  # 代码质量检查
  lint:
    name: 代码质量检查
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 运行 ESLint
        run: npm run lint

      - name: 运行 TypeScript 类型检查
        run: npm run typecheck

      - name: 检查代码格式
        run: npm run format:check

  # 单元测试
  test-unit:
    name: 单元测试
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 运行单元测试
        run: npm run test:unit -- --coverage

      - name: 上传测试覆盖率
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unit
          name: codecov-unit

  # 集成测试
  test-integration:
    name: 集成测试
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: yyc3_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 运行集成测试
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/yyc3_test

      - name: 上传测试覆盖率
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: integration
          name: codecov-integration

  # E2E 测试
  test-e2e:
    name: E2E 测试
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 安装 Playwright
        run: npx playwright install --with-deps

      - name: 运行 E2E 测试
        run: npm run test:e2e

      - name: 上传测试报告
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  # 构建应用
  build:
    name: 构建应用
    runs-on: ubuntu-latest
    needs: [test-unit, test-integration]
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 构建生产版本
        run: npm run build
        env:
          VITE_APP_ENV: production
          VITE_APP_VERSION: ${{ github.sha }}

      - name: 生成构建报告
        run: npm run build:analyze

      - name: 上传构建产物
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: |
            dist/
            build-report/

      - name: 上传构建元数据
        run: |
          echo "BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> $GITHUB_OUTPUT
          echo "BUILD_SHA=${{ github.sha }}" >> $GITHUB_OUTPUT
          echo "BUILD_VERSION=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT
        id: build-metadata

      - name: 创建构建标签
        run: |
          echo "BUILD_TAG=v$(node -p "require('./package.json').version")-${{ github.sha }}" >> $GITHUB_ENV

  # Docker 镜像构建
  build-docker:
    name: 构建 Docker 镜像
    runs-on: ubuntu-latest
    needs: build
    permissions:
      contents: read
      packages: write
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置 Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 登录到容器注册表
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 提取元数据
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: 构建并推送镜像
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}
            VERSION=${{ steps.meta.outputs.version }}

  # 部署到 Staging 环境
  deploy-staging:
    name: 部署到 Staging
    runs-on: ubuntu-latest
    needs: build-docker
    if: github.ref == 'refs/heads/develop' || github.event.inputs.environment == 'staging'
    environment:
      name: staging
      url: https://staging.yyc3.ai
    steps:
      - name: 下载构建产物
        uses: actions/download-artifact@v4
        with:
          name: build
          path: dist/

      - name: 部署到 Staging
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          destination_dir: staging

      - name: 通知部署状态
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging 环境部署完成'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()

  # 部署到 Production 环境
  deploy-production:
    name: 部署到 Production
    runs-on: ubuntu-latest
    needs: build-docker
    if: github.ref == 'refs/heads/main' || github.event.inputs.environment == 'production'
    environment:
      name: production
      url: https://yyc3.ai
    steps:
      - name: 下载构建产物
        uses: actions/download-artifact@v4
        with:
          name: build
          path: dist/

      - name: 部署到 Production
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          destination_dir: production

      - name: 创建 GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.event.release.tag_name }}
          release_name: Release v${{ github.event.release.tag_name }}
          draft: false
          prerelease: false

      - name: 通知部署状态
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production 环境部署完成'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()

  # 性能测试
  test-performance:
    name: 性能测试
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 运行性能测试
        run: npm run test:performance
        env:
          BASE_URL: https://staging.yyc3.ai

      - name: 上传性能报告
        uses: actions/upload-artifact@v4
        with:
          name: performance-report
          path: lighthouse-report/

  # 安全扫描
  security-scan:
    name: 安全扫描
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 运行 Trivy 漏洞扫描
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: 上传扫描结果到 GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: 运行 npm audit
        run: npm audit --audit-level=moderate

      - name: 运行 Snyk 安全扫描
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

#### 1.2 依赖更新工作流

**文件路径**: `.github/workflows/dependency-update.yml`

```yaml
name: 依赖更新

on:
  schedule:
    - cron: '0 0 * * 0'  # 每周日午夜运行
  workflow_dispatch:

jobs:
  update-dependencies:
    name: 更新依赖
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: 配置 Git
        run: |
          git config --global user.name 'YYC3 Bot'
          git config --global user.email 'bot@yyc3.ai'

      - name: 运行 npm-check-updates
        run: |
          npx npm-check-updates -u
          npm install

      - name: 运行测试
        run: npm test

      - name: 创建 Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          branch: 'deps/update-dependencies'
          title: 'chore: 更新依赖包'
          body: |
            ## 依赖更新

            自动更新所有依赖包到最新版本。

            ### 变更内容
            - 更新 package.json 中的所有依赖
            - 运行所有测试确保兼容性

            ### 检查清单
            - [ ] 所有测试通过
            - [ ] 无破坏性变更
            - [ ] 手动测试关键功能
          labels: 'dependencies, automated'
          assignees: 'maintainer'
```

### 2. Docker 配置

#### 2.1 Dockerfile

**文件路径**: `Dockerfile`

```dockerfile
# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# 复制 package 文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm@8.15.0

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

ENV BUILD_DATE=${BUILD_DATE}
ENV VCS_REF=${VCS_REF}
ENV VERSION=${VERSION}

RUN pnpm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装生产环境依赖
RUN apk add --no-cache \
    dumb-init \
    curl

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# 安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 复制配置文件
COPY --chown=nodejs:nodejs nginx.conf /etc/nginx/nginx.conf

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 80 443

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

#### 2.2 Docker Compose 配置

**文件路径**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  # 应用服务
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
      args:
        BUILD_DATE: ${BUILD_DATE:-}
        VCS_REF: ${VCS_REF:-}
        VERSION: ${VERSION:-latest}
    container_name: yyc3-app
    restart: unless-stopped
    ports:
      - "${APP_PORT:-3200}:80"
    environment:
      NODE_ENV: production
      PORT: 80
      DATABASE_URL: postgresql://${POSTGRES_USER:-yyc3}:${POSTGRES_PASSWORD:-password}@postgres:5432/${POSTGRES_DB:-yyc3}
      REDIS_URL: redis://redis:6379
      AI_API_KEY: ${AI_API_KEY}
      AI_API_BASE: ${AI_API_BASE}
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - yyc3-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: yyc3-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-yyc3}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: ${POSTGRES_DB:-yyc3}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    networks:
      - yyc3-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-yyc3}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: yyc3-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-password}
    volumes:
      - redis-data:/data
    ports:
      - "${REDIS_PORT:-6379}:6379"
    networks:
      - yyc3-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: yyc3-nginx
    restart: unless-stopped
    ports:
      - "${NGINX_HTTP_PORT:-80}:80"
      - "${NGINX_HTTPS_PORT:-443}:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - app
    networks:
      - yyc3-network

  # 监控服务 - Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: yyc3-prometheus
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    ports:
      - "${PROMETHEUS_PORT:-9090}:9090"
    networks:
      - yyc3-network

  # 监控服务 - Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: yyc3-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
      GF_INSTALL_PLUGINS: grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    ports:
      - "${GRAFANA_PORT:-3000}:3000"
    depends_on:
      - prometheus
    networks:
      - yyc3-network

networks:
  yyc3-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  prometheus-data:
  grafana-data:
```

### 3. 环境配置管理

#### 3.1 环境变量文件

**文件路径**: `.env.example`

```bash
# 应用配置
NODE_ENV=production
PORT=3200
APP_URL=https://yyc3.ai
API_URL=https://api.yyc3.ai

# 数据库配置
DATABASE_URL=postgresql://yyc3:password@localhost:5432/yyc3
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis 配置
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# AI 服务配置
AI_API_KEY=your-api-key
AI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-4
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7

# 认证配置
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# 文件存储配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yyc3.ai

# 监控配置
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info
LOG_FORMAT=json

# CDN 配置
CDN_URL=https://cdn.yyc3.ai
CDN_BUCKET=yyc3-assets

# 第三方服务
FIGMA_ACCESS_TOKEN=your-figma-token
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

#### 3.2 环境特定配置

**Staging 环境**: `.env.staging`

```bash
NODE_ENV=staging
PORT=3200
APP_URL=https://staging.yyc3.ai
API_URL=https://api.staging.yyc3.ai
LOG_LEVEL=debug
```

**Production 环境**: `.env.production`

```bash
NODE_ENV=production
PORT=3200
APP_URL=https://yyc3.ai
API_URL=https://api.yyc3.ai
LOG_LEVEL=warn
```

### 4. 部署脚本

#### 4.1 部署前检查脚本

**文件路径**: `scripts/pre-deploy.sh`

```bash
#!/bin/bash

set -e

echo "🔍 开始部署前检查..."

# 检查 Node.js 版本
echo "检查 Node.js 版本..."
NODE_VERSION=$(node -v)
echo "当前 Node.js 版本: $NODE_VERSION"

# 检查依赖安装
echo "检查依赖安装..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules 不存在，请先运行 npm install"
    exit 1
fi

# 运行类型检查
echo "运行 TypeScript 类型检查..."
npm run typecheck

# 运行代码检查
echo "运行 ESLint 检查..."
npm run lint

# 运行单元测试
echo "运行单元测试..."
npm run test:unit

# 检查环境变量
echo "检查环境变量..."
if [ ! -f ".env.production" ]; then
    echo "⚠️  警告: .env.production 文件不存在"
fi

# 检查构建配置
echo "检查构建配置..."
if [ ! -f "vite.config.ts" ]; then
    echo "❌ vite.config.ts 不存在"
    exit 1
fi

# 检查 Docker 配置
echo "检查 Docker 配置..."
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile 不存在"
    exit 1
fi

echo "✅ 部署前检查完成"
```

#### 4.2 部署脚本

**文件路径**: `scripts/deploy.sh`

```bash
#!/bin/bash

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
ENVIRONMENT=${1:-staging}
VERSION=$(node -p "require('./package.json').version")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF=$(git rev-parse --short HEAD)

echo "🚀 开始部署到 $ENVIRONMENT 环境..."

# 运行部署前检查
echo "运行部署前检查..."
./scripts/pre-deploy.sh

# 加载环境变量
echo "加载环境变量..."
if [ "$ENVIRONMENT" = "production" ]; then
    export $(cat .env.production | xargs)
elif [ "$ENVIRONMENT" = "staging" ]; then
    export $(cat .env.staging | xargs)
else
    echo -e "${RED}❌ 未知的环境: $ENVIRONMENT${NC}"
    exit 1
fi

# 构建应用
echo "构建应用..."
npm run build

# 运行测试
echo "运行测试..."
npm run test:integration

# 构建 Docker 镜像
echo "构建 Docker 镜像..."
docker build \
    --build-arg BUILD_DATE=$BUILD_DATE \
    --build-arg VCS_REF=$VCS_REF \
    --build-arg VERSION=$VERSION \
    -t yyc3/ai-code-designer:$VERSION \
    -t yyc3/ai-code-designer:latest \
    .

# 推送镜像到注册表
if [ "$ENVIRONMENT" = "production" ]; then
    echo "推送镜像到注册表..."
    docker push yyc3/ai-code-designer:$VERSION
    docker push yyc3/ai-code-designer:latest
fi

# 停止旧容器
echo "停止旧容器..."
docker-compose -f docker-compose.$ENVIRONMENT.yml down

# 启动新容器
echo "启动新容器..."
docker-compose -f docker-compose.$ENVIRONMENT.yml up -d

# 等待应用启动
echo "等待应用启动..."
sleep 10

# 健康检查
echo "执行健康检查..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 应用启动成功${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "等待应用启动... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ 应用启动失败${NC}"
    docker-compose -f docker-compose.$ENVIRONMENT.yml logs
    exit 1
fi

# 运行数据库迁移
echo "运行数据库迁移..."
npm run db:migrate

# 清理旧镜像
echo "清理旧镜像..."
docker image prune -f

echo -e "${GREEN}🎉 部署完成！${NC}"
echo "版本: $VERSION"
echo "环境: $ENVIRONMENT"
echo "构建时间: $BUILD_DATE"
echo "提交: $VCS_REF"
```

#### 4.3 回滚脚本

**文件路径**: `scripts/rollback.sh`

```bash
#!/bin/bash

set -e

ENVIRONMENT=${1:-staging}
PREVIOUS_VERSION=${2}

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "❌ 请指定要回滚的版本"
    echo "用法: ./scripts/rollback.sh <environment> <version>"
    echo "示例: ./scripts/rollback.sh staging v1.0.0"
    exit 1
fi

echo "🔄 开始回滚到版本 $PREVIOUS_VERSION..."

# 拉取指定版本的镜像
echo "拉取镜像..."
docker pull yyc3/ai-code-designer:$PREVIOUS_VERSION

# 更新 docker-compose.yml
echo "更新 docker-compose.yml..."
sed -i.bak "s/image: yyc3\/ai-code-designer:.*/image: yyc3\/ai-code-designer:$PREVIOUS_VERSION/" docker-compose.$ENVIRONMENT.yml

# 重启服务
echo "重启服务..."
docker-compose -f docker-compose.$ENVIRONMENT.yml up -d

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 健康检查
echo "执行健康检查..."
if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
    echo "✅ 回滚成功"
else
    echo "❌ 回滚失败"
    exit 1
fi

echo "🎉 回滚完成！"
```

### 5. 监控和日志

#### 5.1 Prometheus 配置

**文件路径**: `prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'yyc3-production'
    environment: 'production'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - 'alerts/*.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'yyc3-app'
    static_configs:
      - targets: ['app:80']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:9121']
```

#### 5.2 Grafana 仪表板配置

**文件路径**: `grafana/provisioning/dashboards/dashboard.yml`

```yaml
apiVersion: 1

providers:
  - name: 'YYC3 Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: true
```

#### 5.3 日志配置

**文件路径**: `src/utils/logger.ts`

```typescript
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'json';

const logTransports: winston.transport[] = [
  // 控制台输出
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
          msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
      })
    ),
  }),

  // 文件输出
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),

  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Elasticsearch 输出（生产环境）
if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
  logTransports.push(
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL,
      },
      index: 'yyc3-logs',
    })
  );
}

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'yyc3-ai-code-designer',
    environment: process.env.NODE_ENV,
  },
  transports: logTransports,
});

// Sentry 集成
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });

  logger.on('error', (error) => {
    Sentry.captureException(error);
  });
}
```

### 6. 性能优化

#### 6.1 Nginx 配置

**文件路径**: `nginx/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # 缓存配置
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g
                     inactive=60m use_temp_path=off;

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    upstream backend {
        least_conn;
        server app:80 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    server {
        listen 80;
        server_name yyc3.ai www.yyc3.ai;

        # 重定向到 HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yyc3.ai www.yyc3.ai;

        # SSL 配置
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # 静态资源缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri @backend;
        }

        # API 限流
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            limit_conn conn_limit 10;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # 健康检查
        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }

        # 主应用
        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### 7. 自动化测试

#### 7.1 测试配置

**文件路径**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
});
```

### 8. 部署检查清单

#### 8.1 部署前检查

- [ ] 所有测试通过（单元测试、集成测试、E2E 测试）
- [ ] 代码审查完成
- [ ] 代码质量检查通过（ESLint、TypeScript）
- [ ] 安全扫描通过
- [ ] 性能测试通过
- [ ] 文档更新完成
- [ ] 变更日志更新
- [ ] 数据库迁移脚本准备
- [ ] 环境变量配置正确
- [ ] 备份策略确认

#### 8.2 部署后验证

- [ ] 应用健康检查通过
- [ ] 关键功能测试通过
- [ ] API 响应时间正常
- [ ] 数据库连接正常
- [ ] 日志输出正常
- [ ] 监控指标正常
- [ ] 错误率在可接受范围
- [ ] 用户反馈收集
- [ ] 性能指标监控
- [ ] 回滚计划准备

### 9. 故障处理

#### 9.1 常见问题处理

**问题**: 应用启动失败

**解决方案**:
1. 检查日志文件
2. 验证环境变量配置
3. 检查数据库连接
4. 验证依赖安装
5. 检查端口占用

**问题**: 性能下降

**解决方案**:
1. 分析性能监控数据
2. 检查数据库查询
3. 优化代码逻辑
4. 增加缓存策略
5. 扩容服务器资源

**问题**: 数据库连接失败

**解决方案**:
1. 检查数据库服务状态
2. 验证连接字符串
3. 检查网络连接
4. 验证认证信息
5. 检查连接池配置

### 10. 最佳实践

#### 10.1 CI/CD 最佳实践

1. **自动化**: 尽可能自动化所有流程
2. **快速反馈**: 缩短构建和测试时间
3. **并行执行**: 使用并行任务提高效率
4. **缓存优化**: 利用缓存减少构建时间
5. **安全第一**: 集成安全扫描和漏洞检测
6. **监控告警**: 建立完善的监控和告警机制
7. **文档完善**: 保持文档和配置同步更新
8. **回滚准备**: 始终准备回滚方案
9. **渐进式部署**: 使用蓝绿部署或金丝雀发布
10. **持续改进**: 定期审查和优化 CI/CD 流程

#### 10.2 部署最佳实践

1. **环境隔离**: 严格区分开发、测试、生产环境
2. **配置管理**: 使用配置管理工具统一管理配置
3. **版本控制**: 所有配置文件纳入版本控制
4. **自动化测试**: 部署前必须通过自动化测试
5. **监控告警**: 部署后持续监控应用状态
6. **日志管理**: 集中收集和分析日志
7. **备份恢复**: 定期备份并测试恢复流程
8. **安全加固**: 定期进行安全审计和加固
9. **性能优化**: 持续优化应用性能
10. **文档维护**: 保持部署文档的及时更新

---

## 总结

本 CI/CD 流程文档提供了完整的自动化部署解决方案，包括：

✅ **GitHub Actions 工作流配置** - 自动化测试、构建、部署流程
✅ **Docker 容器化** - 多阶段构建和容器编排
✅ **环境配置管理** - 多环境支持和配置管理
✅ **部署脚本** - 自动化部署和回滚脚本
✅ **监控和日志** - Prometheus、Grafana 和日志收集
✅ **性能优化** - Nginx 配置和缓存策略
✅ **自动化测试** - 单元测试、集成测试、E2E 测试
✅ **故障处理** - 常见问题处理和最佳实践

通过这套 CI/CD 流程，可以实现：
- 🚀 快速、可靠的自动化部署
- 📊 全面的监控和告警
- 🔒 完善的安全保障
- 📈 持续的性能优化
- 🔄 灵活的回滚机制

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
| 内容校验 | 9ef5e259d89ae1f6 |
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
