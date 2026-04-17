/**
 * @file input.test.tsx
 * @description Input 组件单元测试 - 覆盖所有类型和交互
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @license MIT
 * 
 * @note 结合 2026 年智能应用趋势，采用现代化测试实践：
 * - React Testing Library（用户视角测试）
 * - 类型测试（所有 input 类型）
 * - 无障碍测试（a11y）
 * - 表单集成测试
 * 
 * @tech-stack-2026:
 * - React Testing Library (用户视角测试）
 * - Vitest (快速测试框架）
 * - TypeScript (严格类型检查）
 * - 表单测试
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/app/components/ui/input'

describe('Input 组件', () => {
  describe('渲染测试', () => {
    it('应该渲染为 input 元素', () => {
      render(<Input placeholder="Enter text" />)
      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toBeInTheDocument()
      expect(input.tagName).toBe('INPUT')
    })

    it('应该支持自定义 className', () => {
      render(<Input className="custom-class" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-class')
    })

    it('应该有正确的 data-slot 属性', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('data-slot', 'input')
    })
  })

  describe('类型测试', () => {
    it('应该渲染 text 类型', () => {
      render(<Input type="text" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('应该渲染 email 类型', () => {
      render(<Input type="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('应该渲染 password 类型', () => {
      render(<Input type="password" />)
      const input = document.querySelector('input[type="password"]')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'password')
    })

    it('应该渲染 number 类型', () => {
      render(<Input type="number" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
    })

    it('应该渲染 tel 类型', () => {
      render(<Input type="tel" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'tel')
    })

    it('应该渲染 url 类型', () => {
      render(<Input type="url" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'url')
    })

    it('应该渲染 search 类型', () => {
      render(<Input type="search" />)
      const input = screen.getByRole('searchbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'search')
    })

    it('应该渲染 date 类型', () => {
      render(<Input type="date" />)
      const input = document.querySelector('input[type="date"]')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'date')
    })

    it('应该渲染 file 类型', () => {
      render(<Input type="file" />)
      const input = document.querySelector('input[type="file"]')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'file')
    })
  })

  describe('属性测试', () => {
    it('应该支持 placeholder', () => {
      render(<Input placeholder="Placeholder text" />)
      const input = screen.getByPlaceholderText('Placeholder text')
      expect(input).toBeInTheDocument()
    })

    it('应该支持 value', () => {
      render(<Input value="Initial value" />)
      const input = screen.getByDisplayValue('Initial value')
      expect(input).toBeInTheDocument()
    })

    it('应该支持 disabled 状态', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('应该支持 required 状态', () => {
      render(<Input required />)
      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })

    it('应该支持 readOnly 状态', () => {
      render(<Input readOnly />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readonly')
    })

    it('应该支持 maxLength', () => {
      render(<Input maxLength={10} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('maxlength', '10')
    })

    it('应该支持 minLength', () => {
      render(<Input minLength={5} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('minlength', '5')
    })

    it('应该支持 pattern', () => {
      render(<Input pattern="[0-9]*" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('pattern', '[0-9]*')
    })

    it('应该支持 name 属性', () => {
      render(<Input name="username" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('name', 'username')
    })

    it('应该支持 id 属性', () => {
      render(<Input id="test-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'test-input')
    })

    it('应该支持 autoFocus', () => {
      render(<Input autoFocus />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveFocus()
    })

    it('应该支持 autoComplete', () => {
      render(<Input autoComplete="on" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('autocomplete', 'on')
    })
  })

  describe('交互测试', () => {
    it('应该响应输入变化', async () => {
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'Hello')
      
      expect(handleChange).toHaveBeenCalled()
    })

    it('应该更新 value', async () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'Test')
      
      expect(input).toHaveValue('Test')
    })

    it('应该在 disabled 状态下不接受输入', async () => {
      render(<Input disabled />)
      
      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'Test')
      
      expect(input).toHaveValue('')
    })

    it('应该在 readOnly 状态下不接受输入', async () => {
      render(<Input readOnly value="Readonly" />)
      
      const input = screen.getByDisplayValue('Readonly')
      await userEvent.type(input, 'Test')
      
      expect(input).toHaveValue('Readonly')
    })

    it('应该触发 onFocus', async () => {
      const handleFocus = vi.fn()
      render(<Input onFocus={handleFocus} />)
      
      const input = screen.getByRole('textbox')
      await userEvent.click(input)
      
      expect(handleFocus).toHaveBeenCalled()
    })

    it('应该触发 onBlur', async () => {
      const handleBlur = vi.fn()
      render(<Input onBlur={handleBlur} />)
      
      const input = screen.getByRole('textbox')
      input.focus()
      await userEvent.tab()
      
      expect(handleBlur).toHaveBeenCalled()
    })

    it('应该支持键盘导航', async () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      await userEvent.click(input)
      await userEvent.keyboard('{ArrowRight}')
      
      expect(input).toHaveFocus()
    })
  })

  describe('无障碍测试', () => {
    it('应该有正确的 role', () => {
      render(<Input />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('应该支持 aria-label', () => {
      render(<Input aria-label="Username" />)
      const input = screen.getByLabelText('Username')
      expect(input).toBeInTheDocument()
    })

    it('应该支持 aria-describedby', () => {
      render(<Input aria-describedby="description" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'description')
    })

    it('应该支持 aria-invalid', () => {
      render(<Input aria-invalid="true" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('应该支持 aria-required', () => {
      render(<Input required aria-required="true" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('边界情况', () => {
    it('应该处理空值', () => {
      render(<Input value="" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('应该处理长文本', () => {
      const longText = 'A'.repeat(1000)
      render(<Input value={longText} />)
      const input = screen.getByDisplayValue(longText)
      expect(input).toBeInTheDocument()
    })

    it('应该处理特殊字符', () => {
      render(<Input value="<script>alert('xss')</script>" />)
      const input = screen.getByDisplayValue("<script>alert('xss')</script>")
      expect(input).toBeInTheDocument()
    })
  })

  describe('样式测试', () => {
    it('应该有默认的样式类', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-9')
      expect(input).toHaveClass('w-full')
    })

    it('应该合并自定义样式', () => {
      render(<Input className="w-20" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('w-20') // 自定义类覆盖默认类
    })
  })

  describe('file 类型特殊处理', () => {
    it('应该支持文件上传', async () => {
      const handleChange = vi.fn()
      render(<Input type="file" onChange={handleChange} />)
      
      const input = document.querySelector('input[type="file"]')
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      
      await userEvent.upload(input as HTMLElement, file)
      
      expect(handleChange).toHaveBeenCalled()
    })

    it('应该支持 multiple 文件上传', () => {
      render(<Input type="file" multiple />)
      const input = document.querySelector('input[type="file"]')
      expect(input).toHaveAttribute('multiple')
    })

    it('应该支持 accept 属性', () => {
      render(<Input type="file" accept=".png,.jpg" />)
      const input = document.querySelector('input[type="file"]')
      expect(input).toHaveAttribute('accept', '.png,.jpg')
    })
  })
})
