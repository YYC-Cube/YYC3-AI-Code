import React, { useState, useCallback } from 'react';
import { Sparkles, Code2, Loader2, Copy, Check, AlertCircle } from 'lucide-react';
import { useAICodeGeneration } from '../../hooks/useAICodeGeneration';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

export const CodeGeneratorPanel = () => {
  const {
    generateCode,
    generatedCode,
    isGenerating,
    error,
    clearCode
  } = useAICodeGeneration();

  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    await generateCode({ prompt, context, language });
  }, [prompt, context, language, generateCode]);

  const handleCopy = useCallback(() => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedCode]);

  const handleClear = useCallback(() => {
    clearCode();
    setPrompt('');
    setContext('');
  }, [clearCode]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-sm font-semibold">AI Code Generator</span>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
        {/* Prompt Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-neutral-400">
            Describe what you want to build
          </label>
          <Textarea
            placeholder="e.g., Create a React hook for debouncing..."
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            className="min-h-[80px] bg-[#161b22] border-neutral-700 focus:border-purple-500"
          />
        </div>

        {/* Context Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-neutral-400">
            Current code or variables (optional)
          </label>
          <Textarea
            placeholder="Provide context for better results..."
            value={context}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
            className="min-h-[60px] bg-[#161b22] border-neutral-700 focus:border-purple-500"
          />
        </div>

        {/* Settings - Native Select */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-neutral-400 mb-1 block">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-[#161b22] border border-neutral-700 text-neutral-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="go">Go</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-auto">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Code
              </>
            )}
          </Button>
          
          <Button
            onClick={handleClear}
            variant="outline"
            className="bg-[#161b22] border-neutral-700 hover:bg-[#1c2128]"
          >
            Clear
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* Result Area */}
        {generatedCode && (
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-400">
                Generated Code
              </label>
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <Copy size={14} className={copied ? 'hidden' : ''} />
                <Check size={14} className={!copied ? 'hidden' : 'text-green-400'} />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
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
