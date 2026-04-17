/**
 * @file api-service.test.ts
 * @description API Service 全面测试 — 覆盖项目CRUD、通知管理、部署、分页排序
 * @author YYC³ QA Team
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isApiSuccess, isApiError } from '@/app/types/api'

describe('ApiService - Project API', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('应该能够获取项目列表（分页）', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.list({ page: 1, pageSize: 10 })
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const data = result.data

    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
    expect(result.meta).toBeDefined()
    expect(result.meta?.page).toBe(1)
    expect(result.meta?.pageSize).toBe(10)
    expect(result.meta?.total).toBeGreaterThanOrEqual(3)
  })

  it('应该能够获取单个项目详情', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.get('proj-001')
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const data = result.data

    expect(data).toBeDefined()
    expect(data.id).toBe('proj-001')
    expect(data.name).toBe('E-Commerce Dashboard')
    expect(data.status).toBe('active')
    expect(data.tech).toBeDefined()
    expect(data.collaborators).toBeDefined()
  })

  it('应该处理不存在的项目ID', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.get('non-existent-id')
    if (!isApiError(result)) throw new Error('Expected error response')
    const err = result.error

    expect(err).toBeDefined()
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toContain('not found')
  })

  it('应该能够创建新项目', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.create({
      name: 'New Test Project',
      description: 'Test project for unit testing',
      tech: {
        framework: 'react',
        language: 'typescript',
        styling: 'tailwind',
      },
      tags: ['test', 'unit'],
    })
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const data = result.data

    expect(data).toBeDefined()
    expect(data.name).toBe('New Test Project')
    expect(data.description).toBe('Test project for unit testing')
    expect(data.id).toMatch(/^proj-\d{3}$/)
    expect(data.status).toBe('draft')
    expect(data.createdAt).toBeDefined()
    expect(data.tags).toContain('test')
  })

  it('创建项目时应使用默认值（如果未提供）', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.create({})
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const data = result.data

    expect(data.name).toBe('Untitled Project')
    expect(data.tech.framework).toBe('react')
    expect(data.tags).toHaveLength(0)
  })

  it('应该能够更新项目信息', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.update('proj-001', {
      name: 'Updated Dashboard',
      status: 'archived',
    })
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const data = result.data

    expect(data.name).toBe('Updated Dashboard')
    expect(data.status).toBe('archived')
    expect(data.updatedAt).toBeDefined()
  })

  it('更新不存在的项目应返回错误', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.update('non-existent', { name: 'Test' })
    if (!isApiError(result)) throw new Error('Expected error response')

    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('应该能够删除项目', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const created = await projectApi.create({ name: 'To Delete' })
    if (!isApiSuccess(created)) throw new Error('Expected success response')

    const result = await projectApi.delete(created.data.id)
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    expect(result.data?.deleted).toBe(true)

    const getAfterDelete = await projectApi.get(created.data.id)
    if (!isApiError(getAfterDelete)) throw new Error('Expected error response')
  })

  it('删除不存在的项目应返回错误', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.delete('non-existent')
    if (!isApiError(result)) throw new Error('Expected error response')

    expect(result.error?.code).toBe('NOT_FOUND')
  })
})

describe('ApiService - 分页与排序', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('应该支持按名称升序排列', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.list({
      sortBy: 'name',
      sortOrder: 'asc',
      pageSize: 20,
    })
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const data = result.data

    if (data.length >= 2) {
      for (let i = 1; i < data.length; i++) {
        expect(data[i - 1].name.localeCompare(data[i].name)).toBeLessThanOrEqual(0)
      }
    }
  })

  it('应该支持按名称降序排列', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.list({
      sortBy: 'name',
      sortOrder: 'desc',
      pageSize: 20,
    })
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const data = result.data

    if (data.length >= 2) {
      for (let i = 1; i < data.length; i++) {
        expect(data[i - 1].name.localeCompare(data[i].name)).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('应该正确计算分页元数据', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.list({ page: 1, pageSize: 2 })
    if (!isApiSuccess(result)) throw new Error('Expected success response')

    expect(result.meta?.totalPages).toBeGreaterThanOrEqual(2)
    expect(result.meta?.hasMore).toBe(true)
    expect(result.data.length).toBeLessThanOrEqual(2)
  })

  it('第二页应返回不同的数据', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const page1 = await projectApi.list({ page: 1, pageSize: 1 })
    const page2 = await projectApi.list({ page: 2, pageSize: 1 })
    expect(isApiSuccess(page1) && isApiSuccess(page2)).toBe(true)

    expect(page1.data[0].id).not.toBe(page2.data[0].id)
  })
})

describe('ApiService - Notification API', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('应该能够获取通知列表', async () => {
    const { notificationApi } = await import('@/app/services/api-service')

    const result = await notificationApi.list()
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const data = result.data

    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
    expect(data[0]).toHaveProperty('id')
    expect(data[0]).toHaveProperty('type')
    expect(data[0]).toHaveProperty('title')
    expect(data[0]).toHaveProperty('message')
    expect(data[0]).toHaveProperty('read')
  })

  it('应该能够获取未读通知数量', async () => {
    const { notificationApi } = await import('@/app/services/api-service')

    const result = await notificationApi.unreadCount()
    if (!isApiSuccess(result)) throw new Error('Expected success response')

    expect(typeof result.data).toBe('number')
    expect(result.data).toBeGreaterThanOrEqual(0)
  })

  it('应该能够标记单个通知为已读', async () => {
    const { notificationApi } = await import('@/app/services/api-service')

    const before = await notificationApi.unreadCount()
    if (!isApiSuccess(before)) throw new Error('Expected success response')
    expect(before.data).toBeGreaterThan(0)

    const notifs = await notificationApi.list()
    if (!isApiSuccess(notifs)) throw new Error('Expected success response')
    const unreadNotif = notifs.data.find(n => !n.read)
    expect(unreadNotif).toBeDefined()

    const result = await notificationApi.markRead(unreadNotif!.id)
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    expect(result.data?.read).toBe(true)

    const after = await notificationApi.unreadCount()
    if (!isApiSuccess(after)) throw new Error('Expected success response')
    expect(after.data).toBe(before.data - 1)
  })

  it('标记不存在的通知应返回错误', async () => {
    const { notificationApi } = await import('@/app/services/api-service')

    const result = await notificationApi.markRead('non-existent-notif')
    if (!isApiError(result)) throw new Error('Expected error response')

    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('应该能够将所有通知标记为已读', async () => {
    const { notificationApi } = await import('@/app/services/api-service')

    const result = await notificationApi.markAllRead()
    if (!isApiSuccess(result)) throw new Error('Expected success response')

    expect(typeof result.data?.updated).toBe('number')
    expect(result.data?.updated).toBeGreaterThanOrEqual(0)

    const unreadCount = await notificationApi.unreadCount()
    if (!isApiSuccess(unreadCount)) throw new Error('Expected success response')
    expect(unreadCount.data).toBe(0)
  })
})

describe('ApiService - Deployment API', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('应该能够创建部署任务', async () => {
    const { deploymentApi } = await import('@/app/services/api-service')

    const result = await deploymentApi.create('proj-001')
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const data = result.data

    expect(data).toBeDefined()
    expect(data.id).toMatch(/^deploy-\d+$/)
    expect(data.projectId).toBe('proj-001')
    expect(data.version).toBe('1.0.0')
    expect(data.status).toBe('pending')
    expect(data.startedAt).toBeDefined()
  })

  it('部署应该包含完整的生命周期字段', async () => {
    const { deploymentApi } = await import('@/app/services/api-service')

    const result = await deploymentApi.create('proj-002')
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const data = result.data

    expect(data.id).toBeDefined()
    expect(data.projectId).toBeDefined()
    expect(data.version).toBeDefined()
    expect(data.status).toBeDefined()
    expect(data.startedAt).toBeDefined()
  })
})

describe('ApiService - 数据完整性验证', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('项目应该包含所有必需的字段', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.get('proj-001')
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const data = result.data

    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('name')
    expect(data).toHaveProperty('description')
    expect(data).toHaveProperty('ownerId')
    expect(data).toHaveProperty('tech')
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('collaborators')
    expect(data).toHaveProperty('tags')
    expect(data).toHaveProperty('createdAt')
    expect(data).toHaveProperty('updatedAt')
  })

  it('项目的tech对象应该包含所有技术栈信息', async () => {
    const { projectApi } = await import('@/app/services/api-service')

    const result = await projectApi.get('proj-001')
    if (!isApiSuccess(result)) throw new Error('Expected success response')

    expect(result.data.tech).toHaveProperty('framework')
    expect(result.data.tech).toHaveProperty('language')
    expect(result.data.tech).toHaveProperty('styling')
    expect(result.data.tech).toHaveProperty('stateManagement')
  })

  it('通知应该包含所有必需的字段', async () => {
    const { notificationApi } = await import('@/app/services/api-service')

    const result = await notificationApi.list()
    if (!isApiSuccess(result)) throw new Error('Expected success response')
    const notif = result.data[0]

    expect(notif).toHaveProperty('id')
    expect(notif).toHaveProperty('type')
    expect(notif).toHaveProperty('title')
    expect(notif).toHaveProperty('message')
    expect(notif).toHaveProperty('read')
    expect(notif).toHaveProperty('createdAt')
  })

  it('通知类型应该是有效的', async () => {
    const { notificationApi } = await import('@/app/services/api-service')

    const result = await notificationApi.list()
    if (!isApiSuccess(result)) throw new Error('Expected success response')

    const validTypes = ['info', 'success', 'warning', 'error']
    result.data.forEach(notif => {
      expect(validTypes).toContain(notif.type)
    })
  })
})
