import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';
import { getMemoryStore } from '../services/memoryStore';

interface AuthRequest extends Request {
  user?: any;
}

// Check if database is available
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

// JWT认证中间件
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('访问令牌缺失', 401);
    }

    // 验证Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const dbAvailable = await isDatabaseAvailable();
    let user: any;

    if (dbAvailable) {
      // 使用数据库
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          credits: true,
          membershipLevel: true,
          membershipExpiry: true,
          emailVerified: true,
          isActive: true,
        }
      });
    } else {
      // 使用内存存储
      const memoryStore = getMemoryStore();
      user = await memoryStore.findUserById(decoded.userId);
    }

    if (!user) {
      throw new AppError('用户不存在', 401);
    }

    if (!user.isActive) {
      throw new AppError('账户已被禁用', 403);
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('无效的访问令牌', 401));
    } else {
      next(error);
    }
  }
};

// 可选认证中间件（允许匿名访问）
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          credits: true,
          membershipLevel: true,
          membershipExpiry: true,
          emailVerified: true,
          isActive: true,
        }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // 忽略认证错误，继续处理请求
    next();
  }
};

// 检查会员权限
export const requireMembership = (membershipLevels: string[] = ['MONTHLY', 'QUARTERLY', 'YEARLY']) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        const error = new AppError('需要登录');
        error.statusCode = 401;
        throw error;
      }

      // 检查会员级别
      if (!membershipLevels.includes(user.membershipLevel)) {
        const error = new AppError('需要会员权限');
        error.statusCode = 403;
        throw error;
      }

      // 检查会员是否过期
      if (user.membershipExpiry && new Date() > new Date(user.membershipExpiry)) {
        const error = new AppError('会员已过期');
        error.statusCode = 403;
        throw error;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// 检查积分余额
export const requireCredits = (minCredits: number) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        const error = new AppError('需要登录');
        error.statusCode = 401;
        throw error;
      }

      if (user.credits < minCredits) {
        const error = new AppError(`积分不足，需要至少${minCredits}积分`);
        error.statusCode = 402; // Payment Required
        throw error;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// 管理员权限检查（预留）
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;

    if (!user) {
      const error = new AppError('需要登录');
      error.statusCode = 401;
      throw error;
    }

    // 这里可以添加管理员检查逻辑
    // 例如：检查用户是否有admin角色
    
    next();
  } catch (error) {
    next(error);
  }
};