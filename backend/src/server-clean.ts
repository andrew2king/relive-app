import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import { RealAIProcessing } from './services/realAIProcessing';
import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { addRequestId } from './middleware/apiResponse';
import { generalLimiter } from './middleware/rateLimiter';
import { 
  generalRateLimit, 
  authRateLimit, 
  apiRateLimit, 
  uploadRateLimit,
  securityHeaders,
  suspiciousActivityDetection,
  requestSizeLimit
} from './middleware/security';
import { 
  getCsrfToken, 
  sameSiteCookies 
} from './middleware/csrf';
import { 
  sanitizeInput, 
  handleValidationErrors, 
  preventSQLInjection, 
  validateFileType, 
  ValidationRuleBuilder 
} from './middleware/inputValidation';
import authRoutes from './routes/auth';
import creditsRoutes from './routes/credits';
import paymentRoutes from './routes/payment';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Security Middleware
app.use(securityHeaders);
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // 允许前端访问
  credentials: true
}));

// 请求追踪和安全防护
app.use(addRequestId);
app.use(sameSiteCookies);
app.use(requestSizeLimit('50mb'));
app.use(suspiciousActivityDetection);
app.use(generalRateLimit);

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input validation and sanitization
app.use(sanitizeInput);
app.use(preventSQLInjection);

// Static file serving for uploaded and processed files
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    // 设置正确的MIME类型
    if (path.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Disposition', 'inline');
    } else if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const ext = path.split('.').pop()?.toLowerCase();
      if (ext) {
        res.setHeader('Content-Type', 'image/' + ext);
      }
    }
  }
}));

// Security endpoints
app.get('/api/csrf-token', getCsrfToken);

// Auth routes (with auth-specific rate limiting)
app.use('/api/auth', authRateLimit, authRoutes);

// Credits routes
app.use('/api/credits', apiRateLimit, creditsRoutes);

// Payment routes
app.use('/api/payment', apiRateLimit, paymentRoutes);

// 静态文件服务
app.use('/public', express.static('public'));

// 获取图生视频提示词模板
app.get('/api/templates/image-to-video', async (req, res) => {
  try {
    const templatesPath = path.join(__dirname, '../public/image-to-video-templates.json');
    const templatesData = await fs.readFile(templatesPath, 'utf-8');
    const templates = JSON.parse(templatesData);
    
    res.json({
      success: true,
      data: templates,
      message: '获取提示词模板成功'
    });
  } catch (error) {
    console.error('获取模板失败:', error);
    res.status(500).json({
      success: false,
      error: '获取提示词模板失败'
    });
  }
});

// 根据分类获取模板
app.get('/api/templates/image-to-video/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const templatesPath = path.join(__dirname, '../public/image-to-video-templates.json');
    const templatesData = await fs.readFile(templatesPath, 'utf-8');
    const templates = JSON.parse(templatesData);
    
    const categoryData = templates.image_to_video_templates.categories[category];
    
    if (!categoryData) {
      return res.status(404).json({
        success: false,
        error: `分类 '${category}' 不存在`
      });
    }
    
    res.json({
      success: true,
      data: categoryData,
      message: `获取 ${categoryData.name} 模板成功`
    });
  } catch (error) {
    console.error('获取分类模板失败:', error);
    res.status(500).json({
      success: false,
      error: '获取分类模板失败'
    });
  }
});

// 后台管理页面
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// 提示词模板展示页面
app.get('/templates', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/templates.html'));
});

// 专业图生视频界面
app.get('/video-generator', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/video-generator.html'));
});

// 移动端图生视频界面（别名）
app.get('/mobile-video', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/video-generator.html'));
});

// Root route - 智能重定向
app.get('/', (req, res) => {
  // 检查Accept头部，如果是浏览器访问则重定向到后台
  const acceptHeader = req.get('Accept') || '';
  if (acceptHeader.includes('text/html')) {
    res.redirect('/admin');
  } else {
    res.json({
      message: 'RELIVE AI Photo Restoration Platform API',
      version: '1.0.0',
      admin_panel: '/admin',
      endpoints: {
        health: '/health',
        status: '/api/status',
        upload: '/api/photos/upload',
        processing: '/api/processing/start',
        types: '/api/processing/types'
      },
      features: [
        '智能修复 (综合破损修复+模糊修复+黑白上色+高清放大)',
        '人物复活 (先智能修复，再生成MP4视频)'
      ]
    });
  }
});

