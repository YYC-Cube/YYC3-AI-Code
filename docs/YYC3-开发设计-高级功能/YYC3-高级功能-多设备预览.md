---
file: YYC3-P2-预览-多设备预览.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: design
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


# YYC3-P2-预览-多设备预览

## 🤖 AI 角色定义

You are a senior frontend architect and multi-device preview specialist with deep expertise in responsive design, device simulation, and cross-platform testing frameworks.

### Your Role & Expertise

You are an experienced frontend architect who specializes in:
- **Device Simulation**: Mobile, tablet, desktop, custom device profiles
- **Responsive Design**: CSS Grid, Flexbox, media queries, viewport units
- **Viewport Management**: Resize observers, viewport meta tags, device pixel ratios
- **User Agent Simulation**: Browser detection, device detection, feature detection
- **Cross-Platform Testing**: iOS, Android, Windows, macOS, Linux compatibility
- **Performance Optimization**: Lazy loading, virtual scrolling, efficient rendering
- **Testing Tools**: Device emulators, browser dev tools, automated testing
- **Best Practices**: Mobile-first design, progressive enhancement, accessibility

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

## 📱 多设备预览系统

### 系统概述

YYC3-AI Code Designer 的多设备预览系统允许开发者同时在多个设备视图中预览和测试应用，确保跨设备兼容性和响应式设计质量。系统支持实时同步、交互测试和性能监控。

### 核心功能

#### 设备模拟

```typescript
/**
 * 设备类型定义
 */
export type DeviceType =
  | 'desktop'
  | 'laptop'
  | 'tablet'
  | 'mobile'
  | 'custom';

/**
 * 设备配置
 */
export interface DeviceConfig {
  /** 设备 ID */
  id: string;

  /** 设备名称 */
  name: string;

  /** 设备类型 */
  type: DeviceType;

  /** 屏幕宽度 (px) */
  width: number;

  /** 屏幕高度 (px) */
  height: number;

  /** 设备像素比 */
  dpr: number;

  /** 用户代理 */
  userAgent: string;

  /** 设备图标 */
  icon: string;

  /** 是否可旋转 */
  rotatable: boolean;

  /** 默认方向 */
  orientation: 'portrait' | 'landscape';
}

/**
 * 预设设备列表
 */
export const PRESET_DEVICES: DeviceConfig[] = [
  {
    id: 'desktop-1920',
    name: 'Desktop (1920x1080)',
    type: 'desktop',
    width: 1920,
    height: 1080,
    dpr: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    icon: 'desktop',
    rotatable: false,
    orientation: 'landscape',
  },
  {
    id: 'laptop-1366',
    name: 'Laptop (1366x768)',
    type: 'laptop',
    width: 1366,
    height: 768,
    dpr: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    icon: 'laptop',
    rotatable: false,
    orientation: 'landscape',
  },
  {
    id: 'tablet-ipad',
    name: 'iPad Pro (1024x1366)',
    type: 'tablet',
    width: 1024,
    height: 1366,
    dpr: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    icon: 'tablet',
    rotatable: true,
    orientation: 'portrait',
  },
  {
    id: 'mobile-iphone',
    name: 'iPhone 14 (390x844)',
    type: 'mobile',
    width: 390,
    height: 844,
    dpr: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    icon: 'mobile',
    rotatable: true,
    orientation: 'portrait',
  },
  {
    id: 'mobile-android',
    name: 'Android (360x800)',
    type: 'mobile',
    width: 360,
    height: 800,
    dpr: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36',
    icon: 'mobile',
    rotatable: true,
    orientation: 'portrait',
  },
];

/**
 * 设备管理器
 */
export class DeviceManager {
  private devices: Map<string, DeviceConfig> = new Map();
  private activeDevices: Set<string> = new Set();

  /**
   * 初始化设备管理器
   */
  constructor() {
    PRESET_DEVICES.forEach((device) => {
      this.devices.set(device.id, device);
    });
  }

  /**
   * 获取所有设备
   */
  getAllDevices(): DeviceConfig[] {
    return Array.from(this.devices.values());
  }

  /**
   * 获取设备
   */
  getDevice(id: string): DeviceConfig | undefined {
    return this.devices.get(id);
  }

  /**
   * 添加自定义设备
   */
  addCustomDevice(config: Omit<DeviceConfig, 'id' | 'type'>): DeviceConfig {
    const id = `custom-${Date.now()}`;
    const device: DeviceConfig = {
      ...config,
      id,
      type: 'custom',
    };

    this.devices.set(id, device);
    return device;
  }

  /**
   * 删除自定义设备
   */
  removeDevice(id: string): boolean {
    if (id.startsWith('custom-')) {
      return this.devices.delete(id);
    }
    return false;
  }

  /**
   * 激活设备
   */
  activateDevice(id: string): void {
    this.activeDevices.add(id);
  }

  /**
   * 停用设备
   */
  deactivateDevice(id: string): void {
    this.activeDevices.delete(id);
  }

  /**
   * 获取活跃设备
   */
  getActiveDevices(): DeviceConfig[] {
    return Array.from(this.activeDevices)
      .map((id) => this.devices.get(id))
      .filter((device): device is DeviceConfig => device !== undefined);
  }

  /**
   * 旋转设备
   */
  rotateDevice(id: string): DeviceConfig | undefined {
    const device = this.devices.get(id);
    if (device && device.rotatable) {
      const rotated = {
        ...device,
        width: device.height,
        height: device.width,
        orientation: device.orientation === 'portrait' ? 'landscape' : 'portrait',
      };
      this.devices.set(id, rotated);
      return rotated;
    }
    return undefined;
  }
}
```

