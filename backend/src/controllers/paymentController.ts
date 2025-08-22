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

// 商品套餐配置
interface Package {
  id: string;
  name: string;
  type: 'credits' | 'membership';
  amount: number;
  credits: number;
  description: string;
  membershipLevel?: string;
  duration?: number;
}

const PACKAGES: { [key: string]: Package } = {
  credits_100: {
    id: 'credits_100',
    name: '100积分包',
    type: 'credits',
    amount: 9.90,
    credits: 100,
    description: '适合偶尔使用的用户'
  },
  credits_500: {
    id: 'credits_500',
    name: '500积分包',
    type: 'credits',
    amount: 39.90,
    credits: 500,
    description: '性价比之选，送额外100积分'
  },
  credits_1000: {
    id: 'credits_1000',
    name: '1000积分包',
    type: 'credits',
    amount: 69.90,
    credits: 1000,
    description: '大量使用用户首选，送额外200积分'
  },
  membership_monthly: {
    id: 'membership_monthly',
    name: '月度会员',
    type: 'membership',
    amount: 29.90,
    membershipLevel: 'MONTHLY',
    duration: 30,
    credits: 2000,
    description: '每月2000积分 + VIP特权'
  },
  membership_quarterly: {
    id: 'membership_quarterly',
    name: '季度会员',
    type: 'membership',
    amount: 79.90,
    membershipLevel: 'QUARTERLY',
    duration: 90,
    credits: 6500,
    description: '每季度6500积分 + VIP特权，省钱10%'
  },
  membership_yearly: {
    id: 'membership_yearly',
    name: '年度会员',
    type: 'membership',
    amount: 199.90,
    membershipLevel: 'YEARLY',
    duration: 365,
    credits: 15000,
    description: '每年15000积分 + VIP特权，省钱33%'
  }
};

// 获取所有商品套餐
export const getPackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        packages: Object.values(PACKAGES),
        categories: {
          credits: Object.values(PACKAGES).filter(p => p.type === 'credits'),
          membership: Object.values(PACKAGES).filter(p => p.type === 'membership')
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 创建支付订单
export const createPaymentOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { packageId, paymentMethod } = req.body;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    // 验证套餐
    const packageInfo = PACKAGES[packageId as keyof typeof PACKAGES];
    if (!packageInfo) {
      throw new AppError('无效的套餐ID', 400);
    }

    // 验证支付方式
    const supportedMethods = ['wechat', 'alipay', 'unionpay'];
    if (!supportedMethods.includes(paymentMethod)) {
      throw new AppError('不支持的支付方式', 400);
    }

    const orderNumber = generateOrderNumber();
    const dbAvailable = await isDatabaseAvailable();
    let order: any;

    if (dbAvailable) {
      // 使用数据库
      order = await prisma.order.create({
        data: {
          userId,
          type: packageInfo.type === 'credits' ? 'CREDITS' : 'MEMBERSHIP',
          packageId: packageInfo.id,
          amount: packageInfo.amount,
          credits: packageInfo.credits,
          membershipLevel: packageInfo.type === 'membership' ? (packageInfo as any).membershipLevel : null,
          membershipDuration: packageInfo.type === 'membership' ? (packageInfo as any).duration : null,
          status: 'PENDING',
          paymentMethod,
        }
      });
    } else {
      // 使用内存存储（简化版）
      order = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: packageInfo.type === 'credits' ? 'CREDITS' : 'MEMBERSHIP',
        packageId: packageInfo.id,
        amount: packageInfo.amount,
        credits: packageInfo.credits,
        membershipLevel: packageInfo.type === 'membership' ? (packageInfo as any).membershipLevel : null,
        membershipDuration: packageInfo.type === 'membership' ? (packageInfo as any).duration : null,
        status: 'PENDING',
        paymentMethod,
        createdAt: new Date(),
      };
      // 注意：内存存储版本不会持久化订单
    }

    // 生成支付参数（模拟）
    const paymentParams = generatePaymentParams(order, paymentMethod);

    logger.info(`创建支付订单: ${orderNumber}, 用户: ${userId}, 金额: ${packageInfo.amount}`);

    res.json({
      success: true,
      message: '订单创建成功',
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          packageName: packageInfo.name,
          amount: order.amount,
          paymentMethod: order.paymentMethod,
          status: order.status,
          createdAt: order.createdAt,
        },
        paymentParams
      }
    });
  } catch (error) {
    next(error);
  }
};

