/**
 * @file fileTreeUtils.test.ts
 * @description Unit tests for file tree utility functions
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,file-tree,utilities
 */

import { describe, it, expect } from 'vitest';
import {
  findNodeById,
  findParent,
  removeNode,
  insertNode,
  renameNode,
  cloneNode,
  flattenNames,
  filterTree,
  getNodePath,
  collectAllFileNames,
  type FileNode,
} from '../components/ai-code/fileTreeUtils';

/* ================================================================
   Test Data
   ================================================================ */

function makeTestTree(): FileNode[] {
  return [
    {
      id: 'f1', name: 'src', type: 'folder', children: [
        {
          id: 'f2', name: 'app', type: 'folder', children: [
            { id: 'f3', name: 'App.tsx', type: 'file', language: 'typescript' },
            { id: 'f4', name: 'store.tsx', type: 'file', language: 'typescript' },
          ]
        },
        {
          id: 'f5', name: 'styles', type: 'folder', children: [
            { id: 'f6', name: 'theme.css', type: 'file', language: 'css' },
          ]
        },
      ]
    },
    { id: 'f7', name: 'package.json', type: 'file', language: 'json' },
    { id: 'f8', name: 'tsconfig.json', type: 'file', language: 'json' },
  ];
}

/* ================================================================
   findNodeById
   ================================================================ */

describe('findNodeById', () => {
  const tree = makeTestTree();

  it('finds a root-level node', () => {
    const node = findNodeById(tree, 'f7');
    expect(node).toBeTruthy();
    expect(node!.name).toBe('package.json');
  });

  it('finds a deeply nested node', () => {
    const node = findNodeById(tree, 'f3');
    expect(node).toBeTruthy();
    expect(node!.name).toBe('App.tsx');
  });

  it('returns null for non-existent ID', () => {
    expect(findNodeById(tree, 'non-existent')).toBeNull();
  });

  it('finds a folder node', () => {
    const node = findNodeById(tree, 'f5');
    expect(node).toBeTruthy();
    expect(node!.type).toBe('folder');
    expect(node!.name).toBe('styles');
  });
});

/* ================================================================
   findParent
   ================================================================ */

describe('findParent', () => {
  const tree = makeTestTree();

  it('finds parent of a nested file', () => {
    const parent = findParent(tree, 'f3');
    expect(parent).toBeTruthy();
    expect(parent!.id).toBe('f2');
    expect(parent!.name).toBe('app');
  });

  it('finds parent of a folder', () => {
    const parent = findParent(tree, 'f2');
    expect(parent).toBeTruthy();
    expect(parent!.id).toBe('f1');
  });

  it('returns null for root-level nodes', () => {
    expect(findParent(tree, 'f1')).toBeNull();
    expect(findParent(tree, 'f7')).toBeNull();
  });

  it('returns null for non-existent ID', () => {
    expect(findParent(tree, 'non-existent')).toBeNull();
  });
});

/* ================================================================
   removeNode
   ================================================================ */

describe('removeNode', () => {
  it('removes a root-level node', () => {
    const tree = makeTestTree();
    const result = removeNode(tree, 'f7');
    expect(result.length).toBe(2);
    expect(findNodeById(result, 'f7')).toBeNull();
  });

  it('removes a nested node', () => {
    const tree = makeTestTree();
    const result = removeNode(tree, 'f3');
    const appFolder = findNodeById(result, 'f2');
    expect(appFolder!.children!.length).toBe(1);
    expect(findNodeById(result, 'f3')).toBeNull();
  });

  it('does not mutate original tree', () => {
    const tree = makeTestTree();
    removeNode(tree, 'f3');
    expect(findNodeById(tree, 'f3')).toBeTruthy();
  });

  it('handles non-existent ID gracefully', () => {
    const tree = makeTestTree();
    const result = removeNode(tree, 'non-existent');
    expect(result.length).toBe(tree.length);
  });
});

/* ================================================================
   insertNode
   ================================================================ */

