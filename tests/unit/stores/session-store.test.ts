/**
 * @file session-store.test.ts
 * @description SessionStore 全面单元测试 — 覆盖会话管理、消息操作、流式响应、持久化
 * @author YYC³ QA Team
 * @version 2.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage.store[key] = value }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage.store[key] }),
  clear: vi.fn(() => { mockLocalStorage.store = {} }),
}

vi.stubGlobal('localStorage', mockLocalStorage)

describe('SessionStore - 会话生命周期', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()
    
    Object.keys(store.sessions).forEach(sessionId => {
      store.deleteSession(sessionId)
    })
    store.setActiveSession(null)
  })

  it('应该能够创建新会话', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const sessionId = store.createSession('project-1', 'Test Session')

    expect(sessionId).toBeDefined()
    expect(typeof sessionId).toBe('string')

    const updated = useSessionStore.getState()
    expect(updated.sessions[sessionId]).toBeDefined()
    expect(updated.sessions[sessionId].title).toBe('Test Session')
    expect(updated.sessions[sessionId].projectId).toBe('project-1')
    expect(updated.sessions[sessionId].status).toBe('active')
    expect(updated.sessions[sessionId].messages).toEqual([])
  })

  it('应该自动生成会话标题（如果未提供）', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const sessionId1 = store.createSession('proj-1')
    const sessionId2 = store.createSession('proj-1')

    const sessions = useSessionStore.getState().sessions
    expect(sessions[sessionId1].title).toContain('会话')
    expect(sessions[sessionId2].title).toContain('会话')
    expect(sessions[sessionId1].title).not.toBe(sessions[sessionId2].title)
  })

  it('应该能够关闭会话', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const sessionId = store.createSession('proj-1', 'To Close')
    store.closeSession(sessionId)

    const session = useSessionStore.getState().sessions[sessionId]
    expect(session.status).toBe('closed')
  })

  it('应该能够删除会话', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const sessionId = store.createSession('proj-1', 'To Delete')
    expect(useSessionStore.getState().sessions[sessionId]).toBeDefined()

    store.deleteSession(sessionId)

    expect(useSessionStore.getState().sessions[sessionId]).toBeUndefined()
  })

  it('应该能够重命名会话', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const sessionId = store.createSession('proj-1', 'Original Name')
    store.renameSession(sessionId, 'New Name')

    expect(useSessionStore.getState().sessions[sessionId].title).toBe('New Name')
  })

  it('应该能够设置活动会话', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    expect(store.activeSessionId).toBeNull()

    const sessionId = store.createSession('proj-1')
    store.setActiveSession(sessionId)

    expect(useSessionStore.getState().activeSessionId).toBe(sessionId)
  })

  it('应该能够清除活动会话', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const sessionId = store.createSession('proj-1')
    store.setActiveSession(sessionId)
    store.setActiveSession(null)

    expect(useSessionStore.getState().activeSessionId).toBeNull()
  })
})

describe('SessionStore - 消息管理系统', () => {
  let testSessionId: string

  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { useSessionStore } = await import('@/app/stores/session-store')
    testSessionId = useSessionStore.getState().createSession('test-project', 'Test Messages')
  })

  it('应该能够添加用户消息', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const msgId = store.addMessage(testSessionId, 'user', 'Hello from user')

    expect(msgId).toBeDefined()
    const messages = useSessionStore.getState().getSessionMessages(testSessionId)
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('user')
    expect(messages[0].content).toBe('Hello from user')
  })

  it('应该能够添加助手消息', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    store.addMessage(testSessionId, 'assistant', 'Hello! I am AI')

    const messages = useSessionStore.getState().getSessionMessages(testSessionId)
    expect(messages[0].role).toBe('assistant')
    expect(messages[0].content).toBe('Hello! I am AI')
  })

  it('应该能够添加系统消息', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    store.addMessage(testSessionId, 'system', 'System notification')

    const messages = useSessionStore.getState().getSessionMessages(testSessionId)
    expect(messages[0].role).toBe('system')
  })

  it('应该能够更新消息内容', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const msgId = store.addMessage(testSessionId, 'user', 'Original content')
    store.updateMessage(testSessionId, msgId, { content: 'Updated content' })

    const messages = useSessionStore.getState().getSessionMessages(testSessionId)
    expect(messages[0].content).toBe('Updated content')
  })

  it('应该能够删除指定消息', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    store.addMessage(testSessionId, 'user', 'Message 1')
    store.addMessage(testSessionId, 'user', 'Message 2')
    const msgId = useSessionStore.getState().getSessionMessages(testSessionId)[0].id

    store.deleteMessage(testSessionId, msgId)

    const messages = useSessionStore.getState().getSessionMessages(testSessionId)
    expect(messages).toHaveLength(1)
    expect(messages[0].content).toBe('Message 2')
  })

  it('应该能够清空所有消息', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    store.addMessage(testSessionId, 'user', 'Msg 1')
    store.addMessage(testSessionId, 'assistant', 'Msg 2')
    store.addMessage(testSessionId, 'user', 'Msg 3')

    store.clearMessages(testSessionId)

    expect(useSessionStore.getState().getSessionMessages(testSessionId)).toHaveLength(0)
  })

  it('应该支持元数据附加到消息', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const metadata = {
      model: 'glm-4',
      tokens: 150,
      latency: 230,
    }

    store.addMessage(testSessionId, 'assistant', 'Response with metadata', metadata)

    const messages = useSessionStore.getState().getSessionMessages(testSessionId)
    expect(messages[0].metadata).toEqual(metadata)
  })
})

describe('SessionStore - 流式响应系统', () => {
  let testSessionId: string

  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { useSessionStore } = await import('@/app/stores/session-store')
    testSessionId = useSessionStore.getState().createSession('test-project', 'Streaming Test')
  })

  it('应该能够开始和停止流式响应', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    expect(store.isStreaming).toBe(false)

    store.startStreaming()
    expect(useSessionStore.getState().isStreaming).toBe(true)

    store.stopStreaming()
    expect(useSessionStore.getState().isStreaming).toBe(false)
  })

  it('应该能够追加内容到最后一条助手消息', async () => {
    const { useSessionStore, flushStreamBuffers } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    store.addMessage(testSessionId, 'assistant', 'Initial ')
    store.appendToLastAssistant(testSessionId, 'chunk1 ')
    store.appendToLastAssistant(testSessionId, 'chunk2 ')
    flushStreamBuffers()

    const messages = useSessionStore.getState().getSessionMessages(testSessionId)
    expect(messages[0].content).toBe('Initial chunk1 chunk2 ')
  })

  it('流式响应应该在无消息时创建新消息', async () => {
    const { useSessionStore, flushStreamBuffers } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    store.appendToLastAssistant(testSessionId, 'First chunk')
    flushStreamBuffers()

    const messages = useSessionStore.getState().getSessionMessages(testSessionId)
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('assistant')
    expect(messages[0].content).toBe('First chunk')
  })

  it('应该支持多次流式追加', async () => {
    const { useSessionStore, flushStreamBuffers } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const chunks = ['Hello', ', ', 'World', '!']
    chunks.forEach(chunk => {
      store.appendToLastAssistant(testSessionId, chunk)
    })
    flushStreamBuffers()

    const messages = useSessionStore.getState().getSessionMessages(testSessionId)
    expect(messages[0].content).toBe('Hello, World!')
  })
})

describe('SessionStore - 查询功能', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { useSessionStore } = await import('@/app/stores/session-store')
    
    useSessionStore.getState().createSession('proj-a', 'Session A')
    useSessionStore.getState().createSession('proj-b', 'Session B')
    useSessionStore.getState().createSession('proj-a', 'Session C')
  })

  it('getActiveSession 应该返回当前活动会话', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const sessionIds = Object.keys(store.sessions)
    store.setActiveSession(sessionIds[0])

    const active = useSessionStore.getState().getActiveSession()
    expect(active?.id).toBe(sessionIds[0])
  })

  it('getActiveSession 在无活动会话时应返回null', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    // 先清除活动会话
    store.setActiveSession(null)

    expect(store.getActiveSession()).toBeNull()
  })

  it('getSessionsByProject 应该返回指定项目的所有会话', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    // 创建测试专用会话
    const id1 = store.createSession('proj-a', 'Proj A Session 1')
    const id2 = store.createSession('proj-a', 'Proj A Session 2')
    store.createSession('proj-b', 'Proj B Session 1')

    const projASessions = store.getSessionsByProject('proj-a')
    // 过滤出我们刚创建的会话（至少包含2个新创建的）
    expect(projASessions.length).toBeGreaterThanOrEqual(2)

    const projBSessions = store.getSessionsByProject('proj-b')
    expect(projBSessions.length).toBeGreaterThanOrEqual(1)
  })

  it('getAllSessions 应该返回所有会话数组', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const allSessions = store.getAllSessions()
    expect(allSessions.length).toBeGreaterThan(0) // 至少有beforeEach创建的会话
    expect(Array.isArray(allSessions)).toBe(true)
  })
})

describe('SessionStore - 上下文管理', () => {
  let testSessionId: string

  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    
    const { useSessionStore } = await import('@/app/stores/session-store')
    testSessionId = useSessionStore.getState().createSession('test-project', 'Context Test')
  })

  it('应该能够更新会话上下文', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    store.updateContext(testSessionId, {
      aiModel: 'gpt-4',
      temperature: 0.9,
      maxTokens: 8192,
    })

    const session = useSessionStore.getState().sessions[testSessionId]
    expect(session.context.aiModel).toBe('gpt-4')
    expect(session.context.temperature).toBe(0.9)
    expect(session.context.maxTokens).toBe(8192)
  })

  it('应该保留未更新的上下文字段', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const originalProvider = store.sessions[testSessionId].context.aiProvider
    store.updateContext(testSessionId, { temperature: 1.0 })

    const session = useSessionStore.getState().sessions[testSessionId]
    expect(session.context.aiProvider).toBe(originalProvider)
    expect(session.context.temperature).toBe(1.0)
  })
})

describe('SessionStore - 边界条件测试', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  it('应该处理对不存在会话的消息操作', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    expect(() => {
      store.addMessage('non-existent', 'user', 'test')
    }).not.toThrow()
  })

  it('应该处理空内容消息', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const sessionId = store.createSession('proj-1')
    store.addMessage(sessionId, 'user', '')

    const messages = useSessionStore.getState().getSessionMessages(sessionId)
    expect(messages[0].content).toBe('')
  })

  it('应该处理超长内容消息', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const sessionId = store.createSession('proj-1')
    const longContent = 'X'.repeat(50000)
    store.addMessage(sessionId, 'assistant', longContent)

    const messages = useSessionStore.getState().getSessionMessages(sessionId)
    expect(messages[0].content.length).toBe(50000)
  })

  it('应该处理特殊字符内容', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const sessionId = store.createSession('proj-1')
    const specialContent = '<div class="test">HTML</div>\n```code block```\n中文🎉'
    store.addMessage(sessionId, 'user', specialContent)

    const messages = useSessionStore.getState().getSessionMessages(sessionId)
    expect(messages[0].content).toBe(specialContent)
  })

  it('应该处理重复删除同一会话', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const sessionId = store.createSession('proj-1')
    store.deleteSession(sessionId)
    
    expect(() => {
      store.deleteSession(sessionId)
    }).not.toThrow()
  })

  it('应该处理大量会话创建', async () => {
    const { useSessionStore } = await import('@/app/stores/session-store')
    const store = useSessionStore.getState()

    const initialCount = Object.keys(useSessionStore.getState().sessions).length
    
    const ids: string[] = []
    for (let i = 0; i < 100; i++) {
      ids.push(store.createSession(`proj-${i % 5}`, `Session ${i}`))
    }

    expect(Object.keys(useSessionStore.getState().sessions).length).toBe(initialCount + 100)
    expect(ids.length).toBe(100)
    expect(new Set(ids).size).toBe(100) // 确保所有ID唯一
  })
})
