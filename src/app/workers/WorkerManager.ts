/**
 * @file WorkerManager.ts
 * @description YYC3 Web Worker 管理器 — 统一管理Web Worker生命周期
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-05-22
 * @status production
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags web-worker,manager,performance,lifecycle
 */

import { logger } from '../utils/logger';

/* ================================================================
   类型定义
   ================================================================ */

export interface WorkerTask<T = any, R = any> {
  id: string;
  type: string;
  payload: T;
  timeout?: number;
  onProgress?: (progress: number) => void;
}

export interface WorkerTaskResult<R = any> {
  id: string;
  type: string;
  result?: R;
  error?: string;
  executionTime: number;
}

export interface WorkerPoolConfig {
  maxSize: number;
  minSize: number;
  taskTimeout: number;
  workerIdleTimeout: number;
  maxRetries: number;
}

/* ================================================================
   Worker包装器
   ================================================================ */

class WorkerWrapper {
  private worker: Worker | null = null;
  private activeTasks = new Map<string, (result: any) => void>();
  private pendingTasks: WorkerTask[] = [];
  private isTerminating = false;
  private lastActivity = Date.now();
  private activityTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private workerId: string,
    private workerScript: string,
    private onTerminate: (workerId: string) => void,
    private idleTimeout: number
  ) {
    this.startWorker();
    this.startActivityMonitoring();
  }

  private startActivityMonitoring() {
    this.activityTimer = setInterval(() => {
      const idleTime = Date.now() - this.lastActivity;
      if (idleTime > this.idleTimeout && this.activeTasks.size === 0) {
        this.terminate();
      }
    }, 10000); // Check every 10 seconds
  }

  private startWorker() {
    try {
      // 创建Worker
      const blob = new Blob([this.workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (event) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (error) => {
        logger.error(`Worker ${this.workerId} error:`, 'WorkerManager', error);
        this.rejectAllTasks(new Error(`Worker error: ${error.message}`));
      };

      logger.debug(`Worker ${this.workerId} started`, 'WorkerManager');
    } catch (error) {
      logger.error(`Failed to create worker ${this.workerId}:`, 'WorkerManager', error);
      this.rejectAllTasks(error);
    }
  }

  private handleWorkerMessage(message: any) {
    this.lastActivity = Date.now();

    if (message.type === 'worker-ready') {
      logger.debug(`Worker ${this.workerId} is ready`, 'WorkerManager');
      this.processPendingTasks();
      return;
    }

    const { id, type, result, error } = message;

    const resolver = this.activeTasks.get(id);
    if (resolver) {
      this.activeTasks.delete(id);

      if (error) {
        resolver({ id, type, error, executionTime: 0 });
      } else {
        resolver({ id, type, result, executionTime: 0 });
      }

      // 处理更多待处理的任务
      if (this.activeTasks.size === 0) {
        this.processPendingTasks();
      }
    }
  }

  private processPendingTasks() {
    if (this.pendingTasks.length === 0 || this.activeTasks.size >= 1) {
      return; // Process one task at a time per worker
    }

    const task = this.pendingTasks.shift();
    if (task) {
      this.executeTask(task);
      // 递归处理下一个任务
      if (this.pendingTasks.length > 0) {
        setTimeout(() => this.processPendingTasks(), 0);
      }
    }
  }

  private rejectAllTasks(error: any) {
    this.activeTasks.forEach((resolver) => {
      resolver({
        id: '',
        type: 'error',
        error: error.message || String(error),
        executionTime: 0,
      });
    });
    this.activeTasks.clear();
  }

  public executeTask<T, R>(task: WorkerTask<T, R>): Promise<WorkerTaskResult<R>> {
    return new Promise((resolve) => {
      if (!this.worker || this.isTerminating) {
        resolve({
          id: task.id,
          type: task.type,
          error: 'Worker not available',
          executionTime: 0,
        });
        return;
      }

      this.activeTasks.set(task.id, resolve);
      this.lastActivity = Date.now();

      // 设置超时
      if (task.timeout) {
        setTimeout(() => {
          if (this.activeTasks.has(task.id)) {
            this.activeTasks.delete(task.id);
            resolve({
              id: task.id,
              type: task.type,
              error: 'Task timeout',
              executionTime: task.timeout,
            });
          }
        }, task.timeout);
      }

      // 发送任务到Worker
      try {
        this.worker!.postMessage({
          id: task.id,
          type: task.type,
          payload: task.payload,
        });
      } catch (error) {
        this.activeTasks.delete(task.id);
        resolve({
          id: task.id,
          type: task.type,
          error: `Failed to send task: ${error}`,
          executionTime: 0,
        });
      }
    });
  }

  public queueTask<T, R>(task: WorkerTask<T, R>): void {
    this.pendingTasks.push(task);
    if (this.activeTasks.size === 0) {
      this.processPendingTasks();
    }
  }

  public terminate(): void {
    if (this.isTerminating) return;

    this.isTerminating = true;
    this.rejectAllTasks(new Error('Worker terminated'));

    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.onTerminate(this.workerId);
    logger.debug(`Worker ${this.workerId} terminated`, 'WorkerManager');
  }

  public isIdle(): boolean {
    return this.activeTasks.size === 0 && this.pendingTasks.length === 0;
  }

  public isActive(): boolean {
    return !this.isTerminating && this.worker !== null;
  }
}

/* ================================================================
   Worker Pool管理器
   ================================================================ */

export class WorkerManager {
  private static instance: WorkerManager;

  private workers: Map<string, WorkerWrapper> = new Map();
  private taskQueue: WorkerTask[] = [];
  private config: WorkerPoolConfig;
  private taskIdCounter = 0;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  private constructor(config: Partial<WorkerPoolConfig> = {}) {
    this.config = {
      maxSize: Math.min(navigator.hardwareConcurrency || 4, 8),
      minSize: 1,
      taskTimeout: 30000,
      workerIdleTimeout: 60000,
      maxRetries: 3,
      ...config,
    };

    this.startCleanupTimer();
  }

  public static getInstance(config?: Partial<WorkerPoolConfig>): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager(config);
    }
    return WorkerManager.instance;
  }

  private startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleWorkers();
    }, 30000); // Check every 30 seconds
  }

  private cleanupIdleWorkers() {
    const activeWorkers = Array.from(this.workers.values()).filter(w => w.isActive());

    if (activeWorkers.length > this.config.minSize) {
      // Terminate idle workers above minimum
      const idleWorkers = activeWorkers.filter(w => w.isIdle());
      const toTerminate = idleWorkers.slice(0, idleWorkers.length - this.config.minSize);

      toTerminate.forEach(worker => worker.terminate());
    }
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${++this.taskIdCounter}-${Math.random().toString(36).slice(2, 6)}`;
  }

  private getOrCreateWorker(): WorkerWrapper | null {
    // 查找空闲Worker
    for (const [id, worker] of this.workers) {
      if (worker.isIdle() && worker.isActive()) {
        return worker;
      }
    }

    // 创建新Worker（如果不超过最大值）
    if (this.workers.size < this.config.maxSize) {
      const workerId = `worker-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const worker = new WorkerWrapper(
        workerId,
        this.getWorkerScript(),
        (id) => this.workers.delete(id),
        this.config.workerIdleTimeout
      );

      this.workers.set(workerId, worker);
      return worker;
    }

    return null;
  }

  private getWorkerScript(): string {
    // 返回Worker脚本内容
    // 实际应用中可能需要动态导入
    return `
      // Worker code will be injected here
      // This is a placeholder
      self.onmessage = function(e) {
        const { id, type, payload } = e.data;
        // Process task...
        self.postMessage({ id, type, result: null });
      };
    `;
  }

  public async executeTask<T = any, R = any>(
    type: string,
    payload: T,
    options: {
      timeout?: number;
      onProgress?: (progress: number) => void;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): Promise<WorkerTaskResult<R>> {
    const taskId = this.generateTaskId();

    const task: WorkerTask<T, R> = {
      id: taskId,
      type,
      payload,
      timeout: options.timeout || this.config.taskTimeout,
      onProgress: options.onProgress,
    };

    // 尝试立即执行
    const worker = this.getOrCreateWorker();
    if (worker) {
      try {
        return await worker.executeTask(task);
      } catch (error) {
        return {
          id: taskId,
          type,
          error: error instanceof Error ? error.message : String(error),
          executionTime: 0,
        };
      }
    } else {
      // 将任务加入队列
      return new Promise((resolve) => {
        this.taskQueue.push(task);

        // 设置超时
        setTimeout(() => {
          const index = this.taskQueue.findIndex(t => t.id === taskId);
          if (index !== -1) {
            this.taskQueue.splice(index, 1);
            resolve({
              id: taskId,
              type,
              error: 'Task queue timeout',
              executionTime: 0,
            });
          }
        }, this.config.taskTimeout);
      });
    }
  }

  public async executeBatch<T = any, R = any>(
    tasks: Array<{ type: string; payload: T }>
  ): Promise<WorkerTaskResult<R>[]> {
    const promises = tasks.map(({ type, payload }) =>
      this.executeTask<T, R>(type, payload)
    );

    return Promise.all(promises);
  }

  public terminate(): void {
    // 终止所有Worker
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();

    // 清理任务队列
    this.taskQueue = [];

    // 清理定时器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    logger.info('WorkerManager terminated', 'WorkerManager');
  }

  public getStatus() {
    return {
      totalWorkers: this.workers.size,
      activeWorkers: Array.from(this.workers.values()).filter(w => w.isActive()).length,
      idleWorkers: Array.from(this.workers.values()).filter(w => w.isIdle() && w.isActive()).length,
      queuedTasks: this.taskQueue.length,
      config: this.config,
    };
  }
}

