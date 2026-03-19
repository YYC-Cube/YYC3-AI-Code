---
@file: Guidelines.md
@description: YYC³ Multi-Panel Low-Code Designer 设计指南，包含五高五标五化设计原则、核心交互架构、UI/UX 设计描述等
@author: YanYuCloudCube Team <admin@0379.email>
@version: v1.0.0
@created: 2026-03-19
@updated: 2026-03-19
@status: dev
@tags: design,guidelines,architecture,critical,zh-CN
@category: design
@language: zh-CN
@audience: developers,designers
@complexity: advanced
@design_type: architecture
@review_status: approved
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

**Multi‑Panel guidelines**
<!--

**项目名称**：Multi‑Panel Low‑Code Designer（多联式低码设计器）  
**核心口号**：**设计即代码·配置即部署**  
**目标用户**：产品/交互设计师、前端/全栈开发者、企业内部工具团队（本地自用）  
**交付形态**：一套 **Figma AI 设计指南 + 可直接落地的前端/后端实现模板**，兼容 **宿主机本地存储 + 本地数据库管理 + OpenAI 统一认证**。

---

## 1️⃣ 五高‑五标‑五化 设计原则  

**高性能**
采用增量渲染 + 虚拟化列表，保证拖拽/预览毫秒级响应

**标准化组件**
统一 `ComponentSpec`（属性、事件、数据Schema）

**自动化**
所有 UI → JSON Schema → 代码生成全链路自动化

**高灵活**
多面板自由组合、任意嵌套、动态合并/拆分

**模块化**
组件、布局、插件均以 npm 包/微前端形式发布

**可视化**
所有业务流程、数据流、权限在编辑器中以图谱方式展示

**高可扩展**
插件体系（拖拽库、图表库、表单库）可热加载

**高可靠**
本地持久化 + 宿主机云同步双写，防止数据丢失

**可测试**
自动生成单元/快照测试脚本（Jest + Playwright）

**智能化**
AI 助手（OpenAI）提供属性建议、代码片段、错误诊断

**高安全**
OpenAI OAuth + 本地 JWT 双认证，细粒度 RBAC

**可文档化**
自动生成交互文档（MDX/Storybook）

**高安全**
OpenAI OAuth + 本地 JWT 双认证，细粒度 RBAC

**可文档化**
自动生成交互文档（MDX/Storybook）

**平台化**
统一插件市场、模板市场、模板审计系统

---

## 2️⃣ 核心交互架构  

```
+-------------------+      +-------------------+      +-----------------------+
|   Multi‑Panel UI  | <--> |   Real‑Time Sync  | <--> |   Low‑Code Engine      |
|（拖拽/合并/分割）  |      |（WebSocket/CRDT）|      |（JSON → React/Vue）    |
+-------------------+      +-------------------+      +-----------------------+
          ^                         ^                           ^
          |                         |                           |
          |                         |                           |
+-------------------+      +-------------------+      +-----------------------+
|   OpenAI AI‑Assist| <--->|   Auth & RBAC    | <--->|   Local DB Manager    |
|（属性/代码建议） |      |（OpenID Connect）|      |（SQLite / MySQL）     |
+-------------------+      +-------------------+      +-----------------------+
```

* **Multi‑Panel UI**：基于 `react‑grid‑layout` + `react‑dnd` 实现自由拖拽/缩放/合并；面板之间可以 **嵌套**、**拆分**、**合并**，每个面板拥有独立的 **Viewport**（实时预览）和 **Config**（属性面板）。
* **Real‑Time Sync**：采用 **CRDT + WebSocket**（`yjs` + `y-websocket`）实现多人协同，且本地首写（IndexedDB）+ 宿主机同步（REST API）双写，确保离线也能编辑。
* **Low‑Code Engine**：编辑器输出统一的 **Design JSON**，随后通过 **Code Generator**（模板化 `Handlebars` + AST 转换）生成 **React/Vue/Angular** 代码；同时输出 **Schema、Storybook、Playwright** 等产出，实现 **设计即代码**。
* **OpenAI AI‑Assist**：通过 OpenAI `gpt‑4o-mini`（或企业版）提供：
  * **属性智能补全**（例如：放置一个 `Table` 时自动推荐列字段、分页模式）；
  * **代码片段**（基于当前设计生成对应 JSX/TSX）；
  * **错误诊断**（实时检查布局冲突、属性缺失）；
  * **文档生成**（一键生成 Markdown/MDX）；
