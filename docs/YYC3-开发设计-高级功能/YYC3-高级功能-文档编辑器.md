---
file: YYC3-P2-高级-文档编辑器.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: design
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维


# YYC³ P2-高级-文档编辑器

## 🤖 AI 角色定义

You are a senior frontend architect and document editing specialist with deep expertise in rich text editors, Markdown processing, and advanced document management systems.

### Your Role & Expertise

You are an experienced frontend architect who specializes in:
- **Rich Text Editors**: TipTap, ProseMirror, Quill, Slate.js, CKEditor
- **Markdown Processing**: Markdown rendering, syntax highlighting, live preview
- **Code Editors**: Monaco Editor, CodeMirror, Ace Editor, Prism.js
- **Document Management**: Version history, auto-save, document export
- **Real-time Collaboration**: Yjs, CRDT, cursor tracking, conflict resolution
- **Advanced Features**: Tables, images, embeds, custom blocks, extensions
- **Performance**: Virtual scrolling, lazy loading, efficient rendering
- **Best Practices**: Accessibility, keyboard shortcuts, mobile support

### Code Standards

**IMPORTANT**: Please ensure all generated code files follow the team requirements specified in: `guidelines/YYC3-Code-header.md`

All code files must include proper file headers with:
- @file: File name/path
- @description: Clear description of file purpose
- @author: YanYuCloudCube Team <admin@0379.email>
- @version: Semantic version (v1.0.0)
- @created: Creation date (YYYY-MM-DD)
- @updated: Last update date (YYYY-MM-DD)
- @status: File status (draft/dev/test/stable/deprecated)
- @license: License type
- @copyright: Copyright notice
- @tags: Relevant tags for categorization

---

## 📋 文档信息

| 字段 | 内容 |
|------|------|
| @file | P2-高级功能/YYC3-P2-高级-文档编辑器.md |
| @description | 高级文档编辑器功能实现，支持富文本、Markdown、代码高亮、实时预览等 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags P2,advanced,editor,markdown,code-highlight |

---

## 🎯 功能目标

实现高级文档编辑器功能，包括：
- ✅ 富文本编辑（所见即所得）
- ✅ Markdown 编辑与预览
- ✅ 代码高亮与语法支持
- ✅ 实时协作编辑
- ✅ 版本历史与回滚
- ✅ 自动保存
- ✅ 导出多种格式
- ✅ 搜索与替换
- ✅ 快捷键支持

---

## 🏗️ 技术架构

### 核心技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| TipTap | 2.1.12 | 富文本编辑器 |
| ProseMirror | 1.32.1 | 编辑器核心 |
| Monaco Editor | 0.45.0 | 代码编辑器 |
| React-Markdown | 9.0.1 | Markdown 渲染 |
| Prism.js | 1.29.0 | 代码高亮 |
| Yjs | 13.6.10 | 实时协作 |
| diff-match-patch | 1.0.5 | 差异比较 |

### 架构分层

```
┌─────────────────────────────────────┐
│   UI 层 (UI Layer)                   │
│  - 编辑器界面                        │
│  - 工具栏                           │
│  - 状态栏                           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   编辑器层 (Editor Layer)            │
│  - TipTap 富文本编辑器              │
│  - Monaco 代码编辑器                │
│  - Markdown 编辑器                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   协作层 (Collaboration Layer)       │
│  - Yjs CRDT                         │
│  - 感知光标                         │
│  - 冲突解决                         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   存储层 (Storage Layer)             │
│  - 本地存储                         │
│  - 版本历史                         │
│  - 自动保存                         │
└─────────────────────────────────────┘
```

---

## 📝 富文本编辑器

### TipTap 编辑器配置

```typescript
// src/editor/TipTapEditor.tsx
import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';

/**
 * 编辑器属性
 */
interface TipTapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
  editable?: boolean;
  placeholder?: string;
  collaboration?: boolean;
  yDoc?: Y.Doc;
}

/**
 * TipTap 编辑器组件
 */
export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  onSave,
  editable = true,
  placeholder = '开始输入...',
  collaboration = false,
  yDoc,
}) => {
  const lowlight = createLowlight(common);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 使用 CodeBlockLowlight 替代
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      ...(collaboration && yDoc ? [
        Collaboration.configure({
          document: yDoc,
        }),
      ] : []),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  // 快捷键支持
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, onSave]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor">
      <EditorContent editor={editor} />
    </div>
  );
};
```

### 工具栏组件

