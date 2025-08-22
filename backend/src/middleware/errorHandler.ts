import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from './apiResponse';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;
    this.name = 'AppError';

    Error.captureStackTrace(this, this.constructor);
  }
}

// 错误码枚举
export const ERROR_CODES = {
  // 认证错误 (1000-1099)
  UNAUTHORIZED: 'AUTH_001',
  INVALID_TOKEN: 'AUTH_002',
  TOKEN_EXPIRED: 'AUTH_003',
  FORBIDDEN: 'AUTH_004',
  
  // 验证错误 (1100-1199)
  VALIDATION_ERROR: 'VAL_001',
  INVALID_INPUT: 'VAL_002',
  MISSING_REQUIRED_FIELD: 'VAL_003',
  
  // 资源错误 (1200-1299)
  NOT_FOUND: 'RES_001',
  ALREADY_EXISTS: 'RES_002',
  CONFLICT: 'RES_003',
  
  // 业务错误 (1300-1399)
  INSUFFICIENT_CREDITS: 'BUS_001',
  MEMBERSHIP_EXPIRED: 'BUS_002',
  PROCESSING_FAILED: 'BUS_003',
  PAYMENT_FAILED: 'BUS_004',
  
  // 系统错误 (1400-1499)
  DATABASE_ERROR: 'SYS_001',
  EXTERNAL_API_ERROR: 'SYS_002',
  FILE_SYSTEM_ERROR: 'SYS_003',
  RATE_LIMIT_EXCEEDED: 'SYS_004',
  
  // 未知错误 (1500+)
  INTERNAL_ERROR: 'INT_001'
} as const;

// 错误分类函数
function categorizeError(error: any): { statusCode: number; code: string; message: string } {
  // Prisma数据库错误
  if (error.name === 'PrismaClientKnownRequestError') {
    switch (error.code) {
      case 'P2002':
        return { statusCode: 409, code: ERROR_CODES.ALREADY_EXISTS, message: '数据已存在' };
      case 'P2025':
        return { statusCode: 404, code: ERROR_CODES.NOT_FOUND, message: '数据不存在' };
      default:
        return { statusCode: 500, code: ERROR_CODES.DATABASE_ERROR, message: '数据库操作失败' };
    }
  }

  // Prisma连接错误
  if (error.name === 'PrismaClientInitializationError') {
    return { statusCode: 503, code: ERROR_CODES.DATABASE_ERROR, message: '数据库连接失败' };
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return { statusCode: 401, code: ERROR_CODES.INVALID_TOKEN, message: '无效的访问令牌' };
  }
  if (error.name === 'TokenExpiredError') {
    return { statusCode: 401, code: ERROR_CODES.TOKEN_EXPIRED, message: '访问令牌已过期' };
  }

  // 验证错误
  if (error.name === 'ValidationError') {
    return { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR, message: '数据验证失败' };
  }

  // 网络错误
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return { statusCode: 503, code: ERROR_CODES.EXTERNAL_API_ERROR, message: '外部服务不可用' };
  }

  // 默认错误
  return { statusCode: 500, code: ERROR_CODES.INTERNAL_ERROR, message: '内部服务器错误' };
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let code = err.code;
  let message = err.message || 'Internal Server Error';
  let details = err.details;

  // 如果不是AppError，进行错误分类
  if (!(err instanceof AppError)) {
    const categorized = categorizeError(err);
    statusCode = categorized.statusCode;
    code = categorized.code;
    message = categorized.message;
  }

  // 记录错误日志
  const logContext = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
    statusCode,
    code,
    stack: err.stack
  };

  if (statusCode >= 500) {
    logger.error(`服务器错误: ${message}`, logContext);
  } else if (statusCode >= 400) {
    logger.warn(`客户端错误: ${message}`, logContext);
  }

  // 生产环境下隐藏敏感信息
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) {
      message = '服务暂时不可用，请稍后再试';
      details = undefined;
    }
    delete logContext.stack;
  }

  // 发送错误响应
  sendError(res, statusCode, message, code, details);
};

// 404处理中间件
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `路径 ${req.originalUrl} 不存在`,
    404,
    ERROR_CODES.NOT_FOUND
  );
  next(error);
};

// 异步错误包装器
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};