'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { usePhotos, useNotifications } from '../../hooks';

interface MobilePhotoUploadProps {
  onUploadComplete?: (photoId: string) => void;
  className?: string;
}

export const MobilePhotoUpload: React.FC<MobilePhotoUploadProps> = ({
  onUploadComplete,
  className = '',
}) => {
  const { uploadPhoto, isUploading } = usePhotos();
  const notifications = useNotifications();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (!file.type.startsWith('image/')) {
        notifications.error('文件格式错误', `${file.name} 不是有效的图片文件`);
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        notifications.error('文件过大', `${file.name} 超过50MB限制`);
        continue;
      }

      const uploadId = `${file.name}_${Date.now()}`;
      
      try {
        setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));

        const photoId = await uploadPhoto(file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [uploadId]: progress }));
        });

        if (photoId) {
          notifications.success('上传成功', `${file.name} 上传完成`);
          onUploadComplete?.(photoId);
        }
      } catch (error) {
        notifications.error('上传失败', `${file.name} 上传失败`);
      } finally {
        // 清理进度
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[uploadId];
            return newProgress;
          });
        }, 2000);
      }
    }
  }, [uploadPhoto, notifications, onUploadComplete]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    open
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.tiff', '.webp']
    },
    maxSize: 50 * 1024 * 1024,
    multiple: true,
    noClick: true, // 禁用点击，只允许拖拽和按钮点击
  });

  const hasActiveUploads = Object.keys(uploadProgress).length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${isDragActive && !isDragReject
            ? 'border-blue-400 bg-blue-50'
            : isDragReject
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${hasActiveUploads ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {/* Upload Icon */}
        <div className="mb-4">
          {hasActiveUploads ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          ) : (
            <div className="text-6xl text-gray-400">📷</div>
          )}
        </div>

        {/* Upload Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            {hasActiveUploads ? '正在上传...' : '上传您的照片'}
          </h3>
          
          {!hasActiveUploads && (
            <>
              <p className="text-sm text-gray-600 mobile:text-base">
                {isDragActive
                  ? '释放以上传文件'
                  : '拖拽照片到这里或点击选择'}
              </p>
              <p className="text-xs text-gray-500">
                支持 JPEG、PNG、TIFF、WebP，最大 50MB
              </p>
            </>
          )}
        </div>

        {/* Upload Button */}
        {!hasActiveUploads && (
          <div className="mt-6">
            <button
              type="button"
              onClick={open}
              className="mobile-button bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              选择照片
            </button>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {hasActiveUploads && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">上传进度</h4>
          {Object.entries(uploadProgress).map(([uploadId, progress]) => {
            const fileName = uploadId.split('_')[0];
            return (
              <div key={uploadId} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1 mr-2">
                    {fileName}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions for Mobile */}
      <div className="mobile:block hidden">
        <MobileQuickActions onCameraCapture={onDrop} />
      </div>
    </div>
  );
};

// Mobile Quick Actions
interface MobileQuickActionsProps {
  onCameraCapture: (files: File[]) => void;
}

const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  onCameraCapture,
}) => {
  const handleCameraCapture = async () => {
    try {
      // Check if device supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('您的设备不支持相机功能');
        return;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera by default
      });

      // Create video element for camera preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;

      // Create a modal or full-screen camera interface
      // This is a simplified implementation
      alert('相机功能开发中，请使用文件选择功能');
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Camera access error:', error);
      alert('无法访问相机，请检查权限设置');
    }
  };

  const handleGalleryPick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        onCameraCapture(Array.from(target.files));
      }
    };
    input.click();
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={handleCameraCapture}
        className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 touch-target"
      >
        <span className="text-2xl mb-2">📸</span>
        <span className="text-sm font-medium text-gray-900">拍照</span>
      </button>
      
      <button
        onClick={handleGalleryPick}
        className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 touch-target"
      >
        <span className="text-2xl mb-2">🖼️</span>
        <span className="text-sm font-medium text-gray-900">相册</span>
      </button>
    </div>
  );
};