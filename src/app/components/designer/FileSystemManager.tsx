/**
 * @file FileSystemManager.tsx
 * @description Host-File-System Manager — 工作空间配置、文件浏览、版本控制、最近文件、拖拽导入、文件属性
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags file-system, workspace, version-control, recent-files, drag-drop
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  FolderOpen, HardDrive, Clock, FileCode2, FileType2, FileJson,
  FileText, File, Folder, ChevronDown, ChevronRight, History,
  RotateCcw, Trash2, Copy, Edit3, X, Plus, FolderPlus, FilePlus,
  Upload, Download, GitCompare, Eye, Info, ArrowRight,
  RefreshCw, Search, Settings, Archive, Shield, Check,
  MoreHorizontal, ExternalLink, Files, ChevronUp, CopyPlus,
  ImageIcon, GitBranch, Tag, Hash, Layers,
} from 'lucide-react'
import { useLiquidGlass } from '../../utils/liquid-glass'
import { useI18n } from '../../utils/useI18n'
import {
  useFileTreeStore,
  type FileNode,
  type FileVersion,
  type RecentFileEntry,
} from '../../stores/file-tree-store'
import { useAppStore } from '../../stores/app-store'
import { ScrollArea } from '../ui/scroll-area'
import { MOCK_FILE_CONTENTS } from '../../utils/file-contents'
import { formatTimeAgo, formatFileSize } from '../../utils/time-format'
import { DiffWorker } from '../../services/worker-service'
import type { DiffHunk } from '../../services/worker-service'

// ============================================
// Helpers
// ============================================

function formatDate(timestamp?: number): string {
  if (!timestamp) {return '--'}
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getFileIconSmall(name: string) {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) {return <FileCode2 className="w-3.5 h-3.5 text-blue-400/70" />}
  if (name.endsWith('.css')) {return <FileType2 className="w-3.5 h-3.5 text-purple-400/70" />}
  if (name.endsWith('.json')) {return <FileJson className="w-3.5 h-3.5 text-yellow-400/70" />}
  if (name.endsWith('.md')) {return <FileText className="w-3.5 h-3.5 text-white/40" />}
  if (name.endsWith('.png') || name.endsWith('.svg')) {return <ImageIcon className="w-3.5 h-3.5 text-green-400/70" />}
  return <File className="w-3.5 h-3.5 text-white/40" />
}

// ============================================
// Workspace Header
// ============================================

function WorkspaceHeader() {
  const { workspace, setWorkspace, getFileCount, getTotalSize } = useFileTreeStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [editPath, setEditPath] = useState(workspace.rootPath)

  const handleSave = () => {
    setWorkspace({ rootPath: editPath })
    setEditing(false)
  }

  return (
    <div
      className={`p-3 border-b ${isLG ? 'border-emerald-500/[0.08]' : 'border-white/[0.06]'}`}
      style={{ background: isLG ? 'rgba(10,15,10,0.5)' : 'rgba(14,14,24,0.5)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            isLG ? 'bg-emerald-500/[0.12]' : 'bg-violet-500/[0.12]'
          }`}>
            <HardDrive className={`w-3.5 h-3.5 ${isLG ? 'text-emerald-400/70' : 'text-violet-400/70'}`} />
          </div>
          <div>
            <div className="text-[11px] text-white/70">{workspace.name}</div>
            {editing ? (
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  autoFocus
                  value={editPath}
                  onChange={(e) => setEditPath(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {handleSave()}
                    if (e.key === 'Escape') { setEditing(false); setEditPath(workspace.rootPath) }
                  }}
                  className="bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5 text-[9px] text-white/50 outline-none focus:border-blue-500/30 w-48"
                />
                <button onClick={handleSave} className="p-0.5 rounded hover:bg-white/[0.08] text-emerald-400/50">
                  <Check className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-[9px] text-white/25 hover:text-white/40 flex items-center gap-1 transition-colors"
              >
                <FolderOpen className="w-2.5 h-2.5" />
                {workspace.rootPath}
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/40 transition-colors"
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mt-1.5">
        <div className="flex items-center gap-1">
          <Files className="w-2.5 h-2.5 text-white/15" />
          <span className="text-[9px] text-white/25">{t('fileCount', 'files').replace('{{count}}', String(getFileCount()))}</span>
        </div>
        <div className="flex items-center gap-1">
          <HardDrive className="w-2.5 h-2.5 text-white/15" />
          <span className="text-[9px] text-white/25">{formatFileSize(getTotalSize())}</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-2.5 h-2.5 text-white/15" />
          <span className="text-[9px] text-emerald-400/30">{t('local', 'files')}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Recent Files Panel
// ============================================

function RecentFilesPanel() {
  const { recentFiles, removeRecentFile, clearRecentFiles } = useFileTreeStore()
  const { setSelectedFile, openFileTab } = useAppStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(true)

  const handleOpenFile = (path: string) => {
    setSelectedFile(path)
    openFileTab(path)
  }

  if (recentFiles.length === 0 && !expanded) {return null}

  return (
    <div className={`border-b ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-white/25" />
          <span className="text-[10px] text-white/35 uppercase tracking-wider">{t('recentFiles', 'files')}</span>
          {recentFiles.length > 0 && (
            <span className={`text-[8px] px-1 py-0 rounded-full ${
              isLG ? 'bg-emerald-500/[0.1] text-emerald-400/50' : 'bg-violet-500/[0.1] text-violet-400/50'
            }`}>{recentFiles.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {recentFiles.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); clearRecentFiles() }}
              className="p-0.5 rounded hover:bg-white/[0.08] text-white/15 hover:text-white/40 transition-colors"
              title={t('clearRecent', 'files')}
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}
          {expanded ? <ChevronDown className="w-3 h-3 text-white/20" /> : <ChevronRight className="w-3 h-3 text-white/20" />}
        </div>
      </button>

      {expanded && recentFiles.length > 0 && (
        <div className="px-1 pb-1.5">
          {recentFiles.slice(0, 8).map((entry) => (
            <button
              key={entry.path}
              onClick={() => handleOpenFile(entry.path)}
              className="w-full flex items-center gap-2 px-2 py-[3px] rounded hover:bg-white/[0.04] transition-colors group"
            >
              {getFileIconSmall(entry.name)}
              <span className="text-[10px] text-white/45 truncate flex-1 text-left">{entry.name}</span>
              <span className="text-[8px] text-white/15 shrink-0">{formatTimeAgo(entry.openedAt)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeRecentFile(entry.path) }}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/[0.08] text-white/15 hover:text-white/40 transition-all"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </button>
          ))}
        </div>
      )}

      {expanded && recentFiles.length === 0 && (
        <div className="px-3 pb-2">
          <p className="text-[9px] text-white/15">{t('noRecentFiles', 'files')}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// Version History Panel (Real Data)
// ============================================

export function VersionHistoryPanel({ filePath, onClose }: { filePath: string; onClose: () => void }) {
  const { getVersions, rollbackVersion, deleteVersion, openDiff } = useFileTreeStore()
  const { updateFileContent } = useAppStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const versions = getVersions(filePath)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [confirmRollback, setConfirmRollback] = useState<string | null>(null)
  const [inlineDiff, setInlineDiff] = useState<{ versionId: string; hunks: DiffHunk[]; added: number; removed: number } | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)

  const handleRollback = (versionId: string) => {
    if (confirmRollback !== versionId) {
      setConfirmRollback(versionId)
      return
    }
    const content = rollbackVersion(filePath, versionId)
    if (content) {
      updateFileContent(filePath, content)
    }
    setConfirmRollback(null)
  }

  const handleViewDiff = (versionId: string) => {
    const version = versions.find(v => v.id === versionId)
    const prevIndex = versions.findIndex(v => v.id === versionId)
    const prevVersion = versions[prevIndex + 1]
    if (version && prevVersion) {
      openDiff(filePath, filePath, prevVersion.content, version.content)
    }
  }

  const handleInlineDiff = async (versionId: string) => {
    if (inlineDiff?.versionId === versionId) {
      setInlineDiff(null)
      return
    }
    const version = versions.find(v => v.id === versionId)
    const prevIndex = versions.findIndex(v => v.id === versionId)
    const prevVersion = versions[prevIndex + 1]
    if (!version || !prevVersion) {return}

    setLoadingDiff(true)
    try {
      const result = await DiffWorker.diff(prevVersion.content, version.content)
      setInlineDiff({
        versionId,
        hunks: result.hunks,
        added: result.linesAdded,
        removed: result.linesRemoved,
      })
    } catch {
      setInlineDiff(null)
    } finally {
      setLoadingDiff(false)
    }
  }

  return (
    <div
      className={`h-full flex flex-col border-l ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}
      style={{ background: isLG ? 'rgba(10,15,10,0.6)' : 'var(--sidebar, #0d0d14)' }}
    >
      {/* Header */}
      <div className={`h-8 flex items-center justify-between px-3 border-b shrink-0 ${
        isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
      }`}>
        <div className="flex items-center gap-1.5">
          <History className="w-3 h-3 text-white/30" />
          <span className="text-[10px] text-white/40">{t('versionHistory', 'files')}</span>
          <span className={`text-[8px] px-1 rounded-full ${
            isLG ? 'bg-emerald-500/[0.1] text-emerald-400/40' : 'bg-violet-500/[0.1] text-violet-400/40'
          }`}>{versions.length}</span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Version List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {versions.length === 0 ? (
            <div className="text-center py-6">
              <GitBranch className="w-5 h-5 text-white/10 mx-auto mb-1.5" />
              <p className="text-[10px] text-white/20">{t('noVersions', 'files')}</p>
              <p className="text-[8px] text-white/10 mt-0.5">{t('autoVersionHint', 'files')}</p>
            </div>
          ) : (
            versions.map((version, idx) => {
              const isCurrent = idx === 0
              const isSelected = selectedVersionId === version.id
              return (
                <div
                  key={version.id}
                  onClick={() => setSelectedVersionId(isSelected ? null : version.id)}
                  className={`rounded-lg p-2.5 border transition-all cursor-pointer ${
                    isCurrent
                      ? isLG
                        ? 'bg-emerald-500/[0.06] border-emerald-500/[0.12]'
                        : 'bg-white/[0.04] border-white/[0.06]'
                      : isSelected
                        ? 'bg-white/[0.03] border-white/[0.08]'
                        : 'border-transparent hover:bg-white/[0.02] hover:border-white/[0.04]'
                  }`}
                >
                  {/* Version header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {isCurrent && (
                        <span className={`text-[7px] px-1 py-0 rounded-sm ${
                          isLG ? 'bg-emerald-500/[0.15] text-emerald-400/60' : 'bg-blue-500/[0.15] text-blue-400/60'
                        }`}>{t('current', 'files')}</span>
                      )}
                      <span className={`text-[11px] ${isCurrent ? 'text-white/70' : 'text-white/40'}`}>
                        {version.label}
                      </span>
                    </div>
                    <span className="text-[8px] text-white/15">{formatTimeAgo(version.timestamp)}</span>
                  </div>

                  {/* Author + changes */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-white/25">{version.author || t('unknownAuthor', 'files')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {version.linesAdded !== undefined && version.linesAdded > 0 && (
                        <span className="text-[8px] text-emerald-400/40 font-mono">+{version.linesAdded}</span>
                      )}
                      {version.linesRemoved !== undefined && version.linesRemoved > 0 && (
                        <span className="text-[8px] text-red-400/40 font-mono">-{version.linesRemoved}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions (shown on selection) */}
                  {isSelected && !isCurrent && (
                    <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-white/[0.04]">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRollback(version.id) }}
                        className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                          confirmRollback === version.id
                            ? 'text-amber-400/80 bg-amber-500/[0.12]'
                            : isLG
                              ? 'text-emerald-400/50 hover:text-emerald-400/80 hover:bg-emerald-500/[0.08]'
                              : 'text-blue-400/50 hover:text-blue-400/80 hover:bg-blue-500/[0.08]'
                        }`}
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        {confirmRollback === version.id ? t('confirmRollback', 'files') : t('rollback', 'files')}
                      </button>
                      {idx < versions.length - 1 && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewDiff(version.id) }}
                            className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 px-1.5 py-0.5 rounded hover:bg-white/[0.06] transition-colors"
                          >
                            <GitCompare className="w-2.5 h-2.5" />
                            {t('diff', 'files')}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleInlineDiff(version.id) }}
                            className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                              inlineDiff?.versionId === version.id
                                ? isLG ? 'text-emerald-400/70 bg-emerald-500/[0.1]' : 'text-violet-400/70 bg-violet-500/[0.1]'
                                : 'text-white/30 hover:text-white/60 hover:bg-white/[0.06]'
                            }`}
                          >
                            <Eye className="w-2.5 h-2.5" />
                            {loadingDiff && inlineDiff?.versionId !== version.id ? '...' : t('inlineDiff', 'files') || 'Preview'}
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteVersion(version.id) }}
                        className="flex items-center gap-1 text-[9px] text-red-400/30 hover:text-red-400/60 px-1.5 py-0.5 rounded hover:bg-red-500/[0.06] transition-colors ml-auto"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  {/* Inline diff preview */}
                  {inlineDiff?.versionId === version.id && (
                    <div className="mt-2 rounded-md border border-white/[0.06] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center justify-between px-2 py-1 ${
                        isLG ? 'bg-emerald-500/[0.04]' : 'bg-white/[0.02]'
                      }`}>
                        <span className="text-[8px] text-white/30">Diff Preview</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-emerald-400/50 font-mono">+{inlineDiff.added}</span>
                          <span className="text-[8px] text-red-400/50 font-mono">-{inlineDiff.removed}</span>
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto font-mono text-[9px]">
                        {inlineDiff.hunks.slice(0, 60).map((hunk, hi) => (
                          <div
                            key={hi}
                            className={`px-2 py-0 border-l-2 ${
                              hunk.type === 'add'
                                ? 'bg-emerald-500/[0.06] border-emerald-400/30 text-emerald-300/60'
                                : hunk.type === 'remove'
                                  ? 'bg-red-500/[0.06] border-red-400/30 text-red-300/60'
                                  : 'border-transparent text-white/20'
                            }`}
                          >
                            <span className="text-white/10 select-none inline-block w-6 text-right mr-2">{hunk.lineNumber}</span>
                            <span className="text-white/15 select-none mr-1">{hunk.type === 'add' ? '+' : hunk.type === 'remove' ? '-' : ' '}</span>
                            {hunk.content}
                          </div>
                        ))}
                        {inlineDiff.hunks.length > 60 && (
                          <div className="px-2 py-1 text-[8px] text-white/15 text-center">
                            ...{inlineDiff.hunks.length - 60} more lines
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className={`h-6 flex items-center justify-between px-3 border-t shrink-0 ${
        isLG ? 'border-emerald-500/[0.04]' : 'border-white/[0.04]'
      }`}>
        <span className="text-[8px] text-white/15">{t('totalVersions', 'files').replace('{{count}}', String(versions.length))}</span>
        <span className="text-[8px] text-white/10">{t('encryptedStorage', 'files')}</span>
      </div>
    </div>
  )
}

// ============================================
// File Properties Panel
// ============================================

function FilePropertiesPanel({ filePath, onClose }: { filePath: string; onClose: () => void }) {
  const { getFileNode, getVersionCount } = useFileTreeStore()
  const { fileContents } = useAppStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()

  const node = getFileNode(filePath)
  const content = fileContents[filePath]?.content || MOCK_FILE_CONTENTS[filePath] || ''
  const lineCount = content.split('\n').length
  const versionCount = getVersionCount(filePath)
  const fileName = filePath.split('/').pop() || filePath
  const ext = fileName.includes('.') ? fileName.split('.').pop() || '' : ''

  const properties = [
    { label: t('fileName', 'files'), value: fileName, icon: File },
    { label: t('filePath', 'files'), value: filePath, icon: FolderOpen },
    { label: t('fileType', 'files'), value: ext.toUpperCase() || t('unknownAuthor', 'files'), icon: Tag },
    { label: t('fileSize', 'files'), value: formatFileSize(node?.size), icon: HardDrive },
    { label: t('fileLines', 'files'), value: `${lineCount} ${t('linesUnit', 'files')}`, icon: Hash },
    { label: t('versionCount', 'files'), value: `${versionCount}`, icon: GitBranch },
    { label: t('createdAt', 'files'), value: formatDate(node?.createdAt), icon: Clock },
    { label: t('modifiedAt', 'files'), value: formatDate(node?.modifiedAt), icon: Edit3 },
  ]

  return (
    <div
      className={`h-full flex flex-col border-l ${isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'}`}
      style={{ background: isLG ? 'rgba(10,15,10,0.6)' : 'var(--sidebar, #0d0d14)' }}
    >
      <div className={`h-8 flex items-center justify-between px-3 border-b shrink-0 ${
        isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
      }`}>
        <div className="flex items-center gap-1.5">
          <Info className="w-3 h-3 text-white/30" />
          <span className="text-[10px] text-white/40">{t('properties', 'files')}</span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2.5">
          {/* File icon header */}
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.04]">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isLG ? 'bg-emerald-500/[0.08]' : 'bg-violet-500/[0.08]'
            }`}>
              {getFileIconSmall(fileName)}
            </div>
            <div>
              <div className="text-[11px] text-white/60">{fileName}</div>
              <div className="text-[9px] text-white/20">{ext.toUpperCase()} {t('fileTypeSuffix', 'files')}</div>
            </div>
          </div>

          {/* Properties list */}
          {properties.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon className="w-3 h-3 text-white/15 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-white/25">{label}</div>
                <div className="text-[10px] text-white/50 truncate">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================
// Drag-Drop Import Zone
// ============================================

function DragDropZone() {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [isDragOver, setIsDragOver] = useState(false)
  const [importedFiles, setImportedFiles] = useState<string[]>([])
  const { createFile } = useFileTreeStore()
  const { openFileTab, setSelectedFile, updateFileContent } = useAppStore()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const imported: string[] = []

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const content = reader.result as string
        const targetPath = 'src/app/components'
        createFile(targetPath, file.name)
        const fullPath = `${targetPath}/${file.name}`
        updateFileContent(fullPath, content)
        openFileTab(fullPath)
        setSelectedFile(fullPath)
        imported.push(file.name)
        setImportedFiles([...imported])

        // Clear imported indicator after 3s
        setTimeout(() => setImportedFiles([]), 3000)
      }
      reader.readAsText(file)
    })
  }, [createFile, openFileTab, setSelectedFile, updateFileContent])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`mx-2 my-1.5 rounded-lg border-2 border-dashed transition-all ${
        isDragOver
          ? isLG
            ? 'border-emerald-400/40 bg-emerald-500/[0.06]'
            : 'border-violet-400/40 bg-violet-500/[0.06]'
          : 'border-white/[0.06] hover:border-white/[0.1]'
      }`}
    >
      <div className="flex flex-col items-center justify-center py-3">
        <Upload className={`w-4 h-4 mb-1 ${
          isDragOver
            ? isLG ? 'text-emerald-400/60' : 'text-violet-400/60'
            : 'text-white/15'
        }`} />
        <span className={`text-[9px] ${isDragOver ? 'text-white/40' : 'text-white/15'}`}>
          {isDragOver ? t('dragDropActive', 'files') : t('dragDropHintFull', 'files')}
        </span>
        {importedFiles.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1 px-2">
            {importedFiles.map((name) => (
              <span key={name} className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/[0.1] text-emerald-400/60">
                <Check className="w-2 h-2 inline mr-0.5" />{name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Enhanced Context Menu
// ============================================

export function EnhancedContextMenu({ x, y, path, type, onClose }: {
  x: number; y: number; path: string; type: 'file' | 'folder'; onClose: () => void
}) {
  const { deleteNode, renameNode, duplicateFile, createFile, createFolder } = useFileTreeStore()
  const { closeFileTab, setSelectedFile, openFileTab } = useAppStore()
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [mode, setMode] = useState<'menu' | 'rename' | 'newFile' | 'newFolder'>('menu')
  const [inputValue, setInputValue] = useState(path.split('/').pop() || '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {onClose()}
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleRename = () => {
    if (inputValue.trim() && inputValue !== path.split('/').pop()) {
      renameNode(path, inputValue.trim())
    }
    onClose()
  }

  const handleNewFile = () => {
    if (inputValue.trim()) {
      createFile(path, inputValue.trim())
      openFileTab(`${path}/${inputValue.trim()}`)
      setSelectedFile(`${path}/${inputValue.trim()}`)
    }
    onClose()
  }

  const handleNewFolder = () => {
    if (inputValue.trim()) {
      createFolder(path, inputValue.trim())
    }
    onClose()
  }

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteNode(path)
    closeFileTab(path)
    if (useAppStore.getState().selectedFile === path) {
      setSelectedFile(null)
    }
    onClose()
  }

  const MenuItem = ({ icon: Icon, label, onClick, danger, accent }: {
    icon: typeof File; label: string; onClick: () => void; danger?: boolean; accent?: boolean
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors ${
        danger
          ? confirmDelete
            ? 'text-red-400 bg-red-500/[0.1] hover:bg-red-500/[0.15]'
            : 'text-white/50 hover:bg-white/[0.06]'
          : accent
            ? isLG
              ? 'text-emerald-400/60 hover:bg-emerald-500/[0.08]'
              : 'text-violet-400/60 hover:bg-violet-500/[0.08]'
            : 'text-white/50 hover:bg-white/[0.06]'
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  )

  const inputMode = mode === 'rename' || mode === 'newFile' || mode === 'newFolder'

  return (
    <div
      ref={menuRef}
      className={`fixed z-[60] rounded-lg border overflow-hidden py-1 min-w-[180px] ${
        isLG ? 'border-emerald-500/[0.1]' : 'border-white/[0.08]'
      }`}
      style={{
        left: Math.min(x, window.innerWidth - 200),
        top: Math.min(y, window.innerHeight - 300),
        background: isLG ? 'rgba(10,15,10,0.95)' : 'rgba(14,14,24,0.98)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {inputMode ? (
        <div className="px-2 py-1.5">
          <div className="text-[9px] text-white/25 mb-1 px-1">
            {mode === 'rename' ? t('rename', 'files') : mode === 'newFile' ? t('newFile', 'files') : t('newFolder', 'files')}
          </div>
          <input
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (mode === 'rename') {handleRename()}
                else if (mode === 'newFile') {handleNewFile()}
                else {handleNewFolder()}
              }
              if (e.key === 'Escape') {onClose()}
            }}
            placeholder={mode === 'newFile' ? t('filenamePlaceholder', 'files') : mode === 'newFolder' ? t('foldernamePlaceholder', 'files') : ''}
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/80 outline-none focus:border-blue-500/40"
          />
        </div>
      ) : (
        <>
          {type === 'folder' && (
            <>
              <MenuItem icon={FilePlus} label={t('newFile', 'files')} onClick={() => { setInputValue(''); setMode('newFile') }} accent />
              <MenuItem icon={FolderPlus} label={t('newFolder', 'files')} onClick={() => { setInputValue(''); setMode('newFolder') }} accent />
              <div className="border-t border-white/[0.04] my-1" />
            </>
          )}
          <MenuItem icon={Edit3} label={t('rename', 'files')} onClick={() => setMode('rename')} />
          {type === 'file' && (
            <MenuItem icon={CopyPlus} label={t('duplicate', 'files')} onClick={() => { duplicateFile(path); onClose() }} />
          )}
          <MenuItem icon={Copy} label={t('copyPath', 'files')} onClick={() => { navigator.clipboard.writeText(path); onClose() }} />
          {type === 'file' && (
            <>
              <div className="border-t border-white/[0.04] my-1" />
              <MenuItem icon={History} label={t('viewVersions', 'files')} onClick={() => { /* trigger from parent */ onClose() }} />
              <MenuItem icon={Info} label={t('viewProperties', 'files')} onClick={() => { /* trigger from parent */ onClose() }} />
            </>
          )}
          <div className="border-t border-white/[0.04] my-1" />
          <MenuItem
            icon={Trash2}
            label={confirmDelete ? t('confirmDeleteQ', 'files') : t('delete', 'files')}
            onClick={handleDelete}
            danger
          />
        </>
      )}
    </div>
  )
}

// ============================================
// FileSystemManager (main export)
// ============================================

export type FSMTab = 'explorer' | 'recent' | 'versions' | 'properties'

interface FileSystemManagerProps {
  /** If provided, show as a standalone panel; otherwise integrated in CenterPanel */
  standalone?: boolean
  /** Active file for version/properties panels */
  activeFile?: string | null
  /** Callback when a file is opened */
  onOpenFile?: (path: string) => void
}

export function FileSystemManager({ standalone, activeFile, onOpenFile }: FileSystemManagerProps) {
  const { isLG } = useLiquidGlass()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<FSMTab>('explorer')
  const { recentFiles, addRecentFile, getVersions } = useFileTreeStore()
  const { setSelectedFile, openFileTab } = useAppStore()

  const handleOpenFile = (path: string) => {
    setSelectedFile(path)
    openFileTab(path)
    addRecentFile(path)
    onOpenFile?.(path)
  }

  const tabs: { key: FSMTab; label: string; icon: typeof File; count?: number }[] = [
    { key: 'explorer', label: t('explorer', 'files'), icon: FolderOpen },
    { key: 'recent', label: t('recentFiles', 'files'), icon: Clock, count: recentFiles.length },
    { key: 'versions', label: t('versionHistory', 'files'), icon: History, count: activeFile ? getVersions(activeFile).length : 0 },
    { key: 'properties', label: t('properties', 'files'), icon: Info },
  ]

  return (
    <div
      className={`h-full flex flex-col ${standalone ? '' : ''}`}
      style={{ background: isLG ? 'rgba(10,15,10,0.35)' : 'var(--sidebar, #0d0d14)' }}
    >
      {/* Tab bar */}
      <div className={`flex items-center border-b shrink-0 ${
        isLG ? 'border-emerald-500/[0.06]' : 'border-white/[0.04]'
      }`} style={{ background: isLG ? 'rgba(10,15,10,0.25)' : 'rgba(0,0,0,0.1)' }}>
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] border-b-2 transition-colors ${
              activeTab === key
                ? isLG
                  ? 'border-emerald-400/40 text-white/60'
                  : 'border-violet-400/40 text-white/60'
                : 'border-transparent text-white/25 hover:text-white/40'
            }`}
            title={label}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
            {count !== undefined && count > 0 && (
              <span className={`text-[7px] px-1 rounded-full ${
                isLG ? 'bg-emerald-500/[0.1] text-emerald-400/40' : 'bg-violet-500/[0.1] text-violet-400/40'
              }`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'explorer' && (
          <div className="h-full flex flex-col">
            <WorkspaceHeader />
            <DragDropZone />
            <RecentFilesPanel />
            {/* Workspace stats footer */}
            <div className={`mt-auto px-3 py-1.5 border-t ${
              isLG ? 'border-emerald-500/[0.04]' : 'border-white/[0.03]'
            }`}>
              <div className="flex items-center gap-2">
                <Layers className="w-2.5 h-2.5 text-white/10" />
                <span className="text-[8px] text-white/15">Host-File-System Manager v1.0.0</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recent' && (
          <ScrollArea className="h-full">
            <div className="p-2">
              {recentFiles.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-6 h-6 text-white/10 mx-auto mb-2" />
                  <p className="text-[10px] text-white/20">{t('noRecentFiles', 'files')}</p>
                  <p className="text-[8px] text-white/10 mt-0.5">{t('noRecentHint', 'files')}</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recentFiles.map((entry) => (
                    <button
                      key={entry.path}
                      onClick={() => handleOpenFile(entry.path)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group"
                    >
                      {getFileIconSmall(entry.name)}
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[11px] text-white/50 truncate">{entry.name}</div>
                        <div className="text-[8px] text-white/15 truncate">{entry.path}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[8px] text-white/15">{formatTimeAgo(entry.openedAt)}</div>
                        <div className={`text-[7px] px-1 rounded ${
                          entry.language === 'typescript' ? 'text-blue-400/30' :
                          entry.language === 'css' ? 'text-purple-400/30' :
                          'text-white/15'
                        }`}>{entry.language}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {activeTab === 'versions' && activeFile && (
          <VersionHistoryPanel filePath={activeFile} onClose={() => setActiveTab('explorer')} />
        )}

        {activeTab === 'versions' && !activeFile && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <History className="w-6 h-6 text-white/10 mx-auto mb-2" />
              <p className="text-[10px] text-white/20">{t('selectForVersions', 'files')}</p>
            </div>
          </div>
        )}

        {activeTab === 'properties' && activeFile && (
          <FilePropertiesPanel filePath={activeFile} onClose={() => setActiveTab('explorer')} />
        )}

        {activeTab === 'properties' && !activeFile && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Info className="w-6 h-6 text-white/10 mx-auto mb-2" />
              <p className="text-[10px] text-white/20">{t('selectForProperties', 'files')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}