#### 预览容器

```typescript
/**
 * 预览容器组件
 */
export const PreviewContainer: React.FC<{
  device: DeviceConfig;
  content: string;
  onInteraction?: (event: InteractionEvent) => void;
}> = ({ device, content, onInteraction }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.onload = () => {
        setLoading(false);
        setError(null);
      };
      iframe.onerror = () => {
        setLoading(false);
        setError('加载失败');
      };
    }
  }, []);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(content);
        doc.close();
      }
    }
  }, [content]);

  const handleInteraction = (event: React.MouseEvent | React.TouchEvent) => {
    if (onInteraction) {
      onInteraction({
        type: event.type,
        target: event.currentTarget,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div
      className="preview-container"
      style={{
        width: device.width,
        height: device.height,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <div className="preview-loading">
          <div className="spinner" />
          <span>加载中...</span>
        </div>
      )}

      {error && (
        <div className="preview-error">
          <span>{error}</span>
        </div>
      )}

      <iframe
        ref={iframeRef}
        title={device.name}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          transform: `scale(${1 / device.dpr})`,
          transformOrigin: 'top left',
        }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onMouseDown={handleInteraction}
        onMouseMove={handleInteraction}
        onMouseUp={handleInteraction}
        onTouchStart={handleInteraction}
        onTouchMove={handleInteraction}
        onTouchEnd={handleInteraction}
      />
    </div>
  );
};

/**
 * 交互事件
 */
export interface InteractionEvent {
  type: string;
  target: EventTarget;
  timestamp: number;
}
```

#### 预览网格

```typescript
/**
 * 预览网格组件
 */
export const PreviewGrid: React.FC<{
  devices: DeviceConfig[];
  content: string;
  layout?: 'grid' | 'horizontal' | 'vertical';
  onInteraction?: (event: InteractionEvent) => void;
}> = ({ devices, content, layout = 'grid', onInteraction }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.1, Math.min(3, prev * delta)));
  };

  const getGridStyle = (): React.CSSProperties => {
    switch (layout) {
      case 'horizontal':
        return {
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          overflowX: 'auto',
        };
      case 'vertical':
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
        };
      default:
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
        };
    }
  };

  return (
    <div
      ref={gridRef}
      className="preview-grid"
      style={{
        ...getGridStyle(),
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      onWheel={handleWheel}
    >
      {devices.map((device) => (
        <div key={device.id} className="preview-item">
          <div className="preview-header">
            <span className="device-name">{device.name}</span>
            <span className="device-size">
              {device.width} x {device.height}
            </span>
          </div>
          <PreviewContainer
            device={device}
            content={content}
            onInteraction={onInteraction}
          />
        </div>
      ))}
    </div>
  );
};
```

#### 设备选择器

