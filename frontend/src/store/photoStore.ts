import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Photo, ProcessingTask, ProcessingType, ProcessingParameters, ApiResponse, PaginatedResponse } from '../types';
import { photoAPI } from '../services/api';

interface PhotoState {
  // 状态
  photos: Photo[];
  currentPhoto: Photo | null;
  uploadProgress: Record<string, number>;
  processingTasks: Record<string, ProcessingTask>;
  loading: boolean;
  error: string | null;
  
  // 分页状态
  currentPage: number;
  totalPages: number;
  totalPhotos: number;
  
  // 筛选状态
  filters: {
    status?: Photo['status'];
    tags?: string[];
    dateRange?: { start: Date; end: Date };
  };

  // 操作
  uploadPhoto: (file: File, onProgress?: (progress: number) => void) => Promise<string | null>;
  loadPhotos: (page?: number, filters?: any) => Promise<void>;
  selectPhoto: (photo: Photo) => void;
  deletePhoto: (photoId: string) => Promise<boolean>;
  
  // 处理相关
  startProcessing: (photoId: string, type: ProcessingType, parameters?: ProcessingParameters) => Promise<string | null>;
  updateProcessingStatus: (taskId: string, task: Partial<ProcessingTask>) => void;
  pollProcessingStatus: (taskId: string) => Promise<void>;
  cancelProcessing: (taskId: string) => Promise<boolean>;
  
