/**
 * @file CodeGeneratorPanel.tsx
 * @description YYC3 AI 代码生成面板 — MVP 功能演示界面
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ui,component,mvp,code-generator
 */

import { useState } from 'react';
import { useAICodeGeneration } from '../../hooks/useAICodeGeneration';
import { Button } from '../ui/Button'; // 假设存在 UI 库，或者使用原生 button
import { Textarea } from '../ui/Textarea'; // 假设存在
import { Select } from '../ui/Select'; // 假设存在
import { Loader2, Sparkles, Code2, Copy, Check, AlertCircle } from 'lucide-react';

// 简单的内联 UI 组件 (如果不存在 ui 库)
const InlineButton = ({ children, ...props }: any) => (
  <button 
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    {...props}
  >
    {children}
  </button>
);

const InlineTextarea = ({ placeholder, value, onChange, rows = 3, ...props }: any) => (
  <textarea
    className="w-full bg-neutral-900/50 border border-neutral-700 rounded-md p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    {...props}
  />
);

export const CodeGeneratorPanel = () => {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [copied, setCopied] = useState(false);

  const { generateCode, generatedCode, isGenerating, error, clearCode } = useAICodeGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      await generateCode({ prompt, context, language, style: 'concise' });
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleClear = () => {
    clearCode();
    setPrompt('');
    setContext('');
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950/80 border border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-neutral-200">AI Code Generator</h3>
        </div>
        <div className="text-xs text-neutral-500">MVP v1.0</div>
      </div>

      {/* Input Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Prompt Input */}
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5">
            Describe what you want to build
          </label>
          <InlineTextarea
            placeholder="e.g., Create a React hook that fetches data with pagination..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
        </div>

        {/* Context & Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Context (Optional)
            </label>
            <InlineTextarea
              placeholder="Current code or variables..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Language
            </label>
            <select
              className="w-full bg-neutral-900/50 border border-neutral-700 rounded-md p-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <InlineButton
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Code2 className="w-4 h-4" />
                Generate Code
              </>
            )}
          </InlineButton>
          <button
            onClick={handleClear}
            disabled={isGenerating}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Result Area */}
        {generatedCode && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-neutral-400">
                Generated Code
              </label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="relative group">
              <pre className="bg-[#0d1117] border border-neutral-800 rounded-md p-4 overflow-x-auto text-xs font-mono text-green-400">
                <code>{generatedCode}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
