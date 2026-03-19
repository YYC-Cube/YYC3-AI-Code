import React, { useState, useCallback } from 'react';
import {
  X, BookOpen, Terminal, Copy, Check, Play, CheckCircle2,
  GitBranch, Container, Globe, Server, Wifi, Database,
  RefreshCw, FileCode2, Shield, AlertTriangle, ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useDesigner } from '../../store';
import { copyToClipboard } from '../../utils/clipboard';
import { useThemeTokens } from './hooks/useThemeTokens';

/* ================================================================
   §7 — Deploy Manual Script Steps
   ================================================================ */

interface ScriptStep {
  id: string;
  step: string;
  title: string;
  desc: string;
  command: string;
  note?: string;
}

const SCRIPT_STEPS: ScriptStep[] = [
  {
    id: 'clone', step: '1', title: '克隆仓库',
    desc: '拉取项目源码到本地工作目录',
    command: `git clone https://github.com/your-org/multi-panel-lowcode.git\ncd multi-panel-lowcode`,
  },
  {
    id: 'env', step: '2', title: '创建 .env',
    desc: '配置前端和后端所需的环境变量',
    command: `cat > .env <<EOF
# 前端
VITE_OPENAI_CLIENT_ID=xxxx
VITE_OPENAI_REDIRECT_URI=http://localhost:3000/auth/callback

# 后端
OPENAI_CLIENT_ID=xxxx
OPENAI_CLIENT_SECRET=xxxx
OPENAI_API_KEY=sk-xxxx
DATABASE_URL="file:./data/db.sqlite"
JWT_SECRET="super-secret-key"
EOF`,
    note: '生产环境请使用 Docker Secrets 或 Vault 管理敏感变量',
  },
  {
    id: 'build', step: '3', title: '构建并启动',
    desc: 'Docker Compose 构建并启动所有 4 个服务容器',
    command: 'docker compose up -d --build',
  },
  {
    id: 'access', step: '4', title: '访问应用',
    desc: '打开浏览器访问前端和后端 API',
    command: `open http://localhost:5173   # 前端
open http://localhost:3000   # 后端 API（Swagger）`,
    note: '首次访问系统会自动创建本地 DB、生成默认项目',
  },
  {
    id: 'use', step: '5', title: '使用与操作',
    desc: '拖拽编辑、实时预览、保存、点击"部署"触发容器内构建',
    command: `# 在 UI 中拖拽、编辑、实时预览
# 保存 → "部署" 按钮触发:
#   npm run build && npm start (容器内)`,
  },
  {
    id: 'mysql', step: '6', title: '切换 MySQL (可选)',
    desc: '生产环境从 SQLite 切换到 MySQL',
    command: `# 修改 docker-compose.yml 中 db 服务为 mysql
# 更新 .env:
DATABASE_URL="mysql://user:pwd@db:3306/dbname"
# 重新启动
docker compose up -d`,
    note: '需在 Prisma schema datasource 中也改为 mysql provider',
  },
];

/* ================================================================
   One-click deploy script (combined)
   ================================================================ */

function generateOneClickScript(): string {
  return `#!/bin/bash
# ═══════════════════════════════════════════════
# YANYUCLOUD Low-Code Designer — 一键部署脚本
# 运行: chmod +x deploy.sh && ./deploy.sh
# ═══════════════════════════════════════════════

set -e

echo "━━━ YANYUCLOUD 一键部署 ━━━"
echo ""

# Step 1: 检查依赖
echo "▶ 检查 Docker..."
if ! command -v docker &>/dev/null; then
  echo "✗ Docker 未安装。请先安装 Docker Desktop。"
  exit 1
fi
echo "✓ Docker $(docker --version | awk '{print $3}')"

echo "▶ 检查 Docker Compose..."
if ! docker compose version &>/dev/null; then
  echo "✗ Docker Compose 未安装。"
  exit 1
fi
echo "✓ $(docker compose version)"

# Step 2: 检查 .env
if [ ! -f .env ]; then
  echo "▶ 创建默认 .env..."
  cat > .env <<ENVEOF
VITE_OPENAI_CLIENT_ID=your_openai_client_id
VITE_OPENAI_REDIRECT_URI=http://localhost:5173/auth/callback
OPENAI_CLIENT_ID=your_openai_client_id
OPENAI_CLIENT_SECRET=your_openai_client_secret
OPENAI_API_KEY=sk-your-openai-api-key
DATABASE_URL="file:./data/db.sqlite"
JWT_SECRET="$(openssl rand -hex 32)"
JWT_EXPIRES_IN=7d
ENVEOF
  echo "✓ .env 已创建 (请编辑填入真实密钥)"
else
  echo "✓ .env 已存在"
fi

# Step 3: 创建数据目录
mkdir -p data my-designs

# Step 4: 构建并启动
echo ""
echo "▶ 构建并启动 Docker 容器..."
docker compose up -d --build

# Step 5: 等待健康检查
echo ""
echo "▶ 等待服务就绪..."
sleep 5

# 检查服务状态
echo ""
echo "━━━ 服务状态 ━━━"
docker compose ps --format "table {{.Name}}\\t{{.Status}}\\t{{.Ports}}"

# Step 6: 输出访问信息
echo ""
echo "━━━ 部署完成 ━━━"
echo ""
echo "  🌐 前端:     http://localhost:5173"
echo "  🔌 API:      http://localhost:3000"
echo "  📡 WebSocket: ws://localhost:1234"
echo "  📖 Swagger:  http://localhost:3000/docs"
echo ""
echo "  首次登录后系统会自动初始化数据库。"
echo "  编辑 my-designs/design.json 会自动触发代码生成和热更新。"
echo ""
echo "  停止: docker compose down"
echo "  日志: docker compose logs -f"
echo ""`;
}

