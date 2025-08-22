import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCreditsBalance,
  getCreditTransactions,
  consumeCredits,
  addCredits,
  upgradeMembership,
} from '../controllers/creditsController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 验证规则
const consumeCreditsValidation = [
  body('amount')
    .isInt({ min: 1 })
    .withMessage('积分数量必须是大于0的整数'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('描述长度不能超过200字符'),
];

const addCreditsValidation = [
  body('amount')
    .isInt({ min: 1 })
    .withMessage('积分数量必须是大于0的整数'),
  body('type')
    .optional()
    .isIn(['PURCHASE', 'REWARD', 'REFERRAL', 'DAILY_SIGNIN', 'REFUND'])
    .withMessage('无效的积分类型'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('描述长度不能超过200字符'),
];

const upgradeMembershipValidation = [
  body('membershipLevel')
    .isIn(['MONTHLY', 'QUARTERLY', 'YEARLY'])
    .withMessage('无效的会员级别'),
  body('duration')
    .isInt({ min: 1, max: 3650 })
    .withMessage('会员期限必须在1-3650天之间'),
];

// 所有路由都需要认证
router.use(authenticateToken);

// 获取积分余额
router.get('/balance', asyncHandler(getCreditsBalance));

// 获取积分交易记录
router.get('/transactions', asyncHandler(getCreditTransactions));

// 消费积分
router.post('/consume', consumeCreditsValidation, validate, asyncHandler(consumeCredits));

// 充值积分
router.post('/add', addCreditsValidation, validate, asyncHandler(addCredits));

// 升级会员
router.post('/upgrade-membership', upgradeMembershipValidation, validate, asyncHandler(upgradeMembership));

export default router;