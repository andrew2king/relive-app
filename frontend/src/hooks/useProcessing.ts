import { useState, useCallback } from 'react';
import { usePhotoStore } from '../store/photoStore';
import { useNotifications } from '../store/uiStore';
import { ProcessingType, ProcessingParameters, ProcessingTask } from '../types';

export const useProcessing = () => {
  const [localLoading, setLocalLoading] = useState<Record<string, boolean>>({});
  const { processingTasks, startProcessing, cancelProcessing } = usePhotoStore();
  const notifications = useNotifications();

  const processPhoto = useCallback(async (
    photoId: string,
    type: ProcessingType,
    parameters?: ProcessingParameters
  ) => {
    const loadingKey = `${photoId}_${type}`;
    setLocalLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const taskId = await startProcessing(photoId, type, parameters);
      
      if (taskId) {
        notifications.success(
          '处理已开始',
          `正在进行${getProcessingTypeName(type)}，预计需要1-2分钟`
        );
        return taskId;
      } else {
        notifications.error('处理失败', '无法启动照片处理任务');
        return null;
      }
    } catch (error) {
      notifications.error(
        '处理失败',
        error instanceof Error ? error.message : '未知错误'
      );
      return null;
    } finally {
      setLocalLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  }, [startProcessing, notifications]);

  const cancelTask = useCallback(async (taskId: string) => {
    try {
      const success = await cancelProcessing(taskId);
      if (success) {
        notifications.success('任务已取消');
      } else {
        notifications.error('取消失败', '无法取消处理任务');
      }
      return success;
    } catch (error) {
      notifications.error(
        '取消失败',
        error instanceof Error ? error.message : '未知错误'
      );
      return false;
    }
  }, [cancelProcessing, notifications]);

  const getTaskProgress = useCallback((taskId: string) => {
    return processingTasks[taskId]?.progress || 0;
  }, [processingTasks]);

  const getTaskStatus = useCallback((taskId: string) => {
    return processingTasks[taskId]?.status || 'pending';
  }, [processingTasks]);

  const isTaskRunning = useCallback((taskId: string) => {
    const status = getTaskStatus(taskId);
    return status === 'pending' || status === 'processing';
  }, [getTaskStatus]);

  const isTaskCompleted = useCallback((taskId: string) => {
    return getTaskStatus(taskId) === 'completed';
  }, [getTaskStatus]);

  const isTaskFailed = useCallback((taskId: string) => {
    return getTaskStatus(taskId) === 'failed';
  }, [getTaskStatus]);

  const getProcessingResult = useCallback((taskId: string) => {
    return processingTasks[taskId]?.result;
  }, [processingTasks]);

  const isProcessingPhoto = useCallback((photoId: string, type?: ProcessingType) => {
    if (type) {
      const loadingKey = `${photoId}_${type}`;
      return localLoading[loadingKey] || false;
    }
    
    // Check if any processing task is running for this photo
    return Object.values(processingTasks).some(
      task => task.photoId === photoId && isTaskRunning(task.id)
    );
  }, [localLoading, processingTasks, isTaskRunning]);

  return {
    // 操作
    processPhoto,
    cancelTask,
    
    // 状态查询
    getTaskProgress,
    getTaskStatus,
    getProcessingResult,
    isTaskRunning,
    isTaskCompleted,
    isTaskFailed,
    isProcessingPhoto,
    
    // 数据
    processingTasks,
    
    // 统计
    activeTasks: Object.values(processingTasks).filter(task => isTaskRunning(task.id)),
    completedTasks: Object.values(processingTasks).filter(task => isTaskCompleted(task.id)),
    failedTasks: Object.values(processingTasks).filter(task => isTaskFailed(task.id)),
  };
};

// 处理类型中文名称映射
const getProcessingTypeName = (type: ProcessingType): string => {
  const names: Record<ProcessingType, string> = {
    'damage-repair': '损伤修复',
    'blur-enhance': '清晰度增强',
    'colorization': '智能上色',
    'upscale': '分辨率提升',
    'smart-restore': '智能修复',
    'face-animation': '人物复活',
    'image-to-video': '图生视频',
    'custom-animation': '自定义动画',
  };
  
  return names[type] || type;
};

// 预设处理参数
export const PROCESSING_PRESETS = {
  // 智能修复预设
  smartRestore: {
    light: { repairType: ['scratches', 'fading'] as const },
    medium: { repairType: ['scratches', 'fading', 'stains'] as const },
    heavy: { repairType: ['scratches', 'tears', 'fading', 'stains', 'blur'] as const },
  },
  
  // 上色预设
  colorization: {
    natural: { colorizeStyle: 'natural' as const },
    vintage: { colorizeStyle: 'vintage' as const },
    vibrant: { colorizeStyle: 'vibrant' as const },
  },
  
  // 放大预设
  upscale: {
    x2: { upscaleRatio: 2 as const },
    x4: { upscaleRatio: 4 as const },
    x8: { upscaleRatio: 8 as const },
  },
  
  // 动画预设
  animation: {
    subtle: { animationIntensity: 'subtle' as const, animationDuration: 3 },
    moderate: { animationIntensity: 'moderate' as const, animationDuration: 5 },
    strong: { animationIntensity: 'strong' as const, animationDuration: 7 },
  },
};