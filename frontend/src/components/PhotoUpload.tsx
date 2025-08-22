'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, X, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ProcessingType } from '@/types';
import { photoAPI } from '@/services/api';
import ProcessingStatus from '@/components/ProcessingStatus';
import VideoGenerator from '@/components/VideoGenerator';

interface PhotoUploadProps {
  onUpload: (files: File[]) => void;
  onProcessingTypeSelect: (type: ProcessingType) => void;
  maxFiles?: number;
  maxSize?: number;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onUpload,
  onProcessingTypeSelect,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedProcessingType, setSelectedProcessingType] = useState<ProcessingType | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [processingTasks, setProcessingTasks] = useState<string[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      return file.size <= maxSize && file.type.startsWith('image/');
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
    onUpload(validFiles);
  }, [maxFiles, maxSize, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.tiff']
    },
    maxFiles,
    maxSize,
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processingTypes = [
    {
      type: 'smart-restore' as ProcessingType,
      title: '智能修复',
      description: '🌐 Replicate云端GFPGAN：腾讯ARC实验室专业人脸修复API+智能上色+细节增强，黑白照片秒变高清彩色',
      credits: 100,
      icon: '✨',
    },
    {
      type: 'face-animation' as ProcessingType,
      title: '人物复活',
      description: '🎬 D-ID专业说话人头视频：将静态照片转换为自然说话的MP4视频，支持多语言配音和真实表情（需配置API密钥）',
      credits: 120,
      icon: '🎭',
    },
    {
      type: 'image-to-video' as ProcessingType,
      title: '图生视频',
      description: '🎨 火山引擎即梦AI：根据上传图片+用户提示词生成动态视频，支持各种动效和风格转换（需配置API密钥）',
      credits: 150,
      icon: '🎬',
    },
  ];

  const handleProcessingTypeSelect = (type: ProcessingType) => {
    setSelectedProcessingType(type);
    onProcessingTypeSelect(type);
  };

  const handleStartProcessing = async () => {
    console.log('🚀 开始处理照片...');
    
    if (!selectedProcessingType || uploadedFiles.length === 0) {
      setError('请选择处理类型和上传文件');
      return;
    }

    // 如果是图生视频，显示专业界面
    if (selectedProcessingType === 'image-to-video') {
      setShowVideoGenerator(true);
      return;
    }

    console.log(`📝 处理类型: ${selectedProcessingType}, 文件数量: ${uploadedFiles.length}`);

    setIsProcessing(true);
    setError(null);
    const tasks: string[] = [];

    try {
      // 首先上传所有文件
      const uploadPromises = uploadedFiles.map(async (file) => {
        try {
          const uploadResponse = await photoAPI.uploadPhoto(file);
          if (uploadResponse.success) {
            return uploadResponse.data;
          }
          throw new Error(uploadResponse.message);
        } catch (err) {
          console.error('Upload failed for file:', file.name, err);
          throw err;
        }
      });

      const uploadedPhotoData = await Promise.all(uploadPromises);
      console.log('✅ 上传完成:', uploadedPhotoData);
      setUploadedPhotos(uploadedPhotoData);

      // 然后开始处理每张照片
      const processingPromises = uploadedPhotoData.map(async (photo) => {
        try {
          const processingResponse = await photoAPI.startProcessing(
            photo.id,
            selectedProcessingType,
            {}
          );
          if (processingResponse.success) {
            return processingResponse.data.id;
          }
          throw new Error(processingResponse.message);
        } catch (err) {
          console.error('Processing failed for photo:', photo.id, err);
          throw err;
        }
      });

      const taskIds = await Promise.all(processingPromises);
      console.log('🔥 处理任务ID:', taskIds);
      setProcessingTasks(taskIds);

    } catch (err) {
      console.error('处理过程中出现错误:', err);
      setError('处理失败，请重试');
      setIsProcessing(false);
    }
  };

  const handleProcessingComplete = (taskId: string, result: any) => {
    console.log('处理完成:', taskId, result);
    // 将任务从进行中移到已完成
    setProcessingTasks(prev => prev.filter(id => id !== taskId));
    setCompletedTasks(prev => [...prev, taskId]);
    setIsProcessing(false);
  };

  const handleProcessingError = (taskId: string, error: string) => {
    console.error('处理失败:', taskId, error);
    setError(`处理失败: ${error}`);
    // 移除失败的任务
    setProcessingTasks(prev => prev.filter(id => id !== taskId));
  };

  // 如果选择了图生视频并且有上传文件，显示专业界面
  if (selectedProcessingType === 'image-to-video' && uploadedFiles.length > 0 && showVideoGenerator) {
    return (
      <VideoGenerator 
        uploadedFiles={uploadedFiles}
        onBack={() => setShowVideoGenerator(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Upload Area */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">上传照片</h2>
        
        <div
          {...getRootProps()}
          className={`upload-area ${isDragActive ? 'dragover' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="text-5xl mb-4">📸</div>
          <div className="text-lg text-[#d1d5db] mb-2">
            {isDragActive ? '释放以上传文件' : '点击上传图片'}
          </div>
          <div className="text-sm text-[#9ca3af]">
            支持JPG/PNG格式文件，大小不超过50MB
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              已上传 {uploadedFiles.length} 张照片
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-[#374151] rounded-lg overflow-hidden">
                    <img
                      src={typeof window !== 'undefined' ? URL.createObjectURL(file) : ''}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-[#ef4444] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                  <p className="text-xs text-[#9ca3af] mt-2 truncate">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Processing Type Selection */}
      {uploadedFiles.length > 0 && (
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-white mb-6">选择处理类型</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processingTypes.map((type) => (
              <div
                key={type.type}
                onClick={() => handleProcessingTypeSelect(type.type)}
                className={`
                  relative border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1
                  ${selectedProcessingType === type.type
                    ? 'border-[#6366f1] bg-[#6366f1]/10'
                    : 'border-[#4b5563] bg-[#374151] hover:border-[#6366f1]'
                  }
                `}
              >
                <div className="text-3xl mb-3">{type.icon}</div>
                <h3 className="font-semibold text-white mb-2">{type.title}</h3>
                <p className="text-sm text-[#9ca3af] mb-4">{type.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#6366f1]">
                    {type.credits} 积分
                  </span>
                  {selectedProcessingType === type.type && (
                    <CheckCircle className="w-5 h-5 text-[#6366f1]" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedProcessingType && (
            <div className="mt-8 p-4 bg-[#6366f1]/10 rounded-lg border border-[#6366f1]/30">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-[#6366f1] mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-white mb-1">处理说明</h4>
                  <p className="text-sm text-[#d1d5db]">
                    处理 {uploadedFiles.length} 张照片将消耗{' '}
                    <span className="font-semibold text-[#6366f1]">
                      {uploadedFiles.length * (processingTypes.find(t => t.type === selectedProcessingType)?.credits || 0)} 积分
                    </span>
                    ，处理时间约 30-60 秒。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-[#ef4444] mr-2" />
            <p className="text-[#ef4444]">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {uploadedFiles.length > 0 && selectedProcessingType && processingTasks.length === 0 && (
        <div className="flex justify-center space-x-4">
          <button
            className="btn-secondary"
            onClick={() => {
              setUploadedFiles([]);
              setSelectedProcessingType(null);
              setUploadedPhotos([]);
              setProcessingTasks([]);
              setCompletedTasks([]);
              setError(null);
            }}
          >
            重新上传
          </button>
          <button
            className="btn-primary"
            onClick={handleStartProcessing}
            disabled={isProcessing}
          >
            <span>🎬</span>
            {isProcessing ? '处理中...' : '开始处理'}
          </button>
        </div>
      )}

      {/* Processing Status */}
      {(processingTasks.length > 0 || completedTasks.length > 0) && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white text-center">
            处理状态 
            {processingTasks.length > 0 && ` (${processingTasks.length} 个进行中)`}
            {completedTasks.length > 0 && ` (${completedTasks.length} 个已完成)`}
          </h3>
          
          {/* 进行中的任务 */}
          {processingTasks.map((taskId, index) => (
            <ProcessingStatus
              key={taskId}
              taskId={taskId}
              onComplete={(result) => handleProcessingComplete(taskId, result)}
              onError={(error) => handleProcessingError(taskId, error)}
            />
          ))}
          
          {/* 已完成的任务 */}
          {completedTasks.map((taskId, index) => (
            <ProcessingStatus
              key={`completed-${taskId}`}
              taskId={taskId}
              onComplete={(result) => {}}
              onError={(error) => {}}
            />
          ))}
          
          {/* 全部完成后的操作按钮 */}
          {processingTasks.length === 0 && completedTasks.length > 0 && (
            <div className="text-center">
              <button
                className="btn-secondary"
                onClick={() => {
                  setUploadedFiles([]);
                  setSelectedProcessingType(null);
                  setUploadedPhotos([]);
                  setProcessingTasks([]);
                  setCompletedTasks([]);
                  setError(null);
                }}
              >
                处理更多照片
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;