/**
 * @file computation.worker.ts
 * @description YYC3 Web Worker - 计算密集型任务处理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-05-22
 * @status production
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags web-worker,performance,computation
 */

/* ================================================================
   Worker消息类型定义
   ================================================================ */

export interface WorkerMessage<T = any> {
  id: string;
  type: string;
  payload: T;
}

export interface WorkerResponse<T = any> {
  id: string;
  type: string;
  result?: T;
  error?: string;
}

/* ================================================================
   Worker任务处理器
   ================================================================ */

interface TaskHandler {
  (payload: any, workerId: string): Promise<any> | any;
}

const taskHandlers: Record<string, TaskHandler> = {};

/* ================================================================
   注册任务处理器
   ================================================================ */

export function registerTaskHandler(type: string, handler: TaskHandler): void {
  taskHandlers[type] = handler;
}

/* ================================================================
   Worker消息处理
   ================================================================ */

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;

  try {
    if (!taskHandlers[type]) {
      throw new Error(`Unknown task type: ${type}`);
    }

    const result = await taskHandlers[type](payload, id);

    const response: WorkerResponse = {
      id,
      type,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      type,
      error: error instanceof Error ? error.message : String(error),
    };

    self.postMessage(response);
  }
};

/* ================================================================
   预定义任务处理器
   ================================================================ */

// JSON解析和验证
registerTaskHandler('json-parse', async (payload: { json: string }) => {
  return JSON.parse(payload.json);
});

// 数据转换和格式化
registerTaskHandler('data-transform', async (payload: { data: any[]; transform: string }) => {
  const { data, transform } = payload;

  // 安全的函数构造（仅用于数据转换）
  const transformFn = new Function('data', `return ${transform}`) as (data: any[]) => any[];

  return transformFn(data);
});

// 大数组排序
registerTaskHandler('array-sort', async (payload: { data: any[]; compareFn?: string }) => {
  const { data, compareFn } = payload;

  if (compareFn) {
    const fn = new Function('a', 'b', `return ${compareFn}`) as (a: any, b: any) => number;
    return [...data].sort(fn);
  }

  return [...data].sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
});

// 数据聚合
registerTaskHandler('data-aggregate', async (payload: {
  data: any[];
  groupBy: string;
  aggregations: Array<{ field: string; operation: 'sum' | 'avg' | 'count' | 'min' | 'max' }>;
}) => {
  const { data, groupBy, aggregations } = payload;

  const groups: Record<string, any[]> = {};

  // 分组
  data.forEach(item => {
    const key = item[groupBy];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  // 聚合
  const result = Object.entries(groups).map(([key, items]) => {
    const aggregated: any = { [groupBy]: key };

    aggregations.forEach(({ field, operation }) => {
      const values = items.map(item => item[field]).filter(val => typeof val === 'number');

      switch (operation) {
        case 'sum':
          aggregated[`${field}_${operation}`] = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          aggregated[`${field}_${operation}`] = values.length > 0
            ? values.reduce((sum, val) => sum + val, 0) / values.length
            : 0;
          break;
        case 'count':
          aggregated[`${field}_${operation}`] = values.length;
          break;
        case 'min':
          aggregated[`${field}_${operation}`] = Math.min(...values);
          break;
        case 'max':
          aggregated[`${field}_${operation}`] = Math.max(...values);
          break;
      }
    });

    return aggregated;
  });

  return result;
});

// 代码生成和分析
registerTaskHandler('code-analysis', async (payload: { code: string; language: string }) => {
  const { code, language } = payload;

  const analysis = {
    lines: code.split('\n').length,
    characters: code.length,
    charactersWithoutSpaces: code.replace(/\s/g, '').length,
    functions: [],
    imports: [],
    exports: [],
  };

  // 简单的正则匹配（生产环境建议使用AST解析）
  switch (language) {
    case 'typescript':
    case 'javascript':
      // 匹配函数声明
      const functionMatches = code.match(/function\s+(\w+)/g);
      if (functionMatches) {
        analysis.functions = functionMatches.map(match => match.replace(/function\s+/, ''));
      }

      // 匹配导入
      const importMatches = code.match(/import\s+.*from\s+['"]([^'"]+)['"]/g);
      if (importMatches) {
        analysis.imports = importMatches.map(match => {
          const result = match.match(/from\s+['"]([^'"]+)['"]/);
          return result ? result[1] : '';
        });
      }

      // 匹配导出
      const exportMatches = code.match(/export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g);
      if (exportMatches) {
        analysis.exports = exportMatches.map(match => {
          const result = match.match(/(?:function|const|class)\s+(\w+)/);
          return result ? result[1] : '';
        });
      }
      break;
  }

  return analysis;
});

// AI代码生成任务
registerTaskHandler('ai-code-generation', async (payload: {
  prompt: string;
  context: string;
  options: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  };
}) => {
  const { prompt, context, options } = payload;

  // 模拟AI代码生成（实际应用中这里会调用AI API）
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    code: `// AI Generated Code\n// Prompt: ${prompt}\n\nfunction example() {\n  // Implementation\n  return ${JSON.stringify(options)};\n}`,
    usage: {
      promptTokens: prompt.length + context.length,
      completionTokens: 100,
      totalTokens: prompt.length + context.length + 100,
    },
  };
});

