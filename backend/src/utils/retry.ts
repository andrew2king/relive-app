import { logger } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

export class RetryError extends Error {
  public readonly attempts: number;
  public readonly lastError: Error;

  constructor(message: string, attempts: number, lastError: Error) {
    super(message);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

// 默认重试配置
const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: any) => {
    // 默认重试条件：网络错误、超时、5xx服务器错误
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    if (error.response?.status >= 500) {
      return true;
    }
    if (error.name === 'PrismaClientInitializationError') {
      return true;
    }
    return false;
  }
};

// 指数退避重试
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  operationName = 'operation'
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      logger.debug(`执行操作 ${operationName} - 尝试 ${attempt}/${config.maxAttempts}`);
      const result = await operation();
      
      if (attempt > 1) {
        logger.info(`操作 ${operationName} 在第 ${attempt} 次尝试后成功`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // 检查是否应该重试
      if (!config.retryCondition!(error)) {
        logger.debug(`操作 ${operationName} 失败，不符合重试条件: ${error.message}`);
        throw error;
      }
      
      // 最后一次尝试，不再重试
      if (attempt === config.maxAttempts) {
        break;
      }
      
      // 计算延迟时间（指数退避 + 抖动）
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      // 添加随机抖动，避免雷群效应
      const jitter = delay * 0.1 * Math.random();
      const finalDelay = delay + jitter;
      
      logger.warn(
        `操作 ${operationName} 第 ${attempt} 次尝试失败: ${error.message}，${finalDelay.toFixed(0)}ms 后重试`
      );
      
      await sleep(finalDelay);
    }
  }
  
  const retryError = new RetryError(
    `操作 ${operationName} 在 ${config.maxAttempts} 次尝试后仍然失败`,
    config.maxAttempts,
    lastError!
  );
  
  logger.error(`重试失败: ${retryError.message}`, {
    operationName,
    attempts: config.maxAttempts,
    lastError: lastError!.message
  });
  
  throw retryError;
}

// 睡眠函数
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 数据库操作重试配置
export const DB_RETRY_OPTIONS: Partial<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 500,
  maxDelay: 5000,
  backoffFactor: 2,
  retryCondition: (error: any) => {
    return error.name === 'PrismaClientInitializationError' ||
           error.code === 'P1001' || // Can't reach database
           error.code === 'P1017' || // Server has closed the connection
           error.code === 'ECONNREFUSED' ||
           error.code === 'ETIMEDOUT';
  }
};

// API请求重试配置
export const API_RETRY_OPTIONS: Partial<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  backoffFactor: 2,
  retryCondition: (error: any) => {
    // 重试网络错误和5xx错误
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    if (error.response?.status >= 500) {
      return true;
    }
    if (error.response?.status === 429) { // Rate limit
      return true;
    }
    return false;
  }
};

// 文件操作重试配置
export const FILE_RETRY_OPTIONS: Partial<RetryOptions> = {
  maxAttempts: 2,
  baseDelay: 100,
  maxDelay: 1000,
  backoffFactor: 2,
  retryCondition: (error: any) => {
    return error.code === 'EBUSY' || 
           error.code === 'EMFILE' || 
           error.code === 'ENFILE' ||
           error.code === 'ENOSPC';
  }
};