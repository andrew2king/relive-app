import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'relive-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});


// Basic API routes
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'RELIVE Backend is running',
    services: {
      auth: 'available',
      users: 'available',
      photos: 'available',
      processing: 'available'
    }
  });
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
app.post('/api/processing/start', (req, res) => {
  try {
    const { photoId, type, parameters } = req.body;

    if (!photoId || !type) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const taskId = uuidv4();
    const task = {
      id: taskId,
      photoId,
      type,
      parameters: parameters || {},
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      estimatedTime: 60
    };

    processingTasks.set(taskId, task);

    // Simulate processing
    setTimeout(() => {
      const task = processingTasks.get(taskId);
      if (task) {
        task.status = 'processing';
        task.progress = 50;
        processingTasks.set(taskId, task);
      }
    }, 2000);

    setTimeout(() => {
      const task = processingTasks.get(taskId);
      if (task) {
        task.status = 'completed';
        task.progress = 100;
        task.completedAt = new Date().toISOString();
        task.result = {
          outputUrl: `/uploads/processed/${taskId}-result.jpg`,
          qualityScore: 85,
          processingTime: 30
        };
        processingTasks.set(taskId, task);
      }
    }, 10000);

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API status: http://localhost:${PORT}/api/status`);
});

export default app;