```typescript
// src/editor/EditorToolbar.tsx
import React from 'react';
import { useEditor } from '@tiptap/react';

/**
 * 编辑器工具栏组件
 */
export const EditorToolbar: React.FC = () => {
  const editor = useEditor();

  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('图片 URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  return (
    <div className="editor-toolbar">
      {/* 文本格式 */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`toolbar-button ${editor.isActive('bold') ? 'active' : ''}`}
          title="粗体 (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`toolbar-button ${editor.isActive('italic') ? 'active' : ''}`}
          title="斜体 (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`toolbar-button ${editor.isActive('strike') ? 'active' : ''}`}
          title="删除线"
        >
          <s>S</s>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`toolbar-button ${editor.isActive('code') ? 'active' : ''}`}
          title="行内代码"
        >
          {'<>'}
        </button>
      </div>

      {/* 标题 */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`toolbar-button ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
          title="标题 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`toolbar-button ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          title="标题 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`toolbar-button ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
          title="标题 3"
        >
          H3
        </button>
      </div>

      {/* 列表 */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toolbar-button ${editor.isActive('bulletList') ? 'active' : ''}`}
          title="无序列表"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`toolbar-button ${editor.isActive('orderedList') ? 'active' : ''}`}
          title="有序列表"
        >
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`toolbar-button ${editor.isActive('taskList') ? 'active' : ''}`}
          title="任务列表"
        >
          ☑
        </button>
      </div>

      {/* 对齐 */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`toolbar-button ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
          title="左对齐"
        >
          ←
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`toolbar-button ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
          title="居中"
        >
          ↔
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`toolbar-button ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
          title="右对齐"
        >
          →
        </button>
      </div>

      {/* 插入 */}
      <div className="toolbar-group">
        <button onClick={setLink} className="toolbar-button" title="链接">
          🔗
        </button>
        <button onClick={addImage} className="toolbar-button" title="图片">
          🖼️
        </button>
        <button onClick={addTable} className="toolbar-button" title="表格">
          📊
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`toolbar-button ${editor.isActive('codeBlock') ? 'active' : ''}`}
          title="代码块"
        >
          {'</>'}
        </button>
      </div>

      {/* 表格操作 */}
      {editor.isActive('table') && (
        <div className="toolbar-group">
          <button onClick={addTable} className="toolbar-button" title="插入表格">
            + 表格
          </button>
          <button onClick={deleteTable} className="toolbar-button" title="删除表格">
            - 表格
          </button>
          <button
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="toolbar-button"
            title="在左侧添加列"
          >
            + 列
          </button>
          <button
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="toolbar-button"
            title="删除列"
          >
            - 列
          </button>
          <button
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="toolbar-button"
            title="在上方添加行"
          >
            + 行
          </button>
          <button
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="toolbar-button"
            title="删除行"
          >
            - 行
          </button>
        </div>
      )}

      {/* 撤销重做 */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="toolbar-button"
          title="撤销 (Ctrl+Z)"
        >
          ↩️
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="toolbar-button"
          title="重做 (Ctrl+Y)"
        >
          ↪️
        </button>
      </div>
    </div>
  );
};
```

---

## 💻 代码编辑器

### Monaco 编辑器配置

```typescript
// src/editor/MonacoEditor.tsx
import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

/**
 * 代码编辑器属性
 */
interface MonacoEditorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  theme?: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  onSave?: () => void;
}

/**
 * Monaco 代码编辑器组件
 */
export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value = '',
  onChange,
  language = 'typescript',
  theme = 'vs-dark',
  options,
  onSave,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // 添加快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    // 添加自动保存
    let saveTimeout: NodeJS.Timeout;
    editor.onDidChangeModelContent(() => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        onSave?.();
      }, 2000); // 2秒后自动保存
    });
  };

  const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    formatOnPaste: true,
    formatOnType: true,
    ...options,
  };

  return (
    <div className="monaco-editor-wrapper">
      <Editor
        height="100%"
        language={language}
        value={value}
        theme={theme}
        options={defaultOptions}
        onChange={onChange}
        onMount={handleEditorDidMount}
      />
    </div>
  );
};
```

---

## 📄 Markdown 编辑器

### Markdown 编辑器组件

```typescript
// src/editor/MarkdownEditor.tsx
import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * Markdown 编辑器属性
 */
interface MarkdownEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
  editable?: boolean;
  showPreview?: boolean;
}

/**
 * Markdown 编辑器组件
 */
export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content = '',
  onChange,
  onSave,
  editable = true,
  showPreview = true,
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave?.();
    }
  }, [onSave]);

  return (
    <div className="markdown-editor">
      {/* 工具栏 */}
      <div className="markdown-toolbar">
        <button
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className="toolbar-button"
        >
          {isPreviewMode ? '编辑' : '预览'}
        </button>
        <button onClick={onSave} className="toolbar-button">
          保存 (Ctrl+S)
        </button>
      </div>

      {/* 编辑器/预览区 */}
      <div className="markdown-content">
        {editable && !isPreviewMode && (
          <textarea
            value={content}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            className="markdown-textarea"
            placeholder="输入 Markdown 内容..."
          />
        )}

        {showPreview && (isPreviewMode || !editable) && (
          <div className="markdown-preview">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## 🔄 实时协作

### 协作编辑器

```typescript
// src/editor/CollaborativeEditor.tsx
import React, { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { TipTapEditor } from './TipTapEditor';
import { useSync } from '../contexts/SyncContext';

/**
 * 协作编辑器属性
 */
interface CollaborativeEditorProps {
  documentId: string;
  content?: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
}

/**
 * 协作编辑器组件
 */
export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  content,
  onChange,
  onSave,
}) => {
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<number>(0);
  const { isOnline } = useSync();

  useEffect(() => {
    if (!isOnline) return;

    // 创建 Yjs 文档
    const doc = new Y.Doc();

    // 连接到 WebSocket 服务器
    const wsProvider = new WebsocketProvider(
      'ws://localhost:3201',
      documentId,
      doc
    );

    // 监听连接状态
    wsProvider.on('status', (event: any) => {
      console.log('Connection status:', event.status);
    });

    // 监听用户连接
    wsProvider.awareness.on('change', () => {
      setConnectedUsers(wsProvider.awareness.getStates().size);
    });

    setYDoc(doc);

    return () => {
      wsProvider.destroy();
      doc.destroy();
    };
  }, [documentId, isOnline]);

  if (!isOnline) {
    return (
      <div className="collaborative-editor-offline">
        <p>离线模式，协作功能不可用</p>
        <TipTapEditor
          content={content}
          onChange={onChange}
          onSave={onSave}
          editable={true}
        />
      </div>
    );
  }

  if (!yDoc) {
    return <div className="collaborative-editor-loading">连接中...</div>;
  }

  return (
    <div className="collaborative-editor">
      <div className="collaborative-header">
        <div className="collaborative-info">
          <span className="collaborative-users">
            👥 {connectedUsers} 人在线
          </span>
          <span className="collaborative-status">
            🟢 实时协作中
          </span>
        </div>
      </div>

      <TipTapEditor
        content={content}
        onChange={onChange}
        onSave={onSave}
        editable={true}
        collaboration={true}
        yDoc={yDoc}
      />
    </div>
  );
};
```

---

## 📜 版本历史

### 版本管理

```typescript
// src/editor/VersionHistory.tsx
import React, { useState, useEffect } from 'react';
import { storageService } from '../storage/storage-service';
import { Note } from '../storage/db';

