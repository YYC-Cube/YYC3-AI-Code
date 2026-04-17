import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useFileTreeStore } from '@/app/stores/file-tree-store'

describe('FileTreeStore - 初始化与默认值', () => {
  let store: ReturnType<typeof useFileTreeStore.getState>

  beforeEach(() => {
    store = useFileTreeStore.getState()
    useFileTreeStore.setState({
      fileTree: store.fileTree,
      versions: store.versions,
      diff: { enabled: false, leftPath: null, rightPath: null, leftContent: '', rightContent: '' },
      recentFiles: [],
      workspace: { rootPath: '~/Documents/YYC3-AI-Code', name: 'YYC³ AI Code', createdAt: Date.now() - 86400000 },
      contextMenu: null,
    })
  })

  it('应该有正确的初始文件树结构', () => {
    const state = useFileTreeStore.getState()
    
    expect(state.fileTree).toBeDefined()
    expect(Array.isArray(state.fileTree)).toBe(true)
    expect(state.fileTree.length).toBeGreaterThan(0)
    
    const rootNode = state.fileTree.find(n => n.name === 'src')
    expect(rootNode).toBeDefined()
    expect(rootNode?.type).toBe('folder')
    expect(rootNode?.children).toBeDefined()
    expect(rootNode!.children!.length).toBeGreaterThan(0)
  })

  it('应该有初始的版本历史', () => {
    const state = useFileTreeStore.getState()
    
    expect(state.versions).toBeDefined()
    expect(Array.isArray(state.versions)).toBe(true)
    expect(state.versions.length).toBeGreaterThan(0)
    
    const appVersions = state.versions.filter(v => v.path.includes('App.tsx'))
    expect(appVersions.length).toBeGreaterThanOrEqual(2)
  })

  it('Diff视图初始状态应该是关闭的', () => {
    const state = useFileTreeStore.getState()
    
    expect(state.diff.enabled).toBe(false)
    expect(state.diff.leftPath).toBeNull()
    expect(state.diff.rightPath).toBeNull()
    expect(state.diff.leftContent).toBe('')
    expect(state.diff.rightContent).toBe('')
  })

  it('最近文件列表初始为空', () => {
    const state = useFileTreeStore.getState()
    expect(state.recentFiles).toEqual([])
  })

  it('工作区配置应该有默认值', () => {
    const state = useFileTreeStore.getState()
    
    expect(state.workspace.rootPath).toContain('YYC3-AI-Code')
    expect(state.workspace.name).toBe('YYC³ AI Code')
    expect(state.workspace.createdAt).toBeDefined()
  })

  it('右键菜单初始状态为null', () => {
    const state = useFileTreeStore.getState()
    expect(state.contextMenu).toBeNull()
  })
})

