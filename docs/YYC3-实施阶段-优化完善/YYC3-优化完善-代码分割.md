---
file: YYC3-P3-性能-代码分割.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: development
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维


# YYC3-P3-性能-代码分割

## 🤖 AI 角色定义

You are a senior frontend architect and build optimization specialist with deep expertise in code splitting, lazy loading, and bundle optimization for modern web applications.

### Your Role & Expertise

You are an experienced frontend architect who specializes in:
- **Code Splitting**: Route-based splitting, component-based splitting, dynamic imports
- **Bundle Optimization**: Tree shaking, minification, compression, bundle analysis
- **Lazy Loading**: Lazy loading strategies, preloading, prefetching, code splitting
- **Build Tools**: Vite, Webpack, Rollup, esbuild, Turbopack
- **Performance**: Bundle size optimization, loading performance, runtime performance
- **Caching**: Long-term caching, cache busting, cache optimization
- **Analysis**: Bundle analysis, dependency analysis, optimization opportunities
- **Best Practices**: Performance budgets, optimization strategies, monitoring

### Code Standards

**IMPORTANT**: Please ensure all generated code files follow the team requirements specified in: `guidelines/YYC3-Code-header.md`

All code files must include proper file headers with:
- @file: File name/path
- @description: Clear description of file purpose
- @author: YanYuCloudCube Team <admin@0379.email>
- @version: Semantic version (v1.0.0)
- @created: Creation date (YYYY-MM-DD)
- @updated: Last update date (YYYY-MM-DD)
- @status: File status (draft/dev/test/stable/deprecated)
- @license: License type
- @copyright: Copyright notice
- @tags: Relevant tags for categorization

---

## 📦 代码分割系统

### 系统概述

YYC3-AI Code Designer 的代码分割系统提供智能的代码分割策略，包括路由分割、组件分割、动态导入、懒加载、预加载、预连接等功能，优化应用加载性能和用户体验。

### 核心功能

#### 路由分割

```typescript
/**
 * 路由分割配置
 */
export const routeConfig = {
  home: () => import('@/pages/Home'),
  editor: () => import('@/pages/Editor'),
  preview: () => import('@/pages/Preview'),
  settings: () => import('@/pages/Settings'),
  plugins: () => import('@/pages/Plugins'),
  database: () => import('@/pages/Database'),
  collaboration: () => import('@/pages/Collaboration'),
};

/**
 * 路由分割组件
 */
export const RouteSplitter: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazyHome />
          </React.Suspense>
        }
      />
      <Route
        path="/editor"
        element={
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazyEditor />
          </React.Suspense>
        }
      />
      <Route
        path="/preview"
        element={
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazyPreview />
          </React.Suspense>
        }
      />
      <Route
        path="/settings"
        element={
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazySettings />
          </React.Suspense>
        }
      />
      <Route
        path="/plugins"
        element={
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazyPlugins />
          </React.Suspense>
        }
      />
      <Route
        path="/database"
        element={
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazyDatabase />
          </React.Suspense>
        }
      />
      <Route
        path="/collaboration"
        element={
          <React.Suspense fallback={<LoadingSpinner />}>
            <LazyCollaboration />
          </React.Suspense>
        }
      />
    </Routes>
  );
};

/**
 * 懒加载组件
 */
const LazyHome = React.lazy(() => import('@/pages/Home'));
const LazyEditor = React.lazy(() => import('@/pages/Editor'));
const LazyPreview = React.lazy(() => import('@/pages/Preview'));
const LazySettings = React.lazy(() => import('@/pages/Settings'));
const LazyPlugins = React.lazy(() => import('@/pages/Plugins'));
const LazyDatabase = React.lazy(() => import('@/pages/Database'));
const LazyCollaboration = React.lazy(() => import('@/pages/Collaboration'));

/**
 * 加载指示器
 */
const LoadingSpinner: React.FC = () => (
  <div className="loading-spinner">
    <div className="spinner" />
    <span>Loading...</span>
  </div>
);
```

#### 组件分割

