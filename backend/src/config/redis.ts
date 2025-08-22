import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      retry_delay_on_failover: 100,
      retry_delay_on_cluster_down: 300,
      max_attempts: 3,
    });

    redisClient.on('error', (error) => {
      logger.error('Redis Client Error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis Client Disconnected');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis disconnected successfully');
    }
  } catch (error) {
    logger.error('Redis disconnection failed:', error);
    throw error;
  }
};

// Cache utilities
export const cacheService = {
  // Set cache with expiration
  set: async (key: string, value: any, ttl: number = 3600): Promise<void> => {
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.setEx(key, ttl, serializedValue);
    } catch (error) {
      logger.error('Cache set error:', error);
      throw error;
    }
  },

  // Get cache
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  // Delete cache
  del: async (key: string): Promise<void> => {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
      throw error;
    }
  },

  // Check if key exists
  exists: async (key: string): Promise<boolean> => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists check error:', error);
      return false;
    }
  },

  // Set with pattern matching
  keys: async (pattern: string): Promise<string[]> => {
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      logger.error('Cache keys error:', error);
      return [];
    }
  },

  // Increment value
  incr: async (key: string): Promise<number> => {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      logger.error('Cache increment error:', error);
      throw error;
    }
  },

  // Set expiration
  expire: async (key: string, ttl: number): Promise<void> => {
    try {
      await redisClient.expire(key, ttl);
    } catch (error) {
      logger.error('Cache expire error:', error);
      throw error;
    }
  },
};

// Session management
export const sessionService = {
  // Set user session
  setUserSession: async (userId: string, sessionData: any, ttl: number = 86400): Promise<void> => {
    const key = `session:${userId}`;
    await cacheService.set(key, sessionData, ttl);
  },

  // Get user session
  getUserSession: async (userId: string): Promise<any> => {
    const key = `session:${userId}`;
    return await cacheService.get(key);
  },

  // Delete user session
  deleteUserSession: async (userId: string): Promise<void> => {
    const key = `session:${userId}`;
    await cacheService.del(key);
  },
};

// Rate limiting
export const rateLimitService = {
  // Check rate limit
  checkRateLimit: async (key: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    try {
      const current = await redisClient.incr(key);
      
      if (current === 1) {
        await redisClient.expire(key, window);
      }
      
      const ttl = await redisClient.ttl(key);
      const resetTime = Date.now() + (ttl * 1000);
      
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime,
      };
    } catch (error) {
      logger.error('Rate limit check error:', error);
      // Allow request if Redis is unavailable
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + (window * 1000),
      };
    }
  },
};

// Job queue (simple implementation)
export const queueService = {
  // Add job to queue
  addJob: async (queueName: string, jobData: any, delay: number = 0): Promise<void> => {
    const jobId = `job:${Date.now()}:${Math.random()}`;
    const job = {
      id: jobId,
      data: jobData,
      createdAt: Date.now(),
      processAt: Date.now() + (delay * 1000),
    };
    
    await redisClient.lPush(`queue:${queueName}`, JSON.stringify(job));
  },

  // Get job from queue
  getJob: async (queueName: string): Promise<any> => {
    const jobString = await redisClient.rPop(`queue:${queueName}`);
    return jobString ? JSON.parse(jobString) : null;
  },

  // Get queue length
  getQueueLength: async (queueName: string): Promise<number> => {
    return await redisClient.lLen(`queue:${queueName}`);
  },
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export default redisClient;