describe('FileTreeStore - 文件操作', () => {
  beforeEach(() => {
    useFileTreeStore.setState({
      fileTree: useFileTreeStore.getState().fileTree,
      versions: [],
      diff: { enabled: false, leftPath: null, rightPath: null, leftContent: '', rightContent: '' },
      recentFiles: [],
      workspace: { rootPath: '~/test', name: 'Test Project', createdAt: Date.now() },
      contextMenu: null,
    })
  })

  describe('createFile', () => {
    it('应该在指定父目录下创建新文件', () => {
      const { createFile, getFileNode } = useFileTreeStore.getState()
      
      createFile('src/app/components/designer', 'NewComponent.tsx')
      
      const newNode = getFileNode('src/app/components/designer/NewComponent.tsx')
      expect(newNode).toBeDefined()
      expect(newNode?.name).toBe('NewComponent.tsx')
      expect(newNode?.type).toBe('file')
      expect(newNode?.path).toBe('src/app/components/designer/NewComponent.tsx')
    })

    it('创建的文件应该有时间戳', () => {
      const beforeCreate = Date.now()
      const { createFile, getFileNode } = useFileTreeStore.getState()
      
      createFile('src/app', 'TimestampTest.tsx')
      
      const node = getFileNode('src/app/TimestampTest.tsx')
      expect(node?.createdAt).toBeDefined()
      expect(node?.createdAt!).toBeGreaterThanOrEqual(beforeCreate)
      expect(node?.modifiedAt).toBeDefined()
    })

    it('创建文件后父目录的修改时间应该更新', () => {
      const { createFile, getFileNode } = useFileTreeStore.getState()
      const parentBefore = getFileNode('src/app/components/designer')?.modifiedAt
      
      createFile('src/app/components/designer', 'UpdateParentTest.tsx')
      
      const parentAfter = getFileNode('src/app/components/designer')?.modifiedAt
      expect(parentAfter).toBeDefined()
      if (parentBefore && parentAfter) {
        expect(parentAfter).toBeGreaterThanOrEqual(parentBefore)
      }
    })
  })

  describe('createFolder', () => {
    it('应该在指定父目录下创建新文件夹', () => {
      const { createFolder, getFileNode } = useFileTreeStore.getState()
      
      createFolder('src/app', 'new-folder')
      
      const newFolder = getFileNode('src/app/new-folder')
      expect(newFolder).toBeDefined()
      expect(newFolder?.type).toBe('folder')
      expect(newFolder?.children).toBeDefined()
      expect(newFolder?.children!.length).toBe(0)
    })

    it('可以在新建的文件夹中继续创建子项', () => {
      const { createFolder, createFile, getFileNode } = useFileTreeStore.getState()
      
      createFolder('src/app', 'nested-test')
      createFile('src/app/nested-test', 'nested-file.ts')
      
      const nestedFile = getFileNode('src/app/nested-test/nested-file.ts')
      expect(nestedFile).toBeDefined()
      expect(nestedFile?.type).toBe('file')
    })
  })

  describe('deleteNode', () => {
    it('应该删除指定的文件节点', () => {
      const { deleteNode, getFileNode, getFileCount } = useFileTreeStore.getState()
      const countBefore = getFileCount()
      
      deleteNode('src/app/App.tsx')
      
      const deletedNode = getFileNode('src/app/App.tsx')
      expect(deletedNode).toBeNull()
      expect(getFileCount()).toBe(countBefore - 1)
    })

    it('删除文件时应该从最近文件列表中移除', () => {
      const { addRecentFile, deleteNode } = useFileTreeStore.getState()
      
      addRecentFile('src/app/App.tsx')
      expect(useFileTreeStore.getState().recentFiles.some(r => r.path === 'src/app/App.tsx')).toBe(true)
      
      deleteNode('src/app/App.tsx')
      expect(useFileTreeStore.getState().recentFiles.some(r => r.path === 'src/app/App.tsx')).toBe(false)
    })

    it('删除不存在的路径不应该报错', () => {
      const { deleteNode, getFileCount } = useFileTreeStore.getState()
      const countBefore = getFileCount()
      
      expect(() => deleteNode('non/existent/path.ts')).not.toThrow()
      expect(getFileCount()).toBe(countBefore)
    })
  })

  describe('renameNode', () => {
    it('应该正确重命名文件节点', () => {
      const { createFile, renameNode, getFileNode } = useFileTreeStore.getState()
      
      createFile('src/app', 'rename-test.tsx')
      renameNode('src/app/rename-test.tsx', 'MainApp.tsx')
      
      const oldNode = getFileNode('src/app/rename-test.tsx')
      const newNode = getFileNode('src/app/MainApp.tsx')
      
      expect(oldNode).toBeNull()
      expect(newNode).toBeDefined()
      expect(newNode?.name).toBe('MainApp.tsx')
    })

    it('重命名后应该更新修改时间', () => {
      const { createFile, renameNode, getFileNode } = useFileTreeStore.getState()
      
      createFile('src', 'timestamp-test.json')
      const beforeRename = Date.now()
      
      renameNode('src/timestamp-test.json', 'package-new.json')
      
      const renamedNode = getFileNode('src/package-new.json')
      expect(renamedNode?.modifiedAt).toBeDefined()
      expect(renamedNode?.modifiedAt!).toBeGreaterThanOrEqual(beforeRename)
    })
  })

  describe('moveNode', () => {
    it('应该将文件移动到目标目录', () => {
      const { createFile, moveNode, getFileNode } = useFileTreeStore.getState()
      
      createFile('src/app', 'movable-file.ts')
      moveNode('src/app/movable-file.ts', 'src/styles')
      
      const oldLocation = getFileNode('src/app/movable-file.ts')
      const newLocation = getFileNode('src/styles/movable-file.ts')
      
      expect(oldLocation).toBeNull()
      expect(newLocation).toBeDefined()
      expect(newLocation?.path).toBe('src/styles/movable-file.ts')
    })
  })

  describe('duplicateFile', () => {
    it('应该复制文件并添加-copy后缀', () => {
      const { createFile, duplicateFile, getFileNode } = useFileTreeStore.getState()
      
      createFile('src/app', 'dup-source.tsx')
      duplicateFile('src/app/dup-source.tsx')
      
      const copyNode = getFileNode('src/app/dup-source-copy.tsx')
      expect(copyNode).toBeDefined()
      expect(copyNode?.name).toContain('-copy')
      expect(copyNode?.type).toBe('file')
    })

    it('复制文件夹不应该生效', () => {
      const { duplicateFile, getFileNode } = useFileTreeStore.getState()
      
      duplicateFile('src/app')
      
      const copyFolder = getFileNode('src/app-copy')
      expect(copyFolder).toBeNull()
    })
  })

  describe('resetTree', () => {
    it('应该重置文件树到默认状态', () => {
      const { createFile, resetTree, getFileNode } = useFileTreeStore.getState()
      
      createFile('src/app', 'temp-file.ts')
      expect(getFileNode('src/app/temp-file.ts')).toBeDefined()
      
      resetTree()
      
      expect(getFileNode('src/app/temp-file.ts')).toBeNull()
    })
  })
})

