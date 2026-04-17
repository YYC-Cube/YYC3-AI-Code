/**
 * YYC³ AI - Edge Compute Service (Web Workers)
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module EdgeComputeService
 * @description 边缘计算集成服务，提供后台处理和并行计算功能
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { createLogger } from '../../utils/logger';

const log = createLogger('EdgeComputeService');

/**
 * 计算任务
 */
export interface ComputeTask<T = any> {
  /** 任务 ID */
  id?: string;
  /** 任务类型 */
  type: string;
  /** 任务数据 */
  data: any;
  /** 任务配置 */
  config?: any;
}

/**
 * 计算结果
 */
export interface ComputeResult<T = any> {
  /** 任务 ID */
  taskId: string;
  /** 结果数据 */
  result: T;
  /** 执行时间 */
  executionTime: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 总任务数 */
  totalTasks: number;
  /** 成功任务数 */
  successfulTasks: number;
  /** 失败任务数 */
  failedTasks: number;
  /** 平均执行时间 */
  averageExecutionTime: number;
  /** 当前 Worker 数量 */
  activeWorkers: number;
  /** 队列中任务数 */
  queuedTasks: number;
}

/**
 * Worker 配置
 */
export interface WorkerConfig {
  /** Worker 脚本路径 */
  scriptPath: string;
  /** Worker 类型 */
  type?: 'classic' | 'module';
  /** Worker 名称 */
  name?: string;
}

/**
 * 边缘计算服务接口
 */
export interface IEdgeComputeService {
  // 任务管理
  execute<T>(task: ComputeTask<T>): Promise<ComputeResult<T>>;
  executeParallel<T>(tasks: ComputeTask<T>[]): Promise<ComputeResult<T>[]>;
  cancelTask(taskId: string): Promise<void>;
  clearQueue(): void;
  
  // Worker 管理
  createWorker(config: WorkerConfig): Worker;
  terminateWorker(worker: Worker): void;
  getWorkerCount(): number;
  
  // 性能监控
  getPerformanceMetrics(): PerformanceMetrics;
  onPerformanceUpdate(callback: (metrics: PerformanceMetrics) => void): () => void;
  
  // 事件管理
  onTaskComplete<T>(callback: (result: ComputeResult<T>) => void): () => void;
  onTaskError(callback: (error: { taskId: string; error: string }) => void): () => void;
  
  // 销毁
  destroy(): void;
}

/**
 * 边缘计算服务实现
 */