* **Auth & RBAC**：统一使用 **OpenID Connect**（OpenAI 账户或企业 IdP）获取 **JWT**，在前端通过 `react‑router` Guard、后端中间件进行细粒度 **角色/权限** 校验。  

---

## 3️⃣ 完整 UI/UX 设计描述  

### 3.1 页面结构（多联式面板系统）

| 区域 | 名称 | 功能 | 交互要点 |
|---|---|---|---|
| **左侧工具栏** | `Component Palette` | 列出 **基础组件**（按钮、表单、图表、表格、媒体）<br>**高级插件**（地图、Workflow、Markdown） | 拖拽至任意面板；长按显示 **属性 AI 推荐** |
| **顶部导航** | `Global Toolbar` | 项目切换、保存/发布、预览切换、AI Assist、主题切换 | 快捷键（⌘S 保存、⌘P 预览） |
| **中间工作区** | `Panel Canvas` | 多面板容器（支持 **水平/垂直** 分割、**自由拖拽**、**合并**） | 1️⃣ 拖拽组件到面板 2️⃣ 边缘捕捉（Snap） 3️⃣ 双击面板进入 **子画布** 4️⃣ 右键 → “合并/拆分” |
| **右侧属性面板** | `Inspector` | 实时显示选中组件/面板的 **属性表**（JSON Schema）<br>AI 属性建议卡片 | **即时预览**：属性变化自动同步到对应面板的预览 |
| **底部状态栏** | `Footer` | 连接状态、CRDT 同步信息、AI 消耗统计 | 颜色指示（绿=已同步、黄=待同步、红=冲突） |

#### 3.2 面板交互细节

1. **新增面板**：在 Canvas 任意空白处右键 → “新增面板”。弹出 **面板模板**（`空白/表单/表格/自定义HTML`）供选择。  
2. **拖拽合并**：将一个面板拖至另一个面板边缘，出现 **合并指示**（半透明遮罩），松手完成 **双向合并**（父子关系）。合并后父面板可通过 **Tab 切换子面板**。  
3. **拆分面板**：选中面板 → “拆分为水平/垂直 2/3/4 区”。系统自动创建相同宽高的 **子面板**，并把原有组件均匀分配。  
4. **实时预览**：每个面板内部嵌入 **iframe**（sandbox）渲染当前 **Design JSON** 的子树；属性面板的每一次编辑都会触发 **debounce（300ms）** 的 **Diff → Patch → iframe reload**。  
5. **快捷键**：  
   - `Ctrl + D` / `⌘ + D`：复制当前选中组件或面板  
   - `Ctrl + G` / `⌘ + G`：分组/解组  
   - `Alt + ↑/↓/←/→`：精准像素移动（5px 步进）  
   - `F1`：打开 **AI Assist** 对话框  

### 3.3 低码智能开发能力

| 功能 | 说明 | 实现要点 |
|---|---|---|
| **Design JSON** | 所有组件、布局、属性均序列化为统一的 **JSON Schema**（`design.json`） | 使用 **Zod** 定义严格校验模型；每次保存即生成 `design.json` |
| **代码生成** | 通过 **Handlebars** + **AST（Babel）** 将 `design.json` 转化为 **React (TSX)**、**Vue (SFC)**、**Angular (HTML + TS)** 三套代码 | 1️⃣ 读取组件库的 **Code Template**（`.hbs`）<br>2️⃣ 替换属性、事件<br>3️⃣ 生成 **路由、状态（zustand/recoil）** |
| **配置即部署** | 生成的项目结构直接放入 **宿主机**（Docker Volume），容器启动后自动执行 `npm install && npm run build && npm run start` | 在 **docker‑compose.yml** 中挂载 `./design.json` → `/app/design.json`；容器内 `watcher` 实时监听并热更新 |
| **数据库管理** | 组件（如 Table、Form）可以 **绑定本地数据库表**（SQLite / MySQL），编辑器提供 **Schema Explorer**；CRUD API 自动生成（NestJS / Fastify） | 通过 **Prisma** 读取本地 DB schema → 生成 **OpenAPI** → 前端自动生成 **useQuery / useMutation** |
| **OpenAI 统一认证** | 登录后获取 **OpenAI OAuth** token；所有 AI 请求统一走 **/api/ai-proxy**，后端统一转发并计量 | 采用 **Passport‑OpenIDConnect**，在后端缓存 token 并统一注入 `Authorization: Bearer xxx` |