describe('FileTreeStore - 版本控制', () => {
  beforeEach(() => {
    useFileTreeStore.setState({
      versions: [],
      diff: { enabled: false, leftPath: null, rightPath: null, leftContent: '', rightContent: '' },
      recentFiles: [],
    })
  })

  describe('saveVersion', () => {
    it('应该保存新的版本记录', () => {
      const { saveVersion, getVersions } = useFileTreeStore.getState()
      const content = 'const x = 1'
      
      saveVersion('test/file.ts', content, 'v1 — 初始版本', '测试作者')
      
      const versions = getVersions('test/file.ts')
      expect(versions.length).toBe(1)
      expect(versions[0].path).toBe('test/file.ts')
      expect(versions[0].content).toBe(content)
      expect(versions[0].label).toBe('v1 — 初始版本')
      expect(versions[0].author).toBe('测试作者')
      expect(versions[0].id).toBeDefined()
      expect(versions[0].timestamp).toBeDefined()
    })

    it('自动生成版本标签', () => {
      const { saveVersion, getVersions } = useFileTreeStore.getState()
      
      saveVersion('auto-label.ts', 'content1')
      saveVersion('auto-label.ts', 'content2')
      
      const versions = getVersions('auto-label.ts')
      expect(versions.length).toBe(2)
      const labels = versions.map(v => v.label)
      expect(labels).toContain('v1')
      expect(labels).toContain('v2')
    })

    it('计算行变更统计', () => {
      const { saveVersion, getVersions } = useFileTreeStore.getState()
      
      saveVersion('diff-stats.ts', 'old-line-1\nold-line-2\nold-line-3')
      saveVersion('diff-stats.ts', 'new-line-1\nnew-line-2\nnew-line-3\nnew-line-4')
      
      const versions = getVersions('diff-stats.ts')
      const latest = versions[0]
      expect(latest.linesAdded).toBeGreaterThan(0)
    })

    it('首次保存时linesRemoved应为0', () => {
      const { saveVersion, getVersions } = useFileTreeStore.getState()
      
      saveVersion('first-save.ts', 'line1\nline2\nline3')
      
      const versions = getVersions('first-save.ts')
      expect(versions[0].linesRemoved).toBe(0)
      expect(versions[0].linesAdded).toBe(3)
    })
  })

  describe('getVersions', () => {
    it('应该按时间倒序返回版本列表', () => {
      const { saveVersion, getVersions } = useFileTreeStore.getState()
      
      saveVersion('ordered.ts', 'v1', 'version 1')
      saveVersion('ordered.ts', 'v2', 'version 2')
      saveVersion('ordered.ts', 'v3', 'version 3')
      
      const versions = getVersions('ordered.ts')
      expect(versions.length).toBe(3)
      for (let i = 0; i < versions.length - 1; i++) {
        expect(versions[i].timestamp).toBeGreaterThanOrEqual(versions[i + 1].timestamp)
      }
    })

    it('只返回指定文件的版本', () => {
      const { saveVersion, getVersions } = useFileTreeStore.getState()
      
      saveVersion('file-a.ts', 'content a')
      saveVersion('file-b.ts', 'content b')
      
      const versionsA = getVersions('file-a.ts')
      const versionsB = getVersions('file-b.ts')
      
      expect(versionsA.length).toBe(1)
      expect(versionsB.length).toBe(1)
      expect(versionsA[0].path).toBe('file-a.ts')
      expect(versionsB[0].path).toBe('file-b.ts')
    })
  })

  describe('rollbackVersion', () => {
    it('应该返回指定版本的文件内容', () => {
      const { saveVersion, rollbackVersion } = useFileTreeStore.getState()
      const originalContent = 'original content'
      
      saveVersion('rollback.ts', originalContent, 'initial')
      saveVersion('rollback.ts', 'modified content', 'modified')
      
      const versions = useFileTreeStore.getState().getVersions('rollback.ts')
      const initialVersionId = versions.find(v => v.label === 'initial')?.id!
      
      const rolledBackContent = rollbackVersion('rollback.ts', initialVersionId)
      expect(rolledBackContent).toBe(originalContent)
    })

    it('找不到版本时应返回null', () => {
      const { rollbackVersion } = useFileTreeStore.getState()
      
      const result = rollbackVersion('nonexistent.ts', 'invalid-id')
      expect(result).toBeNull()
    })
  })

  describe('deleteVersion', () => {
    it('应该删除指定版本的记录', () => {
      const { saveVersion, deleteVersion, getVersions, getVersionCount } = useFileTreeStore.getState()
      
      saveVersion('delete-ver.ts', 'content', 'to-delete')
      expect(getVersionCount('delete-ver.ts')).toBe(1)
      
      const versionId = getVersions('delete-ver.ts')[0].id
      deleteVersion(versionId)
      
      expect(getVersionCount('delete-ver.ts')).toBe(0)
    })
  })

  describe('clearVersions', () => {
    it('应该清除指定文件的所有版本', () => {
      const { saveVersion, clearVersions, getVersionCount } = useFileTreeStore.getState()
      
      saveVersion('clear-all.ts', 'v1')
      saveVersion('clear-all.ts', 'v2')
      saveVersion('clear-all.ts', 'v3')
      expect(getVersionCount('clear-all.ts')).toBe(3)
      
      clearVersions('clear-all.ts')
      expect(getVersionCount('clear-all.ts')).toBe(0)
    })

    it('不应影响其他文件的版本', () => {
      const { saveVersion, clearVersions, getVersionCount } = useFileTreeStore.getState()
      
      saveVersion('keep-this.ts', 'keep')
      saveVersion('remove-this.ts', 'remove')
      
      clearVersions('remove-this.ts')
      
      expect(getVersionCount('keep-this.ts')).toBe(1)
      expect(getVersionCount('remove-this.ts')).toBe(0)
    })
  })
})

