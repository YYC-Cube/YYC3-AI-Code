/**
 * @file notification-store.ts
 * @description Notification center state — in-app notifications with categories, read/unread, persistence
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.1.0
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================
// Types
// ============================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'ai' | 'system'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  /** Optional action button */
  action?: {
    label: string
    handler: string // serializable action id
  }
  /** Source component / system */
  source?: string
}

// ============================================
// Constants
// ============================================

const MAX_NOTIFICATIONS = 100

function getDefaultNotifications(): AppNotification[] {
  const now = new Date()
  return [
    {
      id: 'n-welcome',
      type: 'system',
      title: 'Welcome to YYC3 Family AI',
      message: 'Your intelligent code design platform is ready. Start by creating a new project or chatting with AI.',
      timestamp: now.toISOString(),
      read: false,
      source: 'system',
    },
    {
      id: 'n-theme',
      type: 'info',
      title: 'Liquid Glass Theme Available',
      message: 'Try the new Liquid Glass emerald theme for a stunning visual experience. Open Theme Customizer to enable.',
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      read: false,
      source: 'theme',
    },
    {
      id: 'n-model',
      type: 'warning',
      title: 'AI Model Not Configured',
      message: 'No API key detected. AI responses will use mock data. Configure your model in Settings.',
      timestamp: new Date(now.getTime() - 120000).toISOString(),
      read: false,
      source: 'ai',
    },
  ]
}

// ============================================
// Store
// ============================================

interface NotificationState {
  notifications: AppNotification[]
  panelOpen: boolean

  // Actions
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void

  // Queries
  unreadCount: () => number
  getByType: (type: NotificationType) => AppNotification[]
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: getDefaultNotifications(),
      panelOpen: false,

      addNotification: (notification) => {
        const newNotif: AppNotification = {
          ...notification,
          id: `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          read: false,
        }
        set((s) => ({
          notifications: [newNotif, ...s.notifications].slice(0, MAX_NOTIFICATIONS),
        }))
      },

      markAsRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))
      },

      markAllAsRead: () => {
        set((s) => ({
          notifications: s.notifications.map(n => ({ ...n, read: true })),
        }))
      },

      deleteNotification: (id) => {
        set((s) => ({
          notifications: s.notifications.filter(n => n.id !== id),
        }))
      },

      clearAll: () => {
        set({ notifications: [] })
      },

      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
      setPanelOpen: (open) => set({ panelOpen: open }),

      unreadCount: () => get().notifications.filter(n => !n.read).length,
      getByType: (type) => get().notifications.filter(n => n.type === type),
    }),
    {
      name: 'yyc3_notifications',
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
)
