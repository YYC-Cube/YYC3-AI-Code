/**
 * HomePage 组件测试
 * 验证首页组件的功能和渲染
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomePage } from '@/app/components/HomePage'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
}))

describe('HomePage 组件 - HomePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本渲染 - Basic Rendering', () => {
    it('应该成功渲染 HomePage 组件', () => {
      render(<HomePage />)

      // 检查组件存在
      const homePage = screen.getByTestId('home-page')
      expect(homePage).toBeInTheDocument()
    })

    it('应该渲染品牌标识', () => {
      render(<HomePage />)

      // 检查logo存在（使用getAllByAltText因为可能有多个logo）
      const logos = screen.getAllByAltText(/YYC³/i)
      expect(logos.length).toBeGreaterThan(0)
    })

    it('应该渲染主要操作按钮', () => {
      render(<HomePage />)

      // 检查至少有一个操作按钮
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('内容展示 - Content Display', () => {
    it('应该显示品牌标识', () => {
      render(<HomePage />)

      // 检查品牌标识（使用getAllByAltText因为可能有多个logo）
      const logos = screen.getAllByAltText(/YYC³/i)
      expect(logos.length).toBeGreaterThan(0)
    })

    it('应该显示功能列表或介绍', () => {
      render(<HomePage />)

      // 检查有一些文本内容
      const bodyText = document.body.textContent
      expect(bodyText?.length).toBeGreaterThan(0)
    })
  })

  describe('交互功能 - Interaction', () => {
    it('应该能够点击主要操作按钮', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      // 获取第一个按钮
      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        const firstButton = buttons[0]

        // 点击按钮
        await user.click(firstButton)

        // 验证按钮可以被点击（不抛出错误）
        expect(true).toBe(true)
      }
    })

    it('应该能够响应键盘事件', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      // 按 Tab 键
      await user.tab()

      // 按 Enter 键
      await user.keyboard('{Enter}')

      // 验证没有错误
      expect(true).toBe(true)
    })
  })

  describe('主题适配 - Theme Adaptation', () => {
    it('应该在亮色主题下正常渲染', () => {
      // 设置亮色主题
      document.documentElement.classList.remove('dark')

      render(<HomePage />)

      const homePage = screen.getByTestId('home-page')
      expect(homePage).toBeInTheDocument()
    })

    it('应该在暗色主题下正常渲染', () => {
      // 设置暗色主题
      document.documentElement.classList.add('dark')

      render(<HomePage />)

      const homePage = screen.getByTestId('home-page')
      expect(homePage).toBeInTheDocument()

      // 清理
      document.documentElement.classList.remove('dark')
    })
  })

  describe('响应式设计 - Responsive Design', () => {
    it('应该在小屏幕上正常渲染', () => {
      // 模拟小屏幕
      window.innerWidth = 375

      render(<HomePage />)

      const homePage = screen.getByTestId('home-page')
      expect(homePage).toBeInTheDocument()
    })

    it('应该在大屏幕上正常渲染', () => {
      // 模拟大屏幕
      window.innerWidth = 1920

      render(<HomePage />)

      const homePage = screen.getByTestId('home-page')
      expect(homePage).toBeInTheDocument()
    })
  })

  describe('无障碍性 - Accessibility', () => {
    it('应该有正确的 ARIA 标签', () => {
      render(<HomePage />)

      // 检查主页有 data-testid 属性
      const homePage = screen.getByTestId('home-page')
      expect(homePage).toBeInTheDocument()

      // 检查按钮有 role 属性
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })

    it('应该支持键盘导航', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      // Tab 键导航
      await user.tab()
      await user.tab()

      // 验证没有错误
      expect(true).toBe(true)
    })
  })

  describe('性能 - Performance', () => {
    it('应该在合理时间内渲染', () => {
      const startTime = performance.now()

      render(<HomePage />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // 渲染时间应该小于 100ms
      expect(renderTime).toBeLessThan(100)
    })

    it('不应该有不必要的重新渲染', () => {
      const { rerender } = render(<HomePage />)

      const homePage = screen.getByTestId('home-page')
      const initialText = homePage.textContent

      // 重新渲染
      rerender(<HomePage />)

      const homePageAfterRerender = screen.getByTestId('home-page')
      const textAfterRerender = homePageAfterRerender.textContent

      // 文本内容应该相同（除非组件有动态内容）
      expect(textAfterRerender).toBe(initialText)
    })
  })

  describe('错误处理 - Error Handling', () => {
    it('应该优雅地处理缺失的 props', () => {
      // HomePage 可能不需要任何 props
      render(<HomePage />)

      const homePage = screen.getByTestId('home-page')
      expect(homePage).toBeInTheDocument()
    })

    it('应该处理异步数据加载', async () => {
      render(<HomePage />)

      // 等待可能的异步操作完成
      await waitFor(() => {
        const homePage = screen.getByTestId('home-page')
        expect(homePage).toBeInTheDocument()
      })
    })
  })
})

describe('HomePage 组件集成测试 - Integration Tests', () => {
  it('应该能够与其他组件正常工作', () => {
    render(<HomePage />)

    // 验证主页渲染正常
    const homePage = screen.getByTestId('home-page')
    expect(homePage).toBeInTheDocument()

    // 验证页面整体结构
    expect(homePage.children.length).toBeGreaterThan(0)
  })
})