```typescript
/**
 * 组件分割器
 */
export class ComponentSplitter {
  /**
   * 创建懒加载组件
   */
  static createLazyComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ReactNode
  ): React.FC<React.ComponentProps<T>> {
    const LazyComponent = React.lazy(importFn);

    return (props) => (
      <React.Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  }

  /**
   * 创建条件加载组件
   */
  static createConditionalComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    condition: () => boolean,
    fallback?: React.ReactNode
  ): React.FC<React.ComponentProps<T>> {
    const LazyComponent = React.lazy(importFn);

    return (props) => {
      if (!condition()) {
        return <>{fallback || null}</>;
      }

      return (
        <React.Suspense fallback={fallback || <LoadingSpinner />}>
          <LazyComponent {...props} />
        </React.Suspense>
      );
    };
  }

  /**
   * 创建预加载组件
   */
  static createPreloadComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    preloadDelay: number = 1000
  ): React.FC<React.ComponentProps<T>> {
    const LazyComponent = React.lazy(importFn);

    useEffect(() => {
      const timer = setTimeout(() => {
        importFn();
      }, preloadDelay);

      return () => clearTimeout(timer);
    }, []);

    return (props) => (
      <React.Suspense fallback={<LoadingSpinner />}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  }
}

/**
 * 懒加载组件示例
 */
export const LazyCodeEditor = ComponentSplitter.createLazyComponent(
  () => import('@/components/CodeEditor')
);

export const LazyPreviewPane = ComponentSplitter.createLazyComponent(
  () => import('@/components/PreviewPane')
);

export const LazySettingsPanel = ComponentSplitter.createLazyComponent(
  () => import('@/components/SettingsPanel')
);
```

#### 动态导入

```typescript
/**
 * 动态导入管理器
 */
export class DynamicImportManager {
  private loadedModules: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  /**
   * 动态导入模块
   */
  async importModule<T>(modulePath: string): Promise<T> {
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath);
    }

    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }

    const promise = this.loadModule<T>(modulePath);
    this.loadingPromises.set(modulePath, promise);

    try {
      const module = await promise;
      this.loadedModules.set(modulePath, module);
      return module;
    } finally {
      this.loadingPromises.delete(modulePath);
    }
  }

  /**
   * 加载模块
   */
  private async loadModule<T>(modulePath: string): Promise<T> {
    const startTime = performance.now();
    console.log(`Loading module: ${modulePath}`);

    try {
      const module = await import(modulePath);
      const loadTime = performance.now() - startTime;

      console.log(`Module loaded: ${modulePath} (${loadTime.toFixed(2)}ms)`);
      return module as T;
    } catch (error) {
      console.error(`Failed to load module: ${modulePath}`, error);
      throw error;
    }
  }

  /**
   * 预加载模块
   */
  async preloadModule(modulePath: string): Promise<void> {
    try {
      await this.importModule(modulePath);
    } catch (error) {
      console.warn(`Failed to preload module: ${modulePath}`, error);
    }
  }

  /**
   * 批量预加载模块
   */
  async preloadModules(modulePaths: string[]): Promise<void> {
    const promises = modulePaths.map((path) => this.preloadModule(path));
    await Promise.allSettled(promises);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.loadedModules.clear();
    this.loadingPromises.clear();
  }

  /**
   * 获取已加载模块列表
   */
  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }
}

/**
 * 使用动态导入
 */
export function useDynamicImport<T>(modulePath: string) {
  const [module, setModule] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    import(modulePath)
      .then((mod) => {
        setModule(mod as T);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [modulePath]);

  return { module, loading, error };
}
```

#### 懒加载

```typescript
/**
 * 懒加载管理器
 */
export class LazyLoadManager {
  private observer: IntersectionObserver | null = null;
  private elements: Map<Element, LazyLoadCallback> = new Map();

  /**
   * 初始化
   */
  initialize(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const callback = this.elements.get(entry.target);
              if (callback) {
                callback();
                this.unobserve(entry.target);
              }
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1,
        }
      );
    }
  }

  /**
   * 观察元素
   */
  observe(element: Element, callback: LazyLoadCallback): void {
    if (this.observer) {
      this.elements.set(element, callback);
      this.observer.observe(element);
    } else {
      callback();
    }
  }

  /**
   * 取消观察
   */
  unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element);
      this.elements.delete(element);
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.elements.clear();
  }
}

/**
 * 懒加载回调
 */
type LazyLoadCallback = () => void;

/**
 * 懒加载组件 Hook
 */
export function useLazyLoad(
  elementRef: RefObject<Element>,
  callback: LazyLoadCallback,
  options: IntersectionObserverInit = {}
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.unobserve(element);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, callback, options]);
}

/**
 * 懒加载图片组件
 */
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}> = ({ src, alt, placeholder, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useLazyLoad(imgRef, () => {
    if (imgRef.current) {
      imgRef.current.src = src;
    }
  });

  return (
    <img
      ref={imgRef}
      alt={alt}
      className={className}
      data-src={src}
      src={placeholder}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      style={{
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.3s',
      }}
    />
  );
};
```

#### 预加载