---

## 4️⃣ 技术实现逻辑  

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

### 4.2 后端技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| **运行时** | Node.js 20 + TypeScript | 主体 API |
| **Web 框架** | Fastify + `fastify‑websocket` | 轻量、低延迟 |
| **实时协同** | `y-websocket` **server** | 同步 yjs 文档 |
| **数据库** | SQLite（开发/本地） + MySQL（企业） | 通过 Prisma ORM |
| **认证** | `passport-openidconnect` + `jsonwebtoken` | OpenAI OAuth + JWT |
| **AI 代理** | Express 中间件 `/api/ai-proxy` | 统一计量、错误包装 |
| **代码生成** | `handlebars` + `prisma‑generator‑typescript` | 生成后端 CRUD、OpenAPI |
| **容器化** | Docker Compose（frontend, backend, db, yjs‑ws） | 一键部署 |

#### 示例：Fastify + y‑websocket

```ts
// src/server.ts
import Fastify from 'fastify';
import websocketPlugin from '@fastify/websocket';
import { setupWSConnection } from 'y-websocket/bin/utils.js';
import { prisma } from './prisma';

const app = Fastify({ logger: true });

app.register(websocketPlugin, {
  handle: (conn, req) => {
    // 只允许已认证的用户进入 ws
    const token = req.headers['authorization']?.split(' ')[1];
    // 验证 token -> userId ...
    setupWSConnection(conn, req, { gc: true });
  },
});

app.get('/api/design/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  const design = await prisma.design.findUnique({ where: { id } });
  return design;
});

// AI Proxy
app.post('/api/ai-proxy', async (req, res) => {
  const { prompt, stream } = req.body as { prompt: string; stream?: boolean };
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      stream,
    }),
  });
  // 直接 pipe 给前端
  if (stream) {
    res.raw.writeHead(200, { 'Content-Type': 'text/event-stream' });
    response.body?.pipe(res.raw);
  } else {
    const data = await response.json();
    res.send(data);
  }
});

app.listen({ port: 3000, host: '0.0.0.0' }, err => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
```

### 4.3 数据模型（Prisma 示例）

```prisma
model Design {
  id          String   @id @default(uuid())
  name        String
  json        Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
}

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  name        String?
  openaiId    String   @unique
  role        Role     @default(USER)
  designs     Design[]
}

enum Role {
  ADMIN
  USER
}
```

> **Design JSON** 结构示例（简化）  
```json
{
  "panels": [
    {
      "id": "p1",
      "type": "container",
      "layout": { "x": 0, "y": 0, "w": 6, "h": 10 },
      "children": [
        { "id": "c1", "type": "Button", "props": { "label": "提交", "variant": "primary" } },
        { "id": "c2", "type": "Table", "props": { "source": "local:users", "pageSize": 20 } }
      ]
    }
  ],
  "theme": "light",
  "metadata": { "project": "内部报表系统", "version": "1.0.0" }
}
```

### 4.4 代码生成流程（伪代码）

```tsx
// generate.ts
import { readFileSync, writeFileSync } from 'fs';
import Handlebars from 'handlebars';
import prettier from 'prettier';

// 读取模板
const tmpl = readFileSync('templates/react-component.hbs', 'utf-8');
const compile = Handlebars.compile(tmpl);

// 读取 design.json
const design = JSON.parse(readFileSync('design.json', 'utf-8'));

// 递归遍历生成组件
function genComponent(node: any): string {
  const { type, props, children = [] } = node;
  const childCodes = children.map(genComponent).join('\n');
  return compile({ type, props, children: childCodes });
}

// 生成入口文件
const appCode = `
import React from 'react';
import { ThemeProvider } from '@/theme';
${design.panels.map(p => `import ${p.id} from './${p.id}';`).join('\n')}

