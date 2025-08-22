import { Router } from 'express';
import { body, param } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { asyncHandler, AppError, ERROR_CODES } from '../middleware/errorHandler';
import { sendSuccess } from '../middleware/apiResponse';

const router = Router();

// Mock albums storage
const albums = new Map();

// 验证规则
const createAlbumValidation = [
  body('name')
    .notEmpty()
    .withMessage('相册名称不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('相册名称长度应在1-50位之间'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('描述长度不能超过200字符'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('隐私设置必须是布尔值'),
];

const updateAlbumValidation = [
  param('albumId')
    .isUUID()
    .withMessage('相册ID格式不正确'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('相册名称长度应在1-50位之间'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('描述长度不能超过200字符'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('隐私设置必须是布尔值'),
];

const albumIdValidation = [
  param('albumId')
    .isUUID()
    .withMessage('相册ID格式不正确'),
];

// 公开路由
router.get('/status', (req, res) => {
  res.json({ message: 'Album routes are working' });
});

// 需要认证的路由
router.use(authenticateToken);

// 创建相册
router.post('/', 
  createAlbumValidation, 
  validate, 
  asyncHandler(async (req, res) => {
    const { name, description, isPrivate = false } = req.body;
    const userId = (req as any).user.id;
    
    const albumId = uuidv4();
    const album = {
      id: albumId,
      name,
      description,
      isPrivate,
      userId,
      photoCount: 0,
      coverPhoto: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    albums.set(albumId, album);
    
    sendSuccess(res, album, '相册创建成功');
  })
);

// 获取用户相册列表
router.get('/', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const { page = 1, limit = 20, search } = req.query;
  
  let userAlbums = Array.from(albums.values())
    .filter(album => album.userId === userId);
  
  if (search) {
    userAlbums = userAlbums.filter(album => 
      album.name.toLowerCase().includes((search as string).toLowerCase())
    );
  }
  
  // Simple pagination
  const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
  const endIndex = startIndex + parseInt(limit as string);
  const paginatedAlbums = userAlbums.slice(startIndex, endIndex);
  
  sendSuccess(res, {
    albums: paginatedAlbums,
    total: userAlbums.length,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    totalPages: Math.ceil(userAlbums.length / parseInt(limit as string))
  }, '获取相册列表成功');
}));

// 获取相册详情
router.get('/:albumId', 
  albumIdValidation, 
  validate, 
  asyncHandler(async (req, res) => {
    const { albumId } = req.params;
    const userId = (req as any).user.id;
    const album = albums.get(albumId);
    
    if (!album) {
      throw new AppError('相册不存在', 404, ERROR_CODES.NOT_FOUND);
    }
    
    if (album.userId !== userId && album.isPrivate) {
      throw new AppError('无权访问此相册', 403, ERROR_CODES.FORBIDDEN);
    }
    
    // TODO: Add photos list
    album.photos = [];
    
    sendSuccess(res, album, '获取相册详情成功');
  })
);

// 更新相册
router.put('/:albumId', 
  updateAlbumValidation, 
  validate, 
  asyncHandler(async (req, res) => {
    const { albumId } = req.params;
    const { name, description, isPrivate } = req.body;
    const userId = (req as any).user.id;
    const album = albums.get(albumId);
    
    if (!album) {
      throw new AppError('相册不存在', 404, ERROR_CODES.NOT_FOUND);
    }
    
    if (album.userId !== userId) {
      throw new AppError('无权修改此相册', 403, ERROR_CODES.FORBIDDEN);
    }
    
    // Update album
    if (name !== undefined) album.name = name;
    if (description !== undefined) album.description = description;
    if (isPrivate !== undefined) album.isPrivate = isPrivate;
    album.updatedAt = new Date().toISOString();
    
    albums.set(albumId, album);
    
    sendSuccess(res, album, '相册更新成功');
  })
);

// 删除相册
router.delete('/:albumId', 
  albumIdValidation, 
  validate, 
  asyncHandler(async (req, res) => {
    const { albumId } = req.params;
    const userId = (req as any).user.id;
    const album = albums.get(albumId);
    
    if (!album) {
      throw new AppError('相册不存在', 404, ERROR_CODES.NOT_FOUND);
    }
    
    if (album.userId !== userId) {
      throw new AppError('无权删除此相册', 403, ERROR_CODES.FORBIDDEN);
    }
    
    albums.delete(albumId);
    
    sendSuccess(res, null, '相册删除成功');
  })
);

export default router;