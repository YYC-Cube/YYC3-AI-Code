/**
 * @file routes.tsx
 * @description YYC3 应用路由配置 — 首页 / Designer / AI Code / AI Generator 四大入口（全部路由级 lazy loading）
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.3.0
 * @created 2026-03-08
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags router,routes,navigation,app,error-boundary,lazy-loading
 */

import { lazy, Suspense } from 'react';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createBrowserRouter } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingPage } from './components/LoadingPage';

const AIHomePage = lazy(() =>
  import('./components/home/AIHomePage').then(m => ({ default: m.AIHomePage }))
);

const AICodeSystem = lazy(() =>
  import('./components/ai-code/AICodeSystem').then(m => ({ default: m.AICodeSystem }))
);

const CodeGeneratorPanel = lazy(() =>
  import('./components/ai-code/CodeGeneratorPanel').then(m => ({ default: m.CodeGeneratorPanel }))
);

const DesignerLayout = lazy(() =>
  import('./components/designer/DesignerLayout').then(m => ({ default: m.DesignerLayout }))
);

const SettingsPage = lazy(() =>
  import('./components/settings/SettingsPage').then(m => ({ default: m.SettingsPage }))
);

const DndProvider = lazy(() =>
  import('react-dnd').then(m => ({ default: m.DndProvider }))
);

const DesignerProvider = lazy(() =>
  import('./store').then(m => ({ default: m.DesignerProvider }))
);

function withSuspense(name: string, autoRecoveryMs: number, maxAutoRecovery: number, element: React.ReactNode) {
  return (
    <ErrorBoundary level="route" name={name} autoRecoveryMs={autoRecoveryMs} maxAutoRecovery={maxAutoRecovery}>
      <Suspense fallback={<LoadingPage message={`加载 ${name}...`} />}>
        {element}
      </Suspense>
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense('Home', 2000, 5, <AIHomePage />),
    errorElement: <ErrorBoundary level="route">{null}</ErrorBoundary>,
  },
  {
    path: '/designer',
    element: withSuspense('Designer', 3000, 3,
      <DesignerProvider>
        <DndProvider backend={HTML5Backend}>
          <DesignerLayout />
        </DndProvider>
      </DesignerProvider>
    ),
  },
  {
    path: '/ai-code',
    element: withSuspense('AI-Code-Workbench', 3000, 3, <AICodeSystem />),
  },
  {
    path: '/ai-generator',
    element: withSuspense('AI-Generator', 3000, 3, <CodeGeneratorPanel />),
  },
  {
    path: '/settings',
    element: withSuspense('Settings', 2000, 3, <SettingsPage />),
  },
]);
