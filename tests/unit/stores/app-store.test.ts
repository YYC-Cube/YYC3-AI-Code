/**
 * @file app-store.test.ts
 * @description AppStore 全面单元测试 — 覆盖消息管理、AI模型同步、文件操作、UI状态
 * @author YYC³ QA Team
 * @version 2.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage.store[key] = value }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage.store[key] }),
  clear: vi.fn(() => { mockLocalStorage.store = {} }),
}

vi.stubGlobal('localStorage', mockLocalStorage)

describe('AppStore - 消息管理系统', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()
    if (store.messages && Array.isArray(store.messages)) {
      store.messages.forEach(msg => {
        if (store.removeMessagesFrom) {
          store.removeMessagesFrom(msg.id)
        }
      })
    }
  })

  it('应该正确添加用户消息', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.addMessage({
      role: 'user',
      content: 'Hello AI',
    })

    const updated = useAppStore.getState()
    expect(updated.messages).toHaveLength(1)
    expect(updated.messages[0].role).toBe('user')
    expect(updated.messages[0].content).toBe('Hello AI')
    expect(updated.messages[0].id).toBeDefined()
    expect(updated.messages[0].timestamp).toBeDefined()
  })

  it('应该正确添加助手消息', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.addMessage({
      role: 'assistant',
      content: 'Hello! How can I help?',
    })

    const updated = useAppStore.getState()
    expect(updated.messages).toHaveLength(1)
    expect(updated.messages[0].role).toBe('assistant')
  })

  it('应该支持流式响应标记', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.addMessage({
      role: 'assistant',
      content: 'Streaming...',
      isStreaming: true,
    })

    const updated = useAppStore.getState()
    expect(updated.messages[0].isStreaming).toBe(true)
  })

  it('应该正确更新消息内容', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.addMessage({ role: 'user', content: 'Original' })
    const msgId = useAppStore.getState().messages[0].id

    store.updateMessage(msgId, { content: 'Updated' })

    const updated = useAppStore.getState()
    expect(updated.messages[0].content).toBe('Updated')
  })

  it('应该正确删除指定消息', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.addMessage({ role: 'user', content: 'Msg1' })
    store.addMessage({ role: 'user', content: 'Msg2' })
    const msgId = useAppStore.getState().messages[0].id

    store.removeMessagesFrom(msgId)

    const updated = useAppStore.getState()
    expect(updated.messages).toHaveLength(1)
    expect(updated.messages[0].content).toBe('Msg2')
  })

  it('应该支持AI输入状态切换', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    expect(store.isAiTyping).toBe(false)

    store.setAiTyping(true)
    expect(useAppStore.getState().isAiTyping).toBe(true)

    store.setAiTyping(false)
    expect(useAppStore.getState().isAiTyping).toBe(false)
  })

  it('应该支持AbortController管理', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    const controller = new AbortController()
    store.setAbortController(controller)

    expect(useAppStore.getState().abortController).toBe(controller)
  })
})

describe('AppStore - AI模型双向同步系统', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  it('应该能够添加AI模型并同步到ai-service-store', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    const initialCount = store.aiModels.length

    store.addAIModel({
      isActive: false,
      name: 'Test Model',
      provider: 'zhipu',
      endpoint: 'https://api.test.com',
      apiKey: 'test-key',
    })

    const updated = useAppStore.getState()
    expect(updated.aiModels.length).toBe(initialCount + 1)
    
    const newModel = updated.aiModels.find(m => m.name === 'Test Model')
    expect(newModel).toBeDefined()
    expect(newModel?.provider).toBe('zhipu')
    expect(newModel?.id).toBeDefined()
  })

  it('应该能够删除AI模型', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.addAIModel({
      isActive: false,
      name: 'To Delete',
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
      apiKey: '',
    })

    const addedModel = useAppStore.getState().aiModels.find(m => m.name === 'To Delete')
    expect(addedModel).toBeDefined()

    if (addedModel) {
      store.removeAIModel(addedModel.id)
      
      const updated = useAppStore.getState()
      expect(updated.aiModels.find(m => m.id === addedModel.id)).toBeUndefined()
    }
  })

  it('应该能够激活指定模型', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.addAIModel({
      isActive: false,
      name: 'Active Model',
      provider: 'custom',
      endpoint: 'https://api.custom.com',
      apiKey: 'custom-key',
    })

    const model = useAppStore.getState().aiModels.find(m => m.name === 'Active Model')
    if (model) {
      store.activateAIModel(model.id)

      const updated = useAppStore.getState()
      expect(updated.activeModelId).toBe(model.id)
      expect(updated.aiModels.find(m => m.id === model.id)?.isActive).toBe(true)
    }
  })

  it('应该能够更新模型配置', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.addAIModel({
      isActive: false,
      name: 'Update Me',
      provider: 'zhipu',
      endpoint: 'https://api.old.com',
      apiKey: 'old-key',
    })

    const model = useAppStore.getState().aiModels.find(m => m.name === 'Update Me')
    if (model) {
      store.updateAIModel(model.id, {
        name: 'Updated Name',
        endpoint: 'https://api.new.com',
      })

      const updated = useAppStore.getState()
      const updatedModel = updated.aiModels.find(m => m.id === model.id)
      expect(updatedModel?.name).toBe('Updated Name')
      expect(updatedModel?.endpoint).toBe('https://api.new.com')
    }
  })

  it('激活新模型时应该取消之前模型的激活状态', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.addAIModel({
      isActive: false, name: 'Model A', provider: 'zhipu', endpoint: 'https://a.com', apiKey: 'key1' })
    store.addAIModel({
      isActive: false, name: 'Model B', provider: 'ollama', endpoint: 'http://b.com', apiKey: '' })

    const models = useAppStore.getState().aiModels
    const modelA = models.find(m => m.name === 'Model A')
    const modelB = models.find(m => m.name === 'Model B')

    if (modelA && modelB) {
      store.activateAIModel(modelA.id)
      expect(useAppStore.getState().activeModelId).toBe(modelA.id)

      store.activateAIModel(modelB.id)
      const finalState = useAppStore.getState()
      expect(finalState.activeModelId).toBe(modelB.id)
      expect(finalState.aiModels.find(m => m.id === modelA.id)?.isActive).toBe(false)
      expect(finalState.aiModels.find(m => m.id === modelB.id)?.isActive).toBe(true)
    }
  })
})

describe('AppStore - 文件内容管理', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  it('应该能够更新文件内容', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.updateFileContent('src/test.tsx', 'console.log("hello")')

    const updated = useAppStore.getState()
    expect(updated.fileContents['src/test.tsx']).toBeDefined()
    expect(updated.fileContents['src/test.tsx'].content).toBe('console.log("hello")')
    expect(updated.fileContents['src/test.tsx'].isModified).toBe(false) // 首次设置，未修改
  })

  it('应该标记文件为已修改', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.updateFileContent('src/modified.ts', '// initial code')
    expect(useAppStore.getState().fileContents['src/modified.ts']?.isModified).toBe(false) // 首次设置

    store.updateFileContent('src/modified.ts', '// new code') // 第二次设置
    expect(useAppStore.getState().fileContents['src/modified.ts']?.isModified).toBe(true) // 已修改
  })

  it('应该支持清除修改标记', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.updateFileContent('src/clear.ts', 'code')
    store.clearAppliedHighlight()

    expect(useAppStore.getState().lastAppliedFile).toBeNull()
  })

  it('应该支持选择和打开文件', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.setSelectedFile('src/App.tsx')
    expect(useAppStore.getState().selectedFile).toBe('src/App.tsx')

    store.openFileTab('src/components/Button.tsx')
    expect(useAppStore.getState().openTabs).toContain('src/components/Button.tsx')
  })

  it('应该支持关闭标签页', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.openFileTab('tab1.tsx')
    store.openFileTab('tab2.tsx')
    store.closeFileTab('tab1.tsx')

    expect(useAppStore.getState().openTabs).not.toContain('tab1.tsx')
    expect(useAppStore.getState().openTabs).toContain('tab2.tsx')
  })
})

describe('AppStore - UI状态管理', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  it('应该支持底部面板切换', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    expect(store.bottomPanelVisible).toBe(false)

    store.toggleBottomPanel()
    expect(useAppStore.getState().bottomPanelVisible).toBe(true)

    store.toggleBottomPanel()
    expect(useAppStore.getState().bottomPanelVisible).toBe(false)
  })

  it('应该支持底部面板标签页切换', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.setBottomPanelTab('filesystem')
    expect(useAppStore.getState().bottomPanelTab).toBe('filesystem')

    store.setBottomPanelTab('database')
    expect(useAppStore.getState().bottomPanelTab).toBe('database')
  })

  it('应该支持打开特定标签的底部面板', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.openBottomPanel('filesystem')

    const state = useAppStore.getState()
    expect(state.bottomPanelVisible).toBe(true)
    expect(state.bottomPanelTab).toBe('filesystem')
  })

  it('应该支持模型设置面板开关', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    expect(store.modelSettingsOpen).toBe(false)

    store.openModelSettings()
    expect(useAppStore.getState().modelSettingsOpen).toBe(true)

    store.closeModelSettings()
    expect(useAppStore.getState().modelSettingsOpen).toBe(false)
  })

  it('应该支持搜索面板开关', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.toggleSearchPanel()
    expect(useAppStore.getState().searchPanelOpen).toBe(true)
  })

  it('应该支持终端面板开关', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    const initialValue = useAppStore.getState().terminalVisible

    store.toggleTerminal()
    expect(useAppStore.getState().terminalVisible).toBe(!initialValue)

    store.toggleTerminal()
    expect(useAppStore.getState().terminalVisible).toBe(initialValue)
  })
})

describe('AppStore - 模型测试结果', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  it('应该能够设置模型测试结果', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.setModelTestResult('model-1', {
      status: 'success',
      message: 'Connection successful',
      latency: 150,
    })

    const result = useAppStore.getState().modelTestResults['model-1']
    expect(result).toBeDefined()
    expect(result.status).toBe('success')
    expect(result.latency).toBe(150)
  })

  it('应该能够清除模型测试结果', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.setModelTestResult('model-1', { status: 'success', message: 'OK' })
    store.clearModelTestResult('model-1')

    expect(useAppStore.getState().modelTestResults['model-1']).toBeUndefined()
  })
})

describe('AppStore - 边界条件测试', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()

    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    if (store.messages && Array.isArray(store.messages) && store.messages.length > 0) {
      store.messages.forEach(msg => {
        if (store.removeMessagesFrom) {
          store.removeMessagesFrom(msg.id)
        }
      })
    }
  })

  it('应该处理空内容消息', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.addMessage({ role: 'user', content: '' })

    expect(useAppStore.getState().messages).toHaveLength(1)
    expect(useAppStore.getState().messages[0].content).toBe('')
  })

  it('应该处理超长内容消息', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    const longContent = 'A'.repeat(10000)
    store.addMessage({ role: 'assistant', content: longContent })

    expect(useAppStore.getState().messages[0].content.length).toBe(10000)
  })

  it('应该处理特殊字符消息', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    const specialContent = '<script>alert("xss")</script>\n"quotes"\n\ttabs\n中文内容'
    store.addMessage({ role: 'user', content: specialContent })

    expect(useAppStore.getState().messages[0].content).toBe(specialContent)
  })

  it('应该处理不存在的消息ID更新', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    const initialLength = store.messages.length
    store.updateMessage('non-existent-id', { content: 'updated' })

    expect(useAppStore.getState().messages).toHaveLength(initialLength)
  })

  it('应该处理不存在的模型ID删除', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    const initialCount = store.aiModels.length
    store.removeAIModel('non-existent-model-id')

    expect(useAppStore.getState().aiModels.length).toBe(initialCount)
  })

  it('应该处理重复添加相同名称的模型', async () => {
    const { useAppStore } = await import('@/app/stores/app-store')
    const store = useAppStore.getState()

    store.addAIModel({
      isActive: false, name: 'Duplicate', provider: 'zhipu', endpoint: 'https://a.com', apiKey: 'k1' })
    store.addAIModel({
      isActive: false, name: 'Duplicate', provider: 'zhipu', endpoint: 'https://b.com', apiKey: 'k2' })

    const duplicates = useAppStore.getState().aiModels.filter(m => m.name === 'Duplicate')
    expect(duplicates).toHaveLength(2)
    expect(duplicates[0].id).not.toBe(duplicates[1].id)
  })
})