export class EdgeComputeService implements IEdgeComputeService {
  private workers: Map<string, Worker> = new Map();
  private taskQueue: ComputeTask[] = [];
  private activeTasks: Map<string, Promise<ComputeResult>> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    totalTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    averageExecutionTime: 0,
    activeWorkers: 0,
    queuedTasks: 0,
  };
  
  private taskCallbacks: Map<string, Set<(result: any) => void>> = new Map();
  private errorCallbacks: Set<(error: { taskId: string; error: string }) => void> = new Set();
  private performanceCallbacks: Set<(metrics: PerformanceMetrics) => void> = new Set();
  private destroyCallbacks: Set<() => void> = new Set();
  
  private maxWorkers: number = 4;
  private isProcessing: boolean = false;

  constructor(maxWorkers?: number) {
    this.maxWorkers = maxWorkers || navigator.hardwareConcurrency || 4;
  }

  /**
   * 执行单个任务
   */
  async execute<T>(task: ComputeTask<T>): Promise<ComputeResult<T>> {
    const taskId = task.id || this.generateTaskId();
    const startTime = performance.now();

    // 添加到活动任务
    const taskPromise = this.processTask(taskId, task);
    this.activeTasks.set(taskId, taskPromise);

    try {
      const result = await taskPromise;
      
      // 更新性能指标
      this.updatePerformanceMetrics({
        totalTasks: this.performanceMetrics.totalTasks + 1,
        successfulTasks: this.performanceMetrics.successfulTasks + 1,
        averageExecutionTime: this.calculateAverageExecutionTime(
          startTime,
          this.performanceMetrics.averageExecutionTime,
          this.performanceMetrics.successfulTasks
        ),
      });

      return result as ComputeResult<T>;
    } catch (error) {
      // 更新性能指标
      this.updatePerformanceMetrics({
        totalTasks: this.performanceMetrics.totalTasks + 1,
        failedTasks: this.performanceMetrics.failedTasks + 1,
      });

      throw error;
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  /**
   * 并行执行多个任务
   */
  async executeParallel<T>(tasks: ComputeTask<T>[]): Promise<ComputeResult<T>[]> {
    const promises = tasks.map((task) => this.execute<T>(task));
    return Promise.all(promises);
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<void> {
    const taskPromise = this.activeTasks.get(taskId);
    if (taskPromise) {
      this.activeTasks.delete(taskId);
      // 注意：实际上取消正在运行的 Worker 任务比较复杂
      // 这里只是从活动任务中移除
    }
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.taskQueue = [];
    this.updatePerformanceMetrics({
      queuedTasks: 0,
    });
  }

  /**
   * 创建 Worker
   */
  createWorker(config: WorkerConfig): Worker {
    const workerId = config.name || this.generateWorkerId();
    
    const worker = new Worker(config.scriptPath, {
      type: config.type || 'classic',
    });

    // 设置 Worker 监听器
    worker.addEventListener('message', (event) => {
      this.handleWorkerMessage(workerId, event.data);
    });

    worker.addEventListener('error', (event) => {
      log.error('Worker error:', event);
    });

    this.workers.set(workerId, worker);
    this.updatePerformanceMetrics({
      activeWorkers: this.workers.size,
    });

    return worker;
  }

  /**
   * 终止 Worker
   */
  terminateWorker(worker: Worker): void {
    worker.terminate();
    
    for (const [id, w] of this.workers.entries()) {
      if (w === worker) {
        this.workers.delete(id);
        break;
      }
    }

    this.updatePerformanceMetrics({
      activeWorkers: this.workers.size,
    });
  }

  /**
   * 获取 Worker 数量
   */
  getWorkerCount(): number {
    return this.workers.size;
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * 监听性能更新
   */
  onPerformanceUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.performanceCallbacks.add(callback);

    return () => {
      this.performanceCallbacks.delete(callback);
    };
  }

  /**
   * 监听任务完成
   */
  onTaskComplete<T>(callback: (result: ComputeResult<T>) => void): () => void {
    const taskId = this.generateTaskId();
    
    if (!this.taskCallbacks.has(taskId)) {
      this.taskCallbacks.set(taskId, new Set());
    }
    
    this.taskCallbacks.get(taskId)!.add(callback);

    return () => {
      this.taskCallbacks.get(taskId)?.delete(callback);
    };
  }

  /**
   * 监听任务错误
   */
  onTaskError(callback: (error: { taskId: string; error: string }) => void): () => void {
    this.errorCallbacks.add(callback);

    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /**
   * 处理任务
   */
  private async processTask(taskId: string, task: ComputeTask): Promise<ComputeResult> {
    // 简化实现：直接返回模拟结果
    // 实际实现中应该将任务分配给 Worker 执行
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      taskId,
      result: task.data,
      executionTime: 100,
      success: true,
    };
  }

  /**
   * 处理 Worker 消息
   */
  private handleWorkerMessage(workerId: string, message: any) {
    const { type, taskId, result, error } = message;

    if (type === 'task-complete') {
      const callbacks = this.taskCallbacks.get(taskId);
      if (callbacks) {
        callbacks.forEach((cb) => cb(result));
      }
    } else if (type === 'task-error') {
      this.errorCallbacks.forEach((cb) => cb({ taskId, error }));
    }
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(updates: Partial<PerformanceMetrics>): void {
    this.performanceMetrics = {
      ...this.performanceMetrics,
      ...updates,
    };
    this.performanceCallbacks.forEach((cb) => cb(this.performanceMetrics));
  }

  /**
   * 计算平均执行时间
   */
  private calculateAverageExecutionTime(
    startTime: number,
    currentAverage: number,
    successfulTasks: number
  ): number {
    const executionTime = performance.now() - startTime;
    const totalExecutionTime = currentAverage * successfulTasks + executionTime;
    return totalExecutionTime / (successfulTasks + 1);
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成 Worker ID
   */
  private generateWorkerId(): string {
    return `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    // 终止所有 Worker
    this.workers.forEach((worker) => worker.terminate());
    this.workers.clear();

    // 清空队列
    this.clearQueue();

    // 清空活动任务
    this.activeTasks.clear();

    // 清空回调
    this.taskCallbacks.clear();
    this.errorCallbacks.clear();
    this.performanceCallbacks.clear();
    this.destroyCallbacks.forEach((cb) => cb());
    this.destroyCallbacks.clear();
  }
}

/**
 * 创建边缘计算服务实例
 */
export function createEdgeComputeService(maxWorkers?: number): EdgeComputeService {
  return new EdgeComputeService(maxWorkers);
}

/**
 * 单例边缘计算服务
 */
let singletonEdgeComputeService: EdgeComputeService | null = null;

/**
 * 获取或创建单例边缘计算服务
 */
export function getEdgeComputeService(maxWorkers?: number): EdgeComputeService {
  if (!singletonEdgeComputeService) {
    singletonEdgeComputeService = new EdgeComputeService(maxWorkers);
  }

  return singletonEdgeComputeService;
}

/**
 * 销毁单例边缘计算服务
 */
export function destroyEdgeComputeService(): void {
  if (singletonEdgeComputeService) {
    singletonEdgeComputeService.destroy();
    singletonEdgeComputeService = null;
  }
}

export default EdgeComputeService;
