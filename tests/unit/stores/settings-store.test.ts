/**
 * SettingsStore 测试
 * 验证设置状态管理的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock AI Service Store
vi.mock('@/app/stores/ai-service-store', () => ({
  useAIServiceStore: vi.fn(() => ({
    resetToDefaults: vi.fn(),
  })),
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

vi.stubGlobal('localStorage', mockLocalStorage)

describe('SettingsStore - 核心功能', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('应该能够导入 SettingsStore', async () => {
    const storeModule = await import('@/app/stores/settings-store')
    expect(storeModule.useSettingsStore).toBeDefined()
  })

  it('应该有默认设置', async () => {
    const { useSettingsStore } = await import('@/app/stores/settings-store')
    const store = useSettingsStore.getState()
    
    expect(store).toBeDefined()
    expect(store.settings).toBeDefined()
    expect(store.settings.userProfile).toBeDefined()
    expect(store.settings.general).toBeDefined()
  })

  it('应该能够更新用户资料', async () => {
    const { useSettingsStore } = await import('@/app/stores/settings-store')
    const store = useSettingsStore.getState()
    
    store.updateUserProfile({
      username: 'Test User',
      email: 'test@example.com',
    })
    
    const updatedStore = useSettingsStore.getState()
    expect(updatedStore.settings.userProfile.username).toBe('Test User')
    expect(updatedStore.settings.userProfile.email).toBe('test@example.com')
  })

  it('应该能够更新通用设置', async () => {
    const { useSettingsStore } = await import('@/app/stores/settings-store')
    const store = useSettingsStore.getState()
    
    store.updateGeneralSettings({
      theme: 'light',
      language: 'en-US',
    })
    
    const updatedStore = useSettingsStore.getState()
    expect(updatedStore.settings.general.theme).toBe('light')
    expect(updatedStore.settings.general.language).toBe('en-US')
  })

  it('应该能够添加 Agent', async () => {
    const { useSettingsStore } = await import('@/app/stores/settings-store')
    const store = useSettingsStore.getState()
    
    const initialCount = store.settings.agents.length
    
    store.addAgent({
      id: 'test-agent',
      name: 'Test Agent',
      systemPrompt: 'Test prompt',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      isBuiltIn: false,
      isCustom: true,
    })
    
    const updatedStore = useSettingsStore.getState()
    expect(updatedStore.settings.agents.length).toBe(initialCount + 1)
    expect(updatedStore.settings.agents.find(a => a.id === 'test-agent')).toBeDefined()
  })

  it('应该能够添加 Model', async () => {
    const { useSettingsStore } = await import('@/app/stores/settings-store')
    const store = useSettingsStore.getState()
    
    const initialCount = store.settings.models.length
    
    store.addModel({
      id: 'test-model',
      provider: 'TestProvider',
      model: 'test-model-v1',
      apiKey: '',
      enabled: true,
    })
    
    const updatedStore = useSettingsStore.getState()
    expect(updatedStore.settings.models.length).toBe(initialCount + 1)
    expect(updatedStore.settings.models.find(m => m.id === 'test-model')).toBeDefined()
  })

  it('应该能够导出配置', async () => {
    const { useSettingsStore } = await import('@/app/stores/settings-store')
    const store = useSettingsStore.getState()
    
    const exported = store.exportConfig()
    
    expect(exported).toBeDefined()
    expect(exported.userProfile).toBeDefined()
    expect(exported.general).toBeDefined()
    expect(exported.models).toBeDefined()
  })

  it('应该能够导入配置', async () => {
    const { useSettingsStore } = await import('@/app/stores/settings-store')
    const store = useSettingsStore.getState()
    
    const testConfig = {
      userProfile: {
        id: 'test-user',
        username: 'Imported User',
        email: 'imported@example.com',
      },
      general: {
        theme: 'dark' as const,
        language: 'zh-CN' as const,
        editorFont: 'JetBrains Mono',
        editorFontSize: 14,
        wordWrap: true,
        keybindingScheme: 'vscode' as const,
        customKeybindings: {},
        localLinkOpenMode: 'system' as const,
        markdownOpenMode: 'editor' as const,
        nodeVersion: '20.11.0',
      },
    }
    
    store.importConfig(testConfig)
    
    const updatedStore = useSettingsStore.getState()
    expect(updatedStore.settings.userProfile.username).toBe('Imported User')
    expect(updatedStore.settings.userProfile.email).toBe('imported@example.com')
  })

  it('应该能够重置设置', async () => {
    const { useSettingsStore } = await import('@/app/stores/settings-store')
    const store = useSettingsStore.getState()
    
    // 先修改设置
    store.updateUserProfile({
      username: 'Modified User',
      email: 'modified@example.com',
    })
    
    // 重置设置
    store.resetSettings()
    
    const updatedStore = useSettingsStore.getState()
    expect(updatedStore.settings.userProfile.username).toBe('YYC3 Developer')
  })

  it('应该能够深度搜索设置', async () => {
    const { useSettingsStore } = await import('@/app/stores/settings-store')
    const store = useSettingsStore.getState()
    
    const results = store.deepSearch('theme')
    
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)
  })

  it('应该能够获取启用的规则内容', async () => {
    const { useSettingsStore } = await import('@/app/stores/settings-store')
    const store = useSettingsStore.getState()
    
    const rulesContent = store.getEnabledRulesContent()
    
    expect(typeof rulesContent).toBe('string')
    expect(rulesContent.length).toBeGreaterThan(0)
  })
})
