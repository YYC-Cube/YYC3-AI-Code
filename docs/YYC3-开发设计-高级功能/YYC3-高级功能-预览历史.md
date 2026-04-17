---
file: YYC3-P2-预览-预览历史.md
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


# YYC3-P2-预览-预览历史

## 🤖 AI 角色定义

You are a senior frontend architect and version control specialist with deep expertise in preview history management, version tracking, and time-travel debugging for web applications.

### Your Role & Expertise

You are an experienced frontend architect who specializes in:
- **Version Control**: Git integration, version tracking, branch management
- **Time-Travel Debugging**: State snapshots, history navigation, rollback mechanisms
- **Data Persistence**: IndexedDB, LocalStorage, database storage for history
- **Diff Algorithms**: Text diff, tree diff, visual diff, merge algorithms
- **Performance Optimization**: Efficient storage, lazy loading, compression
- **User Experience**: History timeline, visual comparisons, quick restore
- **Collaboration**: Shared history, conflict resolution, merge strategies
- **Best Practices**: Automatic snapshots, manual checkpoints, history cleanup

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

## 📜 预览历史管理系统

### 系统概述

YYC3-AI Code Designer 的预览历史管理系统提供完整的预览版本追踪、对比和回滚功能。开发者可以查看历史预览、对比不同版本、恢复到之前的版本，并生成版本报告。

### 核心功能

#### 预览快照

