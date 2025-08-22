import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
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

// 生成JWT Token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
};

// 生成刷新Token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  });
};

// 用户注册
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, username, password, displayName } = req.body;

    // 验证输入
    if (!email || !password) {
      throw new AppError('邮箱和密码不能为空', 400);
    }

    if (password.length < 6) {
      throw new AppError('密码长度至少为6位', 400);
    }

    // 密码加密
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const dbAvailable = await isDatabaseAvailable();
    let user: any;

    if (dbAvailable) {
      // 使用数据库
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            ...(username ? [{ username }] : [])
          ]
        }
      });

      if (existingUser) {
        throw new AppError('用户已存在', 409);
      }

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username: username || null,
          password: passwordHash,
          credits: 200,
          membershipLevel: 'FREE',
          emailVerified: false,
        },
        select: {
          id: true,
          email: true,
          username: true,
          credits: true,
          membershipLevel: true,
          emailVerified: true,
          createdAt: true,
        }
      });

      // 记录积分获得
      await prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: 200,
          type: 'REWARD',
          description: '新用户注册奖励',
          balanceBefore: 0,
          balanceAfter: 200,
        }
      });
    } else {
      // 使用内存存储
      const memoryStore = getMemoryStore();
      
      user = await memoryStore.createUser({
        email: email.toLowerCase(),
        username: username || undefined,
        password: passwordHash,
        credits: 200,
        membershipLevel: 'FREE',
        emailVerified: false,
        isActive: true,
      });

      // 记录积分获得
      await memoryStore.createCreditTransaction({
        userId: user.id,
        amount: 200,
        type: 'REWARD',
        description: '新用户注册奖励',
        balanceBefore: 0,
        balanceAfter: 200,
      });
    }

    // 生成Token
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    logger.info(`用户注册成功 (${dbAvailable ? 'DB' : 'Memory'}): ${user.email}`);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          credits: user.credits,
          membershipLevel: user.membershipLevel,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        token,
        refreshToken,
      }
    });
  } catch (error) {
    next(error);
  }
};

// 用户登录
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      throw new AppError('邮箱和密码不能为空', 400);
    }

    const dbAvailable = await isDatabaseAvailable();
    let user: any;

    if (dbAvailable) {
      // 使用数据库
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
          credits: true,
          membershipLevel: true,
          membershipExpiry: true,
          emailVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        }
      });
    } else {
      // 使用内存存储
      const memoryStore = getMemoryStore();
      user = await memoryStore.findUserByEmail(email.toLowerCase());
    }

    if (!user) {
      throw new AppError('邮箱或密码错误', 401);
    }

    // 检查账户状态
    if (!user.isActive) {
      throw new AppError('账户已被禁用', 403);
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('邮箱或密码错误', 401);
    }

    // 更新最后登录时间
    if (dbAvailable) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    } else {
      const memoryStore = getMemoryStore();
      await memoryStore.updateUser(user.id, { lastLoginAt: new Date() });
    }

    // 生成Token
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;

    logger.info(`用户登录成功 (${dbAvailable ? 'DB' : 'Memory'}): ${user.email}`);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken,
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取当前用户信息
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const dbAvailable = await isDatabaseAvailable();
    let user: any;

    if (dbAvailable) {
      // 使用数据库
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          credits: true,
          membershipLevel: true,
          membershipExpiry: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        }
      });
    } else {
      // 使用内存存储
      const memoryStore = getMemoryStore();
      user = await memoryStore.findUserById(userId);
    }

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    res.json({
      success: true,
      data: { user: {
        id: user.id,
        email: user.email,
        username: user.username,
        credits: user.credits,
        membershipLevel: user.membershipLevel,
        membershipExpiry: user.membershipExpiry,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      }}
    });
  } catch (error) {
    next(error);
  }
};

// 刷新Token
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const error = new AppError('刷新Token不能为空');
      error.statusCode = 400;
      throw error;
    }

    // 验证刷新Token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
    
    if (decoded.type !== 'refresh') {
      const error = new AppError('无效的刷新Token');
      error.statusCode = 401;
      throw error;
    }

    // 生成新的Token
    const newToken = generateToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      const appError = new AppError('无效的刷新Token');
      appError.statusCode = 401;
      next(appError);
    } else {
      next(error);
    }
  }
};

// 注销
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 这里可以添加Token黑名单逻辑
    // 目前简单返回成功响应
    
    res.json({
      success: true,
      message: '注销成功'
    });
  } catch (error) {
    next(error);
  }
};

// 修改密码
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      const error = new AppError('当前密码和新密码不能为空');
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new AppError('新密码长度至少为6位');
      error.statusCode = 400;
      throw error;
    }

    // 获取用户当前密码
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      const error = new AppError('用户不存在');
      error.statusCode = 404;
      throw error;
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      const error = new AppError('当前密码错误');
      error.statusCode = 401;
      throw error;
    }

    // 加密新密码
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash }
    });

    logger.info(`用户修改密码成功: ${userId}`);

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    next(error);
  }
};