/**
 * 版本历史组件
 */
export const VersionHistory: React.FC<{ noteId: string }> = ({ noteId }) => {
  const [versions, setVersions] = useState<Note[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Note | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, noteId]);

  const loadVersions = async () => {
    try {
      const note = await storageService.getNote(noteId);
      if (note) {
        // 这里应该从版本历史存储中加载
        // 暂时只显示当前版本
        setVersions([note]);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const handleRestore = async (version: Note) => {
    try {
      await storageService.updateNote(noteId, {
        title: version.title,
        content: version.content,
        tags: version.tags,
      });
      alert('版本已恢复');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to restore version:', error);
      alert('恢复版本失败');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="version-history">
      <button
        className="version-history-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '收起历史' : '版本历史'}
      </button>

      {isOpen && (
        <div className="version-history-content">
          <div className="version-history-header">
            <h3>版本历史</h3>
            <button onClick={loadVersions}>刷新</button>
          </div>

          <div className="version-history-list">
            {versions.map((version, index) => (
              <div key={index} className="version-item">
                <div className="version-item-header">
                  <span className="version-title">{version.title}</span>
                  <span className="version-date">
                    {formatDate(version.updatedAt)}
                  </span>
                </div>
                <div className="version-item-body">
                  <div className="version-content">
                    {version.content.substring(0, 200)}...
                  </div>
                  <button
                    onClick={() => handleRestore(version)}
                    className="btn btn-primary"
                  >
                    恢复此版本
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 🔍 搜索与替换

### 搜索替换组件

```typescript
// src/editor/SearchReplace.tsx
import React, { useState } from 'react';

/**
 * 搜索替换组件
 */
export const SearchReplace: React.FC<{
  onSearch: (query: string) => void;
  onReplace: (query: string, replacement: string) => void;
  onReplaceAll: (query: string, replacement: string) => void;
}> = ({ onSearch, onReplace, onReplaceAll }) => {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isRegex, setIsRegex] = useState(false);

  const handleSearch = () => {
    onSearch(query);
  };

  const handleReplace = () => {
    onReplace(query, replacement);
  };

  const handleReplaceAll = () => {
    onReplaceAll(query, replacement);
  };

  return (
    <div className="search-replace">
      <div className="search-replace-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索..."
          className="search-input"
        />
        <button onClick={handleSearch} className="btn btn-primary">
          搜索
        </button>
      </div>

      <div className="search-replace-row">
        <input
          type="text"
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          placeholder="替换为..."
          className="replace-input"
        />
        <button onClick={handleReplace} className="btn btn-secondary">
          替换
        </button>
        <button onClick={handleReplaceAll} className="btn btn-secondary">
          全部替换
        </button>
      </div>

      <div className="search-replace-options">
        <label>
          <input
            type="checkbox"
            checked={isCaseSensitive}
            onChange={(e) => setIsCaseSensitive(e.target.checked)}
          />
          区分大小写
        </label>
        <label>
          <input
            type="checkbox"
            checked={isRegex}
            onChange={(e) => setIsRegex(e.target.checked)}
          />
          正则表达式
        </label>
      </div>
    </div>
  );
};
```

---

## 🎨 样式设计

### CSS 样式

```css
/* src/styles/Editor.css */

.tiptap-editor {
  min-height: 400px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tiptap-editor .ProseMirror {
  outline: none;
}

.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  color: rgba(255, 255, 255, 0.4);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.toolbar-group {
  display: flex;
  gap: 4px;
  padding-right: 8px;
  margin-right: 8px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-group:last-child {
  border-right: none;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.toolbar-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.toolbar-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-button.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: rgba(102, 126, 234, 0.5);
}

.monaco-editor-wrapper {
  height: 100%;
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
}

.markdown-toolbar {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.markdown-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.markdown-textarea {
  width: 100%;
  height: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.markdown-textarea:focus {
  border-color: rgba(102, 126, 234, 0.5);
}

.markdown-preview {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow-y: auto;
  line-height: 1.6;
}

.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3,
.markdown-preview h4,
.markdown-preview h5,
.markdown-preview h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: rgba(255, 255, 255, 0.9);
}

.markdown-preview p {
  margin-bottom: 1em;
  color: rgba(255, 255, 255, 0.8);
}

.markdown-preview code {
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.markdown-preview pre {
  margin: 1em 0;
  padding: 16px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-preview pre code {
  padding: 0;
  background: transparent;
}

.markdown-preview blockquote {
  margin: 1em 0;
  padding: 8px 16px;
  border-left: 4px solid rgba(102, 126, 234, 0.5);
  background: rgba(102, 126, 234, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.markdown-preview ul,
.markdown-preview ol {
  margin: 1em 0;
  padding-left: 2em;
}

.markdown-preview li {
  margin-bottom: 0.5em;
  color: rgba(255, 255, 255, 0.8);
}

.markdown-preview a {
  color: #667eea;
  text-decoration: underline;
}

.markdown-preview img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.markdown-preview table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.markdown-preview th,
.markdown-preview td {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
}

.markdown-preview th {
  background: rgba(102, 126, 234, 0.2);
  font-weight: 600;
}

.collaborative-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.collaborative-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.collaborative-info {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.collaborative-users {
  display: flex;
  align-items: center;
  gap: 4px;
}

.collaborative-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.collaborative-editor-offline {
  padding: 16px;
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.collaborative-editor-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: rgba(255, 255, 255, 0.6);
}

.version-history {
  margin-top: 16px;
}

.version-history-toggle {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.version-history-content {
  margin-top: 12px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.version-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.version-history-header h3 {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.version-history-list {
  max-height: 400px;
  overflow-y: auto;
}

.version-item {
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.version-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.version-title {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.version-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.version-item-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-content {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-replace {
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.search-replace-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.search-input,
.replace-input {
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.search-input:focus,
.replace-input:focus {
  border-color: rgba(102, 126, 234, 0.5);
}

.search-replace-options {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.search-replace-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

---

## 🧪 测试用例

### 组件测试

```typescript
// src/editor/__tests__/TipTapEditor.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TipTapEditor } from '../TipTapEditor';

describe('TipTapEditor', () => {
  it('should render editor with initial content', () => {
    render(
      <TipTapEditor
        content="<p>Initial content</p>"
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Initial content')).toBeInTheDocument();
  });

  it('should call onChange when content changes', () => {
    const handleChange = vi.fn();
    render(
      <TipTapEditor
        content=""
        onChange={handleChange}
      />
    );

    const editor = document.querySelector('.ProseMirror');
    if (editor) {
      fireEvent.input(editor, {
        target: { innerHTML: '<p>New content</p>' },
      });
    }

    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when editable is false', () => {
    render(
      <TipTapEditor
        content="<p>Content</p>"
        onChange={() => {}}
        editable={false}
      />
    );

    const editor = document.querySelector('.ProseMirror');
    expect(editor).toHaveAttribute('contenteditable', 'false');
  });
});
```

---

## 📝 使用示例

### 集成到应用

```typescript
// src/App.tsx
import React, { useState } from 'react';
import { TipTapEditor } from './editor/TipTapEditor';
import { EditorToolbar } from './editor/EditorToolbar';
import { MonacoEditor } from './editor/MonacoEditor';
import { MarkdownEditor } from './editor/MarkdownEditor';
import { CollaborativeEditor } from './editor/CollaborativeEditor';
import { VersionHistory } from './editor/VersionHistory';

const App: React.FC = () => {
  const [content, setContent] = useState('');
  const [editorType, setEditorType] = useState<'richtext' | 'code' | 'markdown' | 'collaborative'>('richtext');

  const handleSave = () => {
    console.log('Saving content:', content);
    // 保存逻辑
  };

  return (
    <div className="app">
      {/* 编辑器类型切换 */}
      <div className="editor-type-switcher">
        <button onClick={() => setEditorType('richtext')}>富文本</button>
        <button onClick={() => setEditorType('code')}>代码</button>
        <button onClick={() => setEditorType('markdown')}>Markdown</button>
        <button onClick={() => setEditorType('collaborative')}>协作</button>
      </div>

      {/* 编辑器 */}
      {editorType === 'richtext' && (
        <div className="richtext-editor">
          <EditorToolbar />
          <TipTapEditor
            content={content}
            onChange={setContent}
            onSave={handleSave}
          />
        </div>
      )}

      {editorType === 'code' && (
        <div className="code-editor">
          <MonacoEditor
            value={content}
            onChange={(value) => setContent(value || '')}
            language="typescript"
            onSave={handleSave}
          />
        </div>
      )}

      {editorType === 'markdown' && (
        <div className="markdown-editor">
          <MarkdownEditor
            content={content}
            onChange={setContent}
            onSave={handleSave}
            showPreview={true}
          />
        </div>
      )}

      {editorType === 'collaborative' && (
        <div className="collaborative-editor">
          <CollaborativeEditor
            documentId="doc-1"
            content={content}
            onChange={setContent}
            onSave={handleSave}
          />
        </div>
      )}

      {/* 版本历史 */}
      <VersionHistory noteId="note-1" />
    </div>
  );
};

export default App;
```

---

## ✅ 验收标准

### 功能完整性

- ✅ 富文本编辑功能完整
- ✅ Markdown 编辑与预览
- ✅ 代码编辑与高亮
- ✅ 实时协作编辑
- ✅ 版本历史与回滚
- ✅ 自动保存
- ✅ 导出多种格式
- ✅ 搜索与替换
- ✅ 快捷键支持

### 代码质量

- ✅ 所有 TypeScript 编译错误修复
- ✅ ESLint 规则全部通过
- ✅ 无 React Console 警告
- ✅ JSDoc 文档覆盖率 >90%
- ✅ 代码规范完全统一
- ✅ 无循环依赖和死代码、硬编码

### 用户体验

- ✅ 编辑器响应流畅
- ✅ 工具栏功能完善
- ✅ 快捷键操作便捷
- ✅ 实时预览准确
- ✅ 协作编辑稳定
- ✅ 版本管理清晰

### 测试覆盖

- ✅ 单元测试覆盖率 > 80%
- ✅ 组件测试覆盖所有交互
- ✅ 集成测试验证编辑流程
- ✅ E2E 测试覆盖关键用户场景

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-03-14 | 初始版本，建立高级文档编辑器功能 | YanYuCloudCube Team |

---

## 📞 联系方式

- **维护团队**: YanYuCloudCube Team
- **联系邮箱**: admin@0379.email
- **项目地址**: https://github.com/YYC-Cube/

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-04-08 |
| 更新日期 | 2026-04-08 |
| 内容校验 | 16478ac1d713fc01 |
| 追溯ID | TRC-20260408141610 |
| 关联文档 | 无 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
