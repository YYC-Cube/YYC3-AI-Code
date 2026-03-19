4️⃣ 技术实现逻辑  

### 4.1 前端技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| **框架** | React 18 + TypeScript | 主体 UI、Hooks、Concurrent Mode |
| **布局** | `react-grid-layout` + `react-dnd` | 多面板拖拽、网格化布局 |
| **实时协同** | `yjs` + `y-websocket` | CRDT 基于文档模型的多用户同步 |
| **状态管理** | `zustand` + `immer` | 轻量级、可持久化（localStorage / IndexedDB） |
| **表单/验证** | `react-hook-form` + `zod` | 与 Design JSON 严格对齐 |
| **AI 助手** | 自定义 `useOpenAIAssist` Hook（Axios -> /api/ai-proxy） | 支持流式（Server‑Sent Events） |
| **代码生成预览** | `monaco-editor`（内嵌 VSCode） + `@babel/standalone` | 直接在浏览器中展示生成代码、支持一键复制 |
| **主题** | `tailwindcss` + `css-vars` | 运行时主题切换（暗/亮） |
| **打包** | Vite 5 | 快速 HMR、原生 ESModules |

#### 示例：面板拖拽 & 合并（React + Grid + DnD）

```tsx
// PanelContainer.tsx
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useStore } from '@/store';
import { Panel } from './Panel';
import { useDrop } from 'react-dnd';

const GridLayout = WidthProvider(Responsive);

export const PanelContainer = () => {
  const { panels, movePanel, mergePanel } = useStore();
  const [{ isOver, canMerge }, dropRef] = useDrop({
    accept: 'PANEL',
    canDrop: (item: DragItem) => {
      // 只能合并到同层级或者父层级
      return item.id !== item.target?.id;
    },
    drop: (item: DragItem, monitor) => {
      if (monitor.isOver({ shallow: true }) && canMerge) {
        mergePanel(item.id, item.target?.id!);
      } else {
        movePanel(item.id, monitor.getClientOffset()!);
      }
    },
    collect: (m) => ({
      isOver: m.isOver(),
      canMerge: m.canDrop(),
    }),
  });

  return (
    <div ref={dropRef} className="h-full w-full relative">
      <GridLayout
        className="layout"
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        isDraggable={false}
        draggableHandle=".panel-drag-handle"
        layout={panels.map(p => ({
          i: p.id,
          x: p.x,
          y: p.y,
          w: p.w,
          h: p.h,
          static: false,
        }))}
      >
        {panels.map(p => (
          <div key={p.id} data-grid={p}>
            <Panel panel={p} />
          </div>
        ))}
      </GridLayout>
    </div>
  );
};
```
