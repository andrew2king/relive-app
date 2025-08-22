import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

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
    service: 'relive-ai-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Basic API route
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'RELIVE AI Service is running',
    services: {
      photoRestoration: 'available',
      coloring: 'available',
      animation: 'available'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AI Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;