function generateHealthCheckScript(): string {
  return `#!/bin/bash
# YANYUCLOUD 健康检查脚本
# 运行: ./healthcheck.sh

echo "━━━ YANYUCLOUD 健康检查 ━━━"
echo ""

# 检查容器状态
echo "▶ 容器状态:"
docker compose ps --format "  {{.Name}}: {{.Status}}"
echo ""

# 检查端口
check_port() {
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$1" | grep -q "200\\|301\\|302"; then
    echo "  ✓ 端口 $1 ($2): 正常"
  else
    echo "  ✗ 端口 $1 ($2): 无响应"
  fi
}

echo "▶ 端口检查:"
check_port 5173 "前端"
check_port 3000 "后端 API"
echo ""

# 检查数据库
echo "▶ 数据库:"
if [ -f ./data/db.sqlite ]; then
  size=$(du -h ./data/db.sqlite | cut -f1)
  echo "  ✓ SQLite: ./data/db.sqlite ($size)"
else
  echo "  ✗ SQLite 文件不存在"
fi
echo ""

# 检查 design.json
echo "▶ Design JSON:"
if [ -f ./my-designs/design.json ]; then
  size=$(du -h ./my-designs/design.json | cut -f1)
  panels=$(cat ./my-designs/design.json | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('panels',[])))" 2>/dev/null || echo "?")
  echo "  ✓ design.json ($size, $panels 面板)"
else
  echo "  ⚠ design.json 尚未生成"
fi
echo ""

# 检查磁盘使用
echo "▶ 磁盘使用:"
docker compose exec frontend du -sh /app/dist 2>/dev/null && echo "" || echo "  (前端未构建)"
echo ""
echo "━━━ 检查完成 ━━━"`;
}

/* ================================================================
   Component
   ================================================================ */