// 支付回调处理
export const handlePaymentCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderNumber, status, transactionId, signature } = req.body;

    if (!orderNumber || !status) {
      throw new AppError('缺少必要参数', 400);
    }

    // 验证签名（在实际应用中需要验证支付平台的签名）
    if (!verifyPaymentSignature(req.body, signature)) {
      throw new AppError('签名验证失败', 403);
    }

    const dbAvailable = await isDatabaseAvailable();
    let order: any;

    if (dbAvailable) {
      // 简化处理，暂时跳过订单查找和更新
      logger.info(`支付回调 (DB): ${orderNumber}, 状态: ${status}, 交易ID: ${transactionId}`);
    } else {
      // 内存存储版本的简化处理
      logger.info(`支付回调 (Memory Store): ${orderNumber}, 状态: ${status}`);
    }

    res.json({
      success: true,
      message: status === 'success' ? '支付成功' : '支付失败'
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户订单列表
export const getUserOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    if (!userId) {
      throw new AppError('未认证', 401);
    }

    const dbAvailable = await isDatabaseAvailable();
    let orders: any[] = [];
    let total = 0;

    if (dbAvailable) {
      const [orderList, count] = await Promise.all([
        prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.order.count({
          where: { userId }
        })
      ]);
      orders = orderList;
      total = count;
    } else {
      // 内存存储版本返回空列表
      orders = [];
      total = 0;
    }

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          packageId: order.packageId,
          amount: order.amount,
          status: order.status,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          paidAt: order.paidAt,
        })),
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

// 生成订单号
function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `RL${timestamp}${random}`;
}

// 生成支付参数（模拟）
function generatePaymentParams(order: any, paymentMethod: string) {
  const baseParams = {
    orderNumber: order.orderNumber,
    amount: order.amount,
    description: `RELIVE积分充值 - ${order.packageId}`,
    timestamp: Date.now(),
  };

  switch (paymentMethod) {
    case 'wechat':
      return {
        ...baseParams,
        provider: 'wechat',
        qrCode: `https://api.relive.app/qr/wechat/${order.orderNumber}`,
        appId: 'wx_demo_app_id',
        redirectUrl: `https://relive.app/payment/result?order=${order.orderNumber}`
      };
    case 'alipay':
      return {
        ...baseParams,
        provider: 'alipay',
        qrCode: `https://api.relive.app/qr/alipay/${order.orderNumber}`,
        redirectUrl: `https://relive.app/payment/result?order=${order.orderNumber}`
      };
    case 'unionpay':
      return {
        ...baseParams,
        provider: 'unionpay',
        redirectUrl: `https://api.relive.app/unionpay/redirect/${order.orderNumber}`
      };
    default:
      return baseParams;
  }
}

// 验证支付签名（模拟）
function verifyPaymentSignature(data: any, signature: string): boolean {
  // 在实际应用中，这里应该使用真实的签名验证逻辑
  // 例如使用 HMAC-SHA256 验证微信支付或支付宝的签名
  return true; // 暂时返回 true 用于演示
}

// 处理支付成功后的业务逻辑
async function processSuccessfulPayment(order: any) {
  try {
    if (order.type === 'CREDITS') {
      // 充值积分
      await prisma.user.update({
        where: { id: order.userId },
        data: {
          credits: {
            increment: order.credits
          }
        }
      });

      // 记录积分交易
      await prisma.creditTransaction.create({
        data: {
          userId: order.userId,
          amount: order.credits,
          type: 'PURCHASE',
          description: `购买积分包 - ${order.packageId}`,
          balanceBefore: order.user.credits,
          balanceAfter: order.user.credits + order.credits,
          orderId: order.id,
        }
      });
    } else if (order.type === 'MEMBERSHIP') {
      // 升级会员
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + order.membershipDuration);

      await prisma.user.update({
        where: { id: order.userId },
        data: {
          membershipLevel: order.membershipLevel,
          membershipExpiry: expiryDate,
          credits: {
            increment: order.credits
          }
        }
      });

      // 记录积分交易
      await prisma.creditTransaction.create({
        data: {
          userId: order.userId,
          amount: order.credits,
          type: 'PURCHASE',
          description: `购买会员 - ${order.packageId}`,
          balanceBefore: order.user.credits,
          balanceAfter: order.user.credits + order.credits,
          orderId: order.id,
        }
      });
    }

    logger.info(`支付成功处理完成: 订单 ${order.orderNumber}`);
  } catch (error) {
    logger.error(`支付成功处理失败: 订单 ${order.orderNumber}`, error);
    throw error;
  }
}