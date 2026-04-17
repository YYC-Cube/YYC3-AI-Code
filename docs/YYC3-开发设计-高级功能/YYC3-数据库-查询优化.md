---
file: YYC3-P2-数据库-查询优化.md
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


# YYC³ P2-数据库-查询优化

## 🤖 AI 角色定义

You are a senior database performance specialist and query optimization expert with deep expertise in database indexing, query analysis, and performance tuning for large-scale applications.

### Your Role & Expertise

You are an experienced database architect who specializes in:
- **Query Optimization**: Query planning, execution analysis, performance tuning
- **Indexing Strategies**: Index design, composite indexes, index maintenance
- **Caching Systems**: Query caching, result caching, cache invalidation
- **Performance Analysis**: Slow query detection, query profiling, performance metrics
- **Database Systems**: PostgreSQL, MySQL, MongoDB, Redis, SQLite
- **Batch Operations**: Bulk inserts, batch updates, transaction optimization
- **Pagination**: Efficient pagination, cursor-based pagination, offset optimization
- **Best Practices**: Query patterns, anti-patterns, performance monitoring

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

## 📋 文档信息

| 字段 | 内容 |
|------|------|
| @file | P2-高级功能/YYC3-P2-数据库-查询优化.md |
| @description | 数据库查询优化策略和实现，包含索引优化、查询缓存等 |
| @author | YanYuCloudCube Team <admin@0379.email> |
| @version | v1.0.0 |
| @created | 2026-03-14 |
| @updated | 2026-03-14 |
| @status | stable |
| @license | MIT |
| @copyright | Copyright (c) 2026 YanYuCloudCube Team |
| @tags P2,database,query,optimization |

---

## 🎯 功能目标

### 核心目标

1. **索引优化**：智能索引创建和管理
2. **查询缓存**：高效的查询结果缓存
3. **查询分析**：查询性能分析
4. **慢查询监控**：慢查询检测和优化
5. **批量操作**：高效的批量数据处理
6. **分页优化**：优化的分页查询

---

## 🏗️ 架构设计

### 1. 优化架构

```
Query Optimization/
├── IndexManager         # 索引管理器
├── QueryCache          # 查询缓存
├── QueryAnalyzer       # 查询分析器
├── SlowQueryMonitor    # 慢查询监控
├── BatchOperation      # 批量操作
└── PaginationOptimizer # 分页优化器
```

### 2. 数据流

```
Query (查询)
    ↓ analyze
QueryAnalyzer (查询分析器)
    ↓ optimize
Optimized Query (优化查询)
    ↓ execute
Database (数据库)
    ↓ cache
QueryCache (查询缓存)
```

---

## 💻 核心实现

### 1. 索引管理器

