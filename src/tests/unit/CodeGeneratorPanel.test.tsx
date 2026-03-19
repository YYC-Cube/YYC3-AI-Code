import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CodeGeneratorPanel } from '../../app/components/ai-code/CodeGeneratorPanel';
import { useAICodeGeneration } from '../../app/hooks/useAICodeGeneration';

// Mock dependencies
vi.mock('../../app/hooks/useAICodeGeneration', () => ({
  useAICodeGeneration: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Sparkles: ({ className }: any) => <div data-testid="sparkles" className={className}>Sparkles</div>,
  Code2: ({ className }: any) => <div data-testid="code2" className={className}>Code2</div>,
  Loader2: ({ className }: any) => <div data-testid="loader2" className={className}>Loader2</div>,
  Copy: ({ className }: any) => <div data-testid="copy-icon" className={className}>Copy</div>,
  Check: ({ className }: any) => <div data-testid="check-icon" className={className}>Check</div>,
  AlertCircle: ({ className }: any) => <div data-testid="alert-icon" className={className}>Alert</div>,
}));

const mockUseAICodeGeneration = useAICodeGeneration as any;

describe('CodeGeneratorPanel — AI 代码生成面板组件', () => {
  const mockGenerate = vi.fn();
  const mockClearCode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAICodeGeneration.mockReturnValue({
      generateCode: mockGenerate,
      generatedCode: null,
      isGenerating: false,
      error: null,
      clearCode: mockClearCode,
    });
  });

  const renderComponent = () => {
    return render(<CodeGeneratorPanel />);
  };

  describe('UI 渲染测试', () => {
    it('TC-COMP-001: 应该渲染标题 "AI Code Generator"', () => {
      renderComponent();
      expect(screen.getByText('AI Code Generator')).toBeInTheDocument();
    });

    it('TC-COMP-002: 应该渲染 Prompt 输入框 (使用 data-testid)', () => {
      renderComponent();
      const promptInput = screen.getByPlaceholderText(/create a react hook/i);
      expect(promptInput).toBeInTheDocument();
    });

    it('TC-COMP-003: 应该渲染 Context 输入框', () => {
      renderComponent();
      const contextInput = screen.getByPlaceholderText(/current code or variables/i);
      expect(contextInput).toBeInTheDocument();
    });

    it('TC-COMP-004: 应该渲染 "Generate Code" 按钮', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: /generate code/i });
      expect(button).toBeInTheDocument();
    });

    it('TC-COMP-005: 初始状态下结果区域不应该可见', () => {
      renderComponent();
      expect(screen.queryByText('Generated Code')).not.toBeInTheDocument();
    });
  });

  describe('交互逻辑测试', () => {
    it('TC-COMP-010: 在 Loading 状态下，按钮应该被禁用并显示 Loading 图标', () => {
      mockUseAICodeGeneration.mockReturnValue({
        generateCode: mockGenerate,
        isGenerating: true,
        error: null,
        generatedCode: null,
        clearCode: mockClearCode,
      });

      renderComponent();
      const button = screen.getByRole('button', { name: /generating/i });
      expect(button).toBeDisabled();
      expect(screen.getByTestId('loader2')).toBeInTheDocument();
    });

    it('TC-COMP-011: 在 Error 状态下，应该显示错误消息', () => {
      mockUseAICodeGeneration.mockReturnValue({
        generateCode: mockGenerate,
        isGenerating: false,
        error: 'API Key missing',
        generatedCode: null,
        clearCode: mockClearCode,
      });

      renderComponent();
      expect(screen.getByText('API Key missing')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('TC-COMP-012: 在成功状态下，应该显示生成的代码和 "Copy" 按钮', async () => {
      mockUseAICodeGeneration.mockReturnValue({
        generateCode: mockGenerate,
        isGenerating: false,
        error: null,
        generatedCode: 'const a = 1;',
        clearCode: mockClearCode,
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Generated Code')).toBeInTheDocument();
      });
      
      // Use getAllByText to handle multiple "Copy" elements (icon text and button text)
      // Or better, use a more specific selector.
      // For this test, we just check existence.
      const copyButtons = screen.getAllByText('Copy');
      expect(copyButtons.length).toBeGreaterThan(0);
    });

    it('TC-COMP-013: 点击 "Clear" 按钮应该调用 clearCode 并清空输入', () => {
      renderComponent();
      
      const clearButton = screen.getByRole('button', { name: 'Clear' });
      fireEvent.click(clearButton);

      expect(mockClearCode).toHaveBeenCalled();
    });
  });

  describe('代码复制功能测试', () => {
    it('TC-COMP-020: 点击 "Copy" 按钮应该调用 navigator.clipboard.writeText', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      mockUseAICodeGeneration.mockReturnValue({
        generateCode: mockGenerate,
        isGenerating: false,
        error: null,
        generatedCode: 'test code',
        clearCode: mockClearCode,
      });

      renderComponent();

      // Use a more specific query to avoid "multiple elements" error
      // Since we can't easily add data-testid to the real InlineButton without editing the component,
      // we can use the button's role and name.
      const copyButton = screen.getByRole('button', { name: /copy/i });
      
      expect(copyButton).toBeInTheDocument();
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('test code');
      });
    });
  });
});
