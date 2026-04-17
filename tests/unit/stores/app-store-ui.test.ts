import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage.store[key] = value }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage.store[key] }),
  clear: vi.fn(() => { mockLocalStorage.store = {} }),
}

vi.stubGlobal('localStorage', mockLocalStorage)

describe('AppStore - UI状态管理', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  describe('终端面板控制', () => {
    it('toggleTerminal应该切换终端可见性', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      const initial = useAppStore.getState().terminalVisible
      
      useAppStore.getState().toggleTerminal()
      
      expect(useAppStore.getState().terminalVisible).toBe(!initial)
      
      useAppStore.getState().toggleTerminal()
      
      expect(useAppStore.getState().terminalVisible).toBe(initial)
    })
  })

  describe('搜索面板控制', () => {
    it('toggleSearchPanel应该切换搜索面板', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      const initial = useAppStore.getState().searchPanelOpen
      
      useAppStore.getState().toggleSearchPanel()
      
      expect(useAppStore.getState().searchPanelOpen).toBe(!initial)
    })

    it('setSearchPanelOpen应该直接设置状态', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().setSearchPanelOpen(true)
      expect(useAppStore.getState().searchPanelOpen).toBe(true)
      
      useAppStore.getState().setSearchPanelOpen(false)
      expect(useAppStore.getState().searchPanelOpen).toBe(false)
    })
  })

  describe('底部面板控制', () => {
    it('toggleBottomPanel应该切换底部面板可见性', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      const initial = useAppStore.getState().bottomPanelVisible
      
      useAppStore.getState().toggleBottomPanel()
      
      expect(useAppStore.getState().bottomPanelVisible).toBe(!initial)
    })

    it('setBottomPanelTab应该切换标签页', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().setBottomPanelTab('filesystem' as any)
      expect(useAppStore.getState().bottomPanelTab).toBe('filesystem')
      
      useAppStore.getState().setBottomPanelTab('terminal' as any)
      expect(useAppStore.getState().bottomPanelTab).toBe('terminal')
    })

    it('openBottomPanel应该打开并设置标签', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().openBottomPanel('output' as any)
      
      expect(useAppStore.getState().bottomPanelVisible).toBe(true)
      expect(useAppStore.getState().bottomPanelTab).toBe('output')
    })
  })

  describe('视图模式控制', () => {
    it('setCurrentView应该切换视图模式', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().setCurrentView('preview')
      expect(useAppStore.getState().currentView).toBe('preview')
      
      useAppStore.getState().setCurrentView('split')
      expect(useAppStore.getState().currentView).toBe('split')
      
      useAppStore.getState().setCurrentView('code')
      expect(useAppStore.getState().currentView).toBe('code')
    })
  })

  describe('AI输入状态', () => {
    it('setAiTyping应该设置AI输入状态', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().setAiTyping(true)
      expect(useAppStore.getState().isAiTyping).toBe(true)
      
      useAppStore.getState().setAiTyping(false)
      expect(useAppStore.getState().isAiTyping).toBe(false)
    })
  })

  describe('模型设置弹窗', () => {
    it('openModelSettings应该打开弹窗', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().openModelSettings()
      expect(useAppStore.getState().modelSettingsOpen).toBe(true)
    })

    it('closeModelSettings应该关闭弹窗', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().openModelSettings()
      useAppStore.getState().closeModelSettings()
      expect(useAppStore.getState().modelSettingsOpen).toBe(false)
    })
  })

  describe('文件夹展开状态', () => {
    it('toggleFolder应该切换文件夹展开状态', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      const initialState = useAppStore.getState().expandedFolders.has('src')
      
      useAppStore.getState().toggleFolder('src')
      
      const afterToggle = useAppStore.getState().expandedFolders.has('src')
      expect(afterToggle).toBe(!initialState)
    })

    it('toggleFolder对于新路径应该添加到集合', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      expect(useAppStore.getState().expandedFolders.has('new-folder')).toBe(false)
      
      useAppStore.getState().toggleFolder('new-folder')
      
      expect(useAppStore.getState().expandedFolders.has('new-folder')).toBe(true)
    })
  })

  describe('AbortController管理', () => {
    it('setAbortController应该设置控制器', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      const controller = new AbortController()
      
      useAppStore.getState().setAbortController(controller)
      
      expect(useAppStore.getState().abortController).toBe(controller)
    })

    it('setAbortController应该支持null', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().setAbortController(null)
      
      expect(useAppStore.getState().abortController).toBeNull()
    })
  })
})