export const App = () => (
  <ThemeProvider theme="${design.theme}">
    ${design.panels.map(p => `<${p.id} />`).join('\n')}
  </ThemeProvider>
);
`;

writeFileSync('src/App.tsx', prettier.format(appCode, { parser: 'typescript' }));
```

> **模板 `react-component.hbs`**（简化）  
```hbs
{{#if (eq type "container")}}
<div style={{json layout}}>
  {{{children}}}
</div>
{{else if (eq type "Button")}}
<button {{#each props}} {{@key}}="{{this}}"{{/each}} />
{{else if (eq type "Table")}}
<Table source="{{props.source}}" pageSize="{{props.pageSize}}" />
{{/if}}
```

---

## 5️⃣ 本地自用‑宿主机存储方案

| 步骤 | 操作 |
|---|---|
| **1️⃣ 初始化宿主机** | `docker compose up -d`（包括 `frontend`, `backend`, `db`, `yjs`） |
| **2️⃣ 项目挂载** | 本地目录 `./my‑designs` 挂载到容器 `/app/designs`，编辑器自动把 `design.json` 写入该目录；后端实时读取并生成代码。 |
| **3️⃣ 本地数据库** | 默认使用 SQLite (`./data/db.sqlite`)；需要企业 MySQL 时修改 `docker-compose.yml` 的 `environment` 并在 Prisma `datasource` 中切换。 |
| **4️⃣ OpenAI 认证** | 在宿主机 `.env` 中配置 `OPENAI_CLIENT_ID`, `OPENAI_CLIENT_SECRET`；首次登录会弹出 OAuth 窗口，成功后 token 会保存在宿主机的密钥库（`keytar`）中。 |
| **5️⃣ 自动部署** | 宿主机监控 `designs/*.json`，一旦变更触发 `npm run build && npm run start`（容器内部），实现 **配置即部署**。 |

---

## 6️⃣ Figma AI 设计指南  

### 6.1 组件命名规范（Figma → 代码映射）

| Figma 图层名称 | 对应代码文件 | 备注 |
|---|---|---|
| `Btn/Primary` | `ButtonPrimary.tsx` | 前缀表示组件类别 + 变体 |
| `Tbl/UserList` | `TableUserList.tsx` | 自动生成 `Table` + 数据源 |
| `Frm/Login` | `FormLogin.tsx` | 包含 `Input`, `Checkbox`，自动生成 Yup/Zod 验证 |
| `Panel/Analytics` | `PanelAnalytics.tsx` | 容器面板，内部可再嵌套子组件 |

### 6.2 交互标注（Interaction）

| 标注类型 | Figma 操作 | 自动生成的属性 |
|---|---|---|
| **Click → Open Modal** | `Prototype → On Click → Open` | `onClick={() => openModal('xxx')}` |
| **Hover → Tooltip** | `Prototype → On Hover → Show` | `title="..."` （自动转为 Tooltip 组件） |
| **Data Bind** | `右键 → Bind Data → Table` | `source="local:users"` |
| **AI 推荐** | `右键 → AI Suggest → Props` | `AI 填充 props`（在 `Inspector` 中出现） |

### 6.3 颜色/文字系统

| 系统 | Figma 变量名 | 代码变量 |
|---|---|---|
| 主色 | `--color-primary` | `theme.colors.primary` |
| 背景 | `--color-bg` | `theme.colors.background` |
| 文本大小 | `--font-size-base` | `theme.fontSize.base` |

> **建议**：在 Figma 中使用 **Design Tokens**（`File → Tokens`）管理上述变量，插件会自动同步到 `tailwind.config.js`。

### 6.4 AI 交互第一段提示词（Figma Plugin）