```typescript
/**
 * 预加载管理器
 */
export class PreloadManager {
  private preloadedResources: Set<string> = new Set();

  /**
   * 预加载图片
   */
  preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(src)) {
        const img = new Image();
        img.src = src;
        resolve(img);
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.preloadedResources.add(src);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * 预加载脚本
   */
  preloadScript(src: string): Promise<HTMLScriptElement> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(src)) {
        const script = document.createElement('script');
        script.src = src;
        resolve(script);
        return;
      }

      const script = document.createElement('script');
      script.onload = () => {
        this.preloadedResources.add(src);
        resolve(script);
      };
      script.onerror = reject;
      script.src = src;
      document.head.appendChild(script);
    });
  }

  /**
   * 预加载样式
   */
  preloadStyle(href: string): Promise<HTMLLinkElement> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(href)) {
        const link = document.createElement('link');
        link.href = href;
        link.rel = 'stylesheet';
        resolve(link);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.onload = () => {
        this.preloadedResources.add(href);
        resolve(link);
      };
      link.onerror = reject;
      link.href = href;
      document.head.appendChild(link);
    });
  }

  /**
   * 预加载字体
   */
  preloadFont(fontFamily: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(src)) {
        resolve();
        return;
      }

      const font = new FontFace(fontFamily, `url(${src})`);
      font.load()
        .then(() => {
          document.fonts.add(font);
          this.preloadedResources.add(src);
          resolve();
        })
        .catch(reject);
    });
  }

  /**
   * 预加载模块
   */
  async preloadModule(modulePath: string): Promise<void> {
    if (this.preloadedResources.has(modulePath)) {
      return;
    }

    try {
      await import(modulePath);
      this.preloadedResources.add(modulePath);
    } catch (error) {
      console.warn(`Failed to preload module: ${modulePath}`, error);
    }
  }

  /**
   * 批量预加载
   */
  async batchPreload(resources: PreloadResource[]): Promise<void> {
    const promises = resources.map((resource) => {
      switch (resource.type) {
        case 'image':
          return this.preloadImage(resource.src);
        case 'script':
          return this.preloadScript(resource.src);
        case 'style':
          return this.preloadStyle(resource.src);
        case 'font':
          return this.preloadFont(resource.fontFamily || '', resource.src);
        case 'module':
          return this.preloadModule(resource.src);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * 清除预加载缓存
   */
  clearCache(): void {
    this.preloadedResources.clear();
  }

  /**
   * 获取预加载状态
   */
  isPreloaded(resource: string): boolean {
    return this.preloadedResources.has(resource);
  }
}

/**
 * 预加载资源
 */
interface PreloadResource {
  type: 'image' | 'script' | 'style' | 'font' | 'module';
  src: string;
  fontFamily?: string;
}

/**
 * 预加载 Hook
 */
export function usePreload(resources: PreloadResource[]) {
  useEffect(() => {
    const manager = new PreloadManager();
    manager.batchPreload(resources);

    return () => {
      manager.clearCache();
    };
  }, [resources]);
}
```

#### 预连接

```typescript
/**
 * 预连接管理器
 */
export class PreconnectManager {
  private preconnectedOrigins: Set<string> = new Set();

  /**
   * 预连接域名
   */
  preconnect(origin: string): void {
    if (this.preconnectedOrigins.has(origin)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    document.head.appendChild(link);

    this.preconnectedOrigins.add(origin);
  }

  /**
   * DNS 预解析
   */
  dnsPrefetch(origin: string): void {
    if (this.preconnectedOrigins.has(origin)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = origin;
    document.head.appendChild(link);

    this.preconnectedOrigins.add(origin);
  }

  /**
   * 批量预连接
   */
  batchPreconnect(origins: string[]): void {
    origins.forEach((origin) => this.preconnect(origin));
  }

  /**
   * 批量 DNS 预解析
   */
  batchDnsPrefetch(origins: string[]): void {
    origins.forEach((origin) => this.dnsPrefetch(origin));
  }

  /**
   * 清除预连接
   */
  clear(): void {
    this.preconnectedOrigins.clear();
  }
}

/**
 * 预连接 Hook
 */
export function usePreconnect(origins: string[]) {
  useEffect(() => {
    const manager = new PreconnectManager();
    manager.batchPreconnect(origins);

    return () => {
      manager.clear();
    };
  }, [origins]);
}
```

#### 代码分割分析

