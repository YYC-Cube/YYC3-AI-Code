/**
 * @file main.tsx
 * @description YYC3 应用入口 — React 应用挂载点，导入全局样式和根组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags entry,main,react,styles
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';

// 导入全局样式
import './styles/index.css';
import './styles/theme.css';
import './styles/tailwind.css';
import './styles/fonts.css';

// 创建 React 根节点
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Please ensure index.html contains a div with id="root".');
}

// 创建 React 根容器并渲染 App
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 开发环境下的热模块替换 (HMR) 支持
if (import.meta.hot) {
  import.meta.hot.accept();
}
