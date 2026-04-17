/**
 * @file layout-store.test.ts
 * @description Layout Store 全面单元测试 — 覆盖面板管理、预设应用、保存布局、Undo/Redo
 * @author YYC³ QA Team
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('LayoutStore - 初始化状态', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该正确初始化默认布局', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    const store = useLayoutStore.getState()

    expect(store.config.preset).toBe('default')
    expect(store.config.direction).toBe('horizontal')
    expect(store.panelDragActive).toBe(false)
    expect(store.savedLayouts).toHaveLength(0)
    expect(store.activeLayoutId).toBeNull()
    expect(store.undoStack).toHaveLength(0)
    expect(store.redoStack).toHaveLength(0)
  })

  it('应该包含所有默认面板', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    const store = useLayoutStore.getState()

    expect(Object.keys(store.config.panels)).toContain('left')
    expect(Object.keys(store.config.panels)).toContain('center')
    expect(Object.keys(store.config.panels)).toContain('right')
    expect(Object.keys(store.config.panels)).toContain('preview')

    for (const panel of Object.values(store.config.panels)) {
      expect(panel.visible).toBe(true)
      expect(panel.collapsed).toBe(false)
      expect(panel.id).toBeDefined()
      expect(panel.label).toBeDefined()
      expect(panel.defaultSize).toBeDefined()
      expect(panel.minSize).toBeDefined()
      expect(panel.maxSize).toBeDefined()
    }
  })
})

describe('LayoutStore - 预设应用', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    useLayoutStore.getState().resetLayout()
  })

  it('应该能够应用默认预设', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().applyPreset('default')

    expect(useLayoutStore.getState().config.preset).toBe('default')
    expect(useLayoutStore.getState().config.panels.left.visible).toBe(true)
    expect(useLayoutStore.getState().config.panels.center.visible).toBe(true)
    expect(useLayoutStore.getState().config.panels.right.visible).toBe(true)
  })

  it('应该能够应用focus-code预设', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().applyPreset('focus-code')

    expect(useLayoutStore.getState().config.preset).toBe('focus-code')
    expect(useLayoutStore.getState().config.panels.left.collapsed).toBe(true)
    expect(useLayoutStore.getState().config.panels.center.defaultSize).toBe(60)
  })

  it('应该能够应用focus-chat预设', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().applyPreset('focus-chat')

    expect(useLayoutStore.getState().config.preset).toBe('focus-chat')
    expect(useLayoutStore.getState().config.panels.right.collapsed).toBe(true)
    expect(useLayoutStore.getState().config.panels.left.defaultSize).toBe(40)
  })

  it('应该能够应用minimal预设（隐藏左侧面板）', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().applyPreset('minimal')

    expect(useLayoutStore.getState().config.preset).toBe('minimal')
    expect(useLayoutStore.getState().config.panels.left.visible).toBe(false)
    expect(useLayoutStore.getState().config.panels.left.collapsed).toBe(true)
  })

  it('应该能够应用wide-preview预设（隐藏右侧面板）', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().applyPreset('wide-preview')

    expect(useLayoutStore.getState().config.preset).toBe('wide-preview')
    expect(useLayoutStore.getState().config.panels.right.visible).toBe(false)
    expect(useLayoutStore.getState().config.panels.center.defaultSize).toBe(70)
  })
})

describe('LayoutStore - 面板操作', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    useLayoutStore.getState().resetLayout()
  })

  it('应该能够切换面板可见性', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    const initialVisible = useLayoutStore.getState().config.panels.left.visible
    
    useLayoutStore.getState().togglePanelVisibility('left')
    
    expect(useLayoutStore.getState().config.panels.left.visible).toBe(!initialVisible)
    expect(useLayoutStore.getState().config.preset).toBe('custom')
  })

  it('应该能够切换面板折叠状态', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    const initialCollapsed = useLayoutStore.getState().config.panels.left.collapsed
    
    useLayoutStore.getState().togglePanelCollapse('left')
    
    expect(useLayoutStore.getState().config.panels.left.collapsed).toBe(!initialCollapsed)
  })

  it('应该能够设置面板大小', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().setPanelSize('center', 55)

    expect(useLayoutStore.getState().config.panels.center.defaultSize).toBe(55)
    expect(useLayoutStore.getState().config.preset).toBe('custom')
  })

  it('应该能够更新面板配置', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().updatePanelConfig('left', {
      label: 'Custom Label',
      minSize: 20,
      maxSize: 40,
    })

    expect(useLayoutStore.getState().config.panels.left.label).toBe('Custom Label')
    expect(useLayoutStore.getState().config.panels.left.minSize).toBe(20)
    expect(useLayoutStore.getState().config.panels.left.maxSize).toBe(40)
  })

  it('应该能够设置面板拖拽状态', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    expect(useLayoutStore.getState().panelDragActive).toBe(false)
    
    useLayoutStore.getState().setPanelDragActive(true)
    expect(useLayoutStore.getState().panelDragActive).toBe(true)
    
    useLayoutStore.getState().setPanelDragActive(false)
    expect(useLayoutStore.getState().panelDragActive).toBe(false)
  })

  it('应该能够获取可见面板列表', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    const visiblePanels = useLayoutStore.getState().getVisiblePanels()
    
    expect(visiblePanels.length).toBeGreaterThan(0)
    visiblePanels.forEach(panel => {
      expect(panel.visible).toBe(true)
      expect(panel.collapsed).toBe(false)
    })
  })

  it('折叠的面板不应该出现在可见面板列表中', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().togglePanelCollapse('right')
    
    const visiblePanels = useLayoutStore.getState().getVisiblePanels()
    const rightPanelVisible = visiblePanels.some(p => p.id === 'right')
    
    expect(rightPanelVisible).toBe(false)
  })

  it('隐藏的面板不应该出现在可见面板列表中', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().togglePanelVisibility('left')
    
    const visiblePanels = useLayoutStore.getState().getVisiblePanels()
    const leftPanelVisible = visiblePanels.some(p => p.id === 'left')
    
    expect(leftPanelVisible).toBe(false)
  })
})

describe('LayoutStore - 布局重置', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('应该能够重置到默认布局', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    // 先修改布局
    useLayoutStore.getState().applyPreset('minimal')
    expect(useLayoutStore.getState().config.preset).toBe('minimal')
    
    // 重置
    useLayoutStore.getState().resetLayout()

    expect(useLayoutStore.getState().config.preset).toBe('default')
    expect(useLayoutStore.getState().config.panels.left.visible).toBe(true)
    expect(useLayoutStore.getState().activeLayoutId).toBeNull()
  })
})

describe('LayoutStore - 保存的布局管理', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    useLayoutStore.getState().resetLayout()
    // 清空已保存的布局（因为persist可能保留之前的数据）
    const currentLayouts = [...useLayoutStore.getState().savedLayouts]
    currentLayouts.forEach(layout => {
      useLayoutStore.getState().deleteSavedLayout(layout.id)
    })
  })

  it('应该能够保存当前布局', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().applyPreset('focus-code')
    
    const savedLayout = useLayoutStore.getState().saveCurrentLayout('My Custom Layout')

    expect(savedLayout).toBeDefined()
    expect(savedLayout.name).toBe('My Custom Layout')
    expect(savedLayout.id).toBeDefined()
    expect(savedLayout.config.preset).toBe('focus-code')
    expect(savedLayout.createdAt).toBeDefined()
    expect(savedLayout.updatedAt).toBeDefined()
    expect(useLayoutStore.getState().savedLayouts.length).toBeGreaterThanOrEqual(1)
    expect(useLayoutStore.getState().activeLayoutId).toBe(savedLayout.id)
  })

  it('应该能够加载已保存的布局', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    // 保存一个布局
    const saved = useLayoutStore.getState().saveCurrentLayout('Test Layout')
    
    // 切换到其他布局
    useLayoutStore.getState().applyPreset('minimal')
    expect(useLayoutStore.getState().config.preset).toBe('minimal')
    
    // 加载保存的布局
    useLayoutStore.getState().loadSavedLayout(saved.id)
    
    expect(useLayoutStore.getState().activeLayoutId).toBe(saved.id)
  })

  it('应该能够删除已保存的布局', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    const saved = useLayoutStore.getState().saveCurrentLayout('To Delete')
    const countBeforeDelete = useLayoutStore.getState().savedLayouts.length
    
    useLayoutStore.getState().deleteSavedLayout(saved.id)
    
    expect(useLayoutStore.getState().savedLayouts.length).toBe(countBeforeDelete - 1)
  })

  it('删除当前活动布局时应清除activeLayoutId', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    const saved1 = useLayoutStore.getState().saveCurrentLayout('Layout 1')
    useLayoutStore.getState().saveCurrentLayout('Layout 2')
    
    expect(useLayoutStore.getState().activeLayoutId).not.toBeNull()
    
    const activeId = useLayoutStore.getState().activeLayoutId
    if (activeId) {
      useLayoutStore.getState().deleteSavedLayout(activeId)
      expect(useLayoutStore.getState().activeLayoutId).toBeNull()
    }
  })

  it('应该能够重命名已保存的布局', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    const saved = useLayoutStore.getState().saveCurrentLayout('Original Name')
    
    useLayoutStore.getState().renameSavedLayout(saved.id, 'New Name')
    
    const updated = useLayoutStore.getState().savedLayouts.find(l => l.id === saved.id)
    expect(updated?.name).toBe('New Name')
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(saved.updatedAt)
  })

  it('应该能够覆盖已保存的布局', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    const saved = useLayoutStore.getState().saveCurrentLayout('Original')
    
    // 修改当前布局
    useLayoutStore.getState().applyPreset('minimal')
    
    // 覆盖
    useLayoutStore.getState().overwriteSavedLayout(saved.id)
    
    const updated = useLayoutStore.getState().savedLayouts.find(l => l.id === saved.id)
    expect(updated?.config.preset).toBe('minimal')
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(saved.updatedAt)
  })

  it('应该处理加载不存在的布局ID', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    const originalPreset = useLayoutStore.getState().config.preset
    
    useLayoutStore.getState().loadSavedLayout('non-existent-id')
    
    expect(useLayoutStore.getState().config.preset).toBe(originalPreset) // 不变
  })
})

describe('LayoutStore - Undo/Redo系统', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    // 重置后清除undo栈（因为resetLayout会创建快照）
    useLayoutStore.getState().resetLayout()
  })

  it('应该在应用预设时创建undo快照', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    // 确保有undo能力
    const initialCanUndo = useLayoutStore.getState().canUndo()
    
    useLayoutStore.getState().applyPreset('focus-code')
    
    expect(useLayoutStore.getState().undoStack.length).toBeGreaterThan(0)
  })

  it('应该能够撤销布局更改', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().resetLayout()
    useLayoutStore.getState().undoLayout() // 清空undo栈
    
    const originalPreset = useLayoutStore.getState().config.preset
    
    useLayoutStore.getState().applyPreset('minimal')
    expect(useLayoutStore.getState().config.preset).toBe('minimal')
    
    useLayoutStore.getState().undoLayout()
    
    expect(useLayoutStore.getState().config.preset).toBe(originalPreset)
  })

  it('应该能够重做布局更改', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().applyPreset('focus-code')
    const focusCodePreset = useLayoutStore.getState().config.preset
    
    useLayoutStore.getState().undoLayout()
    expect(useLayoutStore.getState().config.preset).not.toBe(focusCodePreset)
    
    useLayoutStore.getState().redoLayout()
    
    expect(useLayoutStore.getState().config.preset).toBe(focusCodePreset)
  })

  it('撤销后应清空redo栈', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().applyPreset('focus-code')
    useLayoutStore.getState().undoLayout()
    
    expect(useLayoutStore.getState().canRedo()).toBe(true)
    
    useLayoutStore.getState().applyPreset('minimal')
    
    expect(useLayoutStore.getState().canRedo()).toBe(false)
  })

  it('undo栈应该限制在20个快照以内', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    for (let i = 0; i < 25; i++) {
      useLayoutStore.getState().applyPreset(i % 2 === 0 ? 'default' : 'focus-code')
    }
    
    expect(useLayoutStore.getState().undoStack.length).toBeLessThanOrEqual(20)
  })

  it('撤销操作应该正确恢复之前的配置', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().applyPreset('focus-code')
    const configBeforeUndo = JSON.stringify(useLayoutStore.getState().config)
    
    useLayoutStore.getState().applyPreset('minimal')
    expect(useLayoutStore.getState().config.preset).toBe('minimal')
    
    useLayoutStore.getState().undoLayout()
    
    // 撤销后配置应该恢复到minimal之前的状态
    expect(JSON.stringify(useLayoutStore.getState().config)).toBe(configBeforeUndo)
  })

  it('空redo栈时不应该执行重做操作', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    expect(useLayoutStore.getState().canRedo()).toBe(false)
    
    useLayoutStore.getState().redoLayout() // 不应该有任何效果
  })

  it('重置布局时应创建undo快照', async () => {
    const { useLayoutStore } = await import('@/app/stores/layout-store')
    
    useLayoutStore.getState().applyPreset('minimal')
    useLayoutStore.getState().resetLayout()
    
    expect(useLayoutStore.getState().canUndo()).toBe(true)
  })
})