// 数据验证
registerTaskHandler('data-validation', async (payload: {
  data: any[];
  schema: {
    required?: string[];
    properties?: Record<string, { type: string; required?: boolean }>;
  };
}) => {
  const { data, schema } = payload;
  const errors: Array<{ index: number; field: string; message: string }> = [];

  data.forEach((item, index) => {
    // 检查必填字段
    if (schema.required) {
      schema.required.forEach(field => {
        if (!(field in item) || item[field] === null || item[field] === undefined) {
          errors.push({
            index,
            field,
            message: `Required field "${field}" is missing or empty`,
          });
        }
      });
    }

    // 检查属性类型
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([field, config]) => {
        if (config.required && (!(field in item) || item[field] === null || item[field] === undefined)) {
          errors.push({
            index,
            field,
            message: `Required field "${field}" is missing or empty`,
          });
          return;
        }

        if (field in item) {
          const expectedType = config.type;
          const actualType = typeof item[field];

          if (expectedType !== actualType) {
            errors.push({
              index,
              field,
              message: `Type mismatch for field "${field}": expected ${expectedType}, got ${actualType}`,
            });
          }
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    checkedCount: data.length,
  };
});

// 大文件处理
registerTaskHandler('file-processing', async (payload: {
  content: string;
  operations: Array<{ type: 'replace' | 'remove' | 'insert'; pattern?: string; replacement?: string; position?: number }>;
}) => {
  const { content, operations } = payload;

  let result = content;

  operations.forEach(operation => {
    switch (operation.type) {
      case 'replace':
        if (operation.pattern && operation.replacement !== undefined) {
          const regex = new RegExp(operation.pattern, 'g');
          result = result.replace(regex, operation.replacement);
        }
        break;
      case 'remove':
        if (operation.pattern) {
          const regex = new RegExp(operation.pattern, 'g');
          result = result.replace(regex, '');
        }
        break;
      case 'insert':
        if (operation.position !== undefined && operation.replacement !== undefined) {
          result =
            result.slice(0, operation.position) +
            operation.replacement +
            result.slice(operation.position);
        }
        break;
    }
  });

  return result;
});

// 性能监控和基准测试
registerTaskHandler('performance-benchmark', async (payload: {
  iterations: number;
  testFunction: string; // 序列化的函数
  testData?: any[];
}) => {
  const { iterations, testFunction, testData = [] } = payload;

  // 安全地构造测试函数
  const fn = new Function('data', `return ${testFunction}`) as (data: any[]) => any;

  const results: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn(testData);
    const end = performance.now();
    results.push(end - start);
  }

  return {
    iterations,
    averageTime: results.reduce((sum, time) => sum + time, 0) / results.length,
    minTime: Math.min(...results),
    maxTime: Math.max(...results),
    medianTime: results.sort((a, b) => a - b)[Math.floor(results.length / 2)],
    totalTime: results.reduce((sum, time) => sum + time, 0),
  };
});

/* ================================================================
   Worker健康检查
   ================================================================ */

registerTaskHandler('health-check', async () => {
  return {
    status: 'healthy',
    timestamp: Date.now(),
    memory: (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    } : null,
  };
});

/* ================================================================
   Worker初始化消息
   ================================================================ */

self.postMessage({
  type: 'worker-ready',
  workerId: `computation-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
});