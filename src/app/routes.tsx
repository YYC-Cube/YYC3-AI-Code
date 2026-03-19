/**
 * @file routes.tsx
 * @description YYC3 应用路由配置 — 首页 / Designer / AI Code 三大入口，含路由级 Error Boundary
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-08
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags router,routes,navigation,app,error-boundary
 */

import { createBrowserRouter } from 'react-router';
import { AIHomePage } from './components/home/AIHomePage';
import { AICodeSystem } from './components/ai-code/AICodeSystem';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-load the designer since it's large
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DesignerProvider } from './store';
import { DesignerLayout } from './components/designer/DesignerLayout';
import { SettingsPage } from './components/settings/SettingsPage';

function DesignerPage() {
  return (
    <ErrorBoundary level="route" name="Designer" autoRecoveryMs={3000} maxAutoRecovery={3}>
      <DesignerProvider>
        <DndProvider backend={HTML5Backend}>
          <DesignerLayout />
        </DndProvider>
      </DesignerProvider>
    </ErrorBoundary>
  );
}

function AICodePage() {
  return (
    <ErrorBoundary level="route" name="AI-Code-Workbench" autoRecoveryMs={3000} maxAutoRecovery={3}>
      <AICodeSystem />
    </ErrorBoundary>
  );
}

function HomePage() {
  return (
    <ErrorBoundary level="route" name="Home" autoRecoveryMs={2000} maxAutoRecovery={5}>
      <AIHomePage />
    </ErrorBoundary>
  );
}

function SettingsPageWrapper() {
  return (
    <ErrorBoundary level="route" name="Settings" autoRecoveryMs={2000} maxAutoRecovery={3}>
      <SettingsPage />
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: HomePage,
  },
  {
    path: '/designer',
    Component: DesignerPage,
  },
  {
    path: '/ai-code',
    Component: AICodePage,
  },
  {
    path: '/settings',
    Component: SettingsPageWrapper,
  },
]);