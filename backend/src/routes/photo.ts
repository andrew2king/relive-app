import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { asyncHandler, AppError, ERROR_CODES } from '../middleware/errorHandler';
import { uploadLimiter } from '../middleware/rateLimiter';
import { sendSuccess } from '../middleware/apiResponse';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/photos');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|tiff|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new AppError('只支持图片文件格式 (JPEG, PNG, TIFF, WebP)', 400, ERROR_CODES.VALIDATION_ERROR));
    }
  }
});

// 验证规则
const uploadValidation = [
  body('albumId')
    .optional()
    .isUUID()
    .withMessage('相册ID格式不正确'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述长度不能超过500字符'),
];

// 需要认证的路由
router.use(authenticateToken);

router.get('/status', (req, res) => {
  res.json({ message: 'Photo routes are working' });
});

// Upload photo endpoint
router.post('/upload', 
  uploadLimiter,
  upload.single('photo'), 
  uploadValidation, 
  validate, 
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('没有找到上传的文件', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const photo = {
      id: uuidv4(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      userId: (req as any).user.id,
      albumId: req.body.albumId || null,
      description: req.body.description || null
    };

    // TODO: Save to database
    sendSuccess(res, photo, '照片上传成功');
  })
);

// Get photos endpoint
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, albumId } = req.query;
  const userId = (req as any).user.id;
  
  // TODO: Implement database query
  const photos = [];
  const total = 0;
  
  sendSuccess(res, {
    photos,
    total,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    totalPages: Math.ceil(total / parseInt(limit as string))
  }, '获取照片列表成功');
}));

// Get photo by ID
router.get('/:photoId', asyncHandler(async (req, res) => {
  const { photoId } = req.params;
  const userId = (req as any).user.id;
  
  if (!photoId) {
    throw new AppError('照片ID不能为空', 400, ERROR_CODES.VALIDATION_ERROR);
  }
  
  // TODO: Implement database query and check ownership
  throw new AppError('照片不存在', 404, ERROR_CODES.NOT_FOUND);
}));

// Delete photo
router.delete('/:photoId', asyncHandler(async (req, res) => {
  const { photoId } = req.params;
  const userId = (req as any).user.id;
  
  if (!photoId) {
    throw new AppError('照片ID不能为空', 400, ERROR_CODES.VALIDATION_ERROR);
  }
  
  // TODO: Implement database deletion and file cleanup
  sendSuccess(res, null, '照片删除成功');
}));

export default router;