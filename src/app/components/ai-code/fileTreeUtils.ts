/**
 * @file fileTreeUtils.ts
 * @description File tree utility functions extracted from AICodeSystem.tsx
 *              Handles tree traversal, node CRUD, path resolution, filtering
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P1,AI,file-tree,utilities
 */

import type { LucideIcon } from 'lucide-react';

/* ================================================================
   Types
   ================================================================ */

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  icon?: LucideIcon;
  children?: FileNode[];
  language?: string;
  content?: string;
}

/* ================================================================
   ID Generator
   ================================================================ */

let _idCounter = 100;

/** Generate a unique file node ID */
export const nextId = () => 'f' + (++_idCounter);

/* ================================================================
   Tree Traversal
   ================================================================ */

/** Find a node by ID in the file tree */
export function findNodeById(tree: FileNode[], id: string): FileNode | null {
  for (const n of tree) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Find the parent node of a given node ID */
export function findParent(tree: FileNode[], id: string): FileNode | null {
  for (const n of tree) {
    if (n.children) {
      if (n.children.some(c => c.id === id)) return n;
      const found = findParent(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

/* ================================================================
   Tree Mutations (immutable)
   ================================================================ */

/** Remove a node by ID from the tree */
export function removeNode(tree: FileNode[], id: string): FileNode[] {
  return tree.filter(n => n.id !== id).map(n =>
    n.children ? { ...n, children: removeNode(n.children, id) } : n
  );
}

/** Insert a new node under a parent (or at root if parentId is null) */
export function insertNode(tree: FileNode[], parentId: string | null, newNode: FileNode): FileNode[] {
  if (!parentId) return [...tree, newNode];
  return tree.map(n => {
    if (n.id === parentId && n.children) return { ...n, children: [...n.children, newNode] };
    if (n.children) return { ...n, children: insertNode(n.children, parentId, newNode) };
    return n;
  });
}

/** Rename a node by ID */
export function renameNode(tree: FileNode[], id: string, newName: string): FileNode[] {
  return tree.map(n => {
    if (n.id === id) return { ...n, name: newName };
    if (n.children) return { ...n, children: renameNode(n.children, id, newName) };
    return n;
  });
}

/** Deep clone a node with new IDs */
export function cloneNode(node: FileNode): FileNode {
  const newId = nextId();
  return {
    ...node,
    id: newId,
    name: node.name.replace(/(\.\w+)?$/, '_copy$1'),
    children: node.children?.map(cloneNode),
  };
}

/* ================================================================
   Tree Queries
   ================================================================ */

/** Flatten all file/folder names (lowercase) for duplicate detection */
export function flattenNames(tree: FileNode[]): string[] {
  const out: string[] = [];
  for (const n of tree) {
    out.push(n.name.toLowerCase());
    if (n.children) out.push(...flattenNames(n.children));
  }
  return out;
}

/** Filter tree by search query (preserves parent structure) */
export function filterTree(tree: FileNode[], query: string): FileNode[] {
  if (!query) return tree;
  const q = query.toLowerCase();
  return tree.reduce<FileNode[]>((acc, n) => {
    if (n.name.toLowerCase().includes(q)) { acc.push(n); return acc; }
    if (n.children) {
      const filtered = filterTree(n.children, query);
      if (filtered.length > 0) acc.push({ ...n, children: filtered });
    }
    return acc;
  }, []);
}

/** Compute full path for a node (e.g. "src/app/components/designer") */
export function getNodePath(tree: FileNode[], nodeId: string, prefix = ''): string | null {
  for (const n of tree) {
    const p = prefix ? prefix + '/' + n.name : n.name;
    if (n.id === nodeId) return p;
    if (n.children) {
      const found = getNodePath(n.children, nodeId, p);
      if (found) return found;
    }
  }
  return null;
}

/** Collect all file names across tree (for completions) */
export function collectAllFileNames(tree: FileNode[]): string[] {
  const out: string[] = [];
  for (const n of tree) {
    out.push(n.name);
    if (n.children) out.push(...collectAllFileNames(n.children));
  }
  return out;
}