// Health check route
app.get('/health', async (req, res) => {
  const aiStatus = await aiService.checkEnvironment();
  res.status(200).json({ 
    status: 'healthy',
    service: 'relive-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    ai_environment: aiStatus
  });
});

// Basic API routes
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'RELIVE Backend is running',
    services: {
      auth: 'available',
      credits: 'available',
      payment: 'available',
      users: 'available',
      photos: 'available',
      processing: 'available'
    }
  });
});

// Get supported processing types
app.get('/api/processing/types', (req, res) => {
  try {
    const supportedTypes = aiService.getSupportedTypes();
    res.json({
      success: true,
      data: supportedTypes,
      message: '获取处理类型成功'
    });
  } catch (error) {
    console.error('Get processing types error:', error);
    res.status(500).json({
      success: false,
      message: '获取处理类型失败'
    });
  }
});

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
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|tiff|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件格式'));
    }
  }
});

const processingTasks = new Map();

const aiService = new RealAIProcessing();

// 未来：启用真实AI服务
// import { RealAIPhotoService } from './services/realAIService';
// const realAIService = RealAIPhotoService.getInstance();

// Photo upload endpoint
app.post('/api/photos/upload', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有找到上传的文件'
      });
    }

    const photo = {
      id: uuidv4(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: photo,
      message: '照片上传成功'
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      success: false,
      message: '照片上传失败'
    });
  }
});

// Start processing endpoint
app.post('/api/processing/start', async (req, res) => {
  try {
    const { photoId, type, prompt, parameters } = req.body;

    if (!photoId || !type) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 验证处理类型
    const supportedTypes = aiService.getSupportedTypes();
    if (!supportedTypes[type as keyof typeof supportedTypes]) {
      return res.status(400).json({
        success: false,
        message: '不支持的处理类型'
      });
    }

    const taskId = uuidv4();
    const task = {
      id: taskId,
      photoId,
      type,
      prompt: prompt || '自然的动态效果',
      parameters: parameters || {},
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      estimatedTime: 60
    };

    processingTasks.set(taskId, task);

    // 开始异步处理
    processPhotoAsync(taskId, photoId, type, prompt, parameters);

    res.json({
      success: true,
      data: task,
      message: '处理任务已创建'
    });
  } catch (error) {
    console.error('Processing start error:', error);
    res.status(500).json({
      success: false,
      message: '创建处理任务失败'
    });
  }
});

