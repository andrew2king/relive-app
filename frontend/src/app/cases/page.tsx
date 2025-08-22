'use client';

import React, { useState } from 'react';
import { ArrowLeft, Filter, Search } from 'lucide-react';
import CaseShowcase from '@/components/CaseShowcase';

const CasesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'rating' | 'popular'>('latest');

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#1a1e23]">
      {/* Header */}
      <div className="bg-[#2d3238] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-4">
            <button
              onClick={handleBack}
              className="flex items-center text-[#9ca3af] hover:text-white transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回
            </button>
            <h1 className="text-3xl font-bold text-gradient">案例展示</h1>
          </div>
          <p className="text-[#9ca3af]">
            浏览我们的AI照片处理案例，了解技术的强大能力
          </p>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-[#2d3238] border-t border-[#4b5563]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af] w-4 h-4" />
              <input
                type="text"
                placeholder="搜索案例..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#374151] border border-[#4b5563] rounded-lg text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#6366f1] transition-colors"
              />
            </div>

            {/* 排序选择 */}
            <div className="flex items-center gap-3">
              <Filter className="text-[#9ca3af] w-4 h-4" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#374151] border border-[#4b5563] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#6366f1] transition-colors"
              >
                <option value="latest">最新案例</option>
                <option value="rating">评分最高</option>
                <option value="popular">最受欢迎</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 案例展示区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CaseShowcase maxCases={50} />
      </div>

      {/* 底部调用行动 */}
      <div className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            准备让您的照片重获新生？
          </h2>
          <p className="text-xl text-white/90 mb-8">
            加入数万用户，体验专业的AI照片处理服务
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="bg-white text-[#6366f1] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all"
              onClick={() => window.location.href = '/upload'}
            >
              立即开始处理
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#6366f1] transition-all">
              了解更多功能
            </button>
          </div>
        </div>
      </div>

      {/* 技术说明 */}
      <div className="bg-[#0f1419] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-white mb-4">我们使用的AI技术</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🧠</div>
              <h4 className="font-semibold text-white mb-2">GFPGAN</h4>
              <p className="text-[#9ca3af] text-sm">腾讯ARC实验室开发的人脸修复技术</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">🎨</div>
              <h4 className="font-semibold text-white mb-2">智能上色</h4>
              <p className="text-[#9ca3af] text-sm">基于深度学习的黑白照片着色</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">🎭</div>
              <h4 className="font-semibold text-white mb-2">D-ID</h4>
              <p className="text-[#9ca3af] text-sm">专业的人像动画和语音合成技术</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">🎬</div>
              <h4 className="font-semibold text-white mb-2">火山引擎</h4>
              <p className="text-[#9ca3af] text-sm">即梦AI图像到视频生成技术</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasesPage;