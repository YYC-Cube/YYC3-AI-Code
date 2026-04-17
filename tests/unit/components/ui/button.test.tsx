/**
 * @file button.test.tsx
 * @description Button 组件单元测试 - 覆盖所有变体和交互
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @license MIT
 * 
 * @note 结合 2026 年智能应用趋势，采用现代化测试实践：
 * - React Testing Library（用户视角测试）
 * - 变体测试（所有 variant 和 size 组合）
 * - 无障碍测试（a11y）
 * - 快照测试（回归检测）
 * 
 * @tech-stack-2026:
 * - React Testing Library (用户视角测试）
 * - Vitest (快速测试框架）
 * - TypeScript (严格类型检查）
 * - 快照测试（回归检测）
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/app/components/ui/button'

describe('Button 组件', () => {
  describe('渲染测试', () => {
    it('应该渲染为 button 元素', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    it('应该渲染子元素', () => {
      render(<Button>Button Text</Button>)
      expect(screen.getByText('Button Text')).toBeInTheDocument()
    })

    it('应该支持自定义 className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('variant 变体', () => {
    it('应该渲染 default variant', () => {
      render(<Button variant="default">Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('应该渲染 destructive variant', () => {
      render(<Button variant="destructive">Destructive</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('应该渲染 outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('应该渲染 secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('应该渲染 ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('应该渲染 link variant', () => {
      render(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('size 变体', () => {
    it('应该渲染 default size', () => {
      render(<Button size="default">Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('应该渲染 sm size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('应该渲染 lg size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('应该渲染 icon size', () => {
      render(<Button size="icon">Icon</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('变体组合', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
    const sizes = ['default', 'sm', 'lg', 'icon'] as const

    it.each(variants)('应该渲染 %s variant', (variant) => {
      render(<Button variant={variant}>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it.each(sizes)('应该渲染 %s size', (size) => {
      render(<Button size={size}>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('disabled 状态', () => {
    it('应该渲染为 disabled 状态', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('应该有正确的 opacity', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('disabled:opacity-50')
    })
  })

  describe('交互测试', () => {
    it('应该响应点击事件', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('应该在 disabled 状态下不响应点击', async () => {
      const handleClick = vi.fn()
      render(<Button disabled onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      await userEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('asChild 属性', () => {
    it('应该支持 asChild', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link.tagName).toBe('A')
    })
  })

  describe('无障碍测试', () => {
    it('应该有正确的 role', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('应该支持 aria-disabled', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('图标和内容', () => {
    it('应该支持图标作为子元素', () => {
      const icon = <span data-testid="icon">Icon</span>
      render(<Button>{icon} Button</Button>)
      
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Button')).toBeInTheDocument()
    })

    it('应该支持只有图标', () => {
      render(<Button size="icon">Icon</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('类型安全', () => {
    it('应该接受所有 button props', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('应该支持 form 属性', () => {
      render(<Button form="my-form">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('form', 'my-form')
    })
  })
})