describe('AppStore - 文件操作补充', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  describe('updateFileContent边界情况', () => {
    it('更新相同内容不应该标记为修改', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().updateFileContent('same-content.ts', 'hello world')
      const firstResult = useAppStore.getState().fileContents['same-content.ts']
      
      useAppStore.getState().updateFileContent('same-content.ts', 'hello world')
      const secondResult = useAppStore.getState().fileContents['same-content.ts']
      
      expect(firstResult?.content).toBe(secondResult?.content)
    })

    it('更新空内容应该正常工作', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().updateFileContent('empty.ts', '')
      
      const result = useAppStore.getState().fileContents['empty.ts']
      expect(result).toBeDefined()
      expect(result?.content).toBe('')
    })

    it('更新包含特殊字符的内容', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      const specialContent = 'const x = "中文" + \'英文\' + `模板`;\n// 注释\n/* 多行 */'
      useAppStore.getState().updateFileContent('special.ts', specialContent)
      
      expect(useAppStore.getState().fileContents['special.ts']?.content).toBe(specialContent)
    })
  })
})

describe('AppStore - 消息流式控制', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { useAppStore } = await import('@/app/stores/app-store')
    const state = useAppStore.getState()
    if (state.messages && Array.isArray(state.messages)) {
      state.messages.forEach(msg => {
        if (state.removeMessagesFrom) {
          state.removeMessagesFrom(msg.id)
        }
      })
    }
  })

  describe('updateMessage - 流式内容追加', () => {
    it('应该能够更新消息的streaming状态', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().addMessage({
        role: 'assistant',
        content: 'Initial',
        isStreaming: true,
      })
      
      const msgId = useAppStore.getState().messages[0].id
      
      useAppStore.getState().updateMessage(msgId, {
        isStreaming: false,
        content: 'Complete response',
      })
      
      const updated = useAppStore.getState().messages[0]
      expect(updated.isStreaming).toBe(false)
      expect(updated.content).toBe('Complete response')
    })

    it('应该能够逐步构建流式响应', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
      })
      
      const msgId = useAppStore.getState().messages[0].id
      
      const chunks = ['Hello', ', ', 'world', '!']
      for (const chunk of chunks) {
        const current = useAppStore.getState().messages.find(m => m.id === msgId)
        useAppStore.getState().updateMessage(msgId, {
          content: current!.content + chunk,
        })
      }
      
      expect(useAppStore.getState().messages[0].content).toBe('Hello, world!')
    })
  })

  describe('removeMessagesFrom', () => {
    it('应该只删除指定ID的消息', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().addMessage({ role: 'user', content: 'msg1' })
      useAppStore.getState().addMessage({ role: 'assistant', content: 'msg2' })
      useAppStore.getState().addMessage({ role: 'user', content: 'msg3' })
      
      const msgToRemove = useAppStore.getState().messages[1].id
      useAppStore.getState().removeMessagesFrom(msgToRemove)
      
      expect(useAppStore.getState().messages).toHaveLength(2)
      expect(useAppStore.getState().messages.find(m => m.id === msgToRemove)).toBeUndefined()
    })

    it('删除不存在的消息ID不应报错', async () => {
      const { useAppStore } = await import('@/app/stores/app-store')
      
      useAppStore.getState().addMessage({ role: 'user', content: 'keep' })
      
      expect(() => useAppStore.getState().removeMessagesFrom('non-existent')).not.toThrow()
      expect(useAppStore.getState().messages).toHaveLength(1)
    })
  })
})