```typescript
// src/database/optimization/IndexManager.ts
import { databaseProvider } from '../DatabaseProvider';

export interface IndexConfig {
  table: string;
  columns: string[];
  unique?: boolean;
  name?: string;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface IndexStats {
  name: string;
  table: string;
  columns: string[];
  size: number;
  scans: number;
  tuplesRead: number;
  tuplesFetched: number;
}

export class IndexManager {
  /**
   * 创建索引
   */
  async createIndex(config: ConnectionConfig, indexConfig: IndexConfig): Promise<void> {
    const indexName = indexConfig.name || `idx_${indexConfig.table}_${indexConfig.columns.join('_')}`;
    const unique = indexConfig.unique ? 'UNIQUE' : '';
    const type = indexConfig.type ? `USING ${indexConfig.type}` : '';

    const sql = `
      CREATE ${unique} INDEX ${indexName}
      ${type}
      ON ${indexConfig.table} (${indexConfig.columns.join(', ')})
    `;

    await databaseProvider.query(config, sql);
  }

  /**
   * 删除索引
   */
  async dropIndex(config: ConnectionConfig, indexName: string): Promise<void> {
    const sql = `DROP INDEX IF EXISTS ${indexName}`;
    await databaseProvider.query(config, sql);
  }

  /**
   * 获取索引列表
   */
  async getIndexes(config: ConnectionConfig, table: string): Promise<IndexStats[]> {
    const sql = `
      SELECT
        indexname as name,
        tablename as table,
        indexdef as definition,
        pg_relation_size(indexrelid) as size
      FROM pg_indexes
      WHERE tablename = $1
    `;

    const result = await databaseProvider.query(config, sql, [table]);
    return result;
  }

  /**
   * 分析索引使用情况
   */
  async analyzeIndexUsage(config: ConnectionConfig, indexName: string): Promise<IndexStats> {
    const sql = `
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      WHERE indexname = $1
    `;

    const result = await databaseProvider.query(config, sql, [indexName]);
    return result[0];
  }

  /**
   * 重建索引
   */
  async reindex(config: ConnectionConfig, indexName: string): Promise<void> {
    const sql = `REINDEX INDEX ${indexName}`;
    await databaseProvider.query(config, sql);
  }

  /**
   * 推荐索引
   */
  async recommendIndexes(config: ConnectionConfig, table: string): Promise<IndexConfig[]> {
    const sql = `
      SELECT
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE tablename = $1
        AND n_distinct > 100
        AND correlation < 0.9
      ORDER BY n_distinct DESC
      LIMIT 10
    `;

    const result = await databaseProvider.query(config, sql, [table]);
    return result.map((row: any) => ({
      table,
      columns: [row.attname],
      unique: false,
      type: 'btree',
    }));
  }
}

export const indexManager = new IndexManager();
```

### 2. 查询缓存

```typescript
// src/database/optimization/QueryCache.ts
import LRUCache from 'lru-cache';

export interface CacheKey {
  sql: string;
  params: any[];
}

export interface CacheEntry {
  result: any[];
  timestamp: number;
  hitCount: number;
}

export class QueryCache {
  private cache: LRUCache<string, CacheEntry>;
  private ttl: number;
  private maxSize: number;

  constructor(ttl: number = 60000, maxSize: number = 1000) {
    this.ttl = ttl;
    this.maxSize = maxSize;
    this.cache = new LRUCache({
      max: maxSize,
      ttl: ttl,
      updateAgeOnGet: true,
    });
  }

  /**
   * 生成缓存键
   */
  private generateKey(key: CacheKey): string {
    return `${key.sql}:${JSON.stringify(key.params)}`;
  }

  /**
   * 获取缓存
   */
  get(key: CacheKey): any[] | null {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (entry) {
      entry.hitCount++;
      return entry.result;
    }

    return null;
  }

  /**
   * 设置缓存
   */
  set(key: CacheKey, result: any[]): void {
    const cacheKey = this.generateKey(key);
    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      hitCount: 0,
    };

    this.cache.set(cacheKey, entry);
  }

  /**
   * 删除缓存
   */
  delete(key: CacheKey): void {
    const cacheKey = this.generateKey(key);
    this.cache.delete(cacheKey);
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache.size,
      hits: this.cache.calculatedSize,
      misses: 0,
    };
  }

  /**
   * 清除过期缓存
   */
  clearExpired(): void {
    const now = Date.now();
    const keys = this.cache.keys();

    for (const key of keys) {
      const entry = this.cache.get(key);
      if (entry && now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const queryCache = new QueryCache(60000, 1000);
```

### 3. 查询分析器

