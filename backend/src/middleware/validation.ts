import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './errorHandler';

// 验证中间件
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    const error = new AppError(`验证失败: ${errorMessages.join(', ')}`);
    error.statusCode = 400;
    next(error);
    return;
  }
  
  next();
};