  // 工具方法
  setFilters: (filters: any) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const photoApi = {
  async getPhotos(page: number = 1, limit: number = 20, filters: any = {}): Promise<ApiResponse<PaginatedResponse<Photo>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    
    const response = await fetch(`/api/photos?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },

  async deletePhoto(photoId: string): Promise<ApiResponse> {
    const response = await fetch(`/api/photos/${photoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },

  async cancelProcessing(taskId: string): Promise<ApiResponse> {
    const response = await fetch(`/api/processing/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },
};

export const usePhotoStore = create<PhotoState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      photos: [],
      currentPhoto: null,
      uploadProgress: {},
      processingTasks: {},
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalPhotos: 0,
      filters: {},

      // 上传照片
      uploadPhoto: async (file: File, onProgress?: (progress: number) => void) => {
        const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          set(state => ({
            uploadProgress: { ...state.uploadProgress, [uploadId]: 0 }
          }));

          // 模拟上传进度
          if (onProgress) {
            onProgress(0);
          }
          
          const response = await photoAPI.uploadPhoto(file);
          
          if (response.success && response.data) {
            // 上传成功，创建Photo对象
            const photo: Photo = {
              id: response.data.id,
              userId: 'current-user', // 从auth store获取
              originalUrl: response.data.path,
              filename: response.data.filename,
              fileSize: response.data.size,
              mimeType: response.data.mimetype,
              width: 0, // 需要从后端获取
              height: 0,
              tags: [],
              metadata: {
                colorType: 'color',
                quality: 'good',
                damages: [],
              },
              status: 'completed',
              createdAt: new Date(response.data.uploadedAt),
              updatedAt: new Date(response.data.uploadedAt),
            };

            // 添加到photos列表
            set(state => ({
              photos: [photo, ...state.photos],
              uploadProgress: { ...state.uploadProgress, [uploadId]: 100 },
            }));

            if (onProgress) {
              onProgress(100);
            }

            // 清理上传进度
            setTimeout(() => {
              set(state => {
                const newProgress = { ...state.uploadProgress };
                delete newProgress[uploadId];
                return { uploadProgress: newProgress };
              });
            }, 2000);

            return photo.id;
          } else {
            throw new Error(response.message || '上传失败');
          }
        } catch (error) {
          set(state => {
            const newProgress = { ...state.uploadProgress };
            delete newProgress[uploadId];
            return {
              uploadProgress: newProgress,
              error: error instanceof Error ? error.message : '上传失败',
            };
          });
          return null;
        }
      },

      // 加载照片列表
      loadPhotos: async (page: number = 1, filters: any = {}) => {
        set({ loading: true, error: null });
        
        try {
          const response = await photoApi.getPhotos(page, 20, filters);
          
          if (response.success && response.data) {
            set({
              photos: response.data.data,
              currentPage: response.data.page,
              totalPages: response.data.totalPages,
              totalPhotos: response.data.total,
              loading: false,
            });
          } else {
            set({
              error: response.error || '加载失败',
              loading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '网络错误',
            loading: false,
          });
        }
      },

      // 选择照片
      selectPhoto: (photo: Photo) => {
        set({ currentPhoto: photo });
      },

      // 删除照片
      deletePhoto: async (photoId: string) => {
        try {
          const response = await photoApi.deletePhoto(photoId);
          
          if (response.success) {
            set(state => ({
              photos: state.photos.filter(photo => photo.id !== photoId),
              currentPhoto: state.currentPhoto?.id === photoId ? null : state.currentPhoto,
            }));
            return true;
          } else {
            set({ error: response.error || '删除失败' });
            return false;
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '删除失败' });
          return false;
        }
      },

      // 开始处理
      startProcessing: async (photoId: string, type: ProcessingType, parameters: ProcessingParameters = {}) => {
        try {
          const response = await photoAPI.startProcessing(photoId, type, parameters);
          
          if (response.success && response.data) {
            const task: ProcessingTask = {
              id: response.data.id,
              userId: 'current-user',
              photoId,
              type: type as ProcessingType,
              status: response.data.status as any,
              progress: response.data.progress,
              parameters,
              creditsUsed: 1, // 从后端获取
              createdAt: new Date(response.data.createdAt),
            };

            set(state => ({
              processingTasks: { ...state.processingTasks, [task.id]: task }
            }));

            // 开始轮询状态
            get().pollProcessingStatus(task.id);
            
            return task.id;
          } else {
            set({ error: response.message || '处理启动失败' });
            return null;
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '处理启动失败' });
          return null;
        }
      },

      // 更新处理状态
      updateProcessingStatus: (taskId: string, updates: Partial<ProcessingTask>) => {
        set(state => ({
          processingTasks: {
            ...state.processingTasks,
            [taskId]: { ...state.processingTasks[taskId], ...updates }
          }
        }));
      },

      // 轮询处理状态
      pollProcessingStatus: async (taskId: string) => {
        const pollInterval = setInterval(async () => {
          try {
            const response = await photoAPI.getProcessingStatus(taskId);
            
            if (response.success && response.data) {
              const updatedTask: Partial<ProcessingTask> = {
                status: response.data.status as any,
                progress: response.data.progress,
              };

              if (response.data.completedAt) {
                updatedTask.completedAt = new Date(response.data.completedAt);
              }

              if (response.data.result) {
                updatedTask.result = response.data.result;
              }

              get().updateProcessingStatus(taskId, updatedTask);

              // 如果处理完成，停止轮询
              if (response.data.status === 'completed' || response.data.status === 'failed') {
                clearInterval(pollInterval);
              }
            }
          } catch (error) {
            console.error('Failed to poll processing status:', error);
            clearInterval(pollInterval);
          }
        }, 2000);

        // 10分钟后自动停止轮询
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 10 * 60 * 1000);
      },

      // 取消处理
      cancelProcessing: async (taskId: string) => {
        try {
          const response = await photoApi.cancelProcessing(taskId);
          
          if (response.success) {
            get().updateProcessingStatus(taskId, { status: 'failed' });
            return true;
          } else {
            set({ error: response.error || '取消失败' });
            return false;
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '取消失败' });
          return false;
        }
      },

      // 设置筛选条件
      setFilters: (filters: any) => {
        set({ filters });
        get().loadPhotos(1, filters);
      },

      // 清除错误
      clearError: () => set({ error: null }),

      // 设置加载状态
      setLoading: (loading: boolean) => set({ loading }),
    }),
    { name: 'PhotoStore' }
  )
);