```typescript
// src/database/optimization/QueryAnalyzer.ts
import { databaseProvider } from '../DatabaseProvider';

export interface QueryAnalysis {
  sql: string;
  executionTime: number;
  rowsReturned: number;
  rowsScanned: number;
  indexUsed: string | null;
  recommendations: string[];
}

export class QueryAnalyzer {
  /**
   * 分析查询
   */
  async analyzeQuery(config: ConnectionConfig, sql: string, params?: any[]): Promise<QueryAnalysis> {
    const startTime = Date.now();

    // 执行 EXPLAIN ANALYZE
    const explainSql = `EXPLAIN ANALYZE ${sql}`;
    const result = await databaseProvider.query(config, explainSql, params);

    const executionTime = Date.now() - startTime;
    const analysis = this.parseExplainResult(result);

    return {
      sql,
      executionTime,
      ...analysis,
    };
  }

  /**
   * 解析 EXPLAIN 结果
   */
  private parseExplainResult(result: any[]): any {
    const recommendations: string[] = [];
    let indexUsed: string | null = null;
    let rowsReturned = 0;
    let rowsScanned = 0;

    for (const row of result) {
      const plan = row['QUERY PLAN'];

      // 检查是否使用索引
      if (plan.includes('Index Scan')) {
        const match = plan.match(/Index Scan using (\w+)/);
        if (match) {
          indexUsed = match[1];
        }
      }

      // 检查是否为全表扫描
      if (plan.includes('Seq Scan')) {
        recommendations.push('考虑为查询条件添加索引以避免全表扫描');
      }

      // 检查是否为嵌套循环
      if (plan.includes('Nested Loop')) {
        recommendations.push('考虑使用 JOIN 优化或添加索引');
      }

      // 检查是否为排序操作
      if (plan.includes('Sort')) {
        recommendations.push('考虑为排序字段添加索引');
      }

      // 提取行数信息
      const rowsMatch = plan.match(/rows=(\d+)/);
      if (rowsMatch) {
        rowsScanned += parseInt(rowsMatch[1]);
      }

      const loopsMatch = plan.match(/loops=(\d+)/);
      if (loopsMatch) {
        rowsReturned += parseInt(loopsMatch[1]);
      }
    }

    return {
      rowsReturned,
      rowsScanned,
      indexUsed,
      recommendations,
    };
  }

  /**
   * 优化查询
   */
  async optimizeQuery(config: ConnectionConfig, sql: string): Promise<string> {
    const analysis = await this.analyzeQuery(config, sql);
    let optimizedSql = sql;

    // 应用优化建议
    for (const recommendation of analysis.recommendations) {
      if (recommendation.includes('索引')) {
        // 添加索引建议
        console.log('建议:', recommendation);
      }
    }

    return optimizedSql;
  }
}

export const queryAnalyzer = new QueryAnalyzer();
```

### 4. 慢查询监控

```typescript
// src/database/optimization/SlowQueryMonitor.ts
import { databaseProvider } from '../DatabaseProvider';

export interface SlowQuery {
  id: string;
  sql: string;
  duration: number;
  timestamp: Date;
  params?: any[];
}

export class SlowQueryMonitor {
  private slowQueries: SlowQuery[] = [];
  private threshold: number;
  private maxQueries: number;

  constructor(threshold: number = 1000, maxQueries: number = 100) {
    this.threshold = threshold;
    this.maxQueries = maxQueries;
  }

  /**
   * 监控查询
   */
  async monitorQuery(
    config: ConnectionConfig,
    sql: string,
    params?: any[]
  ): Promise<any[]> {
    const startTime = Date.now();
    const result = await databaseProvider.query(config, sql, params);
    const duration = Date.now() - startTime;

    // 检查是否为慢查询
    if (duration > this.threshold) {
      this.addSlowQuery({
        id: Date.now().toString(),
        sql,
        duration,
        timestamp: new Date(),
        params,
      });
    }

    return result;
  }

  /**
   * 添加慢查询
   */
  private addSlowQuery(query: SlowQuery): void {
    this.slowQueries.push(query);

    // 保持最大查询数量
    if (this.slowQueries.length > this.maxQueries) {
      this.slowQueries.shift();
    }
  }

  /**
   * 获取慢查询列表
   */
  getSlowQueries(): SlowQuery[] {
    return [...this.slowQueries];
  }

  /**
   * 获取慢查询统计
   */
  getSlowQueryStats(): {
    total: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
  } {
    if (this.slowQueries.length === 0) {
      return {
        total: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
      };
    }

    const durations = this.slowQueries.map((q) => q.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = total / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    return {
      total: this.slowQueries.length,
      avgDuration,
      maxDuration,
      minDuration,
    };
  }

  /**
   * 清除慢查询
   */
  clearSlowQueries(): void {
    this.slowQueries = [];
  }
}

export const slowQueryMonitor = new SlowQueryMonitor(1000, 100);
```

