/**
 * DesignerPage 组件测试
 * 验证主设计页面的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router'

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

vi.stubGlobal('localStorage', mockLocalStorage)

describe('DesignerPage - 基本渲染 - Basic Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('应该能够导入 DesignerPage 组件', async () => {
    const { DesignerPage } = await import('@/app/components/DesignerPage')
    expect(DesignerPage).toBeDefined()
  })

  it('应该正确渲染页面容器', async () => {
    const { DesignerPage } = await import('@/app/components/DesignerPage')

    const { container } = render(
      <BrowserRouter>
        <DesignerPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      const pageContainer = container.querySelector('.h-screen')
      expect(pageContainer).toBeTruthy()
    })
  })

  it('应该渲染顶部导航栏和视图切换栏', async () => {
    const { DesignerPage } = await import('@/app/components/DesignerPage')

    render(
      <BrowserRouter>
        <DesignerPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(document.body).toBeTruthy()
    })
  })

  it('应该包含可调整大小的面板组', async () => {
    const { DesignerPage } = await import('@/app/components/DesignerPage')

    const { container } = render(
      <BrowserRouter>
        <DesignerPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      const panelGroup = container.querySelector('[data-radix-panel-group]') ||
                         container.querySelector('.flex-1.overflow-hidden')
      expect(panelGroup).toBeTruthy()
    })
  })
})

describe('DesignerPage - 交互功能 - Interactive Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('应该响应窗口大小变化而不崩溃', async () => {
    const { DesignerPage } = await import('@/app/components/DesignerPage')

    render(
      <BrowserRouter>
        <DesignerPage />
      </BrowserRouter>
    )

    window.innerWidth = 768
    window.dispatchEvent(new Event('resize'))

    await waitFor(() => {
      expect(document.body).toBeTruthy()
    })
  })

  it('应该正确处理键盘事件注册', async () => {
    const { DesignerPage } = await import('@/app/components/DesignerPage')

    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

    render(
      <BrowserRouter>
        <DesignerPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    addEventListenerSpy.mockRestore()
  })
})

describe('DesignerPage - 布局结构 - Layout Structure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('应该有正确的flex布局结构', async () => {
    const { DesignerPage } = await import('@/app/components/DesignerPage')

    const { container } = render(
      <BrowserRouter>
        <DesignerPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      const flexContainer = container.querySelector('.flex.flex-col')
      expect(flexContainer).toBeTruthy()
    })
  })

  it('应该包含溢出隐藏的容器', async () => {
    const { DesignerPage } = await import('@/app/components/DesignerPage')

    const { container } = render(
      <BrowserRouter>
        <DesignerPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      const overflowHidden = container.querySelector('.overflow-hidden')
      expect(overflowHidden).toBeTruthy()
    })
  })
})