/* ================================================================
   预定义Worker任务类型
   ================================================================ */

export const WorkerTaskTypes = {
  // JSON处理
  JSON_PARSE: 'json-parse',
  JSON_STRINGIFY: 'json-stringify',

  // 数据处理
  DATA_SORT: 'array-sort',
  DATA_FILTER: 'data-filter',
  DATA_TRANSFORM: 'data-transform',
  DATA_AGGREGATE: 'data-aggregate',
  DATA_VALIDATE: 'data-validation',

  // 代码处理
  CODE_ANALYSIS: 'code-analysis',
  CODE_GENERATION: 'ai-code-generation',

  // 文件处理
  FILE_PROCESS: 'file-processing',
  FILE_COMPRESS: 'file-compress',

  // 性能测试
  PERFORMANCE_BENCHMARK: 'performance-benchmark',

  // 健康检查
  HEALTH_CHECK: 'health-check',
} as const;

/* ================================================================
   便捷函数
   ================================================================ */

export const workerManager = WorkerManager.getInstance();

// JSON处理
export async function parseJsonInWorker<T = any>(json: string): Promise<T> {
  const result = await workerManager.executeTask<string, T>(
    WorkerTaskTypes.JSON_PARSE,
    { json }
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return result.result!;
}

// 数据排序
export async function sortDataInWorker<T = any>(
  data: T[],
  compareFn?: (a: T, b: T) => number
): Promise<T[]> {
  const result = await workerManager.executeTask<
    { data: T[]; compareFn?: string },
    T[]
  >(WorkerTaskTypes.DATA_SORT, {
    data,
    compareFn: compareFn ? compareFn.toString() : undefined,
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result.result!;
}

// 数据聚合
export async function aggregateDataInWorker<T = any>(
  data: T[],
  groupBy: string,
  aggregations: Array<{ field: string; operation: 'sum' | 'avg' | 'count' | 'min' | 'max' }>
): Promise<any[]> {
  const result = await workerManager.executeTask<
    { data: T[]; groupBy: string; aggregations: typeof aggregations },
    any[]
  >(WorkerTaskTypes.DATA_AGGREGATE, {
    data,
    groupBy,
    aggregations,
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result.result!;
}

// 代码分析
export async function analyzeCodeInWorker(
  code: string,
  language: string
): Promise<any> {
  const result = await workerManager.executeTask(
    WorkerTaskTypes.CODE_ANALYSIS,
    { code, language }
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return result.result!;
}

// 数据验证
export async function validateDataInWorker<T = any>(
  data: T[],
  schema: {
    required?: string[];
    properties?: Record<string, { type: string; required?: boolean }>;
  }
): Promise<{ valid: boolean; errors: Array<{ index: number; field: string; message: string }> }> {
  const result = await workerManager.executeTask<
    { data: T[]; schema: typeof schema },
    { valid: boolean; errors: Array<{ index: number; field: string; message: string }> }
  >(WorkerTaskTypes.DATA_VALIDATE, {
    data,
    schema,
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result.result!;
}

// 性能基准测试
export async function runPerformanceBenchmark(
  iterations: number,
  testFunction: string,
  testData?: any[]
): Promise<any> {
  const result = await workerManager.executeTask(
    WorkerTaskTypes.PERFORMANCE_BENCHMARK,
    { iterations, testFunction, testData }
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return result.result!;
}

// 健康检查
export async function checkWorkerHealth(): Promise<any> {
  const result = await workerManager.executeTask(WorkerTaskTypes.HEALTH_CHECK, {});

  if (result.error) {
    throw new Error(result.error);
  }

  return result.result!;
}

export default WorkerManager;