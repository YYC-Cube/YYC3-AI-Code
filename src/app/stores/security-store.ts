/**
 * @file security-store.ts
 * @description F-20 安全状态管理 — Keychain 初始化、API Key 加密存储、安全审计日志
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags security, keychain, encryption, audit
 */

import { create } from 'zustand'
import { createLogger } from '../utils/logger'
import { keychain, encryptApiKey, decryptApiKey, encryptDBPassword, decryptDBPassword } from '../services/crypto-service'

const log = createLogger('SecurityStore')

// ============================================
// Types
// ============================================

export type SecurityLevel = 'locked' | 'unlocked' | 'uninitialized'

export interface AuditLogEntry {
  id: string
  timestamp: number
  action: string
  target: string
  detail: string
  level: 'info' | 'warn' | 'error'
}

interface SecurityState {
  // Keychain status
  securityLevel: SecurityLevel
  keychainReady: boolean
  isUnlocking: boolean
  unlockError: string | null

  // Actions
  initializeKeychain: (passphrase: string) => Promise<boolean>
  lockKeychain: () => void
  isKeychainReady: () => boolean

  // API Key management (encrypted)
  storeApiKey: (providerId: string, apiKey: string) => Promise<void>
  retrieveApiKey: (providerId: string) => Promise<string | null>
  hasApiKey: (providerId: string) => boolean
  removeApiKey: (providerId: string) => void

  // DB Password management (encrypted)
  storeDBPassword: (profileId: string, password: string) => Promise<void>
  retrieveDBPassword: (profileId: string) => Promise<string | null>

  // Audit log
  auditLog: AuditLogEntry[]
  addAuditEntry: (action: string, target: string, detail: string, level?: AuditLogEntry['level']) => void
  clearAuditLog: () => void

  // Wipe
  wipeAllSecrets: () => void
}

// ============================================
// Store
// ============================================

export const useSecurityStore = create<SecurityState>((set, get) => ({
  securityLevel: 'uninitialized',
  keychainReady: false,
  isUnlocking: false,
  unlockError: null,
  auditLog: [],

  initializeKeychain: async (passphrase) => {
    set({ isUnlocking: true, unlockError: null })
    log.info('Initializing keychain...')

    try {
      const success = await keychain.initialize(passphrase)
      if (success) {
        set({ securityLevel: 'unlocked', keychainReady: true, isUnlocking: false })
        get().addAuditEntry('keychain.unlock', 'system', 'Keychain unlocked successfully')
        log.info('Keychain unlocked')
        return true
      } else {
        set({ securityLevel: 'locked', keychainReady: false, isUnlocking: false, unlockError: '密码错误或密钥验证失败' })
        get().addAuditEntry('keychain.unlock_failed', 'system', 'Keychain unlock failed — wrong passphrase', 'warn')
        return false
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      set({ isUnlocking: false, unlockError: msg })
      get().addAuditEntry('keychain.error', 'system', msg, 'error')
      return false
    }
  },

  lockKeychain: () => {
    set({ securityLevel: 'locked', keychainReady: false })
    get().addAuditEntry('keychain.lock', 'system', 'Keychain locked')
    log.info('Keychain locked')
  },

  isKeychainReady: () => get().keychainReady,

  // API Key management
  storeApiKey: async (providerId, apiKey) => {
    if (!get().keychainReady) {throw new Error('Keychain not ready')}
    await encryptApiKey(providerId, apiKey)
    get().addAuditEntry('apikey.store', providerId, `API key stored for provider ${providerId}`)
    log.debug('API key stored', { providerId })
  },

  retrieveApiKey: async (providerId) => {
    if (!get().keychainReady) {return null}
    const key = await decryptApiKey(providerId)
    get().addAuditEntry('apikey.retrieve', providerId, `API key retrieved for provider ${providerId}`)
    return key
  },

  hasApiKey: (providerId) => keychain.hasSecret('yyc3-ai-providers', providerId),

  removeApiKey: (providerId) => {
    keychain.deleteSecret('yyc3-ai-providers', providerId)
    get().addAuditEntry('apikey.remove', providerId, `API key removed for provider ${providerId}`)
  },

  // DB Password management
  storeDBPassword: async (profileId, password) => {
    if (!get().keychainReady) {throw new Error('Keychain not ready')}
    await encryptDBPassword(profileId, password)
    get().addAuditEntry('dbpassword.store', profileId, `DB password stored for profile ${profileId}`)
  },

  retrieveDBPassword: async (profileId) => {
    if (!get().keychainReady) {return null}
    return decryptDBPassword(profileId)
  },

  // Audit log
  addAuditEntry: (action, target, detail, level = 'info') => {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      timestamp: Date.now(), action, target, detail, level,
    }
    set(s => ({ auditLog: [entry, ...s.auditLog].slice(0, 500) }))
  },

  clearAuditLog: () => set({ auditLog: [] }),

  wipeAllSecrets: () => {
    keychain.wipe()
    set({ securityLevel: 'uninitialized', keychainReady: false, unlockError: null })
    get().addAuditEntry('keychain.wipe', 'system', 'All secrets wiped', 'warn')
    log.warn('All secrets wiped')
  },
}))
