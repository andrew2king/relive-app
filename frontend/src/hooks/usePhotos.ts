import { usePhotoStore } from '../store/photoStore';
import { ProcessingType, ProcessingParameters } from '../types';

export const usePhotos = () => {
  const {
    photos,
    currentPhoto,
    uploadProgress,
    processingTasks,
    loading,
    error,
    currentPage,
    totalPages,
    totalPhotos,
    filters,
    uploadPhoto,
    loadPhotos,
    selectPhoto,
    deletePhoto,
    startProcessing,
    updateProcessingStatus,
    cancelProcessing,
    setFilters,
    clearError,
  } = usePhotoStore();

  const handleUploadPhoto = async (
    file: File, 
    onProgress?: (progress: number) => void
  ) => {
    return await uploadPhoto(file, onProgress);
  };

  const handleStartProcessing = async (
    photoId: string,
    type: ProcessingType,
    parameters?: ProcessingParameters
  ) => {
    return await startProcessing(photoId, type, parameters);
  };

  const getProcessingTask = (taskId: string) => {
    return processingTasks[taskId];
  };

  const getUploadProgress = (uploadId: string) => {
    return uploadProgress[uploadId] || 0;
  };

  const isUploading = Object.keys(uploadProgress).length > 0;

  const activeProcessingTasks = Object.values(processingTasks).filter(
    task => task.status === 'pending' || task.status === 'processing'
  );

  const completedProcessingTasks = Object.values(processingTasks).filter(
    task => task.status === 'completed'
  );

  const failedProcessingTasks = Object.values(processingTasks).filter(
    task => task.status === 'failed'
  );

  return {
    // 状态
    photos,
    currentPhoto,
    uploadProgress,
    processingTasks,
    loading,
    error,
    currentPage,
    totalPages,
    totalPhotos,
    filters,
    
    // 操作
    uploadPhoto: handleUploadPhoto,
    loadPhotos,
    selectPhoto,
    deletePhoto,
    startProcessing: handleStartProcessing,
    cancelProcessing,
    setFilters,
    clearError,
    
    // 工具函数
    getProcessingTask,
    getUploadProgress,
    
    // 计算属性
    isUploading,
    activeProcessingTasks,
    completedProcessingTasks,
    failedProcessingTasks,
    hasPhotos: photos.length > 0,
    isLastPage: currentPage >= totalPages,
  };
};