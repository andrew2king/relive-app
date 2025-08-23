import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// 通用速率限制
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 1000, // 每个 IP 最多 1000 个请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 认证相关速率限制
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10, // 认证请求每 15 分钟最多 10 次
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED', 
      message: '登录尝试过于频繁，请 15 分钟后重试'
    }
  }
});

// API 接口速率限制
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 100, // 每分钟最多 100 个请求
  message: {
    success: false,
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'API 调用过于频繁，请稍后再试'
    }
  }
});

// 文件上传速率限制
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 50, // 每小时最多上传 50 个文件
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: '文件上传过于频繁，请稍后再试'
    }
  }
});

// 安全头中间件
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // 基础安全头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (仅在 HTTPS 环境下)
  if (req.secure || req.get('X-Forwarded-Proto') === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // CSP (内容安全策略)
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'none'"
  ].join('; '));

  next();
};

// 可疑活动检测中间件
export const suspiciousActivityDetection = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  
  // 检测常见的爬虫或恶意请求
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && !req.path.includes('/api/auth/')) {
    logger.warn('Suspicious activity detected', {
      ip: req.ip,
      userAgent,
      path: req.path,
      method: req.method
    });

    // 对可疑请求应用更严格的限制
    return apiRateLimit(req, res, next);
  }
  
  next();
};

// 请求大小限制中间件
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        logger.warn('Request size too large', {
          ip: req.ip,
          path: req.path,
          contentLength: sizeInBytes,
          maxAllowed: maxSizeInBytes
        });

        return res.status(413).json({
          success: false,
          error: {
            code: 'REQUEST_TOO_LARGE',
            message: '请求体过大'
          }
        });
      }
    }
    
    next();
  };
};

// 辅助函数：解析大小字符串
function parseSize(sizeStr: string): number {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg]?b)$/);
  if (!match) return 0;
  
  const [, size, unit] = match;
  return parseFloat(size) * (units[unit as keyof typeof units] || 1);
}