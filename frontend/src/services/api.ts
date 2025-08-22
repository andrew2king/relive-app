import axios, { AxiosResponse, AxiosError } from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // 401错误处理 - token过期
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 尝试刷新token
        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data.success && data.data?.token) {
            localStorage.setItem('token', data.data.token);
            originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // 刷新失败，跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // 429错误处理 - 请求过于频繁
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        throw new Error(`请求过于频繁，请${retryAfter}秒后再试`);
      }
    }
    
    return Promise.reject(error);
  }
);

export interface PhotoUploadResponse {
  success: boolean;
  data: {
    id: string;
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
  };
  message: string;
}

export interface ProcessingStartResponse {
  success: boolean;
  data: {
    id: string;
    photoId: string;
    type: string;
    parameters: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    createdAt: string;
    estimatedTime: number;
  };
  message: string;
}

export interface ProcessingStatusResponse {
  success: boolean;
  data: {
    id: string;
    photoId: string;
    type: string;
    parameters: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    createdAt: string;
    estimatedTime: number;
    completedAt?: string;
    result?: {
      outputUrl: string;
      qualityScore: number;
      processingTime: number;
    };
  };
  message: string;
}

export const photoAPI = {
  // 上传照片
  uploadPhoto: async (file: File): Promise<PhotoUploadResponse> => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await api.post('/api/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // 开始处理
  startProcessing: async (
    photoId: string,
    type: string,
    parameters: any = {}
  ): Promise<ProcessingStartResponse> => {
    const response = await api.post('/api/processing/start', {
      photoId,
      type,
      parameters,
    });

    return response.data;
  },

  // 获取处理状态
  getProcessingStatus: async (taskId: string): Promise<ProcessingStatusResponse> => {
    const response = await api.get(`/api/processing/${taskId}/status`);
    return response.data;
  },

  // 检查后端状态
  checkStatus: async () => {
    const response = await api.get('/api/status');
    return response.data;
  },
};

export default api;