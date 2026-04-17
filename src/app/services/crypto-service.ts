/**
 * @file crypto-service.ts
 * @description AES-GCM 加密/解密服务 + OS Keychain 集成模拟 — F-20 安全加固
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags security, aes-gcm, encryption, keychain, crypto
 */

import { createLogger } from '../utils/logger'

const log = createLogger('CryptoService')

// ============================================
// Types
// ============================================

export interface EncryptedPayload {
  /** Base64-encoded IV (12 bytes) */
  iv: string
  /** Base64-encoded ciphertext */
  data: string
  /** Algorithm identifier */
  alg: 'AES-GCM-256'
  /** Version for future migration */
  v: 1
}

export interface KeychainEntry {
  service: string
  account: string
  /** Encrypted value (EncryptedPayload JSON stringified) */
  value: string
  createdAt: number
  updatedAt: number
}

// ============================================
// Utilities
// ============================================

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {binary += String.fromCharCode(bytes[i])}
  return btoa(binary)
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {bytes[i] = binary.charCodeAt(i)}
  return bytes.buffer
}

// ============================================
// Master Key Derivation
// ============================================

const MASTER_KEY_STORAGE = 'yyc3_master_key_check'
const KEYCHAIN_STORAGE = 'yyc3_keychain'
const SALT_STORAGE = 'yyc3_crypto_salt'

/**
 * Derive a CryptoKey from a passphrase using PBKDF2
 * In production this would use tauri-plugin-keychain to retrieve the master key
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 310000, hash: 'SHA-256' },
    keyMaterial as CryptoKey,
    { name: 'AES-GCM', length: 256 } as any,
    false as boolean,
    ['encrypt', 'decrypt'] as KeyUsage[]
  )
}

/**
 * Get or create the persisted salt
 */
function getOrCreateSalt(): Uint8Array {
  try {
    const stored = localStorage.getItem(SALT_STORAGE)
    if (stored) {return new Uint8Array(JSON.parse(stored))}
  } catch {}
  const salt = crypto.getRandomValues(new Uint8Array(16))
  localStorage.setItem(SALT_STORAGE, JSON.stringify(Array.from(salt)))
  return salt
}

// ============================================
// AES-GCM Encryption / Decryption
// ============================================

/**
 * Encrypt plaintext using AES-256-GCM
 */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  return {
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(ciphertext),
    alg: 'AES-GCM-256',
    v: 1,
  }
}

/**
 * Decrypt an EncryptedPayload using AES-256-GCM
 */
export async function decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv))
  const ciphertext = base64ToArrayBuffer(payload.data)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  return new TextDecoder().decode(decrypted)
}

// ============================================
// Keychain Simulation
// ============================================

/**
 * OS Keychain simulation using localStorage + AES-GCM
 * In production: tauri-plugin-keychain (macOS) / Windows Credential Manager / libsecret (Linux)
 */
class KeychainSimulator {
  private entries: KeychainEntry[] = []
  private masterKey: CryptoKey | null = null
  private initialized = false

  async initialize(passphrase: string): Promise<boolean> {
    try {
      const salt = getOrCreateSalt()
      this.masterKey = await deriveKey(passphrase, salt)

      // Verify master key with stored check value
      const check = localStorage.getItem(MASTER_KEY_STORAGE)
      if (check) {
        try {
          const payload: EncryptedPayload = JSON.parse(check)
          const result = await decrypt(payload, this.masterKey)
          if (result !== 'yyc3_keychain_valid') {
            log.warn('Master key verification failed — wrong passphrase')
            this.masterKey = null
            return false
          }
        } catch {
          log.warn('Master key decryption failed — wrong passphrase')
          this.masterKey = null
          return false
        }
      } else {
        // First time: store check value
        const checkPayload = await encrypt('yyc3_keychain_valid', this.masterKey)
        localStorage.setItem(MASTER_KEY_STORAGE, JSON.stringify(checkPayload))
      }

      // Load keychain entries
      this.loadEntries()
      this.initialized = true
      log.info('Keychain initialized successfully')
      return true
    } catch (error) {
      log.error('Keychain initialization failed', { error })
      return false
    }
  }

