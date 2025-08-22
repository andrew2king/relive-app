import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPackages,
  createPaymentOrder,
  handlePaymentCallback,
  getUserOrders,
} from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paymentLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 验证规则
const createOrderValidation = [
  body('packageId')
    .notEmpty()
    .withMessage('套餐ID不能为空')
    .isIn([
      'credits_100', 'credits_500', 'credits_1000',
      'membership_monthly', 'membership_quarterly', 'membership_yearly'
    ])
    .withMessage('无效的套餐ID'),
  body('paymentMethod')
    .isIn(['wechat', 'alipay', 'unionpay'])
    .withMessage('不支持的支付方式'),
];

const paymentCallbackValidation = [
  body('orderNumber')
    .notEmpty()
    .withMessage('订单号不能为空'),
  body('status')
    .isIn(['success', 'failed', 'cancelled'])
    .withMessage('无效的支付状态'),
  body('transactionId')
    .optional()
    .isString()
    .withMessage('交易ID必须是字符串'),
  body('signature')
    .notEmpty()
    .withMessage('签名不能为空'),
];

// 公开路由
router.get('/packages', asyncHandler(getPackages));
router.post('/callback', paymentCallbackValidation, validate, asyncHandler(handlePaymentCallback));

// 需要认证的路由
router.use(authenticateToken);
router.use(paymentLimiter);

// 创建支付订单
router.post('/create-order', createOrderValidation, validate, asyncHandler(createPaymentOrder));

// 获取用户订单列表
router.get('/orders', asyncHandler(getUserOrders));

// Status check
router.get('/status', (req, res) => {
  res.json({ message: 'Payment routes are working' });
});

export default router;