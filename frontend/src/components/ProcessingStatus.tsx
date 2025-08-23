'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Clock, Download, Image } from 'lucide-react';
import { photoAPI, ProcessingStatusResponse } from '@/services/api';
import Button from '@/components/ui/Button';

interface ProcessingStatusProps {
  taskId: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  taskId,
  onComplete,
  onError,
}) => {
  const [status, setStatus] = useState<ProcessingStatusResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await photoAPI.getProcessingStatus(taskId);
        if (response.success) {
          setStatus(response.data);
          setLoading(false);

          if (response.data.status === 'completed') {
            clearInterval(intervalId);
            setTimeout(() => {
              onComplete?.(response.data.result);
            }, 1000); // 延迟1秒再调用完成回调，让用户看到完成状态
          } else if (response.data.status === 'failed') {
            clearInterval(intervalId);
            setError('处理失败，请重试');
            onError?.('处理失败');
          } else if (response.data.status === 'queued') {
            // 服务排队中，继续轮询但显示排队状态
            setError(null);
          }
        }
      } catch (err) {
        console.error('获取处理状态失败:', err);
        setError('无法获取处理状态');
        setLoading(false);
        clearInterval(intervalId);
        onError?.('无法获取处理状态');
      }
    };

    // 立即检查一次
    checkStatus();

    // 每2秒检查一次状态
    intervalId = setInterval(checkStatus, 2000);

    return () => clearInterval(intervalId);
  }, [taskId, onComplete, onError]);

  if (loading && !status) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
        <p className="text-text-secondary">正在获取处理状态...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">处理失败</h3>
        <p className="text-text-secondary">{error}</p>
      </div>
    );
  }

  if (!status) return null;

  const getStatusIcon = () => {
    switch (status.status) {
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>;
      case 'queued':
        return <div className="animate-pulse w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'pending':
        return '等待处理';
      case 'processing':
        return '正在处理';
      case 'queued':
        return '服务排队中';
      case 'completed':
        return '处理完成';
      case 'failed':
        return '处理失败';
      default:
        return '未知状态';
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'pending':
        return 'text-yellow-600';
      case 'processing':
        return 'text-brand-primary';
      case 'queued':
        return 'text-orange-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-8">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
          {getStatusText()}
        </h3>
        <p className="text-text-secondary">
          任务ID: {status.id.substring(0, 8)}...
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-text-secondary mb-2">
          <span>进度</span>
          <span>{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-brand-primary to-brand-secondary h-2 rounded-full transition-all duration-300"
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Processing Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-brand-light rounded-lg">
          <p className="text-sm text-text-secondary">处理类型</p>
          <p className="font-semibold text-brand-dark">{status.type}</p>
        </div>
        <div className="text-center p-4 bg-brand-light rounded-lg">
          <p className="text-sm text-text-secondary">预计时间</p>
          <p className="font-semibold text-brand-dark">{status.estimatedTime}秒</p>
        </div>
      </div>

      {/* Completion Time */}
      {status.completedAt && (
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
          <p className="text-sm text-green-600">
            处理完成时间: {new Date(status.completedAt).toLocaleString()}
          </p>
          {status.result && (
            <p className="text-sm text-green-600 mt-1">
              质量评分: {status.result.qualityScore}/100
            </p>
          )}
        </div>
      )}

      {/* Queue Information */}
      {status.status === 'queued' && (
        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200 mb-6">
          <p className="text-sm text-orange-600">
            🌐 云端GFPGAN服务处理排队中
          </p>
          <p className="text-xs text-orange-500 mt-1">
            当前使用的是腾讯ARC实验室专业人脸修复API，请耐心等待...
          </p>
        </div>
      )}

      {/* Error Information */}
      {status.error && status.status !== 'completed' && (
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200 mb-6">
          <p className="text-sm text-red-600">
            {status.error}
          </p>
        </div>
      )}

      {/* Processed Image Preview */}
      {status.status === 'completed' && status.result && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-brand-dark mb-3 text-center">处理结果</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="aspect-video bg-white rounded-lg overflow-hidden border-2 border-gray-200 mb-4">
              <img
                src={`http://localhost:8000${status.result.outputUrl}`}
                alt="处理后的照片"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('图片加载失败:', status.result?.outputUrl);
                  // 显示友好的错误消息而不是破损的图片图标
                  const imgElement = e.currentTarget as HTMLImageElement;
                  imgElement.style.display = 'none';
                  
                  // 创建错误提示元素
                  if (imgElement.parentElement && !imgElement.parentElement.querySelector('.error-message')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message flex flex-col items-center justify-center h-full text-gray-500';
                    errorDiv.innerHTML = `
                      <div class="text-4xl mb-2">🖼️</div>
                      <div class="text-sm text-center">
                        <p>处理后的图片暂时无法显示</p>
                        <p class="text-xs mt-1">请尝试下载查看</p>
                      </div>
                    `;
                    imgElement.parentElement.appendChild(errorDiv);
                  }
                }}
              />
            </div>
            
            {status.result.metadata?.improvements && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">处理改进项目:</h5>
                <div className="flex flex-wrap gap-2">
                  {status.result.metadata.improvements.map((improvement, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                    >
                      ✓ {improvement}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Download Button */}
      {status.status === 'completed' && status.result && (
        <div className="text-center">
          <div className="flex gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => {
                const viewUrl = `http://localhost:8000${status.result?.outputUrl}`;
                window.open(viewUrl, '_blank');
              }}
              variant="secondary"
            >
              <Image className="w-5 h-5 mr-2" />
              预览图片
            </Button>
            <Button
              size="lg"
              onClick={() => {
                const downloadUrl = `http://localhost:8000${status.result?.outputUrl}`;
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `processed_image_${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="w-5 h-5 mr-2" />
              下载照片
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;