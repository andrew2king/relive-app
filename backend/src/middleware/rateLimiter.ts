import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ERROR_CODES } from './errorHandler';

// 扩展Request类型以包含user属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        membershipLevel: string;
      };
      requestId?: string;
    }
  }
}

// 基础限流配置
const createLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    keyGenerator: options.keyGenerator || ((req: Request) => req.ip || 'unknown'),
    handler: (req: Request, res: Response) => {
      logger.warn(`限流触发: ${req.ip} - ${req.originalUrl}`, {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent')
      });

      res.status(429).json({
        success: false,
        error: {
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: options.message,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          version: '1.0.0'
        }
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// 通用API限流 - 每分钟100请求
export const generalLimiter = createLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 100,
  message: '请求过于频繁，请稍后再试'
});

// 认证相关限流 - 每15分钟5次登录尝试
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5,
  message: '登录尝试次数过多，请15分钟后再试',
  keyGenerator: (req: Request) => {
    // 使用IP + 邮箱作为限流键
    const email = req.body?.email || '';
    return `${req.ip}:${email}`;
  }
});

// 注册限流 - 每小时3次注册
export const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3,
  message: '注册过于频繁，请1小时后再试'
});

// 支付相关限流 - 每分钟10次
export const paymentLimiter = createLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 10,
  message: '支付请求过于频繁，请稍后再试',
  keyGenerator: (req: Request) => {
    // 登录用户使用用户ID，未登录使用IP
    return req.user?.id || req.ip || 'unknown';
  }
});

// 文件上传限流 - 每分钟20次
export const uploadLimiter = createLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 20,
  message: '文件上传过于频繁，请稍后再试',
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'unknown';
  }
});

// AI处理限流 - 每分钟30次
export const processingLimiter = createLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 30,
  message: 'AI处理请求过于频繁，请稍后再试',
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'unknown';
  }
});

// VIP用户更宽松的限流
export const vipProcessingLimiter = createLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // VIP用户3倍额度
  message: 'AI处理请求过于频繁，请稍后再试',
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'unknown';
  }
});

// 动态限流：根据用户类型选择不同的限流策略
export const dynamicProcessingLimiter = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  // VIP用户使用更宽松的限流
  if (user && user.membershipLevel !== 'FREE') {
    return vipProcessingLimiter(req, res, next);
  }
  
  // 普通用户使用标准限流
  return processingLimiter(req, res, next);
};