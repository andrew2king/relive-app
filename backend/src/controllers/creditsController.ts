import { Request, Response, NextFunction } from 'express';
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

// 获取用户积分余额
export const getCreditsBalance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const dbAvailable = await isDatabaseAvailable();
    let user: any;

    if (dbAvailable) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          credits: true,
          membershipLevel: true,
          membershipExpiry: true,
        }
      });
    } else {
      const memoryStore = getMemoryStore();
      user = await memoryStore.findUserById(userId);
    }

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    res.json({
      success: true,
      data: {
        credits: user.credits,
        membershipLevel: user.membershipLevel,
        membershipExpiry: user.membershipExpiry,
        isVip: user.membershipLevel !== 'FREE' && 
               (!user.membershipExpiry || new Date() < new Date(user.membershipExpiry))
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取积分交易记录
export const getCreditTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const dbAvailable = await isDatabaseAvailable();
    let transactions: any[];
    let total: number;

    if (dbAvailable) {
      const [transactionList, count] = await Promise.all([
        prisma.creditTransaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.creditTransaction.count({
          where: { userId }
        })
      ]);
      transactions = transactionList;
      total = count;
    } else {
      const memoryStore = getMemoryStore();
      const allTransactions = await memoryStore.getCreditTransactionsByUserId(userId);
      transactions = allTransactions.slice(offset, offset + limit);
      total = allTransactions.length;
    }

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 消费积分（用于AI处理）
export const consumeCredits = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { amount, description, taskId } = req.body;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    if (!amount || amount <= 0) {
      throw new AppError('积分数量必须大于0', 400);
    }

    const dbAvailable = await isDatabaseAvailable();
    let user: any;
    let updatedUser: any;
    let transaction: any;

    if (dbAvailable) {
      // 使用数据库事务确保一致性
      await prisma.$transaction(async (tx) => {
        // 获取当前用户积分
        user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, credits: true }
        });

        if (!user) {
          throw new AppError('用户不存在', 404);
        }

        if (user.credits < amount) {
          throw new AppError('积分不足', 402);
        }

        // 扣除积分
        updatedUser = await tx.user.update({
          where: { id: userId },
          data: { credits: user.credits - amount },
          select: { id: true, credits: true }
        });

        // 记录交易
        transaction = await tx.creditTransaction.create({
          data: {
            userId,
            amount: -amount,
            type: 'PROCESSING_COST',
            description: description || 'AI处理服务消费',
            balanceBefore: user.credits,
            balanceAfter: user.credits - amount,
            ...(taskId && { taskId })
          }
        });
      });
    } else {
      // 使用内存存储
      const memoryStore = getMemoryStore();
      user = await memoryStore.findUserById(userId);

      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      if (user.credits < amount) {
        throw new AppError('积分不足', 402);
      }

      // 更新用户积分
      updatedUser = await memoryStore.updateUser(userId, {
        credits: user.credits - amount
      });

      // 记录交易
      transaction = await memoryStore.createCreditTransaction({
        userId,
        amount: -amount,
        type: 'PROCESSING_COST',
        description: description || 'AI处理服务消费',
        balanceBefore: user.credits,
        balanceAfter: user.credits - amount,
      });
    }

    logger.info(`用户 ${userId} 消费积分: ${amount}, 剩余: ${updatedUser.credits}`);

    res.json({
      success: true,
      message: '积分消费成功',
      data: {
        transaction,
        newBalance: updatedUser.credits
      }
    });
  } catch (error) {
    next(error);
  }
};

// 充值积分（管理员功能或购买后调用）
export const addCredits = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { amount, type, description, orderId } = req.body;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    if (!amount || amount <= 0) {
      throw new AppError('积分数量必须大于0', 400);
    }

    const dbAvailable = await isDatabaseAvailable();
    let user: any;
    let updatedUser: any;
    let transaction: any;

    if (dbAvailable) {
      await prisma.$transaction(async (tx) => {
        user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, credits: true }
        });

        if (!user) {
          throw new AppError('用户不存在', 404);
        }

        // 增加积分
        updatedUser = await tx.user.update({
          where: { id: userId },
          data: { credits: user.credits + amount },
          select: { id: true, credits: true }
        });

        // 记录交易
        transaction = await tx.creditTransaction.create({
          data: {
            userId,
            amount,
            type: type || 'PURCHASE',
            description: description || '积分充值',
            balanceBefore: user.credits,
            balanceAfter: user.credits + amount,
            ...(orderId && { orderId })
          }
        });
      });
    } else {
      const memoryStore = getMemoryStore();
      user = await memoryStore.findUserById(userId);

      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      // 更新用户积分
      updatedUser = await memoryStore.updateUser(userId, {
        credits: user.credits + amount
      });

      // 记录交易
      transaction = await memoryStore.createCreditTransaction({
        userId,
        amount,
        type: type || 'PURCHASE',
        description: description || '积分充值',
        balanceBefore: user.credits,
        balanceAfter: user.credits + amount,
      });
    }

    logger.info(`用户 ${userId} 获得积分: ${amount}, 余额: ${updatedUser.credits}`);

    res.json({
      success: true,
      message: '积分充值成功',
      data: {
        transaction,
        newBalance: updatedUser.credits
      }
    });
  } catch (error) {
    next(error);
  }
};

// 升级会员
export const upgradeMembership = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { membershipLevel, duration } = req.body; // duration in days

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const validLevels = ['MONTHLY', 'QUARTERLY', 'YEARLY'];
    if (!validLevels.includes(membershipLevel)) {
      throw new AppError('无效的会员级别', 400);
    }

    const dbAvailable = await isDatabaseAvailable();
    let user: any;
    let updatedUser: any;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + duration);

    if (dbAvailable) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, membershipLevel: true, membershipExpiry: true }
      });

      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          membershipLevel,
          membershipExpiry: expiryDate
        },
        select: {
          id: true,
          membershipLevel: true,
          membershipExpiry: true
        }
      });
    } else {
      const memoryStore = getMemoryStore();
      user = await memoryStore.findUserById(userId);

      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      updatedUser = await memoryStore.updateUser(userId, {
        membershipLevel,
        membershipExpiry: expiryDate
      });
    }

    logger.info(`用户 ${userId} 升级会员: ${membershipLevel}, 到期: ${expiryDate}`);

    res.json({
      success: true,
      message: '会员升级成功',
      data: {
        membershipLevel: updatedUser.membershipLevel,
        membershipExpiry: updatedUser.membershipExpiry
      }
    });
  } catch (error) {
    next(error);
  }
};