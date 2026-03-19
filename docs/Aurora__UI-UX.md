---
@file: Aurora__UI-UX.md
@description: YYC³ 极光风格前端UI/UX原型开发设计提示词，包含风格概述、设计原则、视觉系统等
@author: YanYuCloudCube Team <admin@0379.email>
@version: v1.0.0
@created: 2026-03-19
@updated: 2026-03-19
@status: stable
@tags: aurora,ui-ux,frontend,prototype,design-prompt,zh-CN
@category: design
@language: zh-CN
@audience: developers,designers
@complexity: intermediate
@design_type: ui
@review_status: approved
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ 极光风格前端UI/UX原型开发设计提示词

---

## 📋 目录导航

1. [风格概述](#-风格概述)
2. [设计原则](#-设计原则)
3. [视觉系统](#-视觉系统)
4. [组件规范](#-组件规范)
5. [交互设计](#-交互设计)
6. [开发指导](#-开发指导)
7. [技术实现](#-技术实现)
8. [最佳实践](#-最佳实践)

---

## 🎨 风格概述

### 核心特征

极光风格是一种融合了**自然渐变**、**流动光影**、**清新通透**的设计风格，创造出自然、流动、清新的视觉体验。

#### 视觉特点
- **自然性**：模仿极光、彩虹等自然现象，清新配色
- **流动性**：背景渐变缓慢流动变化，光影自然移动
- **通透性**：半透明效果，光线穿透，清新视觉

#### 情感体验
- **清新**：清新自然的色彩组合，带来舒适感
- **流动**：渐变流动和光影移动带来生命力
- **自然**：模仿自然现象，营造和谐氛围

### 适用场景

- **健康应用**：健身、医疗、健康监测、健康管理
- **环保应用**：环保、可持续发展、绿色生活、生态保护
- **生活应用**：社交、娱乐、生活方式、个人成长

---

## 🎯 设计原则

### 1. 自然性原则

#### 自然渐变
```css
/* 线性极光渐变 */
.aurora-linear {
  background: linear-gradient(135deg, #00ff87 0%, #60efff 50%, #ff6b6b 100%);
  background-size: 200% 200%;
  animation: aurora-flow 15s ease infinite;
}

@keyframes aurora-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

#### 径向极光
```css
/* 径向极光渐变 */
.aurora-radial {
  background: radial-gradient(circle at center, #00ff87 0%, #60efff 50%, #ff6b6b 100%);
  background-size: 200% 200%;
  animation: aurora-pulse 10s ease-in-out infinite;
}

@keyframes aurora-pulse {
  0%, 100% { background-size: 200% 200%; }
  50% { background-size: 250% 250%; }
}
```

### 2. 流动性原则

#### 渐变流动
```css
/* 渐变流动背景 */
.gradient-flow {
  background:
    linear-gradient(135deg, #00ff87 0%, #60efff 25%, #ff6b6b 50%, #a855f7 75%, #00ff87 100%);
  background-size: 400% 400%;
  animation: gradientMove 20s ease infinite;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  25% { background-position: 100% 50%; }
  50% { background-position: 100% 100%; }
  75% { background-position: 0% 100%; }
  100% { background-position: 0% 50%; }
}
```

#### 光影移动
```css
/* 光影移动效果 */
.light-move {
  position: relative;
  overflow: hidden;
}

.light-move::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  animation: lightRotate 10s linear infinite;
}

@keyframes lightRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 3. 通透性原则

#### 半透明效果
```css
/* 半透明卡片 */
.card-translucent {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

#### 光影穿透
```css
/* 光影穿透效果 */
.light-penetrate {
  position: relative;
  overflow: hidden;
}

.light-penetrate::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 255, 135, 0.1) 0%,
    rgba(96, 239, 255, 0.1) 50%,
    rgba(255, 107, 107, 0.1) 100%
  );
  pointer-events: none;
  animation: lightShift 8s ease-in-out infinite;
}

@keyframes lightShift {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
```

---

## 🎨 视觉系统

### 色彩系统

#### 主色调
```css
:root {
  --aurora-green: #00ff87;
  --aurora-cyan: #60efff;
  --aurora-red: #ff6b6b;
  --aurora-purple: #a855f7;
  --aurora-pink: #ec4899;
  --aurora-yellow: #fbbf24;
}
```

#### 渐变色系
```css
/* 绿青渐变 */
.gradient-green-cyan {
  background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
}

/* 红紫渐变 */
.gradient-red-purple {
  background: linear-gradient(135deg, #ff6b6b 0%, #a855f7 100%);
}

/* 粉黄渐变 */
.gradient-pink-yellow {
  background: linear-gradient(135deg, #ec4899 0%, #fbbf24 100%);
}

/* 多色渐变 */
.gradient-multi {
  background: linear-gradient(135deg, #00ff87 0%, #60efff 25%, #ff6b6b 50%, #a855f7 75%, #ec4899 100%);
}
```

### 字体系统

#### 字体家族
```css
:root {
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  --font-secondary: 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Consolas', 'Courier New', monospace;
}
```

#### 字体大小
```css
:root {
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;
}
```

### 间距系统

#### 基础间距
```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

### 圆角系统

#### 圆角规范
```css
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
}
```

---

## 🧩 组件规范

### 1. 卡片组件

#### 透明卡片
```css
.card-translucent {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card-translucent:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
```

#### 渐变卡片
```css
.card-gradient {
  background: linear-gradient(135deg, rgba(0, 255, 135, 0.8) 0%, rgba(96, 239, 255, 0.8) 100%);
  backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 24px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 255, 135, 0.3);
  transition: all 0.3s ease;
}

.card-gradient:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 255, 135, 0.4);
}
```

### 2. 按钮组件

#### 渐变按钮
```css
.button-gradient {
  background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 255, 135, 0.3);
}

.button-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 255, 135, 0.4);
}

.button-gradient:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 255, 135, 0.3);
}
```

#### 透明按钮
```css
.button-translucent {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px 24px;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-translucent:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### 3. 输入框组件

#### 透明输入框
```css
.input-translucent {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  color: #374151;
  font-size: 16px;
  transition: all 0.3s ease;
  outline: none;
}

.input-translucent:focus {
  border-color: #00ff87;
  box-shadow: 0 0 0 3px rgba(0, 255, 135, 0.1);
  background: rgba(255, 255, 255, 0.8);
}

.input-translucent::placeholder {
  color: #9ca3af;
}
```

### 4. 导航组件

#### 透明导航栏
```css
.nav-translucent {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-item-translucent {
  background: transparent;
  border: none;
  color: #6b7280;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-item-translucent:hover {
  background: rgba(255, 255, 255, 0.8);
  color: #374151;
}

.nav-item-translucent.active {
  background: linear-gradient(135deg, rgba(0, 255, 135, 0.2) 0%, rgba(96, 239, 255, 0.2) 100%);
  color: #00ff87;
}
```

---

## ✨ 交互设计

### 1. 悬停效果

#### 卡片悬停
```css
.card-translucent {
  transition: all 0.3s ease;
}

.card-translucent:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
```

#### 按钮悬停
```css
.button-gradient {
  transition: all 0.3s ease;
}

.button-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 255, 135, 0.4);
}
```

### 2. 点击效果

#### 按钮点击
```css
.button-gradient:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 255, 135, 0.3);
}
```

### 3. 过渡动画

#### 页面切换
```css
.page-transition {
  animation: pageFadeIn 0.5s ease-out;
}

@keyframes pageFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 元素进入
```css
.element-enter {
  animation: elementSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes elementSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 💻 开发指导

### 1. 技术栈推荐

#### 前端框架
```json
{
  "framework": "React 18+",
  "language": "TypeScript",
  "styling": "Tailwind CSS + CSS Modules",
  "state": "Zustand",
  "router": "React Router v6"
}
```

#### UI组件库
```json
{
  "base": "Radix UI",
  "animations": "Framer Motion",
  "icons": "Lucide React",
  "forms": "React Hook Form"
}
```

### 2. 项目结构

```
src/
├── components/
│   ├── aurora/
│   │   ├── TranslucentCard.tsx
│   │   ├── GradientCard.tsx
│   │   ├── GradientButton.tsx
│   │   └── LightEffect.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── common/
│       ├── Loading.tsx
│       └── Error.tsx
├── styles/
│   ├── aurora.css
│   ├── gradient.css
│   └── variables.css
├── hooks/
│   ├── useAuroraEffect.ts
│   └── useLightAnimation.ts
└── utils/
    ├── color.ts
    └── animation.ts
```

### 3. 性能优化

#### 懒加载
```typescript
const LazyTranslucentCard = React.lazy(() => import('./components/aurora/TranslucentCard'));

const App = () => {
  return (
    <React.Suspense fallback={<Loading />}>
      <LazyTranslucentCard />
    </React.Suspense>
  );
};
```

#### 虚拟滚动
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualList = ({ items }: { items: any[] }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
  });

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TranslucentCard item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔧 技术实现

### 1. React组件实现

#### 透明卡片组件
```typescript
import React from 'react';

interface TranslucentCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const TranslucentCard: React.FC<TranslucentCardProps> = ({
  children,
  className = '',
  gradient = false,
}) => {
  return (
    <div
      className={`card-translucent ${gradient ? 'card-gradient' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
```

#### 光影效果组件
```typescript
import React, { useEffect, useRef } from 'react';

interface LightEffectProps {
  children: React.ReactNode;
  className?: string;
}

export const LightEffect: React.FC<LightEffectProps> = ({
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // 创建光影移动效果
    const createLightEffect = () => {
      const light = document.createElement('div');
      light.className = 'light-move';
      container.appendChild(light);
    };
    
    createLightEffect();
    
    return () => {
      container.innerHTML = '';
    };
  }, []);
  
  return (
    <div ref={containerRef} className={`light-penetrate ${className}`}>
      {children}
    </div>
  );
};
```

### 2. 自定义Hooks

#### 极光效果Hook
```typescript
import { useEffect, useRef } from 'react';

export const useAuroraEffect = (enabled: boolean = true) => {
  const elementRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!enabled || !elementRef.current) return;
    
    const element = elementRef.current;
    
    // 添加极光渐变效果
    const addAuroraEffect = () => {
      element.style.background = 'linear-gradient(135deg, #00ff87 0%, #60efff 50%, #ff6b6b 100%)';
      element.style.backgroundSize = '200% 200%';
      element.style.animation = 'aurora-flow 15s ease infinite';
    };
    
    addAuroraEffect();
    
    return () => {
      element.style.background = '';
      element.style.backgroundSize = '';
      element.style.animation = '';
    };
  }, [enabled]);
  
  return elementRef;
};
```

#### 光影动画Hook
```typescript
import { useEffect, useState } from 'react';

export const useLightAnimation = () => {
  const [lights, setLights] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
  }>>([]);
  
  useEffect(() => {
    // 生成随机光影
    const newLights = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 100 + Math.random() * 200,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 4,
    }));
    
    setLights(newLights);
  }, []);
  
  return lights;
};
```

---

## 📚 最佳实践

### 1. 性能优化

#### 减少重绘
```css
/* 使用transform代替top/left */
.card-translucent {
  transform: translateY(0);
  transition: transform 0.3s ease;
}

.card-translucent:hover {
  transform: translateY(-4px);
}
```

#### 使用will-change
```css
/* 提示浏览器优化 */
.card-translucent {
  will-change: transform, opacity, box-shadow;
}

.gradient-flow {
  will-change: background-position;
}
```

### 2. 可访问性

#### ARIA属性
```tsx
<div
  className="card-translucent"
  role="article"
  aria-label="透明卡片"
>
  <h2>卡片标题</h2>
  <p>卡片内容</p>
</div>
```

#### 键盘导航
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'Tab':
      e.preventDefault();
      focusNextElement();
      break;
    case 'Enter':
    case ' ':
      activateElement();
      break;
    case 'Escape':
      closeDropdown();
      break;
  }
};
```

### 3. 响应式设计

#### 移动端适配
```css
@media (max-width: 768px) {
  .card-translucent {
    padding: 16px;
    border-radius: 12px;
  }
  
  .gradient-flow {
    animation-duration: 30s;
  }
}
```

#### 桌面端适配
```css
@media (min-width: 1024px) {
  .card-translucent {
    padding: 24px;
    border-radius: 16px;
  }
  
  .gradient-flow {
    animation-duration: 20s;
  }
}
```

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
