/**
 * @file routes.ts
 * @description Application routing — page-level route definitions with lazy loading
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 3.0.0
 */

import React, { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { LoadingPage } from './components/LoadingPage'

// Lazy load components for code splitting
const HomePage = lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })))
const DesignerPage = lazy(() => import('./components/DesignerPage').then(m => ({ default: m.DesignerPage })))
const ArchitecturePage = lazy(() => import('./components/ArchitecturePage').then(m => ({ default: m.ArchitecturePage })))
const DevToolsPage = lazy(() => import('./components/DevToolsPage').then(m => ({ default: m.DevToolsPage })))
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })))

// Wrap lazy-loaded components with Suspense
function withSuspense<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    return React.createElement(
      Suspense,
      { fallback: React.createElement(LoadingPage, { message: '加载页面中...' }) },
      React.createElement(Component, props)
    )
  }
}

export const router = createBrowserRouter([
  { path: '/', Component: withSuspense(HomePage) },
  { path: '/designer', Component: withSuspense(DesignerPage) },
  { path: '/architecture', Component: withSuspense(ArchitecturePage) },
  { path: '/devtools', Component: withSuspense(DevToolsPage) },
  { path: '/settings', Component: withSuspense(SettingsPage) },
  { path: '*', Component: withSuspense(HomePage) },
])