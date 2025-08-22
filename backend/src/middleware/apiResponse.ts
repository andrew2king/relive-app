import { Request, Response, NextFunction } from 'express';

// 标准化API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// 生成请求ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

// 请求ID中间件
export const addRequestId = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// 成功响应助手
export const sendSuccess = <T>(res: Response, data?: T, message?: string): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.get('X-Request-ID') || 'unknown',
      version: '1.0.0'
    }
  };
  res.json(response);
};

// 错误响应助手
export const sendError = (res: Response, statusCode: number, message: string, code?: string, details?: any): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.get('X-Request-ID') || 'unknown',
      version: '1.0.0'
    }
  };
  res.status(statusCode).json(response);
};

// 分页响应助手
export const sendPaginatedResponse = <T>(
  res: Response, 
  data: T[], 
  page: number, 
  limit: number, 
  total: number,
  message?: string
): void => {
  const response: ApiResponse<{
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> = {
    success: true,
    data: {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    },
    message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.get('X-Request-ID') || 'unknown',
      version: '1.0.0'
    }
  };
  res.json(response);
};

// 扩展Request类型
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}