describe('FileTreeStore - Diff视图', () => {
  beforeEach(() => {
    useFileTreeStore.setState({
      diff: { enabled: false, leftPath: null, rightPath: null, leftContent: '', rightContent: '' },
    })
  })

  describe('openDiff', () => {
    it('应该打开Diff视图并设置内容', () => {
      const { openDiff } = useFileTreeStore.getState()
      
      openDiff(
        'file-old.ts',
        'file-new.ts',
        'old content line1\nold content line2',
        'new content line1\nnew content line2\nnew content line3'
      )
      
      const state = useFileTreeStore.getState()
      expect(state.diff.enabled).toBe(true)
      expect(state.diff.leftPath).toBe('file-old.ts')
      expect(state.diff.rightPath).toBe('file-new.ts')
      expect(state.diff.leftContent).toContain('old content')
      expect(state.diff.rightContent).toContain('new content')
    })
  })

  describe('closeDiff', () => {
    it('应该关闭Diff视图并重置状态', () => {
      const { openDiff, closeDiff } = useFileTreeStore.getState()
      
      openDiff('a.ts', 'b.ts', 'left', 'right')
      closeDiff()
      
      const state = useFileTreeStore.getState()
      expect(state.diff.enabled).toBe(false)
      expect(state.diff.leftPath).toBeNull()
      expect(state.diff.rightPath).toBeNull()
      expect(state.diff.leftContent).toBe('')
      expect(state.diff.rightContent).toBe('')
    })
  })
})

