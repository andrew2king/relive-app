import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { asyncHandler, AppError, ERROR_CODES } from '../middleware/errorHandler';
import { sendSuccess } from '../middleware/apiResponse';

const router = Router();

// 验证规则
const updateProfileValidation = [
  body('username')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('用户名长度应在2-20位之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('头像必须是有效的URL'),
  body('bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('个人简介长度不能超过200字符'),
];

// 公开路由
router.get('/status', (req, res) => {
  res.json({ message: 'User routes are working' });
});

// 需要认证的路由
router.use(authenticateToken);

// 获取用户信息
router.get('/profile', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  
  // TODO: Get user from database
  const user = {
    id: userId,
    email: (req as any).user.email,
    username: 'user_' + userId.slice(0, 8),
    avatar: null,
    bio: null,
    membershipLevel: 'FREE',
    membershipExpiredAt: null,
    creditsBalance: 100,
    createdAt: new Date().toISOString()
  };
  
  sendSuccess(res, user, '获取用户信息成功');
}));

// 更新用户信息
router.put('/profile', 
  updateProfileValidation, 
  validate, 
  asyncHandler(async (req, res) => {
    const userId = (req as any).user.id;
    const { username, avatar, bio } = req.body;
    
    // TODO: Update user in database
    const updatedUser = {
      id: userId,
      username,
      avatar,
      bio,
      updatedAt: new Date().toISOString()
    };
    
    sendSuccess(res, updatedUser, '用户信息更新成功');
  })
);

// 获取用户统计信息
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  
  // TODO: Get stats from database
  const stats = {
    totalPhotos: 0,
    totalProcessed: 0,
    creditsUsed: 0,
    favoriteAlbums: 0,
    processingTime: 0 // in seconds
  };
  
  sendSuccess(res, stats, '获取用户统计成功');
}));

// 删除用户账户
router.delete('/account', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  
  // TODO: Implement account deletion
  // 1. Delete all user photos
  // 2. Cancel active processing tasks
  // 3. Remove user data
  // 4. Invalidate all tokens
  
  sendSuccess(res, null, '账户已成功删除');
}));

export default router;