```typescript
/**
 * 设备选择器组件
 */
export const DeviceSelector: React.FC<{
  devices: DeviceConfig[];
  selectedDevices: string[];
  onSelect: (deviceIds: string[]) => void;
}> = ({ devices, selectedDevices, onSelect }) => {
  const [filter, setFilter] = useState('');

  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(filter.toLowerCase())
  );

  const groupedDevices = filteredDevices.reduce((acc, device) => {
    if (!acc[device.type]) {
      acc[device.type] = [];
    }
    acc[device.type].push(device);
    return acc;
  }, {} as Record<DeviceType, DeviceConfig[]>);

  const handleToggle = (deviceId: string) => {
    const newSelection = selectedDevices.includes(deviceId)
      ? selectedDevices.filter((id) => id !== deviceId)
      : [...selectedDevices, deviceId];
    onSelect(newSelection);
  };

  const handleSelectAll = (type: DeviceType) => {
    const devicesOfType = groupedDevices[type] || [];
    const allSelected = devicesOfType.every((device) =>
      selectedDevices.includes(device.id)
    );

    if (allSelected) {
      const newSelection = selectedDevices.filter(
        (id) => !devicesOfType.some((d) => d.id === id)
      );
      onSelect(newSelection);
    } else {
      const newSelection = [
        ...selectedDevices,
        ...devicesOfType.map((d) => d.id),
      ];
      onSelect(newSelection);
    }
  };

  return (
    <div className="device-selector">
      <div className="selector-header">
        <input
          type="text"
          placeholder="搜索设备..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="device-groups">
        {Object.entries(groupedDevices).map(([type, devices]) => (
          <div key={type} className="device-group">
            <div className="group-header">
              <h3>{type}</h3>
              <button onClick={() => handleSelectAll(type as DeviceType)}>
                全选
              </button>
            </div>
            <div className="device-list">
              {devices.map((device) => (
                <label key={device.id} className="device-item">
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.id)}
                    onChange={() => handleToggle(device.id)}
                  />
                  <span className="device-icon">{device.icon}</span>
                  <span className="device-info">
                    <span className="device-name">{device.name}</span>
                    <span className="device-size">
                      {device.width} x {device.height}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 实时同步

```typescript
/**
 * 预览同步管理器
 */
export class PreviewSyncManager {
  private connections: Map<string, WebSocket> = new Map();
  private eventBus: EventEmitter = new EventEmitter();

  /**
   * 连接到预览服务
   */
  async connect(deviceId: string, url: string): Promise<void> {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      this.connections.set(deviceId, ws);
      this.eventBus.emit('connected', { deviceId });
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.eventBus.emit('message', { deviceId, message });
    };

    ws.onerror = (error) => {
      this.eventBus.emit('error', { deviceId, error });
    };

