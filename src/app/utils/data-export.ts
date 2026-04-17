/**
 * @file data-export.ts
 * @description F-14 Data Export/Backup — collect all store data, serialize to JSON, download/upload
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 */

import { useAppStore } from '../stores/app-store'
import { useLayoutStore } from '../stores/layout-store'
import { useThemeStore } from '../stores/theme-store'
import { usePluginStore } from '../stores/plugin-store'
import { useSessionStore } from '../stores/session-store'
import { useNotificationStore } from '../stores/notification-store'
import { toast } from 'sonner'
import { createLogger } from './logger'
import { i18nService } from '../services/i18n-service'

const log = createLogger('DataExport')

export interface BackupManifest {
  version: string
  exportedAt: string
  appName: string
  sections: string[]
}

export interface BackupData {
  manifest: BackupManifest
  projects: any
  activeProjectId: string | null
  aiModels: any[]
  activeModelId: string | null
  layout: any
  theme: any
  plugins: any[]
  sessions: any
  fileContents: any
  notifications: any[]
}

/**
 * Collect all application state into a backup object
 */
export function collectBackupData(): BackupData {
  const appState = useAppStore.getState()
  const layoutState = useLayoutStore.getState()
  const themeState = useThemeStore.getState()
  const pluginState = usePluginStore.getState()
  const sessionState = useSessionStore.getState()
  const notificationState = useNotificationStore.getState()

  const sections: string[] = []

  // Projects
  const projects = appState.projects
  const activeProjectId = appState.activeProjectId
  sections.push('projects')

  // AI Models (strip API keys for safety)
  const aiModels = appState.aiModels.map(m => ({
    ...m,
    apiKey: m.apiKey ? '***REDACTED***' : '',
  }))
  const activeModelId = appState.activeModelId
  sections.push('aiModels')

  // Layout
  const layout = layoutState.config
  sections.push('layout')

  // Theme
  const theme = {
    currentThemeName: themeState.currentTheme.name,
    type: themeState.currentTheme.type,
    branding: themeState.currentTheme.branding,
    customColors: themeState.currentTheme.colors,
  }
  sections.push('theme')

  // Plugins
  const plugins = pluginState.plugins.map(p => ({
    name: p.name,
    installed: p.installed,
    enabled: p.enabled,
  }))
  sections.push('plugins')

  // Sessions
  const sessions = {
    sessions: sessionState.sessions,
    activeSessionId: sessionState.activeSessionId,
  }
  sections.push('sessions')

  // File contents
  const fileContents = appState.fileContents
  sections.push('fileContents')

  // Notifications (last 50)
  const notifications = notificationState.notifications.slice(0, 50)
  sections.push('notifications')

  return {
    manifest: {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'YYC3 Family AI',
      sections,
    },
    projects,
    activeProjectId,
    aiModels,
    activeModelId,
    layout,
    theme,
    plugins,
    sessions,
    fileContents,
    notifications,
  }
}

/**
 * Export backup data as a downloadable JSON file
 */
export function exportBackup(): void {
  try {
    const data = collectBackupData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    link.href = url
    link.download = `yyc3-backup-${timestamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    log.info('Backup exported successfully', { sections: data.manifest.sections.length })
    toast.success(i18nService.t('backup.exportSuccess', 'designer'), {
      description: `${data.manifest.sections.length} sections`,
    })
  } catch (err: any) {
    log.error('Backup export failed', { error: err.message })
    toast.error(i18nService.t('messages.error', 'common'), { description: err.message })
  }
}

/**
 * Import backup data from a JSON file
 */
export function importBackup(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) {return}

    try {
      const text = await file.text()
      const data: BackupData = JSON.parse(text)

      // Validate manifest
      if (!data.manifest?.version || !data.manifest?.appName) {
        throw new Error('Invalid backup file: missing manifest')
      }

      const [major] = data.manifest.version.split('.').map(Number)
      if (major !== 1) {
        throw new Error(`Incompatible backup version: ${data.manifest.version}`)
      }

      let restoredSections = 0

      // Restore layout
      if (data.layout) {
        const layoutStore = useLayoutStore.getState()
        layoutStore.applyPreset('custom')
        if (data.layout.panels) {
          Object.entries(data.layout.panels).forEach(([id, cfg]) => {
            layoutStore.updatePanelConfig(id as any, cfg as any)
          })
        }
        restoredSections++
      }

      // Restore projects
      if (data.projects && Array.isArray(data.projects)) {
        const appStore = useAppStore.getState()
        // Merge — don't overwrite, add new ones
        const existingIds = new Set(appStore.projects.map(p => p.id))
        for (const p of data.projects) {
          if (!existingIds.has(p.id)) {
            appStore.createProject(p.name, p.description)
          }
        }
        restoredSections++
      }

      // Restore plugin states
      if (data.plugins && Array.isArray(data.plugins)) {
        const pluginStore = usePluginStore.getState()
        for (const p of data.plugins) {
          const existing = pluginStore.plugins.find(ep => ep.name === p.name)
          if (existing) {
            if (p.installed && !existing.installed) {pluginStore.installPlugin(p.name)}
            if (p.enabled && existing.installed && !existing.enabled) {pluginStore.togglePlugin(p.name)}
          }
        }
        restoredSections++
      }

      // Restore file contents
      if (data.fileContents && typeof data.fileContents === 'object') {
        const appStore = useAppStore.getState()
        Object.entries(data.fileContents).forEach(([path, fc]: [string, any]) => {
          if (fc?.content) {
            appStore.updateFileContent(path, fc.content)
          }
        })
        restoredSections++
      }

      log.info('Backup imported successfully', {
        version: data.manifest.version,
        sections: restoredSections,
      })
      toast.success(i18nService.t('backup.importSuccess', 'designer'), {
        description: `${restoredSections} sections restored`,
      })
    } catch (err: any) {
      log.error('Backup import failed', { error: err.message })
      toast.error(i18nService.t('messages.error', 'common'), { description: err.message })
    }
  }
  input.click()
}