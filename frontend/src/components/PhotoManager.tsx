'use client';

import React, { useEffect, useState } from 'react';
import { usePhotos, useProcessing, useAuth, useNotifications } from '../hooks';
import { ProcessingType } from '../types';

interface PhotoManagerProps {
  className?: string;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({ className = '' }) => {
  const { user, isAuthenticated } = useAuth();
  const {
    photos,
    currentPhoto,
    loading,
    error,
    uploadPhoto,
    loadPhotos,
    selectPhoto,
    deletePhoto,
    isUploading,
    hasPhotos,
  } = usePhotos();
  
  const {
    processPhoto,
    isProcessingPhoto,
    getTaskProgress,
    activeTasks,
  } = useProcessing();
  
  const notifications = useNotifications();
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadPhotos(1);
    }
  }, [isAuthenticated, loadPhotos]);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!isAuthenticated) {
      notifications.error('请先登录', '需要登录后才能上传照片');
      return;
    }

    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        notifications.error('文件格式错误', `${file.name} 不是有效的图片文件`);
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        notifications.error('文件过大', `${file.name} 超过50MB限制`);
        continue;
      }

      try {
        await uploadPhoto(file, (progress) => {
          console.log(`Upload progress for ${file.name}: ${progress}%`);
        });
        
        notifications.success('上传成功', `${file.name} 上传完成`);
      } catch (error) {
        notifications.error('上传失败', `${file.name} 上传失败`);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(files);
    }
  };

  const handleProcessPhoto = async (photoId: string, type: ProcessingType) => {
    if (!user?.credits || user.credits < 1) {
      notifications.error('积分不足', '处理照片需要消耗积分，请先充值');
      return;
    }

    try {
      const taskId = await processPhoto(photoId, type);
      if (taskId) {
        notifications.success(
          '处理已开始',
          '正在处理您的照片，请稍候...'
        );
      }
    } catch (error) {
      notifications.error('处理失败', '无法开始照片处理');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (window.confirm('确定要删除这张照片吗？此操作不可撤销。')) {
      const success = await deletePhoto(photoId);
      if (success) {
        notifications.success('删除成功', '照片已删除');
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          请登录后使用照片管理功能
        </h3>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
          立即登录
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 用户信息栏 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              欢迎回来，{user?.username || user?.email}
            </h2>
            <p className="text-sm text-gray-600">
              剩余积分：{user?.credits || 0} | 
              会员等级：{user?.membershipLevel === 'free' ? '免费用户' : 'VIP用户'}
            </p>
          </div>
          
          {activeTasks.length > 0 && (
            <div className="text-sm text-blue-600">
              正在处理 {activeTasks.length} 个任务
            </div>
          )}
        </div>
      </div>

      {/* 上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-4">
          <div className="text-4xl text-gray-400">📷</div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              拖拽照片到这里上传
            </h3>
            <p className="text-gray-600">
              支持 JPEG、PNG、TIFF、WebP 格式，最大 50MB
            </p>
          </div>
          
          <div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
            >
              选择文件
            </label>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                操作失败
              </h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* 照片列表 */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      )}

      {!loading && !hasPhotos && (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4">📸</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            还没有照片
          </h3>
          <p className="text-gray-600">
            上传您的第一张照片开始体验AI修复功能
          </p>
        </div>
      )}

      {hasPhotos && (
        <div className="mobile-grid">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isSelected={currentPhoto?.id === photo.id}
              isProcessing={isProcessingPhoto(photo.id)}
              onSelect={() => selectPhoto(photo)}
              onProcess={handleProcessPhoto}
              onDelete={() => handleDeletePhoto(photo.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 照片卡片组件
interface PhotoCardProps {
  photo: any;
  isSelected: boolean;
  isProcessing: boolean;
  onSelect: () => void;
  onProcess: (photoId: string, type: ProcessingType) => void;
  onDelete: () => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  isSelected,
  isProcessing,
  onSelect,
  onProcess,
  onDelete,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`relative bg-white rounded-lg shadow overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="aspect-square bg-gray-200">
        {photo.originalUrl ? (
          <img
            src={photo.originalUrl}
            alt={photo.filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">🖼️</span>
          </div>
        )}
      </div>

      {/* 处理状态覆盖层 */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
            <div className="text-sm">处理中...</div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      {showActions && !isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProcess(photo.id, 'smart-restore');
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            智能修复
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProcess(photo.id, 'colorization');
            }}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            智能上色
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            删除
          </button>
        </div>
      )}

      {/* 照片信息 */}
      <div className="p-3">
        <div className="text-sm font-medium text-gray-900 truncate">
          {photo.filename}
        </div>
        <div className="text-xs text-gray-500">
          {(photo.fileSize / 1024 / 1024).toFixed(1)} MB
        </div>
      </div>
    </div>
  );
};