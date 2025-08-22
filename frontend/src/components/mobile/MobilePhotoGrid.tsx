'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { usePhotos, useProcessing, useNotifications } from '../../hooks';
import { ProcessingType, Photo } from '../../types';

interface MobilePhotoGridProps {
  photos?: Photo[];
  loading?: boolean;
  onPhotoSelect?: (photo: Photo) => void;
  className?: string;
}

export const MobilePhotoGrid: React.FC<MobilePhotoGridProps> = ({
  photos = [],
  loading = false,
  onPhotoSelect,
  className = '',
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const handlePhotoClick = useCallback((photo: Photo) => {
    setSelectedPhoto(photo);
    onPhotoSelect?.(photo);
    setShowActionSheet(true);
  }, [onPhotoSelect]);

  if (loading) {
    return <MobilePhotoGridSkeleton />;
  }

  if (photos.length === 0) {
    return <EmptyPhotoGrid />;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Photo Grid */}
      <div className="mobile-grid">
        {photos.map((photo) => (
          <MobilePhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => handlePhotoClick(photo)}
          />
        ))}
      </div>

      {/* Action Sheet */}
      {selectedPhoto && (
        <MobileActionSheet
          photo={selectedPhoto}
          isOpen={showActionSheet}
          onClose={() => setShowActionSheet(false)}
        />
      )}
    </div>
  );
};

// Mobile Photo Card
interface MobilePhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

const MobilePhotoCard: React.FC<MobilePhotoCardProps> = ({ photo, onClick }) => {
  const { isProcessingPhoto } = useProcessing();
  const isProcessing = isProcessingPhoto(photo.id);

  return (
    <div
      className="mobile-card overflow-hidden cursor-pointer touch-target"
      onClick={onClick}
    >
      {/* Photo */}
      <div className="relative aspect-square bg-gray-200">
        {photo.originalUrl ? (
          <img
            src={photo.originalUrl}
            alt={photo.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">🖼️</span>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
              <div className="text-sm">处理中...</div>
            </div>
          </div>
        )}

        {/* Status Badge */}
        {photo.status && photo.status !== 'completed' && (
          <div className="absolute top-2 right-2">
            <StatusBadge status={photo.status} />
          </div>
        )}
      </div>

      {/* Photo Info */}
      <div className="p-3">
        <div className="text-sm font-medium text-gray-900 truncate">
          {photo.filename}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {formatFileSize(photo.fileSize)}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(photo.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Status Badge
const StatusBadge: React.FC<{ status: Photo['status'] }> = ({ status }) => {
  const statusConfig = {
    uploading: { color: 'bg-blue-500', text: '上传中' },
    processing: { color: 'bg-yellow-500', text: '处理中' },
    failed: { color: 'bg-red-500', text: '失败' },
    completed: { color: 'bg-green-500', text: '完成' },
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.color} text-white text-xs px-2 py-1 rounded-full`}>
      {config.text}
    </div>
  );
};

// Mobile Action Sheet
interface MobileActionSheetProps {
  photo: Photo;
  isOpen: boolean;
  onClose: () => void;
}

const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  photo,
  isOpen,
  onClose,
}) => {
  const { processPhoto, isProcessingPhoto } = useProcessing();
  const { deletePhoto } = usePhotos();
  const notifications = useNotifications();

  const isProcessing = isProcessingPhoto(photo.id);

  const handleProcess = async (type: ProcessingType) => {
    if (isProcessing) return;

    try {
      const taskId = await processPhoto(photo.id, type);
      if (taskId) {
        notifications.success('处理已开始', '正在处理您的照片，请稍候...');
        onClose();
      }
    } catch (error) {
      notifications.error('处理失败', '无法开始照片处理');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('确定要删除这张照片吗？此操作不可撤销。')) {
      const success = await deletePhoto(photo.id);
      if (success) {
        notifications.success('删除成功', '照片已删除');
        onClose();
      }
    }
  };

  const processingActions = [
    { type: 'smart-restore' as ProcessingType, label: '智能修复', icon: '🔧', description: '自动修复照片缺陷' },
    { type: 'colorization' as ProcessingType, label: '智能上色', icon: '🎨', description: '为黑白照片添加颜色' },
    { type: 'upscale' as ProcessingType, label: '超分辨率', icon: '🔍', description: '提升照片分辨率' },
    { type: 'face-animation' as ProcessingType, label: '人物复活', icon: '✨', description: '让照片中的人物动起来' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Action Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl safe-area-bottom">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              选择处理方式
            </h3>
            <button
              onClick={onClose}
              className="mobile-button p-2 text-gray-400 hover:text-gray-600"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Photo Preview */}
          <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
              {photo.originalUrl ? (
                <img
                  src={photo.originalUrl}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-xl">🖼️</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">
                {photo.filename}
              </div>
              <div className="text-xs text-gray-500">
                {formatFileSize(photo.fileSize)} • {formatDate(photo.createdAt)}
              </div>
            </div>
          </div>

          {/* Processing Actions */}
          <div className="space-y-3 mb-6">
            {processingActions.map((action) => (
              <button
                key={action.type}
                onClick={() => handleProcess(action.type)}
                disabled={isProcessing}
                className="w-full flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
              >
                <span className="text-2xl">{action.icon}</span>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-600">
                    {action.description}
                  </div>
                </div>
                <span className="text-gray-400">›</span>
              </button>
            ))}
          </div>

          {/* Other Actions */}
          <div className="space-y-3">
            <button
              onClick={() => {
                // Handle download
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 touch-target"
            >
              <span>📥</span>
              <span className="text-gray-900">下载原图</span>
            </button>

            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 touch-target"
            >
              <span>🗑️</span>
              <span>删除照片</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton
const MobilePhotoGridSkeleton: React.FC = () => {
  return (
    <div className="mobile-grid">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="mobile-card animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Empty State
const EmptyPhotoGrid: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl text-gray-300 mb-4">📸</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        还没有照片
      </h3>
      <p className="text-gray-600 mb-6">
        上传您的第一张照片开始体验AI修复功能
      </p>
      <button className="mobile-button bg-blue-600 text-white hover:bg-blue-700">
        立即上传
      </button>
    </div>
  );
};

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
};