  isInitialized(): boolean {
    return this.initialized && this.masterKey !== null
  }

  private loadEntries() {
    try {
      const raw = localStorage.getItem(KEYCHAIN_STORAGE)
      if (raw) {this.entries = JSON.parse(raw)}
    } catch {
      this.entries = []
    }
  }

  private saveEntries() {
    localStorage.setItem(KEYCHAIN_STORAGE, JSON.stringify(this.entries))
  }

  /**
   * Store a secret value in the keychain (encrypted)
   */
  async setSecret(service: string, account: string, value: string): Promise<void> {
    if (!this.masterKey) {throw new Error('Keychain not initialized')}

    const encrypted = await encrypt(value, this.masterKey)
    const encryptedStr = JSON.stringify(encrypted)

    const existing = this.entries.findIndex(e => e.service === service && e.account === account)
    const now = Date.now()

    if (existing >= 0) {
      this.entries[existing] = { ...this.entries[existing], value: encryptedStr, updatedAt: now }
    } else {
      this.entries.push({ service, account, value: encryptedStr, createdAt: now, updatedAt: now })
    }

    this.saveEntries()
    log.debug('Secret stored', { service, account })
  }

  /**
   * Retrieve a secret value from the keychain (decrypted)
   */
  async getSecret(service: string, account: string): Promise<string | null> {
    if (!this.masterKey) {throw new Error('Keychain not initialized')}

    const entry = this.entries.find(e => e.service === service && e.account === account)
    if (!entry) {return null}

    try {
      const payload: EncryptedPayload = JSON.parse(entry.value)
      return await decrypt(payload, this.masterKey)
    } catch (error) {
      log.error('Failed to decrypt secret', { service, account, error })
      return null
    }
  }

  /**
   * Check if a secret exists in the keychain
   */
  hasSecret(service: string, account: string): boolean {
    return this.entries.some(e => e.service === service && e.account === account)
  }

  /**
   * Delete a secret from the keychain
   */
  deleteSecret(service: string, account: string): void {
    this.entries = this.entries.filter(e => !(e.service === service && e.account === account))
    this.saveEntries()
    log.debug('Secret deleted', { service, account })
  }

  /**
   * List all services in the keychain (without values)
   */
  listEntries(): { service: string; account: string; createdAt: number; updatedAt: number }[] {
    return this.entries.map(({ service, account, createdAt, updatedAt }) => ({ service, account, createdAt, updatedAt }))
  }

  /**
   * Wipe the entire keychain
   */
  wipe(): void {
    this.entries = []
    this.saveEntries()
    localStorage.removeItem(MASTER_KEY_STORAGE)
    localStorage.removeItem(SALT_STORAGE)
    this.masterKey = null
    this.initialized = false
    log.warn('Keychain wiped')
  }
}

// ============================================
// Singleton & Exports
// ============================================

export const keychain = new KeychainSimulator()

/**
 * High-level helper: Encrypt an API key for a specific provider
 */
export async function encryptApiKey(providerId: string, apiKey: string): Promise<void> {
  await keychain.setSecret('yyc3-ai-providers', providerId, apiKey)
}

/**
 * High-level helper: Decrypt an API key for a specific provider
 */
export async function decryptApiKey(providerId: string): Promise<string | null> {
  return keychain.getSecret('yyc3-ai-providers', providerId)
}

/**
 * High-level helper: Encrypt a DB connection password
 */
export async function encryptDBPassword(profileId: string, password: string): Promise<void> {
  await keychain.setSecret('yyc3-db-connections', profileId, password)
}

/**
 * High-level helper: Decrypt a DB connection password
 */
export async function decryptDBPassword(profileId: string): Promise<string | null> {
  return keychain.getSecret('yyc3-db-connections', profileId)
}

/**
 * High-level helper: Hash a value using SHA-256 (for non-reversible checks)
 */
export async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return arrayBufferToBase64(hash)
}