// 异步处理照片
async function processPhotoAsync(taskId: string, photoId: string, type: string, prompt: string, parameters: any) {
  try {
    const task = processingTasks.get(taskId);
    if (!task) return;

    // 更新状态为处理中
    task.status = 'processing';
    task.progress = 10;
    processingTasks.set(taskId, task);

    // 在实际应用中，这里会从数据库查询照片路径
    // 现在我们需要找到实际上传的文件
    let inputPath = `uploads/photos/photo-${photoId}.jpg`;
    
    // 尝试找到实际的上传文件
    try {
      const photosDir = 'uploads/photos';
      const files = await fs.readdir(photosDir);
      const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
      
      // 过滤掉测试文件和小文件，优先选择真实上传的图片
      const realImageFiles = imageFiles.filter(f => 
        !f.includes('test') && 
        !f.includes('sample') &&
        f.startsWith('photo-') && 
        f.length > 20
      );
      
      // 查找包含photoId的文件
      const matchingFile = realImageFiles.find(f => f.includes(photoId));
      if (matchingFile) {
        inputPath = `${photosDir}/${matchingFile}`;
        console.log(`找到匹配的上传文件: ${inputPath}`);
      } else if (realImageFiles.length > 0) {
        // 使用最新的真实图片文件
        inputPath = `${photosDir}/${realImageFiles[realImageFiles.length - 1]}`;
        console.log(`使用最新的真实上传文件: ${inputPath}`);
      } else if (imageFiles.length > 0) {
        // 如果没有真实图片，使用任何图片文件
        inputPath = `${photosDir}/${imageFiles[imageFiles.length - 1]}`;
        console.log(`使用可用的上传文件: ${inputPath}`);
      }
    } catch (error) {
      console.log('无法读取uploads目录，使用默认路径');
    }
    
    // 更新进度
    task.progress = 20;
    processingTasks.set(taskId, task);

    // 调用AI服务处理
    const outputPath = aiService.generateOutputPath(inputPath, type);
    const processingResult = await aiService.processImage(inputPath, outputPath, type, prompt);

    // 转换结果格式以匹配前端期望
    const result = {
      outputUrl: `/uploads/processed/${path.basename(processingResult.outputPath)}`,
      qualityScore: processingResult.metadata.qualityImprovement,
      processingTime: Math.round(processingResult.processingTime / 1000),
      metadata: {
        originalSize: { width: 1024, height: 768 },
        outputSize: { width: 1024, height: 768 },
        improvements: processingResult.metadata.visualChanges,
        technique: processingResult.metadata.technique
      },
    };

    // 更新任务为完成状态
    task.status = 'completed';
    task.progress = 100;
    task.completedAt = new Date().toISOString();
    task.result = result;
    processingTasks.set(taskId, task);

    console.log(`照片处理完成: ${taskId}`);
  } catch (error) {
    console.error(`照片处理失败: ${taskId}`, error);
    
    const task = processingTasks.get(taskId);
    if (task) {
      // 检查是否是服务繁忙错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isServiceBusy = errorMessage.includes('服务排队') || 
                          errorMessage.includes('服务繁忙') || 
                          errorMessage.includes('service_busy') ||
                          errorMessage.includes('timeout') ||
                          errorMessage.includes('The write operation timed out');
      
      if (isServiceBusy) {
        task.status = 'queued';
        task.progress = 5;
        task.error = '云端GFPGAN服务处理排队中，请耐心等待...';
        task.errorType = 'service_busy';
      } else {
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : '处理失败';
      }
      processingTasks.set(taskId, task);
    }
  }
}

// Get processing status
app.get('/api/processing/:taskId/status', (req, res) => {
  try {
    const { taskId } = req.params;
    const task = processingTasks.get(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      data: task,
      message: '获取任务状态成功'
    });
  } catch (error) {
    console.error('Get processing status error:', error);
    res.status(500).json({
      success: false,
      message: '获取任务状态失败'
    });
  }
});

// 后台管理API - 获取所有任务
app.get('/api/admin/tasks', (req, res) => {
  try {
    const allTasks = Array.from(processingTasks.values()).map(task => {
      return {
        id: task.id,
        photoId: task.photoId,
        type: task.type,
        status: task.status,
        progress: task.progress,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        error: task.error,
        result: task.result,
        estimatedTime: task.estimatedTime
      };
    });
    
    // 按创建时间倒序排列
    allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({
      success: true,
      data: allTasks,
      stats: {
        total: allTasks.length,
        active: allTasks.filter(t => t.status === 'processing' || t.status === 'queued').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        failed: allTasks.filter(t => t.status === 'failed').length,
        completedToday: allTasks.filter(t => {
          const today = new Date().toDateString();
          return t.status === 'completed' && new Date(t.createdAt).toDateString() === today;
        }).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取任务列表失败'
    });
  }
});

// 404处理中间件
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Try to connect to database (optional for development)
    if (process.env.DATABASE_URL) {
      try {
        await connectDatabase();
        console.log('✅ Database connected successfully');
      } catch (dbError) {
        console.warn('⚠️  Database connection failed, running without database:');
        console.warn(dbError instanceof Error ? dbError.message : dbError);
        console.warn('🔧 To enable database features, please set up PostgreSQL');
      }
    } else {
      console.log('ℹ️  No DATABASE_URL configured, running without database');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 API status: http://localhost:${PORT}/api/status`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/status`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;