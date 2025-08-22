import { Router } from 'express';
import { body, param } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { asyncHandler, AppError, ERROR_CODES } from '../middleware/errorHandler';
import { processingLimiter } from '../middleware/rateLimiter';
import { sendSuccess } from '../middleware/apiResponse';
import { retryWithBackoff } from '../utils/retry';

const router = Router();

// Mock processing tasks storage
const processingTasks = new Map();

// 验证规则
const startProcessingValidation = [
  body('photoId')
    .notEmpty()
    .withMessage('照片ID不能为空')
    .isUUID()
    .withMessage('照片ID格式不正确'),
  body('type')
    .isIn(['colorize', 'enhance', 'upscale', 'restore', 'denoise'])
    .withMessage('无效的处理类型'),
  body('parameters')
    .optional()
    .isObject()
    .withMessage('参数必须是对象'),
];

const getTaskValidation = [
  param('taskId')
    .isUUID()
    .withMessage('任务ID格式不正确'),
];

// 公开路由
router.get('/status', (req, res) => {
  res.json({ message: 'Processing routes are working' });
});

// 需要认证的路由
router.use(authenticateToken);
router.use(processingLimiter);

// Start processing endpoint
router.post('/start', 
  startProcessingValidation, 
  validate, 
  asyncHandler(async (req, res) => {
    const { photoId, type, parameters } = req.body;
    const userId = (req as any).user.id;

    // TODO: Check if user has sufficient credits
    // TODO: Validate photo ownership
    
    const taskId = uuidv4();
    const task = {
      id: taskId,
      photoId,
      type,
      parameters: parameters || {},
      status: 'pending',
      progress: 0,
      userId,
      createdAt: new Date().toISOString(),
      estimatedTime: getEstimatedTime(type)
    };

    processingTasks.set(taskId, task);

    // Start processing with retry mechanism
    startProcessingWithRetry(taskId, task);

    sendSuccess(res, task, '处理任务已创建');
  })
);

// Helper function to get estimated processing time
function getEstimatedTime(type: string): number {
  const times = {
    colorize: 45,
    enhance: 30,
    upscale: 90,
    restore: 60,
    denoise: 25
  };
  return times[type as keyof typeof times] || 60;
}

// Processing simulation with retry
async function startProcessingWithRetry(taskId: string, task: any) {
  try {
    await retryWithBackoff(async () => {
      await simulateProcessing(taskId, task);
    }, {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }, `Processing task ${taskId}`);
  } catch (error) {
    const task = processingTasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error.message;
      task.completedAt = new Date().toISOString();
      processingTasks.set(taskId, task);
    }
  }
}

// Simulate processing with progress updates
async function simulateProcessing(taskId: string, task: any) {
  const updateProgress = (progress: number, status: string = 'processing') => {
    const currentTask = processingTasks.get(taskId);
    if (currentTask) {
      currentTask.status = status;
      currentTask.progress = progress;
      processingTasks.set(taskId, currentTask);
    }
  };

  // Simulate processing steps
  await new Promise(resolve => setTimeout(resolve, 2000));
  updateProgress(25);
  
  await new Promise(resolve => setTimeout(resolve, 13000));
  updateProgress(75);
  
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  const finalTask = processingTasks.get(taskId);
  if (finalTask) {
    finalTask.status = 'completed';
    finalTask.progress = 100;
    finalTask.completedAt = new Date().toISOString();
    finalTask.result = {
      outputUrl: `/uploads/processed/${taskId}-result.jpg`,
      qualityScore: 80 + Math.random() * 20,
      processingTime: Math.floor(Math.random() * 30) + 15
    };
    processingTasks.set(taskId, finalTask);
  }
}

// Get processing status endpoint
router.get('/:taskId/status', 
  getTaskValidation, 
  validate, 
  asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const userId = (req as any).user.id;
    const task = processingTasks.get(taskId);

    if (!task) {
      throw new AppError('任务不存在', 404, ERROR_CODES.NOT_FOUND);
    }

    // Check task ownership
    if (task.userId !== userId) {
      throw new AppError('无权访问此任务', 403, ERROR_CODES.FORBIDDEN);
    }

    sendSuccess(res, task, '获取任务状态成功');
  })
);

// List processing tasks endpoint
router.get('/', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const { page = 1, limit = 20, status } = req.query;
  
  let tasks = Array.from(processingTasks.values())
    .filter(task => task.userId === userId);
  
  if (status) {
    tasks = tasks.filter(task => task.status === status);
  }
  
  // Simple pagination
  const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
  const endIndex = startIndex + parseInt(limit as string);
  const paginatedTasks = tasks.slice(startIndex, endIndex);
  
  sendSuccess(res, {
    tasks: paginatedTasks,
    total: tasks.length,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    totalPages: Math.ceil(tasks.length / parseInt(limit as string))
  }, '获取任务列表成功');
}));

// Cancel processing task
router.delete('/:taskId', 
  getTaskValidation, 
  validate, 
  asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const userId = (req as any).user.id;
    const task = processingTasks.get(taskId);

    if (!task) {
      throw new AppError('任务不存在', 404, ERROR_CODES.NOT_FOUND);
    }

    if (task.userId !== userId) {
      throw new AppError('无权取消此任务', 403, ERROR_CODES.FORBIDDEN);
    }

    if (task.status === 'completed' || task.status === 'failed') {
      throw new AppError('任务已完成，无法取消', 400, ERROR_CODES.CONFLICT);
    }

    task.status = 'cancelled';
    task.completedAt = new Date().toISOString();
    processingTasks.set(taskId, task);

    sendSuccess(res, task, '任务已取消');
  })
);

export default router;