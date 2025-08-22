import axios from 'axios';
import { ApiResponse, Photo, ProcessingTask, User } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const apiClient = {
  // Health check
  healthCheck: async (): Promise<ApiResponse> => {
    const response = await api.get('/health');
    return response.data;
  },

  // Photo upload
  uploadPhoto: async (file: File): Promise<ApiResponse<Photo>> => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await api.post('/api/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Start processing
  startProcessing: async (photoId: string, type: string, parameters: any): Promise<ApiResponse<ProcessingTask>> => {
    const response = await api.post('/api/processing/start', {
      photoId,
      type,
      parameters,
    });
    return response.data;
  },

  // Get processing status
  getProcessingStatus: async (taskId: string): Promise<ApiResponse<ProcessingTask>> => {
    const response = await api.get(`/api/processing/${taskId}/status`);
    return response.data;
  },

  // Get user info
  getUserInfo: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  // Get photos
  getPhotos: async (page = 1, limit = 20): Promise<ApiResponse<{ photos: Photo[], total: number }>> => {
    const response = await api.get(`/api/photos?page=${page}&limit=${limit}`);
    return response.data;
  },
};

export default api;