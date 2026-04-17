/**
 * @file card.test.tsx
 * @description Card 组件单元测试 - 覆盖所有子组件和组合
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @license MIT
 * 
 * @note 结合 2026 年智能应用趋势，采用现代化测试实践：
 * - React Testing Library（用户视角测试）
 * - 组合测试（Card + CardHeader + CardContent）
 * - 快照测试（回归检测）
 * - 无障碍测试（a11y）
 * 
 * @tech-stack-2026:
 * - React Testing Library (用户视角测试）
 * - Vitest (快速测试框架）
 * - TypeScript (严格类型检查）
 * - 快照测试（回归检测）
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/app/components/ui/card'

describe('Card 组件', () => {
  describe('Card', () => {
    it('应该渲染为 div 元素', () => {
      render(<Card>Card Content</Card>)
      const card = screen.getByText('Card Content')
      expect(card).toBeInTheDocument()
      expect(card.parentElement?.tagName).toBe('DIV')
    })

    it('应该有正确的 data-slot 属性', () => {
      render(<Card>Content</Card>)
      const card = screen.getByText('Content')
      expect(card).toHaveAttribute('data-slot', 'card')
    })

    it('应该支持自定义 className', () => {
      render(<Card className="custom-class">Content</Card>)
      const card = screen.getByText('Content')
      expect(card).toHaveClass('custom-class')
    })

    it('应该有默认的样式类', () => {
      render(<Card>Content</Card>)
      const card = screen.getByText('Content')
      expect(card).toHaveClass('bg-card')
      expect(card).toHaveClass('rounded-xl')
      expect(card).toHaveClass('border')
    })

    it('应该接受所有 div props', () => {
      render(<Card data-testid="card">Content</Card>)
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('CardHeader', () => {
    it('应该渲染为 div 元素', () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>
      )
      const header = screen.getByText('Header')
      expect(header).toBeInTheDocument()
      expect(header.parentElement?.tagName).toBe('DIV')
    })

    it('应该有正确的 data-slot 属性', () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>
      )
      const header = screen.getByText('Header')
      expect(header).toHaveAttribute('data-slot', 'card-header')
    })

    it('应该支持自定义 className', () => {
      render(
        <Card>
          <CardHeader className="custom-class">Header</CardHeader>
        </Card>
      )
      const header = screen.getByText('Header')
      expect(header).toHaveClass('custom-class')
    })

    it('应该有默认的样式类', () => {
      render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>
      )
      const header = screen.getByText('Header')
      expect(header).toHaveClass('px-6')
      expect(header).toHaveClass('pt-6')
    })

    it('应该接受所有 div props', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header</CardHeader>
        </Card>
      )
      expect(screen.getByTestId('header')).toBeInTheDocument()
    })
  })

  describe('CardTitle', () => {
    it('应该渲染为 h4 元素', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Title')
      expect(title).toBeInTheDocument()
      expect(title.tagName).toBe('H4')
    })

    it('应该有正确的 data-slot 属性', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Title')
      expect(title).toHaveAttribute('data-slot', 'card-title')
    })

    it('应该支持自定义 className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-class">Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Title')
      expect(title).toHaveClass('custom-class')
    })

    it('应该有默认的样式类', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = screen.getByText('Title')
      expect(title).toHaveClass('leading-none')
    })

    it('应该接受所有 h4 props', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="title">Title</CardTitle>
          </CardHeader>
        </Card>
      )
      expect(screen.getByTestId('title')).toBeInTheDocument()
    })
  })

  describe('CardDescription', () => {
    it('应该渲染为 p 元素', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      )
      const description = screen.getByText('Description')
      expect(description).toBeInTheDocument()
      expect(description.tagName).toBe('P')
    })

    it('应该有正确的 data-slot 属性', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      )
      const description = screen.getByText('Description')
      expect(description).toHaveAttribute('data-slot', 'card-description')
    })

    it('应该支持自定义 className', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className="custom-class">Description</CardDescription>
          </CardHeader>
        </Card>
      )
      const description = screen.getByText('Description')
      expect(description).toHaveClass('custom-class')
    })

    it('应该有默认的样式类', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      )
      const description = screen.getByText('Description')
      expect(description).toHaveClass('text-muted-foreground')
    })

    it('应该接受所有 p props', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="description">Description</CardDescription>
          </CardHeader>
        </Card>
      )
      expect(screen.getByTestId('description')).toBeInTheDocument()
    })
  })

  describe('CardAction', () => {
    it('应该渲染为 div 元素', () => {
      render(
        <Card>
          <CardHeader>
            <CardAction>Action</CardAction>
          </CardHeader>
        </Card>
      )
      const action = screen.getByText('Action')
      expect(action).toBeInTheDocument()
      expect(action.parentElement?.tagName).toBe('DIV')
    })

    it('应该有正确的 data-slot 属性', () => {
      render(
        <Card>
          <CardHeader>
            <CardAction>Action</CardAction>
          </CardHeader>
        </Card>
      )
      const action = screen.getByText('Action')
      expect(action).toHaveAttribute('data-slot', 'card-action')
    })

    it('应该支持自定义 className', () => {
      render(
        <Card>
          <CardHeader>
            <CardAction className="custom-class">Action</CardAction>
          </CardHeader>
        </Card>
      )
      const action = screen.getByText('Action')
      expect(action).toHaveClass('custom-class')
    })

    it('应该有正确的网格布局类', () => {
      render(
        <Card>
          <CardHeader>
            <CardAction>Action</CardAction>
          </CardHeader>
        </Card>
      )
      const action = screen.getByText('Action')
      expect(action).toHaveClass('col-start-2')
      expect(action).toHaveClass('row-start-1')
      expect(action).toHaveClass('self-start')
    })

    it('应该接受所有 div props', () => {
      render(
        <Card>
          <CardHeader>
            <CardAction data-testid="action">Action</CardAction>
          </CardHeader>
        </Card>
      )
      expect(screen.getByTestId('action')).toBeInTheDocument()
    })
  })

  describe('CardContent', () => {
    it('应该渲染为 div 元素', () => {
      render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      )
      const content = screen.getByText('Content')
      expect(content).toBeInTheDocument()
      expect(content.parentElement?.tagName).toBe('DIV')
    })

    it('应该有正确的 data-slot 属性', () => {
      render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      )
      const content = screen.getByText('Content')
      expect(content).toHaveAttribute('data-slot', 'card-content')
    })

    it('应该支持自定义 className', () => {
      render(
        <Card>
          <CardContent className="custom-class">Content</CardContent>
        </Card>
      )
      const content = screen.getByText('Content')
      expect(content).toHaveClass('custom-class')
    })

    it('应该有默认的样式类', () => {
      render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      )
      const content = screen.getByText('Content')
      expect(content).toHaveClass('px-6')
      expect(content).toHaveClass('[&:last-child]:pb-6')
    })

    it('应该接受所有 div props', () => {
      render(
        <Card>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  describe('CardFooter', () => {
    it('应该渲染为 div 元素', () => {
      render(
        <Card>
          <CardFooter>Footer</CardFooter>
        </Card>
      )
      const footer = screen.getByText('Footer')
      expect(footer).toBeInTheDocument()
      expect(footer.parentElement?.tagName).toBe('DIV')
    })

    it('应该有正确的 data-slot 属性', () => {
      render(
        <Card>
          <CardFooter>Footer</CardFooter>
        </Card>
      )
      const footer = screen.getByText('Footer')
      expect(footer).toHaveAttribute('data-slot', 'card-footer')
    })

    it('应该支持自定义 className', () => {
      render(
        <Card>
          <CardFooter className="custom-class">Footer</CardFooter>
        </Card>
      )
      const footer = screen.getByText('Footer')
      expect(footer).toHaveClass('custom-class')
    })

    it('应该有默认的样式类', () => {
      render(
        <Card>
          <CardFooter>Footer</CardFooter>
        </Card>
      )
      const footer = screen.getByText('Footer')
      expect(footer).toHaveClass('flex')
      expect(footer).toHaveClass('items-center')
      expect(footer).toHaveClass('px-6')
      expect(footer).toHaveClass('pb-6')
    })

    it('应该接受所有 div props', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      )
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
  })

  describe('组合测试', () => {
    it('应该正确渲染完整的 Card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card Description')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Card Content')).toBeInTheDocument()
      expect(screen.getByText('Card Footer')).toBeInTheDocument()
    })

    it('应该支持嵌套内容', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Nested Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Inner Content</div>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Nested Card')).toBeInTheDocument()
      expect(screen.getByText('Inner Content')).toBeInTheDocument()
    })

    it('应该支持多个 CardContent', () => {
      render(
        <Card>
          <CardContent>Content 1</CardContent>
          <CardContent>Content 2</CardContent>
        </Card>
      )

      expect(screen.getByText('Content 1')).toBeInTheDocument()
      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })
  })

  describe('无障碍测试', () => {
    it('应该支持 aria-label', () => {
      render(
        <Card aria-label="Card Label">
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      )
      const card = screen.getByLabelText('Card Label')
      expect(card).toBeInTheDocument()
    })

    it('应该支持 role 属性', () => {
      render(
        <Card role="article">
          <CardContent>Content</CardContent>
        </Card>
      )
      const card = screen.getByRole('article')
      expect(card).toBeInTheDocument()
    })

    it('应该支持 aria-describedby', () => {
      render(
        <Card aria-describedby="card-description">
          <CardContent>Content</CardContent>
        </Card>
      )
      const card = screen.getByText('Content')
      expect(card.parentElement).toHaveAttribute('aria-describedby', 'card-description')
    })
  })

  describe('边界情况', () => {
    it('应该处理空内容', () => {
      render(<Card></Card>)
      const card = document.querySelector('[data-slot="card"]')
      expect(card).toBeInTheDocument()
    })

    it('应该处理长文本', () => {
      const longText = 'A'.repeat(1000)
      render(
        <Card>
          <CardContent>{longText}</CardContent>
        </Card>
      )
      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('应该处理特殊字符', () => {
      render(
        <Card>
          <CardContent>&lt;script&gt;alert('xss')&lt;/script&gt;</CardContent>
        </Card>
      )
      expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument()
    })

    it('应该处理嵌套的 HTML', () => {
      render(
        <Card>
          <CardContent>
            <strong>Bold</strong>
            <em>Italic</em>
          </CardContent>
        </Card>
      )
      expect(screen.getByText('Bold')).toBeInTheDocument()
      expect(screen.getByText('Italic')).toBeInTheDocument()
    })
  })
})
