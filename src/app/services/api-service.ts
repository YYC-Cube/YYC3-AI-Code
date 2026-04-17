/**
 * @file api-service.ts
 * @description YYC³ Mock RESTful API 服务层 — 项目、文件、通知的 CRUD 操作
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-13
 * @status stable
 * @license MIT
 *
 * In the FEFS architecture, this service simulates backend API calls
 * with in-memory data. In production, these would be Tauri bridge
 * invocations or real HTTP requests.
 */

import { createLogger } from '../utils/logger'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api'
import type { Project, ProjectFile, AppNotification, Deployment } from '../types/models'

const log = createLogger('ApiService')

/* ================================================================
   Mock Data Store
   ================================================================ */

const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'E-Commerce Dashboard',
    description: '电商数据可视化仪表盘',
    ownerId: 'user-yyc3-001',
    tech: { framework: 'react', language: 'typescript', styling: 'tailwind', stateManagement: 'zustand' },
    status: 'active',
    collaborators: [{ userId: 'user-yyc3-001', role: 'owner', joinedAt: '2026-01-15T00:00:00Z' }],
    tags: ['dashboard', 'react', 'tailwind'],
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-03-12T10:00:00Z',
  },
  {
    id: 'proj-002',
    name: 'Blog CMS',
    description: '内容管理系统',
    ownerId: 'user-yyc3-001',
    tech: { framework: 'react', language: 'typescript', styling: 'tailwind', stateManagement: 'zustand' },
    status: 'draft',
    collaborators: [{ userId: 'user-yyc3-001', role: 'owner', joinedAt: '2026-02-01T00:00:00Z' }],
    tags: ['cms', 'blog', 'markdown'],
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-03-10T08:00:00Z',
  },
  {
    id: 'proj-003',
    name: 'Task Manager',
    description: 'Kanban 风格任务管理应用',
    ownerId: 'user-yyc3-001',
    tech: { framework: 'react', language: 'typescript', styling: 'tailwind', stateManagement: 'zustand' },
    status: 'active',
    collaborators: [{ userId: 'user-yyc3-001', role: 'owner', joinedAt: '2026-02-20T00:00:00Z' }],
    tags: ['kanban', 'tasks', 'productivity'],
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: '2026-03-13T00:00:00Z',
  },
]

const mockNotifications: AppNotification[] = [
  { id: 'notif-001', type: 'info', title: '新版本发布', message: 'YYC³ AI Code v1.0.0 已发布', read: false, createdAt: '2026-03-13T08:00:00Z' },
  { id: 'notif-002', type: 'success', title: '部署成功', message: 'E-Commerce Dashboard 已部署到生产环境', read: false, createdAt: '2026-03-12T15:00:00Z' },
  { id: 'notif-003', type: 'warning', title: 'API 配额提醒', message: 'OpenAI API 本月使用量已达 80%', read: true, createdAt: '2026-03-11T10:00:00Z' },
]

/* ================================================================
   Helpers
   ================================================================ */

function delay(ms = 200): Promise<void> {
  return new Promise(r => setTimeout(r, ms + Math.random() * 100))
}

function paginate<T>(items: T[], params?: PaginationParams): { items: T[]; meta: PaginatedResponse<T>['meta'] } {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const paged = items.slice(start, start + pageSize)
  return {
    items: paged,
    meta: { page, pageSize, total, totalPages, hasMore: page < totalPages },
  }
}

/* ================================================================
   Project API
   ================================================================ */

