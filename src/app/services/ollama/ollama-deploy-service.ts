/**
 * @file ollama-deploy-service.ts
 * @description Ollama local deployment wizard — install guide, health check, model management
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { createLogger } from '../../utils/logger'

const log = createLogger('OllamaDeployService')

// ============================================
// Types
// ============================================

export type OllamaInstallStatus = 'not-installed' | 'installing' | 'installed' | 'running' | 'error'

export interface OllamaModelInfo {
  name: string
  size: string
  quantization: string
  family: string
  parameterSize: string
  status: 'available' | 'downloading' | 'downloaded' | 'error'
  downloadProgress?: number
}

export interface OllamaDeployConfig {
  host: string
  port: number
  modelsDir?: string
}

export interface OllamaInstallGuide {
  platform: 'macos' | 'linux' | 'windows'
  steps: OllamaInstallStep[]
  verifyCommand: string
}

export interface OllamaInstallStep {
  title: string
  command: string
  description: string
  isOptional?: boolean
}

export interface OllamaHealthCheck {
  reachable: boolean
  version: string | null
  modelsLoaded: number
  memoryUsage: string | null
  responseTime: number | null
  lastChecked: number
}

export interface OllamaRecommendedModel {
  id: string
  name: string
  description: string
  size: string
  tags: string[]
  pullCommand: string
  bestFor: string[]
}

// ============================================
// Recommended Models
// ============================================

const RECOMMENDED_MODELS: OllamaRecommendedModel[] = [
  {
    id: 'qwen2.5-coder:7b',
    name: 'Qwen2.5 Coder 7B',
    description: 'Code-specialized model with excellent programming capabilities',
    size: '4.4 GB',
    tags: ['code', 'popular', 'fast'],
    pullCommand: 'ollama pull qwen2.5-coder:7b',
    bestFor: ['代码生成', '代码补全', '代码审查'],
  },
  {
    id: 'deepseek-coder-v2:16b',
    name: 'DeepSeek Coder V2 16B',
    description: 'Advanced code model with strong reasoning',
    size: '8.9 GB',
    tags: ['code', 'reasoning', 'quality'],
    pullCommand: 'ollama pull deepseek-coder-v2:16b',
    bestFor: ['复杂推理', '架构设计', '代码重构'],
  },
  {
    id: 'llama3.1:8b',
    name: 'Llama 3.1 8B',
    description: 'Meta flagship general-purpose model',
    size: '4.7 GB',
    tags: ['general', 'popular', 'balanced'],
    pullCommand: 'ollama pull llama3.1:8b',
    bestFor: ['通用对话', '文本生成', '知识问答'],
  },
  {
    id: 'glm4:9b',
    name: 'GLM-4 9B',
    description: 'Zhipu AI open-source bilingual model',
    size: '5.5 GB',
    tags: ['bilingual', 'chinese', 'quality'],
    pullCommand: 'ollama pull glm4:9b',
    bestFor: ['中文对话', '中文写作', '双语翻译'],
  },
  {
    id: 'codellama:13b',
    name: 'Code Llama 13B',
    description: 'Meta code-specialized model, larger context',
    size: '7.4 GB',
    tags: ['code', 'context', 'infill'],
    pullCommand: 'ollama pull codellama:13b',
    bestFor: ['长代码生成', '代码填充', '单元测试'],
  },
  {
    id: 'mistral:7b',
    name: 'Mistral 7B',
    description: 'Efficient European model, fast inference',
    size: '4.1 GB',
    tags: ['fast', 'efficient', 'general'],
    pullCommand: 'ollama pull mistral:7b',
    bestFor: ['快速推理', '低资源场景', '实时补全'],
  },
]

// ============================================
// Install Guides
// ============================================

function getInstallGuide(platform: OllamaInstallGuide['platform']): OllamaInstallGuide {
  const guides: Record<OllamaInstallGuide['platform'], OllamaInstallGuide> = {
    macos: {
      platform: 'macos',
      steps: [
        {
          title: '下载 Ollama',
          command: 'curl -fsSL https://ollama.com/install.sh | sh',
          description: '通过官方安装脚本一键安装 Ollama',
        },
        {
          title: '或使用 Homebrew 安装',
          command: 'brew install ollama',
          description: 'Homebrew 用户可直接安装',
          isOptional: true,
        },
        {
          title: '启动 Ollama 服务',
          command: 'ollama serve',
          description: '启动本地 Ollama 服务（默认端口 11434）',
        },
        {
          title: '拉取推荐模型',
          command: 'ollama pull qwen2.5-coder:7b',
          description: '下载代码专用模型（约 4.4 GB）',
        },
      ],
      verifyCommand: 'ollama --version',
    },
    linux: {
      platform: 'linux',
      steps: [
        {
          title: '安装 Ollama',
          command: 'curl -fsSL https://ollama.com/install.sh | sh',
          description: '通过官方安装脚本一键安装',
        },
        {
          title: '启动 systemd 服务',
          command: 'sudo systemctl start ollama',
          description: '使用 systemd 管理 Ollama 服务',
        },
        {
          title: '设置开机自启',
          command: 'sudo systemctl enable ollama',
          description: '系统启动时自动运行 Ollama',
          isOptional: true,
        },
        {
          title: '拉取推荐模型',
          command: 'ollama pull qwen2.5-coder:7b',
          description: '下载代码专用模型',
        },
      ],
      verifyCommand: 'ollama --version',
    },
    windows: {
      platform: 'windows',
      steps: [
        {
          title: '下载 Ollama 安装程序',
          command: 'winget install Ollama.Ollama',
          description: '使用 winget 安装，或从 ollama.com 下载安装包',
        },
        {
          title: '或手动下载',
          command: 'https://ollama.com/download/windows',
          description: '从官网下载 Windows 安装程序',
          isOptional: true,
        },
        {
          title: '启动 Ollama',
          command: 'ollama serve',
          description: 'Ollama 安装后通常自动启动',
        },
        {
          title: '拉取推荐模型',
          command: 'ollama pull qwen2.5-coder:7b',
          description: '下载代码专用模型',
        },
      ],
      verifyCommand: 'ollama --version',
    },
  }
  return guides[platform]
}

// ============================================
// Ollama Deploy Service
// ============================================

class OllamaDeployService {
  private config: OllamaDeployConfig
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null
  private healthListeners: Set<(health: OllamaHealthCheck) => void> = new Set()
  private lastHealth: OllamaHealthCheck | null = null

  constructor(config?: Partial<OllamaDeployConfig>) {
    this.config = {
      host: config?.host || 'http://localhost',
      port: config?.port || 11434,
      modelsDir: config?.modelsDir,
    }
  }

  getBaseUrl(): string {
    return `${this.config.host}:${this.config.port}`
  }

  getApiUrl(path: string): string {
    return `${this.getBaseUrl()}${path}`
  }

  // ── Health Check ──

  async checkHealth(): Promise<OllamaHealthCheck> {
    const health: OllamaHealthCheck = {
      reachable: false,
      version: null,
      modelsLoaded: 0,
      memoryUsage: null,
      responseTime: null,
      lastChecked: Date.now(),
    }

    const start = performance.now()
    try {
      const resp = await fetch(this.getApiUrl('/api/version'), {
        signal: AbortSignal.timeout(5000),
      })
      health.responseTime = Math.round(performance.now() - start)

      if (resp.ok) {
        health.reachable = true
        const data = await resp.json()
        health.version = data.version || null
      }
    } catch {
      health.responseTime = null
    }

    if (health.reachable) {
      try {
        const models = await this.listModels()
        health.modelsLoaded = models.length
      } catch { /* ignore */ }
    }

    this.lastHealth = health
    this.healthListeners.forEach(cb => cb(health))
    return health
  }

  startHealthMonitoring(interval = 30000): void {
    this.stopHealthMonitoring()
    this.checkHealth()
    this.healthCheckTimer = setInterval(() => this.checkHealth(), interval)
  }

  stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }
  }

  onHealthUpdate(callback: (health: OllamaHealthCheck) => void): () => void {
    this.healthListeners.add(callback)
    if (this.lastHealth) {callback(this.lastHealth)}
    return () => { this.healthListeners.delete(callback) }
  }

  // ── Model Management ──

  async listModels(): Promise<OllamaModelInfo[]> {
    const resp = await fetch(this.getApiUrl('/api/tags'))
    if (!resp.ok) {throw new Error(`Failed to list models: HTTP ${resp.status}`)}
    const data = await resp.json()
    return (data.models || []).map((m: any) => ({
      name: m.name || m.model,
      size: m.size ? (m.size / 1e9).toFixed(1) + ' GB' : 'N/A',
      quantization: m.details?.quantization_level || 'N/A',
      family: m.details?.family || 'unknown',
      parameterSize: m.details?.parameter_size || 'N/A',
      status: 'downloaded' as const,
    }))
  }

  async pullModel(modelName: string, onProgress?: (progress: number) => void): Promise<void> {
    const resp = await fetch(this.getApiUrl('/api/pull'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true }),
    })

    if (!resp.ok) {throw new Error(`Failed to pull model: HTTP ${resp.status}`)}
    if (!resp.body) {return}

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {break}

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) {continue}
        try {
          const data = JSON.parse(line)
          if (data.status === 'downloading' && data.total && data.completed) {
            onProgress?.(Math.round((data.completed / data.total) * 100))
          }
        } catch { /* skip malformed lines */ }
      }
    }

    onProgress?.(100)
  }

  async deleteModel(modelName: string): Promise<void> {
    const resp = await fetch(this.getApiUrl('/api/delete'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    })
    if (!resp.ok) {throw new Error(`Failed to delete model: HTTP ${resp.status}`)}
  }

  async modelInfo(modelName: string): Promise<any> {
    const resp = await fetch(this.getApiUrl('/api/show'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    })
    if (!resp.ok) {throw new Error(`Failed to get model info: HTTP ${resp.status}`)}
    return resp.json()
  }

  // ── Install Guide ──

  getInstallGuide(): OllamaInstallGuide {
    const platform = this.detectPlatform()
    return getInstallGuide(platform)
  }

  getRecommendedModels(): OllamaRecommendedModel[] {
    return RECOMMENDED_MODELS
  }

  getRecommendedModelsByTag(tag: string): OllamaRecommendedModel[] {
    return RECOMMENDED_MODELS.filter(m => m.tags.includes(tag))
  }

  // ── Quick Setup ──

  async quickSetup(preferredModel = 'qwen2.5-coder:7b', onProgress?: (stage: string, progress?: number) => void): Promise<boolean> {
    onProgress?.('checking', 0)
    const health = await this.checkHealth()

    if (!health.reachable) {
      onProgress?.('not-installed', 0)
      return false
    }

    onProgress?.('checking-models', 30)
    const models = await this.listModels()
    const alreadyDownloaded = models.some(m => m.name === preferredModel || m.name.startsWith(preferredModel.split(':')[0]))

    if (alreadyDownloaded) {
      onProgress?.('ready', 100)
      return true
    }

    onProgress?.('pulling-model', 40)
    try {
      await this.pullModel(preferredModel, (progress) => {
        onProgress?.('pulling-model', 40 + Math.round(progress * 0.6))
      })
      onProgress?.('ready', 100)
      return true
    } catch (err) {
      log.error('Quick setup failed', err)
      onProgress?.('error', 0)
      return false
    }
  }

  // ── Config ──

  updateConfig(config: Partial<OllamaDeployConfig>): void {
    Object.assign(this.config, config)
  }

  getConfig(): OllamaDeployConfig {
    return { ...this.config }
  }

  destroy(): void {
    this.stopHealthMonitoring()
    this.healthListeners.clear()
  }

  // ── Private ──

  private detectPlatform(): OllamaInstallGuide['platform'] {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('mac') || ua.includes('darwin')) {return 'macos'}
    if (ua.includes('win')) {return 'windows'}
    return 'linux'
  }
}

// ============================================
// Singleton
// ============================================

let instance: OllamaDeployService | null = null

export function getOllamaDeployService(config?: Partial<OllamaDeployConfig>): OllamaDeployService {
  if (!instance) {
    instance = new OllamaDeployService(config)
  } else if (config) {
    instance.updateConfig(config)
  }
  return instance
}

export function destroyOllamaDeployService(): void {
  if (instance) {
    instance.destroy()
    instance = null
  }
}

export { OllamaDeployService }