describe('FileTreeStore - 最近文件管理', () => {
  beforeEach(() => {
    useFileTreeStore.setState({ recentFiles: [] })
  })

  describe('addRecentFile', () => {
    it('应该添加文件到最近列表', () => {
      const { addRecentFile } = useFileTreeStore.getState()
      
      addRecentFile('src/app/App.tsx')
      
      const state = useFileTreeStore.getState()
      expect(state.recentFiles.length).toBe(1)
      expect(state.recentFiles[0].path).toBe('src/app/App.tsx')
      expect(state.recentFiles[0].name).toBe('App.tsx')
      expect(state.recentFiles[0].language).toBe('typescript')
      expect(state.recentFiles[0].openedAt).toBeDefined()
    })

    it('重复添加同一文件应该移动到最前面', () => {
      const { addRecentFile } = useFileTreeStore.getState()
      
      addRecentFile('file-a.ts')
      addRecentFile('file-b.ts')
      addRecentFile('file-a.ts')
      
      const state = useFileTreeStore.getState()
      expect(state.recentFiles.length).toBe(2)
      expect(state.recentFiles[0].path).toBe('file-a.ts')
    })

    it('最近文件列表上限为20个', () => {
      const { addRecentFile } = useFileTreeStore.getState()
      
      for (let i = 0; i < 25; i++) {
        addRecentFile(`file-${i}.ts`)
      }
      
      const state = useFileTreeStore.getState()
      expect(state.recentFiles.length).toBe(20)
      expect(state.recentFiles[0].path).toBe('file-24.ts')
    })

    it('应该根据文件扩展名检测语言', () => {
      const { addRecentFile } = useFileTreeStore.getState()
      
      addRecentFile('style.css')
      expect(useFileTreeStore.getState().recentFiles[0].language).toBe('css')
      
      addRecentFile('config.json')
      expect(useFileTreeStore.getState().recentFiles[0].language).toBe('json')
      
      addRecentFile('readme.md')
      expect(useFileTreeStore.getState().recentFiles[0].language).toBe('markdown')
    })
  })

  describe('removeRecentFile', () => {
    it('应该从最近列表中移除指定文件', () => {
      const { addRecentFile, removeRecentFile } = useFileTreeStore.getState()
      
      addRecentFile('keep.ts')
      addRecentFile('remove.ts')
      
      removeRecentFile('remove.ts')
      
      const state = useFileTreeStore.getState()
      expect(state.recentFiles.length).toBe(1)
      expect(state.recentFiles[0].path).toBe('keep.ts')
    })
  })

  describe('clearRecentFiles', () => {
    it('应该清空最近文件列表', () => {
      const { addRecentFile, clearRecentFiles } = useFileTreeStore.getState()
      
      addRecentFile('file1.ts')
      addRecentFile('file2.ts')
      clearRecentFiles()
      
      expect(useFileTreeStore.getState().recentFiles).toEqual([])
    })
  })
})

describe('FileTreeStore - 右键菜单', () => {
  beforeEach(() => {
    useFileTreeStore.setState({ contextMenu: null })
  })

  describe('openContextMenu', () => {
    it('应该设置右键菜单位置和目标信息', () => {
      const { openContextMenu } = useFileTreeStore.getState()
      
      openContextMenu(100, 200, 'src/app/App.tsx', 'file')
      
      const state = useFileTreeStore.getState()
      expect(state.contextMenu).toEqual({
        x: 100,
        y: 200,
        path: 'src/app/App.tsx',
        type: 'file',
      })
    })

    it('支持文件夹类型的右键菜单', () => {
      const { openContextMenu } = useFileTreeStore.getState()
      
      openContextMenu(50, 50, 'src/app', 'folder')
      
      expect(useFileTreeStore.getState().contextMenu?.type).toBe('folder')
    })
  })

  describe('closeContextMenu', () => {
    it('应该关闭右键菜单', () => {
      const { openContextMenu, closeContextMenu } = useFileTreeStore.getState()
      
      openContextMenu(10, 20, 'test.ts', 'file')
      expect(useFileTreeStore.getState().contextMenu).not.toBeNull()
      
      closeContextMenu()
      expect(useFileTreeStore.getState().contextMenu).toBeNull()
    })
  })
})

