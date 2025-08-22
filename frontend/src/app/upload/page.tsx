'use client';

import React, { useState } from 'react';
import PhotoUpload from '@/components/PhotoUpload';
import { ProcessingType } from '@/types';

const UploadPage: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedProcessingType, setSelectedProcessingType] = useState<ProcessingType | null>(null);

  const handleUpload = (files: File[]) => {
    setUploadedFiles(files);
    console.log('Files uploaded:', files);
  };

  const handleProcessingTypeSelect = (type: ProcessingType) => {
    setSelectedProcessingType(type);
    console.log('Processing type selected:', type);
  };

  return (
    <div className="min-h-screen bg-[#1a1e23]">
      {/* Header */}
      <div className="bg-[#2d3238] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gradient">照片处理</h1>
          <p className="text-[#9ca3af] mt-2">
            上传您的老照片，我们将使用AI技术为其注入新的生命力
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PhotoUpload
          onUpload={handleUpload}
          onProcessingTypeSelect={handleProcessingTypeSelect}
        />
      </div>
    </div>
  );
};

export default UploadPage;