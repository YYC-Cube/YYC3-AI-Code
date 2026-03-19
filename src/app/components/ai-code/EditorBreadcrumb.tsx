/**
 * @file EditorBreadcrumb.tsx
 * @description 编辑器文件路径面包屑导航组件 — 展示当前文件在项目结构中的层级路径
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-10
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ui,breadcrumb,navigation,editor,ai-code
 */
import React from 'react';
import { ChevronRight, FolderOpen, FileCode2 } from 'lucide-react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

function buildPath(tree: FileNode[], targetId: string, path: { id: string; name: string; type: string }[] = []): { id: string; name: string; type: string }[] | null {
  for (const node of tree) {
    const current = [...path, { id: node.id, name: node.name, type: node.type }];
    if (node.id === targetId) return current;
    if (node.children) {
      const found = buildPath(node.children, targetId, current);
      if (found) return found;
    }
  }
  return null;
}

export function EditorBreadcrumb({
  fileTree,
  selectedFileId,
  onNavigate,
}: {
  fileTree: FileNode[];
  selectedFileId: string;
  onNavigate: (id: string) => void;
}) {
  const pathParts = buildPath(fileTree, selectedFileId) || [];

  if (pathParts.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 px-3 py-1 border-b border-white/[0.04] shrink-0 bg-[#0b0c12] overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}>
      {pathParts.map((part, idx) => {
        const isLast = idx === pathParts.length - 1;
        const isFolder = part.type === 'folder';
        return (
          <React.Fragment key={part.id}>
            {idx > 0 && <ChevronRight size={9} className="text-white/15 shrink-0" />}
            <button
              onClick={() => isFolder ? undefined : onNavigate(part.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors shrink-0 ${
                isLast ? 'text-white/60' : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
              }`}
            >
              {isFolder ? (
                <FolderOpen size={10} className="text-amber-400/50" />
              ) : (
                <FileCode2 size={10} className="text-cyan-400/50" />
              )}
              <span>{part.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}