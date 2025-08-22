import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  refreshToken,
  logout,
  changePassword,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter, registerLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 验证规则
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少为6位'),
  body('username')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('用户名长度应在2-20位之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码长度至少为6位'),
];

// 公开路由
router.post('/register', registerLimiter, registerValidation, validate, asyncHandler(register));
router.post('/login', authLimiter, loginValidation, validate, asyncHandler(login));
router.post('/refresh-token', asyncHandler(refreshToken));

// 需要认证的路由
router.get('/me', authenticateToken, asyncHandler(getMe));
router.post('/logout', authenticateToken, asyncHandler(logout));
router.put('/change-password', authenticateToken, changePasswordValidation, validate, asyncHandler(changePassword));

// Health check for auth routes
router.get('/status', (req, res) => {
  res.json({ message: 'Auth routes are working' });
});

export default router;