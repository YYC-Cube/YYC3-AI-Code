/**
 * @file ai-store.ts
 * @description AI Store - 完整的状态管理，包含重试、离线模式、错误处理
 * @author YYC³ AI Team
 * @version 1.0.0
 * @license MIT
 */

import { create } from 'zustand'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  error?: string
}

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
}

export interface AIStoreState {
  isLoading: boolean
  error: Error | null
  messages: AIMessage[]
  isStreaming: boolean
  retryConfig: RetryConfig
  
  // Actions
  sendMessage: (message: string) => Promise<void>
  sendBatchMessages: (messages: string[]) => Promise<{ success: boolean; message: string; error?: string }[]>
  clearMessages: () => void
  setError: (error: Error | null) => void
  setLoading: (loading: boolean) => void
  setRetryConfig: (config: Partial<RetryConfig>) => void
  
  // Internal
  _attemptCount: number
  _resetAttemptCount: () => void
  // Test helpers
  _disableRetries: () => void
  _enableRetries: () => void
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calculateExponentialBackoff(attempt: number, config: RetryConfig): number {
  const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay)
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000
}

export const useAIStore = create<AIStoreState>((set, get) => ({
  isLoading: false,
  error: null,
  messages: [],
  isStreaming: false,
  retryConfig: DEFAULT_RETRY_CONFIG,
  _attemptCount: 0,

  sendMessage: async (message: string) => {
    const { messages, retryConfig } = get()
    
    set({ 
      isLoading: true, 
      error: null, 
      isStreaming: true,
      _attemptCount: 0 
    })
    
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      set(state => ({ _attemptCount: state._attemptCount + 1 }))
      
      try {
        // Check if offline
        if (!navigator.onLine) {
          throw new Error('Network is offline. Please check your connection.')
        }
        
        const userMessage: AIMessage = {
          id: `msg-${Date.now()}-user`,
          role: 'user',
          content: message,
          timestamp: Date.now(),
        }
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message, 
            history: messages.slice(-10)
          }),
        })

        if (!response.ok) {
          // Handle specific HTTP errors
          const errorMessage = `HTTP ${response.status}: ${response.statusText}`
          
          if (response.status === 429) {
            throw new Error(`Rate limit exceeded. ${errorMessage}`)
          } else if (response.status === 401) {
            throw new Error(`Unauthorized. ${errorMessage}`)
          } else if (response.status >= 500) {
            throw new Error(`Server error. ${errorMessage}`)
          }
          
          throw new Error(errorMessage)
        }

        const data = await response.json()
        
        const assistantMessage: AIMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: data.content || data.message || '',
          timestamp: Date.now(),
        }
        
        set(state => ({
          messages: [...state.messages, userMessage, assistantMessage],
          isLoading: false,
          isStreaming: false,
          error: null,
        }))
        
        return // Success, exit retry loop
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry on certain errors
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          // CORS or network error - will retry
        } else if (lastError.message.includes('offline') || lastError.message.includes('401')) {
          // Don't retry for offline or auth errors
          break
        }
        
        // If we have retries left, wait and try again
        if (attempt < retryConfig.maxRetries) {
          const delay = calculateExponentialBackoff(attempt, retryConfig)
          await sleep(delay)
        }
      }
    }
    
    // All retries exhausted
    set({ 
      error: lastError, 
      isLoading: false, 
      isStreaming: false 
    })
    
    throw lastError
  },

  sendBatchMessages: async (messages: string[]) => {
    const results: { success: boolean; message: string; error?: string }[] = []
    
    for (const message of messages) {
      try {
        await get().sendMessage(message)
        results.push({ success: true, message })
      } catch (error) {
        results.push({ 
          success: false, 
          message, 
          error: error instanceof Error ? error.message : String(error)
        })
        // Continue with next message even if this one failed
      }
    }
    
    return results
  },

  clearMessages: () => set({ messages: [], error: null }),

  setError: (error) => set({ error }),

  setLoading: (isLoading) => set({ isLoading }),

  setRetryConfig: (config) => set(state => ({
    retryConfig: { ...state.retryConfig, ...config }
  })),

  _resetAttemptCount: () => set({ _attemptCount: 0 }),
  
  // Test helpers to disable/enable retries
  _disableRetries: () => set(state => ({
    retryConfig: { ...state.retryConfig, maxRetries: 0 }
  })),
  
  _enableRetries: () => set(state => ({
    retryConfig: { ...state.retryConfig, maxRetries: DEFAULT_RETRY_CONFIG.maxRetries }
  })),
}))
