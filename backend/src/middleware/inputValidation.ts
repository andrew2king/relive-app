import { body, query, param, ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// 验证规则构建器
export class ValidationRuleBuilder {
  // 用户注册验证
  static userRegistration(): ValidationChain[] {
    return [
      body('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('邮箱地址不能超过100个字符'),
      
      body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('密码长度必须在8-128个字符之间'),
      
      body('username')
        .optional()
        .isLength({ min: 3, max: 20 })
        .withMessage('用户名长度必须在3-20个字符之间')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('用户名只能包含字母、数字、下划线和连字符')
    ];
  }

  // 用户登录验证
  static userLogin(): ValidationChain[] {
    return [
      body('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),
      
      body('password')
        .isLength({ min: 1 })
        .withMessage('密码不能为空')
    ];
  }

  // 支付验证
  static payment(): ValidationChain[] {
    return [
      body('amount')
        .isFloat({ min: 0.01, max: 10000 })
        .withMessage('金额必须在0.01-10000之间'),
      
      body('currency')
        .isIn(['CNY', 'USD'])
        .withMessage('不支持的货币类型'),
      
      body('paymentMethod')
        .isIn(['alipay', 'wechat', 'credit_card'])
        .withMessage('不支持的支付方式')
    ];
  }

  // ID 参数验证
  static idParam(paramName: string = 'id'): ValidationChain {
    return param(paramName)
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage(`${paramName} 格式无效`)
      .isLength({ max: 100 })
      .withMessage(`${paramName} 长度不能超过100个字符`);
  }
}

// 验证结果处理中间件
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));

    logger.warn('Validation errors detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      errors: errorDetails
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '输入验证失败',
        details: errorDetails
      }
    });
  }
  
  next();
};

// 输入清理中间件
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // 清理请求体
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // 清理查询参数
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // 清理路径参数
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// 递归清理对象
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // 基础字符串清理
    return obj.trim().replace(/[<>]/g, '');
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

// SQL 注入防护
export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(--|#|\/\*|\*\/)/g
  ];

  const checkInput = (input: string): boolean => {
    return sqlPatterns.some(pattern => pattern.test(input));
  };

  const scanObject = (obj: any): string[] => {
    const suspiciousFields: string[] = [];
    
    if (typeof obj === 'string' && checkInput(obj)) {
      suspiciousFields.push('string');
    } else if (Array.isArray(obj)) {
      obj.forEach(item => {
        suspiciousFields.push(...scanObject(item));
      });
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        suspiciousFields.push(...scanObject(value));
      });
    }
    
    return suspiciousFields;
  };

  // 检查请求中的所有输入
  const allSuspicious: string[] = [
    ...scanObject(req.body),
    ...scanObject(req.query),
    ...scanObject(req.params)
  ];

  if (allSuspicious.length > 0) {
    logger.error('Potential SQL injection detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      suspiciousFields: allSuspicious
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: '输入包含非法字符'
      }
    });
  }

  next();
};

// 文件类型验证
export const validateFileType = (allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = (req as any).file;
    
    if (file && !allowedTypes.includes(file.mimetype)) {
      logger.warn('Invalid file type uploaded', {
        ip: req.ip,
        fileName: file.originalname,
        mimeType: file.mimetype,
        allowedTypes
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: '不支持的文件类型'
        }
      });
    }
    
    next();
  };
};