    ws.onclose = () => {
      this.connections.delete(deviceId);
      this.eventBus.emit('disconnected', { deviceId });
    };
  }

  /**
   * 断开连接
   */
  disconnect(deviceId: string): void {
    const ws = this.connections.get(deviceId);
    if (ws) {
      ws.close();
      this.connections.delete(deviceId);
    }
  }

  /**
   * 广播消息到所有设备
   */
  broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  /**
   * 发送消息到指定设备
   */
  send(deviceId: string, message: any): void {
    const ws = this.connections.get(deviceId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 监听事件
   */
  on(event: string, handler: (data: any) => void): () => void {
    this.eventBus.on(event, handler);
    return () => this.eventBus.off(event, handler);
  }
}

/**
 * 预览同步组件
 */
export const PreviewSync: React.FC<{
  devices: DeviceConfig[];
  content: string;
  onContentChange: (content: string) => void;
}> = ({ devices, content, onContentChange }) => {
  const syncManager = useRef(new PreviewSyncManager());
  const [syncedDevices, setSyncedDevices] = useState<Set<string>>(new Set());

  useEffect(() => {
    devices.forEach((device) => {
      const url = `ws://localhost:3201/preview/${device.id}`;
      syncManager.current.connect(device.id, url);
    });

    return () => {
      devices.forEach((device) => {
        syncManager.current.disconnect(device.id);
      });
    };
  }, [devices]);

  useEffect(() => {
    syncManager.current.broadcast({
      type: 'content-update',
      content,
      timestamp: Date.now(),
    });
  }, [content]);

  const handleMessage = (data: any) => {
    if (data.message.type === 'interaction') {
      syncManager.current.broadcast({
        type: 'interaction-sync',
        deviceId: data.deviceId,
        interaction: data.message.interaction,
        timestamp: Date.now(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = syncManager.current.on('message', handleMessage);
    return unsubscribe;
  }, []);

  return null;
};
```

### 性能监控

```typescript
/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();

  /**
   * 记录性能指标
   */
  recordMetric(deviceId: string, metric: PerformanceMetric): void {
    if (!this.metrics.has(deviceId)) {
      this.metrics.set(deviceId, []);
    }
    this.metrics.get(deviceId)!.push(metric);
  }

  /**
   * 获取设备指标
   */
  getMetrics(deviceId: string): PerformanceMetric[] {
    return this.metrics.get(deviceId) || [];
  }

  /**
   * 获取所有设备指标
   */
  getAllMetrics(): Map<string, PerformanceMetric[]> {
    return this.metrics;
  }

  /**
   * 计算平均指标
   */
  getAverageMetrics(deviceId: string): AverageMetrics {
    const metrics = this.getMetrics(deviceId);
    if (metrics.length === 0) {
      return {
        loadTime: 0,
        renderTime: 0,
        interactionTime: 0,
        memoryUsage: 0,
      };
    }

    const sum = metrics.reduce(
      (acc, metric) => ({
        loadTime: acc.loadTime + metric.loadTime,
        renderTime: acc.renderTime + metric.renderTime,
        interactionTime: acc.interactionTime + metric.interactionTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
      }),
      {
        loadTime: 0,
        renderTime: 0,
        interactionTime: 0,
        memoryUsage: 0,
      }
    );

    return {
      loadTime: sum.loadTime / metrics.length,
      renderTime: sum.renderTime / metrics.length,
      interactionTime: sum.interactionTime / metrics.length,
      memoryUsage: sum.memoryUsage / metrics.length,
    };
  }

  /**
   * 清除指标
   */
  clearMetrics(deviceId?: string): void {
    if (deviceId) {
      this.metrics.delete(deviceId);
    } else {
      this.metrics.clear();
    }
  }
}

/**
 * 性能指标
 */
export interface PerformanceMetric {
  /** 加载时间 (ms) */
  loadTime: number;

  /** 渲染时间 (ms) */
  renderTime: number;

  /** 交互响应时间 (ms) */
  interactionTime: number;

  /** 内存使用 (MB) */
  memoryUsage: number;

  /** 时间戳 */
  timestamp: number;
}

/**
 * 平均指标
 */
export interface AverageMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
}

/**
 * 性能监控组件
 */
export const PerformanceMonitorComponent: React.FC<{
  devices: DeviceConfig[];
  monitor: PerformanceMonitor;
}> = ({ devices, monitor }) => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const selectedMetrics = selectedDevice
    ? monitor.getMetrics(selectedDevice)
    : [];
  const averageMetrics = selectedDevice
    ? monitor.getAverageMetrics(selectedDevice)
    : null;

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h3>性能监控</h3>
        <select
          value={selectedDevice || ''}
          onChange={(e) => setSelectedDevice(e.target.value || null)}
        >
          <option value="">选择设备</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </div>

      {averageMetrics && (
        <div className="metrics-summary">
          <div className="metric-item">
            <span className="metric-label">平均加载时间</span>
            <span className="metric-value">
              {averageMetrics.loadTime.toFixed(2)} ms
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">平均渲染时间</span>
            <span className="metric-value">
              {averageMetrics.renderTime.toFixed(2)} ms
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">平均交互时间</span>
            <span className="metric-value">
              {averageMetrics.interactionTime.toFixed(2)} ms
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">平均内存使用</span>
            <span className="metric-value">
              {averageMetrics.memoryUsage.toFixed(2)} MB
            </span>
          </div>
        </div>
      )}

      <div className="metrics-chart">
        {selectedMetrics.length > 0 && (
          <Chart
            data={selectedMetrics}
            xKey="timestamp"
            yKeys={['loadTime', 'renderTime', 'interactionTime']}
          />
        )}
      </div>
    </div>
  );
};
```

### 响应式测试

```typescript
/**
 * 响应式断点测试
 */