```typescript
/**
 * 代码分割分析器
 */
export class CodeSplitAnalyzer {
  private chunks: Map<string, ChunkInfo> = new Map();

  /**
   * 分析代码分割
   */
  analyze(): CodeSplitReport {
    const chunks = this.getChunks();
    const routes = this.getRouteChunks();
    const components = this.getComponentChunks();
    const vendors = this.getVendorChunks();

    return {
      totalChunks: chunks.length,
      totalSize: this.calculateTotalSize(chunks),
      routes,
      components,
      vendors,
      recommendations: this.generateRecommendations(chunks),
    };
  }

  /**
   * 获取代码块
   */
  private getChunks(): ChunkInfo[] {
    return Array.from(this.chunks.values());
  }

  /**
   * 获取路由代码块
   */
  private getRouteChunks(): ChunkInfo[] {
    return this.getChunks().filter((chunk) => chunk.type === 'route');
  }

  /**
   * 获取组件代码块
   */
  private getComponentChunks(): ChunkInfo[] {
    return this.getChunks().filter((chunk) => chunk.type === 'component');
  }

  /**
   * 获取第三方代码块
   */
  private getVendorChunks(): ChunkInfo[] {
    return this.getChunks().filter((chunk) => chunk.type === 'vendor');
  }

  /**
   * 计算总大小
   */
  private calculateTotalSize(chunks: ChunkInfo[]): number {
    return chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  }

  /**
   * 生成建议
   */
  private generateRecommendations(chunks: ChunkInfo[]): string[] {
    const recommendations: string[] = [];

    const largeChunks = chunks.filter((chunk) => chunk.size > 500 * 1024);
    if (largeChunks.length > 0) {
      recommendations.push(
        `发现 ${largeChunks.length} 个大型代码块 (>500KB)，建议进一步分割`
      );
    }

    const duplicateChunks = this.findDuplicateChunks(chunks);
    if (duplicateChunks.length > 0) {
      recommendations.push(
        `发现 ${duplicateChunks.length} 个重复代码块，建议合并或去重`
      );
    }

    const unusedChunks = this.findUnusedChunks(chunks);
    if (unusedChunks.length > 0) {
      recommendations.push(
        `发现 ${unusedChunks.length} 个未使用的代码块，建议移除`
      );
    }

    return recommendations;
  }

  /**
   * 查找重复代码块
   */
  private findDuplicateChunks(chunks: ChunkInfo[]): ChunkInfo[] {
    const hashMap = new Map<string, ChunkInfo[]>();

    chunks.forEach((chunk) => {
      if (!hashMap.has(chunk.hash)) {
        hashMap.set(chunk.hash, []);
      }
      hashMap.get(chunk.hash)!.push(chunk);
    });

    return Array.from(hashMap.values())
      .filter((group) => group.length > 1)
      .flat();
  }

  /**
   * 查找未使用的代码块
   */
  private findUnusedChunks(chunks: ChunkInfo[]): ChunkInfo[] {
    return chunks.filter((chunk) => !chunk.used);
  }
}

/**
 * 代码块信息
 */
interface ChunkInfo {
  id: string;
  name: string;
  type: 'route' | 'component' | 'vendor' | 'common';
  size: number;
  hash: string;
  used: boolean;
  dependencies: string[];
}

/**
 * 代码分割报告
 */
interface CodeSplitReport {
  totalChunks: number;
  totalSize: number;
  routes: ChunkInfo[];
  components: ChunkInfo[];
  vendors: ChunkInfo[];
  recommendations: string[];
}
```

---

## ✅ 验收标准

### 功能完整性

- [ ] 路由分割功能完整
- [ ] 组件分割功能完整
- [ ] 动态导入功能完整
- [ ] 懒加载功能完整
- [ ] 预加载功能完整
- [ ] 预连接功能完整
- [ ] 代码分割分析功能完整
- [ ] 性能优化建议功能完整
- [ ] 缓存管理功能完整
- [ ] 错误处理功能完整

### 代码质量

- [ ] TypeScript 类型定义完整
- [ ] 代码分割策略合理
- [ ] 错误处理完善
- [ ] 性能优化到位
- [ ] 代码可维护性强

### 性能指标

- [ ] 初始加载体积减少 > 50%
- [ ] 首屏加载时间减少 > 30%
- [ ] 代码分割粒度合理
- [ ] 懒加载触发准确
- [ ] 预加载策略有效

---

## 📚 相关文档

- [YYC3-P3-性能-性能优化.md](./YYC3-P3-性能-性能优化.md)
- [YYC3-P0-架构-构建配置.md](../P0-核心架构/YYC3-P0-架构-构建配置.md)
- [YYC3-变量-配置参数.md](../变量词库/YYC3-变量-配置参数.md)

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-04-08 |
| 更新日期 | 2026-04-08 |
| 内容校验 | a9545d486bd869cb |
| 追溯ID | TRC-20260408141610 |
| 关联文档 | 无 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