```text
You are a UI/UX design assistant integrated into Figma.
Your task is to help the designer quickly turn selected layers into
low‑code components that can be exported to a React/Vue/Angular project.

When the user selects a layer and types "/ai", respond with:
1️⃣ A concise component name following the naming convention.
2️⃣ A JSON schema of the component’s props (including default values).
3️⃣ Optional code snippet (TSX) that renders the component based on the schema.
4️⃣ Any recommended Tailwind utility classes for layout and styling.

Always respect the existing design tokens (colors, spacing, typography) in the file.
If the layer is a container (frame) containing child components, suggest a
Panel component with a flexible layout (grid/flex) and list its child component
names.

Example response:
---
Component: CardFeature
PropsSchema: {
  "title": "string",
  "subtitle": "string",
  "imageSrc": "string",
  "ctaLabel": "string",
  "ctaLink": "url"
}
Snippet:
```tsx
export const CardFeature = ({title, subtitle, imageSrc, ctaLabel, ctaLink}) => (
  <div className="rounded-lg overflow-hidden shadow-sm bg-white">
    <img src={imageSrc} className="w-full h-48 object-cover" />
    <div className="p-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
      <a href={ctaLink} className="mt-2 inline-block text-primary hover:underline">
        {ctaLabel}
      </a>
    </div>
  </div>
);
```
---
```

> 把以上文本拷贝到 **Figma 插件的 Prompt** 输入框，即可让 AI 按照统一规则输出组件代码。

---

## 7️⃣ 部署/运行手册（一键脚本）

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/multi-panel-lowcode.git
cd multi-panel-lowcode

# 2. 创建 .env（示例）
cat > .env <<EOF
# 前端
VITE_OPENAI_CLIENT_ID=xxxx
VITE_OPENAI_REDIRECT_URI=http://localhost:3000/auth/callback

# 后端
OPENAI_CLIENT_ID=xxxx
OPENAI_CLIENT_SECRET=xxxx
OPENAI_API_KEY=sk-xxxx
DATABASE_URL="file:./data/db.sqlite"
JWT_SECRET="super-secret-key"
EOF

# 3. 构建并启动 Docker Compose
docker compose up -d --build

# 4. 打开浏览器访问
open http://localhost:5173   # 前端
open http://localhost:3000   # 后端 API（Swagger）

# 5. 第一次登录后，系统会自动创建本地 DB、生成默认项目
# 6. 在 UI 中拖拽、编辑、实时预览 → 保存 → "部署" 按钮会触发容器内 `npm run build && npm start`

# 7. 如需切换到 MySQL（生产）
#   修改 docker-compose.yml 中 db 服务为 mysql，更新 .env DATABASE_URL 为 mysql://user:pwd@db:3306/dbname
#   再次运行 `docker compose up -d`
```

---

## 8️⃣ 质量保障（测试 & CI）

| 类型 | 工具 | 说明 |
|---|---|---|
| 单元测试 | Jest + React Testing Library | 组件渲染、属性变更、AI 参数 |
| 快照测试 | Storybook + Chromatic | 自动生成 UI 快照，确保拖拽后布局一致 |
| 集成测试 | Playwright | 端到端：拖拽 → 属性编辑 → 实时预览 → 保存 → 代码生成 → 部署 |
| 代码风格 | ESLint + Prettier | 强制统一代码风格 |
| CI/CD | GitHub Actions → `npm ci && npm test && docker build` | PR 合并前自动跑全套测试并构建镜像 |

---

## 9️⃣ 常见问题快速排查

| 场景 | 可能原因 | 排查办法 |
|---|---|---|
| 拖拽后面板位置错位 | `react-grid-layout` 缓存未刷新 | 打开 **开发者工具 → Console**，执行 `window.dispatchEvent(new Event('resize'))` |
| 实时预览不更新 | 属性面板的 **debounce** 超时或 `yjs` 同步失败 | 检查网络 `WebSocket` 是否保持 101 状态；查看 `yjs` 文档版本 |
| AI 助手返回 429 | OpenAI 配额耗尽 | 登录 OpenAI 账号检查配额；或在 `.env` 中配置 `OPENAI_API_KEY` 为付费密钥 |
| 数据库连接失败 | 本地 SQLite 被锁或 MySQL 容器未启动 | 查看 `docker logs db`；若使用 SQLite 删除 `data/*.lock` 文件 |
| 登录后 token 失效 | JWT 过期时间太短 | 在后端 `.env` 中调高 `JWT_EXPIRES_IN=7d` |

---

-->
