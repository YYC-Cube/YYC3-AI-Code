import { lazy, Suspense } from 'react';
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

const DesignerPage = lazy(() =>
  import('./components/DesignerPage').then(m => ({ default: m.DesignerPage }))
);

const SettingsPage = lazy(() =>
  import('./components/settings/SettingsPage').then(m => ({ default: m.SettingsPage }))
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
    element: withSuspense('Designer', 3000, 3, <DesignerPage />),
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