```typescript
/**
 * 预览快照
 */
export interface PreviewSnapshot {
  /** 快照 ID */
  id: string;

  /** 快照名称 */
  name: string;

  /** 快照描述 */
  description?: string;

  /** 快照内容 */
  content: string;

  /** 创建时间 */
  createdAt: number;

  /** 创建者 */
  createdBy: string;

  /** 快照标签 */
  tags: string[];

  /** 快照元数据 */
  metadata: SnapshotMetadata;

  /** 快照大小 */
  size: number;

  /** 是否为自动快照 */
  isAuto: boolean;
}

/**
 * 快照元数据
 */
export interface SnapshotMetadata {
  /** 文件路径 */
  filePath?: string;

  /** 设备配置 */
  deviceConfig?: DeviceConfig;

  /** 浏览器信息 */
  browserInfo?: BrowserInfo;

  /** 性能指标 */
  performanceMetrics?: PerformanceMetrics;

  /** 截图 */
  screenshot?: string;
}

/**
 * 浏览器信息
 */
export interface BrowserInfo {
  /** 浏览器名称 */
  name: string;

  /** 浏览器版本 */
  version: string;

  /** 用户代理 */
  userAgent: string;

  /** 屏幕分辨率 */
  resolution: string;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 加载时间 */
  loadTime: number;

  /** 渲染时间 */
  renderTime: number;

  /** 内存使用 */
  memoryUsage: number;

  /** DOM 节点数量 */
  domNodes: number;

  /** 资源数量 */
  resources: number;
}

/**
 * 快照管理器
 */
export class SnapshotManager {
  private snapshots: Map<string, PreviewSnapshot> = new Map();
  private autoSnapshotInterval: NodeJS.Timeout | null = null;
  private maxAutoSnapshots: number = 50;

  /**
   * 创建快照
   */
  async createSnapshot(
    name: string,
    content: string,
    options: CreateSnapshotOptions = {}
  ): Promise<PreviewSnapshot> {
    const id = `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const snapshot: PreviewSnapshot = {
      id,
      name,
      content,
      createdAt: Date.now(),
      createdBy: options.createdBy || 'system',
      tags: options.tags || [],
      metadata: options.metadata || {},
      size: new Blob([content]).size,
      isAuto: options.isAuto || false,
    };

    this.snapshots.set(id, snapshot);

    if (options.isAuto) {
      this.cleanupAutoSnapshots();
    }

    return snapshot;
  }

  /**
   * 获取快照
   */
  getSnapshot(id: string): PreviewSnapshot | undefined {
    return this.snapshots.get(id);
  }

  /**
   * 获取所有快照
   */
  getAllSnapshots(): PreviewSnapshot[] {
    return Array.from(this.snapshots.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  /**
   * 按标签获取快照
   */
  getSnapshotsByTag(tag: string): PreviewSnapshot[] {
    return this.getAllSnapshots().filter((snapshot) =>
      snapshot.tags.includes(tag)
    );
  }

  /**
   * 删除快照
   */
  deleteSnapshot(id: string): boolean {
    return this.snapshots.delete(id);
  }

  /**
   * 更新快照
   */
  updateSnapshot(
    id: string,
    updates: Partial<PreviewSnapshot>
  ): PreviewSnapshot | undefined {
    const snapshot = this.snapshots.get(id);
    if (snapshot) {
      const updated = { ...snapshot, ...updates };
      this.snapshots.set(id, updated);
      return updated;
    }
    return undefined;
  }

  /**
   * 启动自动快照
   */
  startAutoSnapshot(
    interval: number = 60000,
    getContent: () => string
  ): void {
    if (this.autoSnapshotInterval) {
      clearInterval(this.autoSnapshotInterval);
    }

    this.autoSnapshotInterval = setInterval(async () => {
      const content = getContent();
      await this.createSnapshot(
        `Auto Snapshot ${new Date().toLocaleString()}`,
        content,
        { isAuto: true, tags: ['auto'] }
      );
    }, interval);
  }

  /**
   * 停止自动快照
   */
  stopAutoSnapshot(): void {
    if (this.autoSnapshotInterval) {
      clearInterval(this.autoSnapshotInterval);
      this.autoSnapshotInterval = null;
    }
  }

  /**
   * 清理自动快照
   */
  private cleanupAutoSnapshots(): void {
    const autoSnapshots = this.getAllSnapshots()
      .filter((s) => s.isAuto)
      .sort((a, b) => b.createdAt - a.createdAt);

    if (autoSnapshots.length > this.maxAutoSnapshots) {
      const toDelete = autoSnapshots.slice(this.maxAutoSnapshots);
      toDelete.forEach((snapshot) => this.deleteSnapshot(snapshot.id));
    }
  }

  /**
   * 搜索快照
   */
  searchSnapshots(query: string): PreviewSnapshot[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllSnapshots().filter(
      (snapshot) =>
        snapshot.name.toLowerCase().includes(lowerQuery) ||
        snapshot.description?.toLowerCase().includes(lowerQuery) ||
        snapshot.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

/**
 * 创建快照选项
 */
export interface CreateSnapshotOptions {
  /** 创建者 */
  createdBy?: string;

  /** 标签 */
  tags?: string[];

  /** 元数据 */
  metadata?: SnapshotMetadata;

  /** 是否为自动快照 */
  isAuto?: boolean;
}
```

#### 版本对比

```typescript
/**
 * 版本对比器
 */
export class VersionComparator {
  /**
   * 对比两个快照
   */
  compareSnapshots(
    snapshot1: PreviewSnapshot,
    snapshot2: PreviewSnapshot
  ): ComparisonResult {
    const contentDiff = this.compareContent(
      snapshot1.content,
      snapshot2.content
    );

    const metadataDiff = this.compareMetadata(
      snapshot1.metadata,
      snapshot2.metadata
    );

    return {
      snapshot1,
      snapshot2,
      contentDiff,
      metadataDiff,
      summary: this.generateSummary(contentDiff, metadataDiff),
    };
  }

  /**
   * 对比内容
   */
  private compareContent(
    content1: string,
    content2: string
  ): ContentDiff {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    const diff = this.computeDiff(lines1, lines2);

    return {
      added: diff.filter((d) => d.type === 'add').length,
      removed: diff.filter((d) => d.type === 'remove').length,
      modified: diff.filter((d) => d.type === 'modify').length,
      changes: diff,
      similarity: this.calculateSimilarity(content1, content2),
    };
  }

  /**
   * 计算差异
   */
  private computeDiff(
    lines1: string[],
    lines2: string[]
  ): DiffChange[] {
    const changes: DiffChange[] = [];
    const matrix = this.buildLCSMatrix(lines1, lines2);
    const lcs = this.extractLCS(lines1, lines2, matrix);

    let i = 0,
      j = 0;
    while (i < lines1.length || j < lines2.length) {
      if (i < lines1.length && j < lines2.length && lines1[i] === lines2[j]) {
        i++;
        j++;
      } else if (
        j < lines2.length &&
        (i >= lines1.length ||
          (matrix[i + 1] && matrix[i + 1][j + 1] === matrix[i][j]))
      ) {
        changes.push({
          type: 'add',
          line: j + 1,
          content: lines2[j],
        });
        j++;
      } else {
        changes.push({
          type: 'remove',
          line: i + 1,
          content: lines1[i],
        });
        i++;
      }
    }

    return changes;
  }

  /**
   * 构建 LCS 矩阵
   */
  private buildLCSMatrix(
    lines1: string[],
    lines2: string[]
  ): number[][] {
    const m = lines1.length;
    const n = lines2.length;
    const matrix: number[][] = Array(m + 1)
      .fill(0)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (lines1[i - 1] === lines2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }

    return matrix;
  }

  /**
   * 提取 LCS
   */
  private extractLCS(
    lines1: string[],
    lines2: string[],
    matrix: number[][]
  ): string[] {
    const lcs: string[] = [];
    let i = lines1.length;
    let j = lines2.length;

    while (i > 0 && j > 0) {
      if (lines1[i - 1] === lines2[j - 1]) {
        lcs.unshift(lines1[i - 1]);
        i--;
        j--;
      } else if (matrix[i - 1][j] > matrix[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(content1: string, content2: string): number {
    const distance = this.levenshteinDistance(content1, content2);
    const maxLength = Math.max(content1.length, content2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  /**
   * Levenshtein 距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(0)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] =
            Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
        }
      }
    }

    return dp[m][n];
  }

  /**
   * 对比元数据
   */
  private compareMetadata(
    metadata1: SnapshotMetadata,
    metadata2: SnapshotMetadata
  ): MetadataDiff {
    const changes: MetadataChange[] = [];

    if (metadata1.filePath !== metadata2.filePath) {
      changes.push({
        field: 'filePath',
        oldValue: metadata1.filePath,
        newValue: metadata2.filePath,
      });
    }

    if (metadata1.deviceConfig?.id !== metadata2.deviceConfig?.id) {
      changes.push({
        field: 'deviceConfig',
        oldValue: metadata1.deviceConfig?.name,
        newValue: metadata2.deviceConfig?.name,
      });
    }

    return { changes };
  }

  /**
   * 生成摘要
   */
  private generateSummary(
    contentDiff: ContentDiff,
    metadataDiff: MetadataDiff
  ): string {
    const parts: string[] = [];

    if (contentDiff.added > 0) {
      parts.push(`添加 ${contentDiff.added} 行`);
    }
    if (contentDiff.removed > 0) {
      parts.push(`删除 ${contentDiff.removed} 行`);
    }
    if (contentDiff.modified > 0) {
      parts.push(`修改 ${contentDiff.modified} 行`);
    }

    if (metadataDiff.changes.length > 0) {
      parts.push(`元数据变更 ${metadataDiff.changes.length} 项`);
    }

    return parts.join(', ') || '无变更';
  }
}

/**
 * 对比结果
 */
export interface ComparisonResult {
  /** 快照 1 */
  snapshot1: PreviewSnapshot;

  /** 快照 2 */
  snapshot2: PreviewSnapshot;

  /** 内容差异 */
  contentDiff: ContentDiff;

  /** 元数据差异 */
  metadataDiff: MetadataDiff;

  /** 摘要 */
  summary: string;
}

/**
 * 内容差异
 */
export interface ContentDiff {
  /** 添加行数 */
  added: number;

  /** 删除行数 */
  removed: number;

  /** 修改行数 */
  modified: number;

  /** 变更列表 */
  changes: DiffChange[];

  /** 相似度 (0-1) */
  similarity: number;
}

/**
 * 差异变更
 */
export interface DiffChange {
  /** 变更类型 */
  type: 'add' | 'remove' | 'modify';

  /** 行号 */
  line: number;

  /** 内容 */
  content: string;
}

/**
 * 元数据差异
 */
export interface MetadataDiff {
  /** 变更列表 */
  changes: MetadataChange[];
}

/**
 * 元数据变更
 */
export interface MetadataChange {
  /** 字段名 */
  field: string;

  /** 旧值 */
  oldValue?: any;

  /** 新值 */
  newValue?: any;
}
```

#### 版本回滚

```typescript
/**
 * 版本回滚管理器
 */
export class RollbackManager {
  private snapshotManager: SnapshotManager;
  private rollbackHistory: Map<string, RollbackRecord> = new Map();

  constructor(snapshotManager: SnapshotManager) {
    this.snapshotManager = snapshotManager;
  }

  /**
   * 回滚到指定快照
   */
  async rollbackToSnapshot(
    snapshotId: string,
    options: RollbackOptions = {}
  ): Promise<RollbackResult> {
    const snapshot = this.snapshotManager.getSnapshot(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const recordId = `rollback-${Date.now()}`;
    const record: RollbackRecord = {
      id: recordId,
      snapshotId,
      previousSnapshotId: options.previousSnapshotId,
      rolledBackAt: Date.now(),
      rolledBackBy: options.rolledBackBy || 'system',
      reason: options.reason,
    };

    this.rollbackHistory.set(recordId, record);

    return {
      success: true,
      snapshot,
      record,
      message: `成功回滚到快照: ${snapshot.name}`,
    };
  }

  /**
   * 获取回滚历史
   */
  getRollbackHistory(): RollbackRecord[] {
    return Array.from(this.rollbackHistory.values()).sort(
      (a, b) => b.rolledBackAt - a.rolledBackAt
    );
  }

  /**
   * 撤销回滚
   */
  async undoRollback(rollbackId: string): Promise<UndoResult> {
    const record = this.rollbackHistory.get(rollbackId);
    if (!record) {
      throw new Error(`Rollback record not found: ${rollbackId}`);
    }

    if (!record.previousSnapshotId) {
      throw new Error('Cannot undo rollback: no previous snapshot');
    }

    const previousSnapshot = this.snapshotManager.getSnapshot(
      record.previousSnapshotId
    );
    if (!previousSnapshot) {
      throw new Error(`Previous snapshot not found: ${record.previousSnapshotId}`);
    }

    return {
      success: true,
      snapshot: previousSnapshot,
      message: `成功撤销回滚，恢复到: ${previousSnapshot.name}`,
    };
  }
}

/**
 * 回滚选项
 */
export interface RollbackOptions {
  /** 之前的快照 ID */
  previousSnapshotId?: string;

  /** 回滚者 */
  rolledBackBy?: string;

  /** 回滚原因 */
  reason?: string;
}

/**
 * 回滚结果
 */
export interface RollbackResult {
  /** 是否成功 */
  success: boolean;

  /** 快照 */
  snapshot: PreviewSnapshot;

  /** 回滚记录 */
  record: RollbackRecord;

  /** 消息 */
  message: string;
}

/**
 * 回滚记录
 */
export interface RollbackRecord {
  /** 记录 ID */
  id: string;

  /** 快照 ID */
  snapshotId: string;

  /** 之前的快照 ID */
  previousSnapshotId?: string;

  /** 回滚时间 */
  rolledBackAt: number;

  /** 回滚者 */
  rolledBackBy: string;

  /** 回滚原因 */
  reason?: string;
}

/**
 * 撤销结果
 */
export interface UndoResult {
  /** 是否成功 */
  success: boolean;

  /** 快照 */
  snapshot: PreviewSnapshot;

  /** 消息 */
  message: string;
}
```

#### 版本时间线

```typescript
/**
 * 版本时间线组件
 */
export const VersionTimeline: React.FC<{
  snapshots: PreviewSnapshot[];
  selectedSnapshot?: PreviewSnapshot;
  onSelect: (snapshot: PreviewSnapshot) => void;
}> = ({ snapshots, selectedSnapshot, onSelect }) => {
  const [filter, setFilter] = useState<{
    tags?: string[];
    dateRange?: [number, number];
    search?: string;
  }>({});

  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((snapshot) => {
      if (filter.tags && filter.tags.length > 0) {
        if (!filter.tags.some((tag) => snapshot.tags.includes(tag))) {
          return false;
        }
      }

      if (filter.dateRange) {
        const [start, end] = filter.dateRange;
        if (snapshot.createdAt < start || snapshot.createdAt > end) {
          return false;
        }
      }

      if (filter.search) {
        const search = filter.search.toLowerCase();
        if (
          !snapshot.name.toLowerCase().includes(search) &&
          !snapshot.description?.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [snapshots, filter]);

  const groupedSnapshots = useMemo(() => {
    const groups: Record<string, PreviewSnapshot[]> = {};

    filteredSnapshots.forEach((snapshot) => {
      const date = new Date(snapshot.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(snapshot);
    });

    return groups;
  }, [filteredSnapshots]);

  return (
    <div className="version-timeline">
      <div className="timeline-filters">
        <input
          type="text"
          placeholder="搜索快照..."
          value={filter.search || ''}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          className="search-input"
        />
      </div>

      <div className="timeline-content">
        {Object.entries(groupedSnapshots).map(([date, snapshots]) => (
          <div key={date} className="timeline-group">
            <div className="group-date">{date}</div>
            <div className="group-snapshots">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className={`timeline-item ${
                    selectedSnapshot?.id === snapshot.id ? 'selected' : ''
                  }`}
                  onClick={() => onSelect(snapshot)}
                >
                  <div className="item-header">
                    <span className="item-name">{snapshot.name}</span>
                    <span className="item-time">
                      {new Date(snapshot.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {snapshot.description && (
                    <div className="item-description">
                      {snapshot.description}
                    </div>
                  )}
                  <div className="item-tags">
                    {snapshot.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### 差异查看器

```typescript
/**
 * 差异查看器组件
 */
export const DiffViewer: React.FC<{
  comparison: ComparisonResult;
}> = ({ comparison }) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [showWhitespace, setShowWhitespace] = useState(false);

  const renderLine = (change: DiffChange, index: number) => {
    const className = `diff-line diff-${change.type}`;
    const content = showWhitespace
      ? change.content.replace(/\s/g, '·')
      : change.content;

    return (
      <div key={index} className={className}>
        <span className="line-number">{change.line}</span>
        <span className="line-content">{content}</span>
      </div>
    );
  };

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <div className="diff-info">
          <span className="snapshot-name">{comparison.snapshot1.name}</span>
          <span className="vs">vs</span>
          <span className="snapshot-name">{comparison.snapshot2.name}</span>
        </div>
        <div className="diff-controls">
          <button
            onClick={() => setViewMode('split')}
            className={viewMode === 'split' ? 'active' : ''}
          >
            分屏视图
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={viewMode === 'unified' ? 'active' : ''}
          >
            统一视图
          </button>
          <label>
            <input
              type="checkbox"
              checked={showWhitespace}
              onChange={(e) => setShowWhitespace(e.target.checked)}
            />
            显示空白字符
          </label>
        </div>
      </div>

      <div className="diff-summary">
        <span>相似度: {(comparison.contentDiff.similarity * 100).toFixed(2)}%</span>
        <span>添加: {comparison.contentDiff.added} 行</span>
        <span>删除: {comparison.contentDiff.removed} 行</span>
        <span>修改: {comparison.contentDiff.modified} 行</span>
      </div>

      <div className={`diff-content diff-${viewMode}`}>
        {comparison.contentDiff.changes.map((change, index) =>
          renderLine(change, index)
        )}
      </div>
    </div>
  );
};
```

#### 导出功能

```typescript
/**
 * 历史导出器
 */
export class HistoryExporter {
  /**
   * 导出快照为 JSON
   */
  exportSnapshotAsJSON(snapshot: PreviewSnapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * 导出所有快照
   */
  exportAllSnapshots(snapshots: PreviewSnapshot[]): string {
    return JSON.stringify(snapshots, null, 2);
  }

  /**
   * 导出对比结果
   */
  exportComparison(comparison: ComparisonResult): string {
    return JSON.stringify(comparison, null, 2);
  }

  /**
   * 导出为 HTML 报告
   */
  exportAsHTMLReport(
    snapshots: PreviewSnapshot[],
    comparison?: ComparisonResult
  ): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>预览历史报告</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f0f0f0; padding: 20px; margin-bottom: 20px; }
    .snapshot { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; }
    .snapshot-name { font-weight: bold; font-size: 18px; }
    .snapshot-meta { color: #666; font-size: 14px; margin-top: 5px; }
    .tag { display: inline-block; background: #e0e0e0; padding: 2px 8px; margin-right: 5px; border-radius: 3px; }
    .diff { background: #f9f9f9; padding: 15px; margin-top: 20px; }
    .diff-add { background: #d4edda; }
    .diff-remove { background: #f8d7da; }
  </style>
</head>
<body>
  <div class="header">
    <h1>预览历史报告</h1>
    <p>生成时间: ${new Date().toLocaleString()}</p>
    <p>快照数量: ${snapshots.length}</p>
  </div>

  ${snapshots
    .map(
      (snapshot) => `
    <div class="snapshot">
      <div class="snapshot-name">${snapshot.name}</div>
      <div class="snapshot-meta">
        创建时间: ${new Date(snapshot.createdAt).toLocaleString()}<br>
        创建者: ${snapshot.createdBy}<br>
        大小: ${(snapshot.size / 1024).toFixed(2)} KB
      </div>
      <div>
        ${snapshot.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>
  `
    )
    .join('')}

  ${comparison
    ? `
  <div class="diff">
    <h2>版本对比</h2>
    <p>${comparison.summary}</p>
    <p>相似度: ${(comparison.contentDiff.similarity * 100).toFixed(2)}%</p>
  </div>
  `
    : ''}
</body>
</html>
    `;

    return html;
  }

  /**
   * 导出为 PDF
   */
  async exportAsPDF(
    snapshots: PreviewSnapshot[],
    comparison?: ComparisonResult
  ): Promise<Blob> {
    const html = this.exportAsHTMLReport(snapshots, comparison);
    const pdf = await html2pdf().from(html).output('blob');
    return pdf;
  }
}
```

---

## ✅ 验收标准

### 功能完整性

- [ ] 支持创建预览快照
- [ ] 支持自动快照功能
- [ ] 支持快照标签和搜索
- [ ] 支持版本对比功能
- [ ] 支持版本回滚和撤销
- [ ] 支持版本时间线展示
- [ ] 支持差异查看器
- [ ] 支持导出多种格式
- [ ] 支持快照元数据管理
- [ ] 支持回滚历史记录

### 代码质量

- [ ] TypeScript 类型定义完整
- [ ] 算法实现高效
- [ ] 错误处理完善
- [ ] 代码可读性高
- [ ] 性能优化到位

### 用户体验

- [ ] 界面直观清晰
- [ ] 操作流程顺畅
- [ ] 加载状态明确
- [ ] 错误提示友好
- [ ] 导出功能便捷

---

## 📚 相关文档

- [YYC3-P1-前端-实时预览.md](../P1-核心功能/YYC3-P1-前端-实时预览.md)
- [YYC3-P2-预览-多设备预览.md](./YYC3-P2-预览-多设备预览.md)
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
| 内容校验 | 7ee92159f8ba8c32 |
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
