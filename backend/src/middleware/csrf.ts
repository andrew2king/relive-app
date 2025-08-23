import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface CSRFRequest extends Request {
  csrfToken?: string;
}

// CSRF token 生成和验证
class CSRFProtection {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.CSRF_SECRET || crypto.randomBytes(64).toString('hex');
  }

  // 生成 CSRF token
  generateToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const payload = `${randomBytes}:${timestamp}`;
    const hash = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
    
    return Buffer.from(`${payload}:${hash}`).toString('base64');
  }

  // 验证 CSRF token
  verifyToken(token: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [randomBytes, timestamp, hash] = decoded.split(':');
      
      if (!randomBytes || !timestamp || !hash) {
        return false;
      }

      // 检查 token 是否过期（4小时）
      const tokenTime = parseInt(timestamp);
      const currentTime = Date.now();
      const maxAge = 4 * 60 * 60 * 1000; // 4 hours
      
      if (currentTime - tokenTime > maxAge) {
        return false;
      }

      // 验证 hash
      const expectedHash = crypto.createHmac('sha256', this.secret)
        .update(`${randomBytes}:${timestamp}`)
        .digest('hex');
      
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
    } catch (error) {
      return false;
    }
  }

  // 从请求中获取 CSRF token
  getTokenFromRequest(req: CSRFRequest): string | null {
    // 优先从头部获取
    let token = req.get('X-CSRF-Token');
    
    // 然后从请求体获取
    if (!token && req.body) {
      token = req.body._csrf || req.body.csrfToken;
    }
    
    // 最后从查询参数获取
    if (!token && req.query) {
      token = req.query._csrf as string || req.query.csrfToken as string;
    }
    
    return token || null;
  }
}

const csrfProtection = new CSRFProtection();

// 获取 CSRF token 的端点
export const getCsrfToken = (req: CSRFRequest, res: Response) => {
  const token = csrfProtection.generateToken();
  
  res.json({
    success: true,
    data: {
      csrfToken: token,
      expiresIn: 4 * 60 * 60 * 1000 // 4 hours in milliseconds
    },
    message: 'CSRF token 生成成功'
  });
};

// CSRF 保护中间件
export const csrfProtect = (options: {
  skipMethods?: string[];
  skipPaths?: string[];
} = {}) => {
  const {
    skipMethods = ['GET', 'HEAD', 'OPTIONS'],
    skipPaths = ['/api/auth/csrf-token']
  } = options;

  return (req: CSRFRequest, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    const path = req.path;

    // 跳过指定的方法和路径
    if (skipMethods.includes(method) || skipPaths.some(p => path.includes(p))) {
      return next();
    }

    // 获取请求中的 CSRF token
    const token = csrfProtection.getTokenFromRequest(req);

    if (!token) {
      logger.warn('CSRF token missing', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_MISSING',
          message: 'CSRF token 缺失'
        }
      });
    }

    // 验证 CSRF token
    const isValid = csrfProtection.verifyToken(token);

    if (!isValid) {
      logger.warn('Invalid CSRF token', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: 'CSRF token 无效'
        }
      });
    }

    next();
  };
};

// SameSite cookie 设置中间件
export const sameSiteCookies = (req: Request, res: Response, next: NextFunction) => {
  const originalCookie = res.cookie.bind(res);
  
  res.cookie = function(name: string, value: any, options: any = {}) {
    // 设置安全的 cookie 选项
    const secureOptions = {
      ...options,
      httpOnly: options.httpOnly !== false, // 默认为 true
      secure: req.secure || req.get('X-Forwarded-Proto') === 'https',
      sameSite: options.sameSite || 'strict'
    };
    
    return originalCookie(name, value, secureOptions);
  };
  
  next();
};