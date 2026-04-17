/**
 * @file CenterPanel.tsx
 * @description File tree + Monaco code editor panel — tree navigation, context menu, diff compare, version history, editor↔preview scroll sync
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 4.1.0
 * @created 2026-03-13
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags file-tree, code-editor, monaco, scroll-sync, version-history, code-intelligence, diff-viewer
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  FileCode2, FileType2, FileJson, FileText, File,
  Folder, FolderOpen, FolderPlus, FilePlus,
  ChevronDown, ChevronRight,
  Search, RefreshCw, GitCompare, GripVertical,
  History, Circle,
  ImageIcon, X, Loader2,
} from 'lucide-react'
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react'
import { useAppStore } from '../../stores/app-store'
import { useFileTreeStore, type FileNode } from '../../stores/file-tree-store'
import { useCollabStore } from '../../stores/collab-store'
import { usePreviewStore } from '../../stores/preview-store'
import { ScrollArea } from '../ui/scroll-area'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/resizable'
import { MOCK_FILE_CONTENTS, getLanguage } from '../../utils/file-contents'
import { FileService } from '../../services/file-service'
import { createLogger } from '../../utils/logger'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useCodeIntelligence, DiagnosticsPanel } from './CodeIntelligence'
import { VersionHistoryPanel as RealVersionHistoryPanel } from './FileSystemManager'
import { EnhancedContextMenu } from './FileSystemManager'
import { DiffViewer } from './DiffViewer'
import { useI18n } from '../../utils/useI18n'

const log = createLogger('CenterPanel')

// ============================================
// Helpers
// ============================================

function getMonacoLanguage(filePath: string): string {
  const lang = getLanguage(filePath)
  const map: Record<string, string> = {
    tsx: 'typescript', typescript: 'typescript', jsx: 'javascript', javascript: 'javascript',
    css: 'css', json: 'json', markdown: 'markdown', html: 'html', svg: 'xml', vue: 'html', text: 'plaintext',
  }
  return map[lang] || 'plaintext'
}

function getFileIcon(name: string) {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) {return <FileCode2 className="w-3.5 h-3.5 text-blue-400/70" />}
  if (name.endsWith('.css')) {return <FileType2 className="w-3.5 h-3.5 text-purple-400/70" />}
  if (name.endsWith('.json')) {return <FileJson className="w-3.5 h-3.5 text-yellow-400/70" />}
  if (name.endsWith('.md')) {return <FileText className="w-3.5 h-3.5 text-white/40" />}
  if (name.endsWith('.png') || name.endsWith('.svg')) {return <ImageIcon className="w-3.5 h-3.5 text-green-400/70" />}
  return <File className="w-3.5 h-3.5 text-white/40" />
}

function getSmallFileIcon(name: string) {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) {return <FileCode2 className="w-3 h-3 text-blue-400/70" />}
  if (name.endsWith('.css')) {return <FileType2 className="w-3 h-3 text-purple-400/70" />}
  if (name.endsWith('.json')) {return <FileJson className="w-3 h-3 text-yellow-400/70" />}
  return <File className="w-3 h-3 text-white/40" />
}

function filterTree(nodes: FileNode[], query: string): FileNode[] {
  if (!query.trim()) {return nodes}
  const lq = query.toLowerCase()
  return nodes.reduce<FileNode[]>((acc, node) => {
    if (node.type === 'file') {
      if (node.name.toLowerCase().includes(lq)) {acc.push(node)}
    } else {
      const filteredChildren = filterTree(node.children || [], query)
      if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lq)) {
        acc.push({ ...node, children: filteredChildren })
      }
    }
    return acc
  }, [])
}

// ============================================
// File Tree Node
// ============================================

function FileTreeNode({ node, depth, searchQuery }: { node: FileNode; depth: number; searchQuery: string }) {
  const { selectedFile, setSelectedFile, openFileTab, expandedFolders, toggleFolder } = useAppStore()
  const isModified = useAppStore(s => node.type === 'file' ? !!s.fileContents[node.path]?.isModified : false)
  const { addRecentFile, loadChildren } = useFileTreeStore()
  const { isLG } = useLiquidGlass()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const isExpanded = expandedFolders.has(node.path)
  const isSelected = selectedFile === node.path
  const indent = depth * 16

  const handleClick = async () => {
    if (node.type === 'folder') {
      toggleFolder(node.path)
      if (!isExpanded && !node.loaded) {
        await loadChildren(node.path)
      }
    }
    else { setSelectedFile(node.path); openFileTab(node.path); addRecentFile(node.path) }
  }

  return (
    <>
      <button
        onClick={handleClick}
        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }) }}
        className={`w-full flex items-center gap-1.5 py-[3px] pr-2 text-left transition-colors group ${
          isSelected
            ? isLG ? 'bg-emerald-500/[0.08] text-white/80' : 'bg-white/[0.06] text-white/80'
            : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'
        }`}
        style={{ paddingLeft: indent + 8 }}
      >
        {node.type === 'folder' ? (
          <>
            <span className="text-white/20">
              {node.loading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
              }
            </span>
            {isExpanded
              ? <FolderOpen className={`w-3.5 h-3.5 ${isLG ? 'text-emerald-400/60' : 'text-amber-400/60'}`} />
              : <Folder className={`w-3.5 h-3.5 ${isLG ? 'text-emerald-400/40' : 'text-amber-400/40'}`} />}
          </>
        ) : (
          <><span className="w-3" />{getFileIcon(node.name)}</>
        )}
        <span className="text-[11px] truncate flex-1">{node.name}</span>
        {node.type === 'folder' && !node.loaded && !node.loading && (
          <span className="text-[8px] text-white/15 shrink-0">lazy</span>
        )}
        {node.type === 'file' && isModified && <Circle className="w-2 h-2 fill-amber-400 text-amber-400 shrink-0" />}
      </button>

      {node.type === 'folder' && isExpanded && (node.loaded || node.loading) && node.children && (
        filterTree(node.children, searchQuery).map((child) => (
          <FileTreeNode key={child.path} node={child} depth={depth + 1} searchQuery={searchQuery} />
        ))
      )}

      {contextMenu && (
        <EnhancedContextMenu x={contextMenu.x} y={contextMenu.y} path={node.path} type={node.type} onClose={() => setContextMenu(null)} />
      )}
    </>
  )
}

// ============================================
// Collab Cursors
// ============================================

function CollabCursorsInline() {
  const { users } = useCollabStore()
  const activeUsers = users.filter(u => u.isOnline && u.currentFile)
  if (activeUsers.length === 0) {return null}
  return (
    <div className="flex items-center gap-1 px-2">
      {activeUsers.slice(0, 3).map((u) => (
        <div key={u.id} className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white/90 border border-black/20" style={{ backgroundColor: u.color }} title={`${u.name} - ${u.currentFile}`}>
          {u.name[0]}
        </div>
      ))}
      {activeUsers.length > 3 && <span className="text-[9px] text-white/25">+{activeUsers.length - 3}</span>}
    </div>
  )
}

// ============================================
// Monaco Code Editor
// ============================================

const defineYYC3Theme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('yyc3-dark', {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c792ea' },
      { token: 'string', foreground: 'c3e88d' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'type', foreground: 'ffcb6b' },
      { token: 'identifier', foreground: 'babed8' },
      { token: 'delimiter', foreground: '89ddff' },
      { token: 'tag', foreground: 'f07178' },
      { token: 'attribute.name', foreground: 'ffcb6b' },
      { token: 'attribute.value', foreground: 'c3e88d' },
    ],
    colors: {
      'editor.background': '#00000000', 'editor.foreground': '#d4d4d8',
      'editor.lineHighlightBackground': '#ffffff06', 'editor.selectionBackground': '#66eeaa18',
      'editorCursor.foreground': '#34d399', 'editorLineNumber.foreground': '#ffffff18',
      'editorLineNumber.activeForeground': '#ffffff40', 'editorIndentGuide.background': '#ffffff08',
      'editorGutter.background': '#00000000', 'editorWidget.background': '#0d0d14ee',
      'editorSuggestWidget.background': '#0d0d14f0', 'scrollbarSlider.background': '#ffffff08',
    },
  })
  monaco.editor.defineTheme('yyc3-dark-lg', {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
      { token: 'keyword', foreground: '34d399' },
      { token: 'string', foreground: 'a7f3d0' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'type', foreground: '6ee7b7' },
      { token: 'identifier', foreground: 'babed8' },
      { token: 'delimiter', foreground: '5eead4' },
      { token: 'tag', foreground: 'f07178' },
      { token: 'attribute.name', foreground: '6ee7b7' },
      { token: 'attribute.value', foreground: 'a7f3d0' },
    ],
    colors: {
      'editor.background': '#00000000', 'editor.foreground': '#d4d4d8',
      'editor.lineHighlightBackground': '#10b98108', 'editor.selectionBackground': '#10b98118',
      'editorCursor.foreground': '#34d399', 'editorLineNumber.foreground': '#10b98120',
      'editorLineNumber.activeForeground': '#10b98150', 'editorIndentGuide.background': '#10b98108',
      'editorGutter.background': '#00000000', 'editorWidget.background': '#0a0f0aee',
      'editorSuggestWidget.background': '#0a0f0af0', 'scrollbarSlider.background': '#10b98110',
    },
  })
}

function MonacoCodeEditor({ filePath }: { filePath: string }) {
  const { fileContents, updateFileContent } = useAppStore()
  const { scrollSyncEnabled, scrollPercent, _scrollSource, setScrollPercent } = usePreviewStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const editorRef = useRef<any>(null)
  const scrollingRef = useRef(false)

  const fileResult = FileService.getContent(filePath)
  const content = fileResult.content
  const language = getMonacoLanguage(filePath)
  const { diagnostics } = useCodeIntelligence(content, filePath)

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor
    editor.onDidScrollChange(() => {
      if (!scrollSyncEnabled || scrollingRef.current) {return}
      const maxScroll = editor.getScrollHeight() - editor.getLayoutInfo().height
      if (maxScroll <= 0) {return}
      setScrollPercent(editor.getScrollTop() / maxScroll, 'editor')
    })
    editor.focus()
  }

  useEffect(() => {
    if (!scrollSyncEnabled || _scrollSource !== 'preview' || !editorRef.current) {return}
    const editor = editorRef.current
    const maxScroll = editor.getScrollHeight() - editor.getLayoutInfo().height
    if (maxScroll <= 0) {return}
    scrollingRef.current = true
    editor.setScrollTop(scrollPercent * maxScroll)
    const timer = setTimeout(() => { scrollingRef.current = false }, 60)
    return () => clearTimeout(timer)
  }, [scrollSyncEnabled, scrollPercent, _scrollSource])

  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {updateFileContent(filePath, value)}
  }, [filePath, updateFileContent])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%" language={language} value={content}
          theme={isLG ? 'yyc3-dark-lg' : 'yyc3-dark'}
          beforeMount={defineYYC3Theme} onMount={handleEditorMount} onChange={handleChange}
          loading={
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className={`w-5 h-5 animate-spin ${isLG ? 'text-emerald-400/30' : 'text-white/20'}`} />
              <span className="ml-2 text-[11px] text-white/20">{t('editor.loading', 'designer')}</span>
            </div>
          }
          options={{
            fontSize: 13, fontFamily: "'Monaco','Menlo','Consolas',monospace", lineHeight: 20, tabSize: 2,
            minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
            scrollBeyondLastLine: false, smoothScrolling: true, cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on', renderLineHighlight: 'line', wordWrap: 'off',
            automaticLayout: true, padding: { top: 8, bottom: 8 }, overviewRulerBorder: false,
            scrollbar: { vertical: 'auto', horizontal: 'auto', verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            suggest: { showKeywords: true, showSnippets: true, showClasses: true, showFunctions: true, showVariables: true, showInterfaces: true },
            bracketPairColorization: { enabled: true }, guides: { bracketPairs: true, indentation: true },
            formatOnPaste: true, renderWhitespace: 'selection', folding: true, foldingStrategy: 'indentation',
            links: true, colorDecorators: true, accessibilitySupport: 'off',
          }}
        />
      </div>
      <DiagnosticsPanel diagnostics={diagnostics} />
    </div>
  )
}

// ============================================
// CenterPanel (main export)
// ============================================

export function CenterPanel() {
  const {
    selectedFile, setSelectedFile, openFileTab, openTabs, closeFileTab,
    reorderTabs, fileContents, lastAppliedFile,
  } = useAppStore()
  const { fileTree: tree, diff, closeDiff } = useFileTreeStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const [searchQuery, setSearchQuery] = useState('')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [applyFlash, setApplyFlash] = useState(false)
  const [dragOverTabIndex, setDragOverTabIndex] = useState<number | null>(null)
  const dragTabIndexRef = useRef<number | null>(null)

  useEffect(() => {
    if (lastAppliedFile && lastAppliedFile === selectedFile) {
      setApplyFlash(true)
      const timer = setTimeout(() => setApplyFlash(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [lastAppliedFile, selectedFile])

  const filteredTree = filterTree(tree, searchQuery)

  const handleNewFile = () => {
    if (!newFileName.trim()) {return}
    const path = `src/app/components/${newFileName}`
    useFileTreeStore.getState().createFile('src/app/components', newFileName)
    openFileTab(path); setSelectedFile(path); setShowNewFileInput(false); setNewFileName('')
  }

  return (
    <div
      className={`h-full flex flex-col border-r ${isLG ? 'border-white/[0.06]' : 'border-white/[0.04]'}`}
      style={{ background: isLG ? 'rgba(10,15,10,0.35)' : 'var(--sidebar, #0d0d14)' }}
    >
      <ResizablePanelGroup direction="vertical">
        {/* File Tree */}
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="h-full flex flex-col">
            <div className={`h-8 flex items-center justify-between px-3 border-b shrink-0 ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">{t('editor.fileExplorer', 'designer')}</span>
              <div className="flex items-center gap-0.5">
                <CollabCursorsInline />
                <button onClick={() => setShowNewFileInput(!showNewFileInput)} className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors" title={t('editor.newFile', 'designer')}>
                  <FilePlus className="w-3 h-3" />
                </button>
                <button className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors" title={t('editor.newFolder', 'designer')}>
                  <FolderPlus className="w-3 h-3" />
                </button>
                <button onClick={() => useFileTreeStore.getState().resetTree()} className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors" title={t('editor.refresh', 'designer')}>
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className={`px-2 py-1.5 border-b ${isLG ? 'border-emerald-500/[0.04]' : 'border-white/[0.03]'}`}>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.04]">
                <Search className="w-3 h-3 text-white/20" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('editor.searchFiles', 'designer')}
                  className="flex-1 bg-transparent text-[10px] text-white/60 placeholder:text-white/15 outline-none" />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="text-white/20 hover:text-white/40"><X className="w-2.5 h-2.5" /></button>}
              </div>
            </div>

            {showNewFileInput && (
              <div className="px-2 py-1.5 border-b border-white/[0.04]">
                <input autoFocus value={newFileName} onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') {handleNewFile();} if (e.key === 'Escape') { setShowNewFileInput(false); setNewFileName('') } }}
                  placeholder={t('editor.fileNamePlaceholder', 'designer')}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 text-[10px] text-white/70 outline-none focus:border-blue-500/30" />
              </div>
            )}

            <ScrollArea className="flex-1">
              <div className="py-1">
                {filteredTree.map((node) => <FileTreeNode key={node.path} node={node} depth={0} searchQuery={searchQuery} />)}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Code Editor Area */}
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className={`h-8 flex items-center border-b shrink-0 overflow-x-auto ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}
              style={{ background: isLG ? 'rgba(10,15,10,0.25)' : 'rgba(0,0,0,0.1)' }}>
              {openTabs.map((tab, tabIndex) => {
                const fileName = tab.split('/').pop() || tab
                const isActive = selectedFile === tab
                const isModified = fileContents[tab]?.isModified
                const isDragOver = dragOverTabIndex === tabIndex
                return (
                  <button key={tab} draggable
                    onDragStart={() => { dragTabIndexRef.current = tabIndex }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverTabIndex(tabIndex) }}
                    onDragLeave={() => setDragOverTabIndex(null)}
                    onDrop={(e) => { e.preventDefault(); setDragOverTabIndex(null); if (dragTabIndexRef.current !== null && dragTabIndexRef.current !== tabIndex) {reorderTabs(dragTabIndexRef.current, tabIndex);} dragTabIndexRef.current = null }}
                    onDragEnd={() => { dragTabIndexRef.current = null; setDragOverTabIndex(null) }}
                    onClick={() => { setSelectedFile(tab); if (diff.enabled) {closeDiff()} }}
                    className={`flex items-center gap-1.5 px-3 h-full text-[11px] border-r border-white/[0.04] shrink-0 transition-colors group ${
                      isDragOver ? isLG ? 'bg-emerald-500/[0.12]' : 'bg-cyan-500/[0.1]'
                        : isActive ? isLG ? 'bg-emerald-500/[0.06] text-white/70' : 'bg-white/[0.04] text-white/70'
                          : 'text-white/35 hover:text-white/55 hover:bg-white/[0.02]'
                    }`}
                    style={{ cursor: 'grab' }}
                  >
                    <GripVertical className="w-2 h-2 text-white/10 group-hover:text-white/25 shrink-0" />
                    {getSmallFileIcon(fileName)}
                    <span className="truncate max-w-[100px]">{fileName}</span>
                    {isModified && <Circle className="w-1.5 h-1.5 fill-amber-400 text-amber-400 shrink-0" />}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); closeFileTab(tab) }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); closeFileTab(tab) }}}
                      className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/[0.08] text-white/20 hover:text-white/60 transition-all cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </span>
                  </button>
                )
              })}

              <div className="ml-auto flex items-center gap-0.5 px-2 shrink-0">
                <button onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className={`p-1 rounded transition-colors ${showVersionHistory ? isLG ? 'bg-emerald-500/[0.1] text-emerald-400/60' : 'bg-white/[0.06] text-white/50' : 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]'}`}
                  title={t('editor.versionHistory', 'designer')}>
                  <History className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { if (diff.enabled) {closeDiff()} }}
                  className={`p-1 rounded transition-colors ${diff.enabled ? isLG ? 'bg-emerald-500/[0.1] text-emerald-400/60' : 'bg-white/[0.06] text-white/50' : 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]'}`}
                  title={t('editor.diffCompare', 'designer')}>
                  <GitCompare className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Editor / Diff Viewer + Version History */}
            <div className="flex-1 flex overflow-hidden">
              <div className={`flex-1 flex flex-col overflow-hidden relative ${applyFlash ? 'ring-1 ring-inset ring-emerald-400/30' : ''}`}>
                {applyFlash && (
                  <div className="absolute inset-0 z-10 pointer-events-none animate-pulse"
                    style={{ background: isLG ? 'linear-gradient(180deg, rgba(16,185,129,0.06) 0%, transparent 40%)' : 'linear-gradient(180deg, rgba(139,92,246,0.06) 0%, transparent 40%)' }} />
                )}

                {diff.enabled ? (
                  <DiffViewer />
                ) : selectedFile ? (
                  <MonacoCodeEditor filePath={selectedFile} />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <FileCode2 className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-[11px] text-white/20">{t('editor.selectFileToEdit', 'designer')}</p>
                      <p className="text-[9px] text-white/10 mt-1">{t('editor.selectFileHint', 'designer')}</p>
                    </div>
                  </div>
                )}
              </div>

              {showVersionHistory && selectedFile && (
                <div className="w-52 shrink-0">
                  <RealVersionHistoryPanel filePath={selectedFile} onClose={() => setShowVersionHistory(false)} />
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className={`h-6 flex items-center justify-between px-3 border-t shrink-0 ${isLG ? 'border-emerald-500/[0.04]' : 'border-white/[0.04]'}`}
              style={{ background: isLG ? 'rgba(10,15,10,0.25)' : 'rgba(0,0,0,0.15)' }}>
              <div className="flex items-center gap-3">
                {diff.enabled && <span className={`text-[9px] ${isLG ? 'text-emerald-400/50' : 'text-white/40'}`}>DIFF</span>}
                {selectedFile && !diff.enabled && (
                  <>
                    <span className="text-[9px] text-white/25">{getLanguage(selectedFile).toUpperCase()}</span>
                    <span className="text-[9px] text-white/15">UTF-8</span>
                    <span className="text-[9px] text-white/15">LF</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedFile && !diff.enabled && fileContents[selectedFile]?.isModified && (
                  <span className="text-[9px] text-amber-400/50">{t('editor.modified', 'designer')}</span>
                )}
                {selectedFile && !diff.enabled && (
                  <span className="text-[9px] text-white/15">
                    {FileService.getContent(selectedFile).content.split('\n').length} {t('editor.lines', 'designer')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