describe('FileTreeStore - 派生查询方法', () => {
  beforeEach(() => {
    useFileTreeStore.setState({
      fileTree: useFileTreeStore.getState().fileTree,
      versions: [],
    })
  })

  describe('getFileNode', () => {
    it('应该根据路径找到对应的文件节点', () => {
      const { getFileNode } = useFileTreeStore.getState()
      
      const appFile = getFileNode('src/app/App.tsx')
      expect(appFile).toBeDefined()
      expect(appFile?.name).toBe('App.tsx')
      expect(appFile?.type).toBe('file')
    })

    it('应该能找到嵌套较深的文件', () => {
      const { getFileNode } = useFileTreeStore.getState()
      
      const deepFile = getFileNode('src/app/components/designer/LeftPanel.tsx')
      expect(deepFile).toBeDefined()
      expect(deepFile?.size).toBe(24680)
    })

    it('找不到的路径应返回null', () => {
      const { getFileNode } = useFileTreeStore.getState()
      
      expect(getFileNode('nonexistent/path.ts')).toBeNull()
    })
  })

  describe('getFileCount', () => {
    it('应该返回文件树中的总文件数', () => {
      const { getFileCount } = useFileTreeStore.getState()
      
      const count = getFileCount()
      expect(count).toBeGreaterThan(0)
      expect(typeof count).toBe('number')
    })

    it('创建新文件后数量应该增加', () => {
      const { getFileCount, createFile } = useFileTreeStore.getState()
      const before = getFileCount()
      
      createFile('src/app', 'count-test.ts')
      
      expect(getFileCount()).toBe(before + 1)
    })
  })

  describe('getTotalSize', () => {
    it('应该返回所有文件的总大小', () => {
      const { getTotalSize } = useFileTreeStore.getState()
      
      const size = getTotalSize()
      expect(size).toBeGreaterThan(0)
      expect(typeof size).toBe('number')
    })
  })

  describe('getVersionCount', () => {
    it('应该返回指定文件的版本数量', () => {
      const { saveVersion, getVersionCount } = useFileTreeStore.getState()
      
      expect(getVersionCount('count-test.ts')).toBe(0)
      
      saveVersion('count-test.ts', 'v1')
      saveVersion('count-test.ts', 'v2')
      saveVersion('count-test.ts', 'v3')
      
      expect(getVersionCount('count-test.ts')).toBe(3)
    })
  })
})

describe('FileTreeStore - 工作区配置', () => {
  beforeEach(() => {
    useFileTreeStore.setState({
      workspace: { rootPath: '~/default', name: 'Default Project', createdAt: Date.now() },
    })
  })

  describe('setWorkspace', () => {
    it('应该更新工作区配置', () => {
      const { setWorkspace } = useFileTreeStore.getState()
      
      setWorkspace({ name: 'Updated Project' })
      
      expect(useFileTreeStore.getState().workspace.name).toBe('Updated Project')
    })

    it('应该支持部分更新', () => {
      const { setWorkspace } = useFileTreeStore.getState()
      const originalName = useFileTreeStore.getState().workspace.name
      
      setWorkspace({ rootPath: '/new/path' })
      
      const ws = useFileTreeStore.getState().workspace
      expect(ws.rootPath).toBe('/new/path')
      expect(ws.name).toBe(originalName)
    })
  })
})

describe('FileTreeStore - 边界情况处理', () => {
  it('在根目录创建文件应该正常工作', () => {
    const { createFile, getFileNode } = useFileTreeStore.getState()
    
    createFile('.', 'root-file.txt')
    
    expect(getFileNode('./root-file.txt')).toBeDefined()
  })

  it('移动文件到自身所在目录不应该出错', () => {
    const { moveNode, getFileNode } = useFileTreeStore.getState()
    
    moveNode('src/app/App.tsx', 'src/app')
    
    expect(getFileNode('src/app/App.tsx')).toBeDefined()
  })

  it('大量版本保存应该限制在500个以内', () => {
    const { saveVersion, getVersions } = useFileTreeStore.getState()
    
    for (let i = 0; i < 600; i++) {
      saveVersion('limit-test.ts', `content version ${i}`)
    }
    
    const allVersions = useFileTreeStore.getState().versions
    expect(allVersions.length).toBeLessThanOrEqual(500)
  })

  it('特殊字符的文件名应该正常处理', () => {
    const { createFile, getFileNode } = useFileTreeStore.getState()
    
    createFile('src/app', 'special-file.test.js')
    
    const node = getFileNode('src/app/special-file.test.js')
    expect(node).toBeDefined()
    expect(node?.name).toBe('special-file.test.js')
  })
})
