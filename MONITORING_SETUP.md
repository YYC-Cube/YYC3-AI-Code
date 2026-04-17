# 📊 YYC³ AI Code 监控仪表盘配置指南

> **"You can't improve what you don't measure." — Peter Drucker**

**适用版本**: v0.1.0-beta.1+  
**最后更新**: 2026-04-10  
**维护者**: YanYuCloudCube Team  

---

## 📋 目录 (Table of Contents)

1. [监控体系概览](#1-监控体系概览)
2. [GitHub内置监控](#2-github内置监控)
3. [Grafana仪表盘配置](#3-grafana仪表盘配置)
4. [自定义Dashboard方案](#4-自定义dashboard方案)
5. [关键指标定义](#5-关键指标定义-kpi-definitions)
6. [告警规则配置](#6-告警规则配置-alert-rules)
7. [自动化报告生成](#7-自动化报告生成)
8. [数据可视化最佳实践](#8-数据可视化最佳实践)

---

## 1. 监控体系概览

### 1.1 三层监控架构

```
┌─────────────────────────────────────────────────┐
│           Layer 3: Business Intelligence         │
│    (Grafana + Custom Dashboard + Reports)        │
├─────────────────────────────────────────────────┤
│            Layer 2: Analytics & Metrics          │
│     (GitHub Insights + CHAOSS + Sentry)          │
├─────────────────────────────────────────────────┤
│           Layer 1: Raw Data Collection           │
│   (GitHub API + Vercel Analytics + CI/CD Logs)   │
└─────────────────────────────────────────────────┘
```

### 1.2 监控目标

| 维度 | 目标 | 数据源 | 更新频率 |
|------|------|--------|----------|
| **增长指标** | Stars/Forks/Watchers增长趋势 | GitHub API | 实时 |
| **参与度** | Issues/PRs/Discussions活跃度 | GitHub Events | 实时 |
| **质量指标** | 测试覆盖率/构建成功率/Lint通过率 | CI/CD Pipeline | 每次提交 |
| **性能指标** | 页面加载时间/内存使用/错误率 | Sentry/RUM | 实时 |
| **社区健康** | 贡献者多样性/Issue响应时间 | CHAOSS Metrics | 每日 |
| **用户反馈** | NPS评分/功能请求优先级 | Surveys/GitHub | 每周 |

---

## 2. GitHub 内置监控

### 2.1 Insights 面板访问路径

```
Repository → Insights tab:
  ├── Overview (总览)
  ├── Contributors (贡献者)
  ├── Traffic (流量)
  ├── Commits (提交记录)
  ├── Code frequency (代码频率)
  ├── Dependency graph (依赖图)
  └── Network (网络活动)
```

### 2.2 关键Insights指标解读

#### **Overview（总览）**
```yaml
关键数据点:
  - Total Commits: 总提交数（目标：Q2达到500+）
  - Total Branches: 分支数（反映开发活跃度）
  - Total Tags: 版本标签数（反映发布节奏）
  - Total Releases: 发布版本数
  - Total Contributors: 贡献者数量（目标：Q2达到10+）
  
趋势分析:
  - Commit Activity Chart: 提交频率热力图
    * 理想状态: 每周都有绿色方块（持续活跃）
    * 警告信号: 连续多周无提交
  - Punch Card: 贡献时间段分布
    * 用于了解团队时区分布和高效时段
```

#### **Contributors（贡献者）**
```yaml
关注指标:
  - Commit Distribution: 是否过度依赖单一维护者？
    * 健康状态: Top contributor < 50% total commits
    * 危险信号: 单人 > 80% commits (Bus Factor = 1)
    
  - New Contributor Velocity: 新贡献者加入速度
    * 目标: 每月新增2-3名新贡献者
    
  - Contribution Types: 
    * Code commits vs Documentation vs Issue triage
```

#### **Traffic（流量）**
```yaml
数据维度:
  - Views (浏览量): 仓库页面被查看次数
  - Clones (克隆量): git clone次数（更真实的兴趣指标）
  - Referring Sites: 流量来源（用于优化推广渠道）
  
使用场景:
  - 判断发布帖子的效果（发布后Views spike？）
  - 识别高价值渠道（哪些网站带来最多Clones？）
  - 地域分布（用户主要来自哪个国家/地区？）
```

### 2.3 自动化GitHub数据收集脚本

```typescript
// scripts/github-metrics.ts
// 使用GitHub API v4 (GraphQL) 批量获取项目指标

import fetch from 'node-fetch'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!
const REPO_OWNER = 'YanYuCloudCube'
const REPO_NAME = 'yyc3-code'

const QUERY = `
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      stargazerCount
      forkCount
      watcherCount
      issues(states: OPEN) { totalCount }
      pullRequests(states: OPEN) {totalCount }
      releases { totalCount }
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 100) {
              nodes {
                author { name }
                additions
                deletions
                committedDate
              }
            }
          }
        }
      }
    }
  }
`

async function fetchMetrics() {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { owner: REPO_OWNER, name: REPO_NAME },
    }),
  })

  const data = await response.json()
  return data.data.repository
}

// 输出JSON供Grafana消费
const metrics = await fetchMetrics()
console.log(JSON.stringify(metrics, null, 2))
```

---

## 3. Grafana 仪表盘配置

### 3.1 架构设计

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  GitHub API │────▶│  Prometheus  │────▶│   Grafana   │
│  (Data Src) │     │ (Time Series)│     │(Visualization)│
└─────────────┘     └──────────────┘     └─────────────┘
                           ▲
                           │
                  ┌────────┴────────┐
                  │  Custom Exporter │
                  │ (github-exporter)│
                  └─────────────────┘
```

### 3.2 Docker Compose 一键部署

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.45.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=90d'

  grafana:
    image: grafana/grafana:10.2.0
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus

  github-exporter:
    build: ./github-exporter
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - REPOSITORY=YanYuCloudCube/yyc3-code
      - SCRAPE_INTERVAL=300s
    ports:
      - "9100:9100"

volumes:
  prometheus-data:
  grafana-data:
```

### 3.3 Prometheus 配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'github-exporter'
    static_configs:
      - targets: ['github-exporter:9100']
    scrape_interval: 300s  # 5分钟一次（GitHub API限流）

rule_files:
  - '/etc/prometheus/alert_rules.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

### 3.4 Grafana Dashboard JSON（YYC³ 专用）

```json
{
  "dashboard": {
    "title": "YYC³ AI Code - Project Health Dashboard",
    "uid": "yyc3-main",
    "tags": ["yyc3", "opensource", "metrics"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "📈 GitHub Stars Growth",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "targets": [{
          "expr": "github_stars_total",
          "legendFormat": "{{repo}}",
          "refId": "A"
        }],
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "palette-classic"},
            "custom": {
              "axisPlacement": "auto",
              "barAlignment": 0,
              "lineInterpolation": "smooth",
              "fillOpacity": 20,
              "gradientMode": "none"
            }
          }
        }
      },
      {
        "id": 2,
        "title": "👥 Active Contributors (30d)",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 12, "y": 0},
        "targets": [{
          "expr": "count(github_commits_total{author!=\"\"} by (author) > 0)",
          "refId": "A"
        }],
        "options": {
          "colorMode": "background",
          "graphMode": "area",
          "reduceOptions": ["last"],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {"color": "red", "value": null},
              {"color": "yellow", "value": 5},
              {"color": "green", "value": 10}
            ]
          }
        }
      },
      {
        "id": 3,
        "title": "🧪 Test Coverage Trend",
        "type": "gauge",
        "gridPos": {"h": 4, "w": 6, "x": 18, "y": 0},
        "targets": [{
          "expr": "test_coverage_percent{branch=\"main\"}",
          "refId": "A"
        }],
        "fieldConfig": {
          "defaults": {
            "min": 0,
            "max": 100,
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "red", "value": 50},
                {"color": "yellow", "value": 70},
                {"color": "green", "value": 85}
              ]
            }
          }
        }
      },
      {
        "id": 4,
        "title": "🔄 Release Frequency",
        "type": "bargauge",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 4},
        "targets": [{
          "expr": "increase(github_releases_total[30d])",
          "refId": "A"
        }]
      },
      {
        "id": 5,
        "title": "🐛 Open Issues by Severity",
        "type": "piechart",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
        "targets": [
          {"expr": 'count(github_issues_total{label="bug/critical"})', "refId": "A"},
          {"expr": 'count(github_issues_total{label="bug/high"})', "refId": "B"},
          {"expr": 'count(github_issues_total{label="bug/medium"})', "refId": "C"},
          {"expr": 'count(github_issues_total{label="bug/low"})', "refId": "D"}
        ]
      },
      {
        "id": 6,
        "title": "⚡ Build Success Rate",
        "type": "stat",
        "gridPos": {"h": 4, "w": 12, "x": 0, "y": 16},
        "targets": [{
          "expr": "(ci_builds_total{status=\"success\"} / ci_builds_total) * 100",
          "refId": "A"
        }]
      },
      {
        "id": 7,
        "title": "🌍 Traffic Sources (Top 10)",
        "type": "table",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 16},
        "targets": [{
          "expr": 'topk(10, sum by (source) (github_traffic_views_total))',
          "refId": "A"
        }]
      }
    ],
    "time": {
      "from": "now-30d",
      "to": "now"
    },
    "refresh": "5m"
  }
}
```

### 3.5 Grafana 导入步骤

```bash
# 方法1: 通过UI导入
1. 登录 Grafana (http://localhost:3000)
2. Dashboards → Import → Upload JSON file
3. 选择上面的 dashboard JSON
4. 选择 Prometheus 数据源
5. 点击 Import

# 方法2: 通过API导入
curl -X POST \
  http://admin:admin123@localhost:3000/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @grafana-dashboard-yyc3.json
```

---

## 4. 自定义 Dashboard 方案

### 4.1 轻量级替代方案（无需Docker）

如果不想部署完整的Prometheus+Grafana栈，可以使用以下轻量方案：

#### **方案A: GitHub Actions + README Badges**

```yaml
# .github/workflows/metrics.yml
name: Update Metrics Badges

on:
  schedule:
    - cron: '0 */6 * * *'  # 每6小时更新
  workflow_dispatch:

jobs:
  metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Fetch GitHub Stats
        uses: actions/github-script@v7
        id: stats
        with:
          script: |
            const repo = await github.rest.repos.get({
              owner: context.repo.owner,
              repo: context.repo.name
            })
            
            core.setOutput('stars', repo.data.stargazers_count)
            core.setOutput('forks', repo.data.forks_count)
            core.setOutput('issues', repo.data.open_issues_count)

      - name: Generate SVG Badges
        run: |
          # 使用 shields.io 动态生成徽章
          echo "![Stars](${{ steps.stats.outputs.stars }})" >> README.md
          echo "![Forks](${{ steps.stats.outputs.forks }})" >> README.md
```

#### **方案B: Star History 可视化**

```markdown
<!-- 在README中添加 -->
<a href="https://star-history.com/#YanYuCloudCube/yyc3-code&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=YanYuCloudCube/yyc3-code&type=Date&theme=dark" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=YanYuCloudCube/yyc3-code&type=Date" />
  </picture>
</a>
```

#### **方案C: CHAOSS 社区健康指标**

```bash
# 安装 CHAOSS 工具
pip install grimoirelab-perceval grimoirelab-toolkit

# 生成社区健康报告
p2o.py enrique github YanYuCloudCube yyc3-code --token $GITHUB_TOKEN

# 分析结果包括：
# - Code Diversity (代码多样性)
# - Bus Factor (关键人物依赖度)
# - Involvement (参与度分布)
# - Community Age (社区年龄)
```

---

## 5. 关键指标定义 (KPI Definitions)

### 5.1 增长漏斗指标 (Growth Funnel KPIs)

| 指标名称 | 定义 | 计算公式 | 目标值 | 数据源 |
|----------|------|----------|--------|--------|
| **Awareness Rate** | 知晓率 | Page Views / Target Developer Population | 1% | GitHub Traffic |
| **Interest Rate** | 兴趣转化率 | Stars / Page Views | 5% | GitHub API |
| **Trial Rate** | 试用转化率 | Clones / Stars | 15% | GitHub Traffic |
| **Adoption Rate** | 采用率 | Contributors / Clones | 2% | GitHub API |
| **Advocacy Rate** | 倡导率 | Referral PRs / Contributors | 10% | GitHub Events |

### 5.2 质量门禁指标 (Quality Gate KPIs)

| 指标名称 | 定义 | Warning阈值 | Critical阈值 | 当前值 |
|----------|------|-------------|--------------|--------|
| **Test Coverage** | 语句覆盖率 | < 65% | < 50% | 45.73% ⚠️ |
| **Build Success Rate** | CI构建成功率 | < 95% | < 90% | ~98% ✅ |
| **Lint Pass Rate** | ESLint通过率 | < 98% | < 95% | ~99% ✅ |
| **TypeScript Errors** | TS编译错误数 | > 10 | > 50 | 0 ✅ |
| **Bundle Size (gzip)** | 打包体积 | > 800KB | > 1.5MB | ~800KB ⚠️ |

### 5.3 社区健康指标 (Community Health KPIs)

基于 [CHAOSS Metrics](https://chaoss.io/) 框架：

```yaml
Code Diversity:
  definition: "不同作者贡献的代码行数分布均匀程度"
  calculation: "Herfindahl-Hirschman Index (HHI)"
  healthy_range: "HHI < 0.25 (高度多样化)"
  current_status: "待评估（当前主要单人开发）"
  
Bus Factor:
  definition: "如果失去Top N贡献者，项目还能继续吗？"
  calculation: "累积贡献率达到50%所需的最少人数"
  healthy_range: "Bus Factor >= 3"
  current_status: "1 (高风险，需尽快提升)"
  
Time to First Response:
  definition: "Issue/PR首次响应的中位时间"
  healthy_range: "< 24 hours for bugs, < 72 hours for features"
  current_status: "N/A (尚未收到外部Issue)"
  
Issue Resolution Rate:
  description: "30天内关闭的Issue占比"
  healthy_range: "> 80%"
  current_status: "N/A"
```

---

## 6. 告警规则配置 (Alert Rules)

### 6.1 Prometheus Alert Rules

```yaml
# alert_rules.yml
groups:
  - name: yyc3-critical-alerts
    interval: 5m
    rules:
      - alert: TestCoverageDropCritical
        expr: test_coverage_percent{branch="main"} < 45
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "测试覆盖率严重下降至 {{ $value }}%"
          description: "主分支测试覆盖率低于45%，请立即检查！"

      - alert: BuildFailureRateHigh
        expr: |
          (
            sum(rate(ci_builds_total{status="failure"}[1h])) /
            sum(rate(ci_builds_total[1h]))
          ) * 100 > 10
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "CI构建失败率过高: {{ $value }}%"
          description: "最近1小时构建失败率超过10%，请检查CI日志"

      - alert: NoNewContributors30Days
        expr: |
          count_increase(github_new_contributors_total[30d]) == 0
        for: 0
        labels:
          severity: info
        annotations:
          summary: "30天无新贡献者加入"
          description: "社区增长停滞，建议加强推广或降低贡献门槛"

      - alert: StarsGrowthStalled
        expr: |
          increase(github_stars_total[7d]) < 10
        for: 3d
        labels:
          severity: warning
        annotations:
          summary: "Star增长率放缓"
          description: "过去7天仅增加{{ $value }}个Stars，考虑新的营销活动"

  - name: yyc3-health-checks
    interval: 10m
    rules:
      - alert: WebsiteDown
        expr: up{job="yyc3-website"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "YYC³官网无法访问"
          description: "网站健康检查失败超过5分钟"

      - alert: HighMemoryUsage
        expr: |
          container_memory_usage_bytes{name="yyc3-app"} / 
          container_spec_memory_limit_bytes{name="yyc3-app"} > 0.85
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "应用内存使用率过高: {{ $value }}%"
          description: "容器内存使用超过85%，可能存在内存泄漏"
```

### 6.2 告警通知通道配置

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  routes:
    - match:
        severity: critical
      receiver: 'critical-notifications'
      repeat_interval: 1h
      
    - match:
        severity: warning
      receiver: 'warning-notifications'
      repeat_interval: 4h

receivers:
  - name: 'default-receiver'
    webhook_configs:
      - url: 'https://hooks.slack.com/services/T00/B00/xxx'

  - name: 'critical-notifications'
    slack_configs:
      - channel: '#alerts-critical'
        send_resolved: true
        title: '[CRITICAL] {{ .Status }}: {{ .Labels.alertname }}'
        text: '{{ range .Annotations.SortedPairs }}{{ .Value }}\n{{ end }}'
    email_configs:
      - to: 'admin@0379.email'
        send_resolved: true

  - name: 'warning-notifications'
    slack_configs:
      - channel: '#alerts-warning'
        send_resolved: true
```

---

## 7. 自动化报告生成

### 7.1 周报自动生成脚本

```typescript
// scripts/generate-weekly-report.ts
import * as fs from 'fs'
import fetch from 'node-fetch'

interface WeeklyMetrics {
  period: string
  stars: { start: number; end: number; growth: number; growthRate: number }
  forks: { start: number; end: number; growth: number }
  contributors: { total: number; newThisWeek: number }
  issues: { opened: number; closed: number; resolutionRate: number }
  prs: { opened: number; merged: number; mergeRate: number }
  testCoverage: { statements: number; branches: number }
  topContributors: Array<{ name: string; commits: number }>
  highlights: string[]
  nextWeekGoals: string[]
}

async function generateWeeklyReport(): Promise<WeeklyMetrics> {
  // 1. 从GitHub API获取原始数据
  // 2. 从CI/CD获取测试覆盖率
  // 3. 计算派生指标
  // 4. 生成Markdown报告
  
  const report: WeeklyMetrics = {
    period: `${getMonday()} to ${new Date().toISOString().split('T')[0]}`,
    stars: { /* ... */ },
    // ...
  }

  const markdown = formatReportAsMarkdown(report)
  fs.writeFileSync(`reports/weekly-${Date.now()}.md`, markdown)
  
  return report
}

function formatReportAsMarkdown(report: WeeklyMetrics): string {
  return `
# 📊 YYC³ AI Code Weekly Report (${report.period})

## 📈 Growth Metrics

| Metric | Value | WoW Change |
|--------|-------|------------|
| GitHub Stars | ${report.stars.end} (+${report.stars.growth}) | ${report.stars.growthRate.toFixed(1)}% |
| Forks | ${report.forks.end} (+${report.forks.growth}) | - |
| Contributors | ${report.contributors.total} (+${report.contributors.newThisWeek} new) | - |

## 🧪 Quality Metrics

- **Test Coverage**: Statements ${report.testCoverage.statements}% / Branches ${report.testCoverage.branches}%
- **Issues Resolution Rate**: ${report.issues.resolutionRate.toFixed(1)}%
- **PR Merge Rate**: ${report.prs.mergeRate.toFixed(1)}%

## 👥 Top Contributors This Week

${report.topContributors.map((c, i) => `${i+1}. ${c.name} - ${c.commits} commits`).join('\n')}

## 🎯 Highlights

${report.highlights.map(h => `- ${h}`).join('\n')}

## 📋 Next Week Goals

${report.nextWeekGoals.map(g => `- [ ] ${g}`).join('\n')}

---
*Generated automatically by YYC³ Metrics Bot*
  `.trim()
}
```

### 7.2 GitHub Actions 定时任务

```yaml
# .github/workflows/weekly-report.yml
name: Generate Weekly Report

on:
  schedule:
    - cron: '0 9 * * 1'  # 每周一上午9点
  workflow_dispatch:

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - run: npm ci
      - run: npx ts-node scripts/generate-weekly-report.ts
        
      - name: Create GitHub Discussion
        uses: repo-discussions/action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          title: "📊 Weekly Report - $(date +%Y-%m-%d)"
          body-path: reports/latest-weekly.md
          category-id: ${{ secrets.WEEKLY_REPORT_CATEGORY_ID }}
```

---

## 8. 数据可视化最佳实践

### 8.1 仪表盘设计原则

```yaml
1. 信息层次 (Information Hierarchy):
   - 第一屏: 关键数字（Stars/测试覆盖率/活跃用户）
   - 第二屏: 趋势图表（增长曲线、提交热力图）
   - 第三屏: 详细列表（最近Issues、PRs、Commits）

2. 颜色语义 (Color Semantics):
   - 🟢 Green: 健康/达标/正向增长
   - 🟡 Yellow: 警告/接近阈值/增速放缓
   - 🔴 Red: 危险/未达标/负向变化
   - 🔵 Blue: 中性信息/参考数据

3. 时间范围选择器 (Time Range Picker):
   - 默认: Last 7 days (日常监控)
   - 快捷选项: Last 24h / 7d / 30d / 90d / YTD
   - 自定义: 日期范围选择器

4. 刷新策略 (Refresh Strategy):
   - 实时数据: 30s-5m (构建状态、错误率)
   - 准实时: 5m-1h (Stars、Traffic)
   - 批处理: Daily/Weekly (贡献者统计、测试覆盖)
```

### 8.2 公开 vs 私有仪表盘

```yaml
公开仪表盘 (Public Dashboard):
  内容:
    - Star History 图表
    - 最近版本列表
    - 贡献者墙（可选匿名化）
  用途: 展示项目活力，吸引潜在用户
  工具: Star History / Shields.io / GitHub Profile README

私有仪表盘 (Private Dashboard):
  内容:
    - 详细性能指标
    - 错误率和堆栈追踪
    - 用户行为漏斗
    - 成本分析（API调用费用）
  用途: 团队内部决策支持
  工具: Grafana + Sentry + PostHog
  权限: 仅核心团队成员可访问
```

### 8.3 移动端适配

```css
/* Grafana移动端响应式CSS */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .panel-container {
    min-height: 200px;
  }
  
  /* 隐藏次要信息 */
  .secondary-metrics {
    display: none;
  }
}
```

---

## 🚀 快速开始清单 (Quick Start Checklist)

### 必做项（30分钟内完成）：

- [ ] 启用GitHub Repository Insights（默认开启）
- [ ] 在README中添加 [Star History](https://star-history.com) 图表
- [ ] 配置GitHub Actions工作流（自动更新Badges）
- [ ] 创建第一个手动报告基线（记录当前所有指标值）

### 推荐项（1周内完成）：

- [ ] 部署Grafana（使用提供的Docker Compose）
- [ ] 配置至少3个关键指标的告警规则
- [ ] 设置每周自动报告生成
- [ ] 创建公开的Project Status页面

### 进阶项（1个月内完成）：

- [ ] 集成Sentry进行错误追踪
- [ ] 设置PostHog或Plausible进行用户行为分析
- [ ] 构建CHAOSS社区健康评估流水线
- [ ] 设计并实现自定义的Exporter收集业务指标

---

## 📞 支持与资源

- **Grafana官方文档**: https://grafana.com/docs/
- **Prometheus官方文档**: https://prometheus.io/docs/
- **GitHub API文档**: https://docs.github.com/en/rest
- **CHAOSS指标框架**: https://chaoss.io/?post_type=metric
- **YYC³社区讨论**: [GitHub Discussions](https://github.com/YanYuCloudCube/yyc3-code/discussions)

---

**"数据驱动决策，让每一份努力都可衡量。"**

*— YanYuCloudCube DevRel Team*
*Last updated: 2026-04-10*
