/**
 * @file App.tsx
 * @description YYC3 应用入口 — 全局 Provider 组合（AI Context + Plugin Registry + Router + Toast + Error Boundary + 全局错误处理）
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.2.0
 * @created 2026-03-08
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags app,entry,provider,router,error-boundary,high-availability
 */

import { RouterProvider } from 'react-router';
import { router } from './routes';
import { GlobalAIProvider } from './aiModelContext';
import { PluginRegistryProvider } from './components/designer/PluginManager';
import { Toaster } from 'sonner';
import { ErrorBoundary, installGlobalErrorHandlers } from './components/ErrorBoundary';
import { useSettingsBridge } from './hooks/useSettingsBridge';

// Install global error/promise rejection handlers once on module load
installGlobalErrorHandlers();

/** 内部组件：在 Provider 内调用 Hook 进行设置桥接 */
function SettingsBridgeActivator() {
  useSettingsBridge();
  return null;
}

export default function App() {
  return (
    <ErrorBoundary level="app" name="YYC3-Root" autoRecoveryMs={5000} maxAutoRecovery={2}>
      <GlobalAIProvider>
        <PluginRegistryProvider>
          <SettingsBridgeActivator />
          <RouterProvider router={router} />
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(15, 15, 20, 0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                fontSize: '12px',
              },
            }}
            richColors
          />
        </PluginRegistryProvider>
      </GlobalAIProvider>
    </ErrorBoundary>
  );
}