export const projectApi = {
  /** GET /projects */
  async list(params?: PaginationParams): Promise<PaginatedResponse<Project>> {
    await delay()
    log.debug('GET /projects', params)
    const items = [...mockProjects]

    // Sort
    if (params?.sortBy) {
      const key = params.sortBy as keyof Project
      items.sort((a, b) => {
        const av = String(a[key] ?? '')
        const bv = String(b[key] ?? '')
        return params.sortOrder === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv)
      })
    }

    const { items: paged, meta } = paginate(items, params)
    return { success: true, data: paged, meta }
  },

  /** GET /projects/:id */
  async get(id: string): Promise<ApiResponse<Project>> {
    await delay()
    log.debug('GET /projects/:id', { id })
    const project = mockProjects.find(p => p.id === id)
    if (!project) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Project ${id} not found` } }
    }
    return { success: true, data: { ...project } }
  },

  /** POST /projects */
  async create(data: Partial<Project>): Promise<ApiResponse<Project>> {
    await delay(300)
    log.info('POST /projects', { name: data.name })
    const project: Project = {
      id: `proj-${String(mockProjects.length + 1).padStart(3, '0')}`,
      name: data.name || 'Untitled Project',
      description: data.description,
      ownerId: 'user-yyc3-001',
      tech: data.tech || { framework: 'react', language: 'typescript', styling: 'tailwind' },
      status: 'draft',
      collaborators: [{ userId: 'user-yyc3-001', role: 'owner', joinedAt: new Date().toISOString() }],
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockProjects.push(project)
    return { success: true, data: project }
  },

  /** PUT /projects/:id */
  async update(id: string, data: Partial<Project>): Promise<ApiResponse<Project>> {
    await delay()
    log.info('PUT /projects/:id', { id })
    const idx = mockProjects.findIndex(p => p.id === id)
    if (idx === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Project ${id} not found` } }
    }
    mockProjects[idx] = { ...mockProjects[idx], ...data, updatedAt: new Date().toISOString() }
    return { success: true, data: { ...mockProjects[idx] } }
  },

  /** DELETE /projects/:id */
  async delete(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    await delay()
    log.info('DELETE /projects/:id', { id })
    const idx = mockProjects.findIndex(p => p.id === id)
    if (idx === -1) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Project ${id} not found` } }
    }
    mockProjects.splice(idx, 1)
    return { success: true, data: { deleted: true } }
  },
}

/* ================================================================
   Notification API
   ================================================================ */

export const notificationApi = {
  /** GET /notifications */
  async list(): Promise<ApiResponse<AppNotification[]>> {
    await delay(100)
    log.debug('GET /notifications')
    return { success: true, data: [...mockNotifications] }
  },

  /** GET /notifications/unread-count */
  async unreadCount(): Promise<ApiResponse<number>> {
    await delay(50)
    const count = mockNotifications.filter(n => !n.read).length
    return { success: true, data: count }
  },

  /** PUT /notifications/:id/read */
  async markRead(id: string): Promise<ApiResponse<AppNotification>> {
    await delay(100)
    const notif = mockNotifications.find(n => n.id === id)
    if (!notif) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Notification ${id} not found` } }
    }
    notif.read = true
    return { success: true, data: { ...notif } }
  },

  /** PUT /notifications/read-all */
  async markAllRead(): Promise<ApiResponse<{ updated: number }>> {
    await delay(100)
    let count = 0
    mockNotifications.forEach(n => {
      if (!n.read) { n.read = true; count++ }
    })
    return { success: true, data: { updated: count } }
  },
}

/* ================================================================
   Deployment API (mock)
   ================================================================ */

export const deploymentApi = {
  /** POST /deployments */
  async create(projectId: string): Promise<ApiResponse<Deployment>> {
    await delay(500)
    log.info('POST /deployments', { projectId })
    const deployment: Deployment = {
      id: `deploy-${Date.now()}`,
      projectId,
      version: '1.0.0',
      status: 'pending',
      startedAt: new Date().toISOString(),
    }
    // Simulate build process
    setTimeout(() => { deployment.status = 'building' }, 1000)
    setTimeout(() => {
      deployment.status = 'deployed'
      deployment.url = `https://${projectId}.yyc3.app`
      deployment.completedAt = new Date().toISOString()
    }, 3000)
    return { success: true, data: deployment }
  },
}