### 5. 批量操作

```typescript
// src/database/optimization/BatchOperation.ts
import { databaseProvider } from '../DatabaseProvider';

export interface BatchInsertOptions {
  table: string;
  columns: string[];
  data: any[][];
  batchSize?: number;
}

export class BatchOperation {
  /**
   * 批量插入
   */
  async batchInsert(
    config: ConnectionConfig,
    options: BatchInsertOptions
  ): Promise<void> {
    const { table, columns, data, batchSize = 1000 } = options;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await this.insertBatch(config, table, columns, batch);
    }
  }

  /**
   * 插入批次
   */
  private async insertBatch(
    config: ConnectionConfig,
    table: string,
    columns: string[],
    data: any[][]
  ): Promise<void> {
    const placeholders = data.map((_, index) => {
      const values = columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`);
      return `(${values.join(', ')})`;
    }).join(', ');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${placeholders}
    `;

    const params = data.flat();
    await databaseProvider.query(config, sql, params);
  }

  /**
   * 批量更新
   */
  async batchUpdate(
    config: ConnectionConfig,
    table: string,
    updates: { id: string | number; data: any }[],
    batchSize: number = 1000
  ): Promise<void> {
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      await this.updateBatch(config, table, batch);
    }
  }

  /**
   * 更新批次
   */
  private async updateBatch(
    config: ConnectionConfig,
    table: string,
    updates: { id: string | number; data: any }[]
  ): Promise<void> {
    const cases = updates.map((u) => {
      const values = Object.entries(u.data).map(([key, value]) => {
        return `WHEN ${u.id} THEN $${value}`;
      });
      return values.join(' ');
    }).join(' ');

    const ids = updates.map((u) => u.id).join(', ');

    const sql = `
      UPDATE ${table}
      SET ${Object.keys(updates[0].data).map((key) => {
        return `${key} = CASE id ${cases} END`;
      }).join(', ')}
      WHERE id IN (${ids})
    `;

    await databaseProvider.query(config, sql);
  }

  /**
   * 批量删除
   */
  async batchDelete(
    config: ConnectionConfig,
    table: string,
    ids: (string | number)[],
    batchSize: number = 1000
  ): Promise<void> {
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      await this.deleteBatch(config, table, batch);
    }
  }

  /**
   * 删除批次
   */
  private async deleteBatch(
    config: ConnectionConfig,
    table: string,
    ids: (string | number)[]
  ): Promise<void> {
    const sql = `DELETE FROM ${table} WHERE id IN (${ids.join(', ')})`;
    await databaseProvider.query(config, sql);
  }
}

export const batchOperation = new BatchOperation();
```

---

## ✅ 验收标准

### 功能完整性

- ✅ 索引优化功能正常
- ✅ 查询缓存高效
- ✅ 查询分析准确
- ✅ 慢查询监控完善
- ✅ 批量操作高效

### 性能优化

- ✅ 查询性能提升明显
- ✅ 缓存命中率高
- ✅ 索引使用合理
- ✅ 批量操作高效

### 代码质量

- ✅ 代码结构清晰
- ✅ 类型定义完整
- ✅ 注释文档完整
- ✅ 代码可维护性好
- ✅ 测试覆盖充分

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-03-14 | 初始版本，建立查询优化功能 | YanYuCloudCube Team |

---

## 📞 联系方式

- **维护团队**: YanYuCloudCube Team
- **联系邮箱**: admin@0379.email
- **项目地址**: https://github.com/YYC-Cube/

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
| 内容校验 | c1f6c8dd05ea6b9f |
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