describe('insertNode', () => {
  it('inserts at root when parentId is null', () => {
    const tree = makeTestTree();
    const newNode: FileNode = { id: 'new1', name: 'README.md', type: 'file' };
    const result = insertNode(tree, null, newNode);
    expect(result.length).toBe(tree.length + 1);
    expect(result[result.length - 1].name).toBe('README.md');
  });

  it('inserts into a folder', () => {
    const tree = makeTestTree();
    const newNode: FileNode = { id: 'new2', name: 'utils.ts', type: 'file' };
    const result = insertNode(tree, 'f2', newNode);
    const appFolder = findNodeById(result, 'f2');
    expect(appFolder!.children!.length).toBe(3);
    expect(appFolder!.children![2].name).toBe('utils.ts');
  });

  it('does not mutate original tree', () => {
    const tree = makeTestTree();
    const newNode: FileNode = { id: 'new3', name: 'test.ts', type: 'file' };
    insertNode(tree, 'f2', newNode);
    const appFolder = findNodeById(tree, 'f2');
    expect(appFolder!.children!.length).toBe(2);
  });
});

/* ================================================================
   renameNode
   ================================================================ */

describe('renameNode', () => {
  it('renames a file', () => {
    const tree = makeTestTree();
    const result = renameNode(tree, 'f3', 'Main.tsx');
    const node = findNodeById(result, 'f3');
    expect(node!.name).toBe('Main.tsx');
  });

  it('renames a folder', () => {
    const tree = makeTestTree();
    const result = renameNode(tree, 'f5', 'css');
    const node = findNodeById(result, 'f5');
    expect(node!.name).toBe('css');
  });

  it('does not mutate original tree', () => {
    const tree = makeTestTree();
    renameNode(tree, 'f3', 'Changed.tsx');
    expect(findNodeById(tree, 'f3')!.name).toBe('App.tsx');
  });
});

/* ================================================================
   cloneNode
   ================================================================ */

describe('cloneNode', () => {
  it('creates a copy with new ID', () => {
    const node: FileNode = { id: 'f3', name: 'App.tsx', type: 'file' };
    const cloned = cloneNode(node);
    expect(cloned.id).not.toBe(node.id);
    expect(cloned.name).toBe('App_copy.tsx');
  });

  it('deep clones children with new IDs', () => {
    const node: FileNode = {
      id: 'f1', name: 'src', type: 'folder', children: [
        { id: 'f2', name: 'app', type: 'folder', children: [
          { id: 'f3', name: 'App.tsx', type: 'file' },
        ] },
      ]
    };
    const cloned = cloneNode(node);
    expect(cloned.id).not.toBe('f1');
    expect(cloned.children![0].id).not.toBe('f2');
    expect(cloned.children![0].children![0].id).not.toBe('f3');
  });
});

/* ================================================================
   flattenNames
   ================================================================ */

describe('flattenNames', () => {
  it('collects all names in lowercase', () => {
    const tree = makeTestTree();
    const names = flattenNames(tree);
    expect(names).toContain('app.tsx');
    expect(names).toContain('package.json');
    expect(names).toContain('src');
  });
});

/* ================================================================
   filterTree
   ================================================================ */

describe('filterTree', () => {
  it('returns full tree for empty query', () => {
    const tree = makeTestTree();
    expect(filterTree(tree, '').length).toBe(tree.length);
  });

  it('filters files by name', () => {
    const tree = makeTestTree();
    const result = filterTree(tree, 'App');
    // Should return src -> app -> App.tsx (preserving parent structure)
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('src');
  });

  it('case-insensitive filtering', () => {
    const tree = makeTestTree();
    const result = filterTree(tree, 'app');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty for no match', () => {
    const tree = makeTestTree();
    const result = filterTree(tree, 'xyz_nonexistent');
    expect(result.length).toBe(0);
  });
});

/* ================================================================
   getNodePath
   ================================================================ */

describe('getNodePath', () => {
  it('returns full path for nested file', () => {
    const tree = makeTestTree();
    expect(getNodePath(tree, 'f3')).toBe('src/app/App.tsx');
  });

  it('returns path for folder', () => {
    const tree = makeTestTree();
    expect(getNodePath(tree, 'f5')).toBe('src/styles');
  });

  it('returns name for root-level file', () => {
    const tree = makeTestTree();
    expect(getNodePath(tree, 'f7')).toBe('package.json');
  });

  it('returns null for non-existent node', () => {
    const tree = makeTestTree();
    expect(getNodePath(tree, 'xxx')).toBeNull();
  });
});

/* ================================================================
   collectAllFileNames
   ================================================================ */

describe('collectAllFileNames', () => {
  it('collects all file and folder names', () => {
    const tree = makeTestTree();
    const names = collectAllFileNames(tree);
    expect(names).toContain('src');
    expect(names).toContain('App.tsx');
    expect(names).toContain('theme.css');
    expect(names).toContain('package.json');
    expect(names.length).toBe(8); // 8 nodes total
  });
});