export function DeployManual() {
  const { deployManualOpen, toggleDeployManual } = useDesigner();
  const t = useThemeTokens();
  const [activeTab, setActiveTab] = useState<'steps' | 'oneclick' | 'healthcheck'>('steps');
  const [copied, setCopied] = useState(false);
  const [runningStep, setRunningStep] = useState(-1);

  const handleCopy = useCallback((text: string) => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSimulate = useCallback(() => {
    setRunningStep(0);
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < SCRIPT_STEPS.length) {
        setRunningStep(idx);
      } else {
        setRunningStep(SCRIPT_STEPS.length);
        clearInterval(interval);
      }
    }, 1000);
  }, []);

  if (!deployManualOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className={`absolute inset-0 ${t.overlayBg} backdrop-blur-md`} onClick={toggleDeployManual} />
      <div
        className={`relative w-[800px] max-h-[88vh] ${t.modalBg} border ${t.modalBorder} rounded-2xl flex flex-col overflow-hidden`}
        style={{ boxShadow: t.modalShadow }}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${t.sectionBorder}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] text-white/90">部署/运行手册 · §7</div>
            <div className="text-[11px] text-white/30">一键脚本 · 步骤指南 · 健康检查</div>
          </div>
          <button onClick={toggleDeployManual} className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-0 border-b border-white/[0.06]">
          {([
            { key: 'steps' as const, label: '步骤指南', icon: Play },
            { key: 'oneclick' as const, label: '一键脚本', icon: Terminal },
            { key: 'healthcheck' as const, label: '健康检查', icon: Shield },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11px] transition-all border-b-2 whitespace-nowrap ${
                activeTab === key
                  ? 'text-amber-400 border-amber-400 bg-amber-500/[0.05]'
                  : 'text-white/30 border-transparent hover:text-white/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          {activeTab === 'steps' && (
            <div className="space-y-4">
              {/* Simulate button */}
              <button
                onClick={handleSimulate}
                disabled={runningStep >= 0 && runningStep < SCRIPT_STEPS.length}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/20 text-amber-400 text-[12px] hover:from-amber-500/25 hover:to-orange-500/25 transition-all disabled:opacity-50"
              >
                {runningStep >= SCRIPT_STEPS.length ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> 全部完成</>
                ) : runningStep >= 0 ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> 执行中 ({runningStep + 1}/{SCRIPT_STEPS.length})...</>
                ) : (
                  <><Play className="w-3.5 h-3.5" /> 模拟执行全部步骤</>
                )}
              </button>

              {/* Steps */}
              {SCRIPT_STEPS.map((step, idx) => {
                const isDone = idx < runningStep;
                const isRunning = idx === runningStep && runningStep < SCRIPT_STEPS.length;
                return (
                  <div
                    key={step.id}
                    className={`rounded-xl border transition-all ${
                      isDone ? 'border-emerald-500/20 bg-emerald-500/[0.03]' :
                      isRunning ? 'border-amber-500/20 bg-amber-500/[0.03]' :
                      'border-white/[0.06] bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isDone ? 'bg-emerald-500/15' : isRunning ? 'bg-amber-500/15' : 'bg-white/[0.04]'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                         isRunning ? <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" /> :
                         <span className="text-[12px] text-white/25">{step.step}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-white/70">{step.title}</div>
                        <div className="text-[10px] text-white/30">{step.desc}</div>
                      </div>
                      <button
                        onClick={() => handleCopy(step.command)}
                        className="p-1.5 rounded-lg text-white/15 hover:text-white/40 hover:bg-white/[0.06] transition-all"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="px-3 pb-3">
                      <pre className="p-3 rounded-lg bg-black/30 text-[10px] leading-relaxed font-mono text-emerald-400/50 overflow-x-auto">
                        {step.command}
                      </pre>
                      {step.note && (
                        <div className="flex items-start gap-1.5 mt-2 text-[9px] text-amber-400/50">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                          {step.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Quick links after deployment */}
              {runningStep >= SCRIPT_STEPS.length && (
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { label: '前端', url: 'http://localhost:5173', icon: Globe, color: 'text-blue-400' },
                    { label: 'API Swagger', url: 'http://localhost:3000', icon: Server, color: 'text-amber-400' },
                    { label: 'WebSocket', url: 'ws://localhost:1234', icon: Wifi, color: 'text-cyan-400' },
                  ].map(svc => (
                    <div key={svc.label} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <svc.icon className={`w-3.5 h-3.5 ${svc.color}`} />
                        <span className="text-[11px] text-white/60">{svc.label}</span>
                      </div>
                      <div className="text-[9px] text-white/25 font-mono mt-1">{svc.url}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'oneclick' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/70">deploy.sh</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/20">chmod +x deploy.sh && ./deploy.sh</span>
                  <button
                    onClick={() => handleCopy(generateOneClickScript())}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <pre className="p-4 text-[10px] leading-relaxed font-mono text-white/40 overflow-x-auto max-h-[50vh]">
                  {generateOneClickScript()}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'healthcheck' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/70">healthcheck.sh</span>
                <button
                  onClick={() => handleCopy(generateHealthCheckScript())}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <pre className="p-4 text-[10px] leading-relaxed font-mono text-white/40 overflow-x-auto max-h-[50vh]">
                  {generateHealthCheckScript()}
                </pre>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] text-emerald-400/80">定期运行建议</div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    可配合 crontab 定时执行健康检查:
                    <code className="text-cyan-400/50 bg-white/[0.04] px-1 py-0.5 rounded ml-1">*/5 * * * * /path/to/healthcheck.sh</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
          <span className="text-[10px] text-white/20">Docker Compose + Bash + Git</span>
          <button onClick={toggleDeployManual} className="px-4 py-1.5 rounded-lg bg-white/[0.06] text-white/50 text-[11px] hover:bg-white/[0.1] transition-all">
            完成
          </button>
        </div>
      </div>
    </div>
  );
}