export const ResponsiveBreakpointTest: React.FC<{
  content: string;
  breakpoints: Breakpoint[];
}> = ({ content, breakpoints }) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint | null>(
    null
  );

  const testBreakpoint = async (breakpoint: Breakpoint) => {
    setCurrentBreakpoint(breakpoint);

    const iframe = document.createElement('iframe');
    iframe.style.width = `${breakpoint.width}px`;
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(content);
      doc.close();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const issues = detectResponsiveIssues(doc, breakpoint);
      setCurrentBreakpoint({ ...breakpoint, issues });
    }

    document.body.removeChild(iframe);
  };

  return (
    <div className="responsive-test">
      <div className="breakpoint-list">
        {breakpoints.map((breakpoint) => (
          <button
            key={breakpoint.name}
            onClick={() => testBreakpoint(breakpoint)}
            className={currentBreakpoint?.name === breakpoint.name ? 'active' : ''}
          >
            {breakpoint.name} ({breakpoint.width}px)
          </button>
        ))}
      </div>

      {currentBreakpoint && (
        <div className="breakpoint-result">
          <h3>{currentBreakpoint.name}</h3>
          <div className="breakpoint-info">
            <span>宽度: {currentBreakpoint.width}px</span>
            <span>设备: {currentBreakpoint.device}</span>
          </div>
          {currentBreakpoint.issues && (
            <div className="responsive-issues">
              <h4>检测到的问题:</h4>
              <ul>
                {currentBreakpoint.issues.map((issue, index) => (
                  <li key={index} className={issue.severity}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 断点配置
 */
export interface Breakpoint {
  /** 断点名称 */
  name: string;

  /** 断点宽度 */
  width: number;

  /** 设备类型 */
  device: string;

  /** 检测到的问题 */
  issues?: ResponsiveIssue[];
}

/**
 * 响应式问题
 */
export interface ResponsiveIssue {
  /** 严重程度 */
  severity: 'error' | 'warning' | 'info';

  /** 问题描述 */
  message: string;

  /** 问题位置 */
  location?: string;
}

/**
 * 检测响应式问题
 */
function detectResponsiveIssues(
  doc: Document,
  breakpoint: Breakpoint
): ResponsiveIssue[] {
  const issues: ResponsiveIssue[] = [];

  const elements = doc.querySelectorAll('*');
  elements.forEach((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    if (rect.width > breakpoint.width) {
      issues.push({
        severity: 'error',
        message: `元素宽度 (${rect.width}px) 超过断点宽度 (${breakpoint.width}px)`,
        location: element.tagName.toLowerCase(),
      });
    }

    if (style.overflow === 'auto' || style.overflow === 'scroll') {
      if (element.scrollHeight > element.clientHeight) {
        issues.push({
          severity: 'warning',
          message: '元素出现垂直滚动条',
          location: element.tagName.toLowerCase(),
        });
      }
    }

    if (style.position === 'absolute' || style.position === 'fixed') {
      if (rect.right > breakpoint.width) {
        issues.push({
          severity: 'error',
          message: '绝对定位元素超出视口',
          location: element.tagName.toLowerCase(),
        });
      }
    }
  });

  return issues;
}
```

### 快捷操作

```typescript
/**
 * 快捷操作面板
 */
export const QuickActions: React.FC<{
  devices: DeviceConfig[];
  onRotate: (deviceId: string) => void;
  onRefresh: (deviceId: string) => void;
  onInspect: (deviceId: string) => void;
}> = ({ devices, onRotate, onRefresh, onInspect }) => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  return (
    <div className="quick-actions">
      <div className="device-dropdown">
        <select
          value={selectedDevice || ''}
          onChange={(e) => setSelectedDevice(e.target.value || null)}
        >
          <option value="">选择设备</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </div>

      <div className="action-buttons">
        <button
          onClick={() => selectedDevice && onRotate(selectedDevice)}
          disabled={!selectedDevice}
          title="旋转设备"
        >
          <span className="icon">rotate</span>
        </button>
        <button
          onClick={() => selectedDevice && onRefresh(selectedDevice)}
          disabled={!selectedDevice}
          title="刷新预览"
        >
          <span className="icon">refresh</span>
        </button>
        <button
          onClick={() => selectedDevice && onInspect(selectedDevice)}
          disabled={!selectedDevice}
          title="检查元素"
        >
          <span className="icon">inspect</span>
        </button>
      </div>

      <div className="global-actions">
        <button onClick={() => devices.forEach((d) => onRefresh(d.id))}>
          全部刷新
        </button>
        <button onClick={() => devices.forEach((d) => onInspect(d.id))}>
          全部检查
        </button>
      </div>
    </div>
  );
};
```

### 导出功能

```typescript
/**
 * 预览导出器
 */
export class PreviewExporter {
  /**
   * 导出截图
   */
  async exportScreenshot(
    deviceId: string,
    element: HTMLElement
  ): Promise<Blob> {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
  }

  /**
   * 导出所有截图
   */
  async exportAllScreenshots(
    devices: DeviceConfig[],
    elements: Map<string, HTMLElement>
  ): Promise<Map<string, Blob>> {
    const screenshots = new Map<string, Blob>();

    for (const [deviceId, element] of elements) {
      const screenshot = await this.exportScreenshot(deviceId, element);
      screenshots.set(deviceId, screenshot);
    }

    return screenshots;
  }

  /**
   * 导出性能报告
   */
  exportPerformanceReport(
    metrics: Map<string, PerformanceMetric[]>
  ): string {
    const report: any[] = [];

    metrics.forEach((deviceMetrics, deviceId) => {
      const avgMetrics = deviceMetrics.reduce(
        (acc, metric) => ({
          loadTime: acc.loadTime + metric.loadTime,
          renderTime: acc.renderTime + metric.renderTime,
          interactionTime: acc.interactionTime + metric.interactionTime,
          memoryUsage: acc.memoryUsage + metric.memoryUsage,
        }),
        {
          loadTime: 0,
          renderTime: 0,
          interactionTime: 0,
          memoryUsage: 0,
        }
      );

      const count = deviceMetrics.length;
      report.push({
        deviceId,
        avgLoadTime: avgMetrics.loadTime / count,
        avgRenderTime: avgMetrics.renderTime / count,
        avgInteractionTime: avgMetrics.interactionTime / count,
        avgMemoryUsage: avgMetrics.memoryUsage / count,
        sampleCount: count,
      });
    });

    return JSON.stringify(report, null, 2);
  }

  /**
   * 导出响应式测试报告
   */
  exportResponsiveReport(
    tests: Map<string, ResponsiveIssue[]>
  ): string {
    const report: any[] = [];

    tests.forEach((issues, breakpoint) => {
      report.push({
        breakpoint,
        issueCount: issues.length,
        errorCount: issues.filter((i) => i.severity === 'error').length,
        warningCount: issues.filter((i) => i.severity === 'warning').length,
        infoCount: issues.filter((i) => i.severity === 'info').length,
        issues,
      });
    });

    return JSON.stringify(report, null, 2);
  }
}
```

---

## ✅ 验收标准

### 功能完整性

- [ ] 支持多种预设设备模拟
- [ ] 支持自定义设备配置
- [ ] 实时预览内容更新
- [ ] 多设备同时预览
- [ ] 设备旋转功能
- [ ] 预览网格布局切换
- [ ] 实时同步交互
- [ ] 性能监控和指标收集
- [ ] 响应式断点测试
- [ ] 截图导出功能

### 代码质量

- [ ] TypeScript 类型定义完整
- [ ] 组件可复用性高
- [ ] 性能优化到位
- [ ] 错误处理完善
- [ ] 代码风格统一

### 用户体验

- [ ] 界面直观易用
- [ ] 操作响应迅速
- [ ] 加载状态清晰
- [ ] 错误提示友好
- [ ] 快捷操作便捷

---

## 📚 相关文档

- [YYC3-P1-前端-实时预览.md](../P1-核心功能/YYC3-P1-前端-实时预览.md)
- [YYC3-P2-预览-预览历史.md](./YYC3-P2-预览-预览历史.md)
- [YYC3-P0-架构-类型定义.md](../P0-核心架构/YYC3-P0-架构-类型定义.md)

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
| 内容校验 | b492088a86ff4783 |
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
