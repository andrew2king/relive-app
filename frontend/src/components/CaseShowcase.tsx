'use client';

import React, { useState } from 'react';
import { Play, Eye, Clock, Star, X } from 'lucide-react';

interface CaseData {
  id: string;
  title: string;
  type: 'restore' | 'colorize' | 'animate' | 'video';
  beforeImage: string;
  afterImage?: string;
  afterVideo?: string;
  description: string;
  processingTime: string;
  rating: number;
  category: string;
  tags: string[];
}

interface CaseShowcaseProps {
  maxCases?: number;
}

const CaseShowcase: React.FC<CaseShowcaseProps> = ({ maxCases = 6 }) => {
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // 模拟案例数据 - 实际项目中应该从API获取
  const caseData: CaseData[] = [
    {
      id: '1',
      title: '民国老照片修复',
      type: 'restore',
      beforeImage: '/api/placeholder/400/400?text=破损老照片',
      afterImage: '/api/placeholder/400/400?text=修复后高清',
      description: '使用GFPGAN技术成功修复了一张1920年代的家庭合影，去除划痕、修复缺失部分，并提升了整体清晰度。',
      processingTime: '45秒',
      rating: 4.9,
      category: '照片修复',
      tags: ['人像修复', '划痕去除', '清晰度提升']
    },
    {
      id: '2',
      title: '黑白照片AI上色',
      type: 'colorize',
      beforeImage: '/api/placeholder/400/400?text=黑白照片',
      afterImage: '/api/placeholder/400/400?text=彩色照片',
      description: '为1950年代的黑白人像照片智能添加自然色彩，还原了人物的肤色、服装颜色，效果自然逼真。',
      processingTime: '35秒',
      rating: 4.8,
      category: '智能上色',
      tags: ['黑白上色', '人像着色', '自然色彩']
    },
    {
      id: '3',
      title: '人物复活说话视频',
      type: 'animate',
      beforeImage: '/api/placeholder/400/400?text=静态人像',
      afterVideo: '/api/placeholder/video.mp4',
      description: '使用D-ID技术让老照片中的人物开口说话，生成自然的面部表情和嘴唇同步动画。',
      processingTime: '2分钟',
      rating: 4.7,
      category: '人物复活',
      tags: ['说话动画', '面部表情', '唇同步']
    },
    {
      id: '4',
      title: '风景图生视频',
      type: 'video',
      beforeImage: '/api/placeholder/400/400?text=风景照片',
      afterVideo: '/api/placeholder/video.mp4',
      description: '将静态风景照片转换为动态视频，添加云朵飘动、水波荡漾等自然动效。',
      processingTime: '1分30秒',
      rating: 4.6,
      category: '图生视频',
      tags: ['风景动效', '自然动画', '视频生成']
    },
    {
      id: '5',
      title: '人像质量增强',
      type: 'restore',
      beforeImage: '/api/placeholder/400/400?text=模糊人像',
      afterImage: '/api/placeholder/400/400?text=高清人像',
      description: '对模糊的人像照片进行AI增强，提升面部细节，修复皮肤纹理，效果显著。',
      processingTime: '40秒',
      rating: 4.8,
      category: '照片修复',
      tags: ['人像增强', '细节修复', '皮肤优化']
    },
    {
      id: '6',
      title: '复古海报上色',
      type: 'colorize',
      beforeImage: '/api/placeholder/400/400?text=复古海报',
      afterImage: '/api/placeholder/400/400?text=彩色海报',
      description: '为复古宣传海报添加符合时代特色的色彩，保持了原有的艺术风格。',
      processingTime: '30秒',
      rating: 4.5,
      category: '智能上色',
      tags: ['海报着色', '复古风格', '艺术修复']
    },
    {
      id: '7',
      title: '婚纱照修复增强',
      type: 'restore',
      beforeImage: '/api/placeholder/400/400?text=破损婚纱照',
      afterImage: '/api/placeholder/400/400?text=修复婚纱照',
      description: '修复了一张1980年代的婚纱照，去除了黄斑、褪色和折痕，恢复了原有的浪漫色彩。',
      processingTime: '50秒',
      rating: 4.9,
      category: '照片修复',
      tags: ['婚纱照修复', '黄斑去除', '色彩恢复']
    },
    {
      id: '8',
      title: '儿童照片动画',
      type: 'animate',
      beforeImage: '/api/placeholder/400/400?text=儿童照片',
      afterVideo: '/api/placeholder/video.mp4',
      description: '为童年照片添加生动的眨眼和微笑动画，让珍贵的童年回忆焕发新的生命力。',
      processingTime: '1分45秒',
      rating: 4.8,
      category: '人物复活',
      tags: ['儿童动画', '眨眼效果', '微笑动作']
    },
    {
      id: '9',
      title: '古建筑图片上色',
      type: 'colorize',
      beforeImage: '/api/placeholder/400/400?text=古建筑黑白',
      afterImage: '/api/placeholder/400/400?text=古建筑彩色',
      description: '为古建筑的黑白历史照片添加逼真色彩，重现古建筑的原貌和历史韵味。',
      processingTime: '40秒',
      rating: 4.7,
      category: '智能上色',
      tags: ['建筑着色', '历史修复', '文物保护']
    },
    {
      id: '10',
      title: '宠物照片生成视频',
      type: 'video',
      beforeImage: '/api/placeholder/400/400?text=宠物照片',
      afterVideo: '/api/placeholder/video.mp4',
      description: '将静态的宠物照片转换为动态视频，添加摇尾巴、眨眼等可爱动作。',
      processingTime: '1分20秒',
      rating: 4.6,
      category: '图生视频',
      tags: ['宠物动画', '可爱动作', '趣味视频']
    },
    {
      id: '11',
      title: '毕业照智能修复',
      type: 'restore',
      beforeImage: '/api/placeholder/400/400?text=模糊毕业照',
      afterImage: '/api/placeholder/400/400?text=清晰毕业照',
      description: '修复模糊的毕业合影，提升人脸清晰度，让每个人的面部都更加清楚可见。',
      processingTime: '55秒',
      rating: 4.8,
      category: '照片修复',
      tags: ['合影修复', '多人修复', '学校回忆']
    },
    {
      id: '12',
      title: '风景照动态效果',
      type: 'video',
      beforeImage: '/api/placeholder/400/400?text=山水风景',
      afterVideo: '/api/placeholder/video.mp4',
      description: '为山水风景照添加云朵飘动、水流效果等自然动态，营造诗意般的视觉体验。',
      processingTime: '2分钟',
      rating: 4.5,
      category: '图生视频',
      tags: ['风景动效', '自然动画', '诗意视频']
    }
  ];

  const categories = ['all', '照片修复', '智能上色', '人物复活', '图生视频'];

  const filteredCases = activeCategory === 'all' 
    ? caseData.slice(0, maxCases)
    : caseData.filter(c => c.category === activeCategory).slice(0, maxCases);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'restore': return '✨';
      case 'colorize': return '🎨';
      case 'animate': return '🎭';
      case 'video': return '🎬';
      default: return '📸';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'restore': return 'from-blue-400 to-blue-600';
      case 'colorize': return 'from-purple-400 to-purple-600';
      case 'animate': return 'from-green-400 to-green-600';
      case 'video': return 'from-orange-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* 分类过滤器 */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  setActiveCategory(category);
                  setIsLoading(false);
                }, 300);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white'
                  : 'bg-[#374151] text-[#d1d5db] hover:bg-[#4b5563]'
              }`}
            >
              {category === 'all' ? '全部案例' : category}
            </button>
          ))}
        </div>

        {/* 案例网格 */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[#d1d5db]">加载中...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCases.map((caseItem, index) => (
              <div
                key={caseItem.id}
                className="card overflow-hidden cursor-pointer group"
                onClick={() => setSelectedCase(caseItem)}
            >
              {/* 案例预览图 */}
              <div className="relative aspect-square overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-[#374151] to-[#6366f1]/20 flex items-center justify-center">
                  <div className="text-6xl opacity-70">
                    {getTypeIcon(caseItem.type)}
                  </div>
                </div>
                
                {/* 悬停遮罩 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Eye className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">查看详情</span>
                  </div>
                </div>

                {/* 类型标签 */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getTypeColor(caseItem.type)}`}>
                  {caseItem.category}
                </div>

                {/* 评分 */}
                <div className="absolute top-3 right-3 flex items-center bg-black/50 rounded-full px-2 py-1">
                  <Star className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" />
                  <span className="text-xs text-white">{caseItem.rating}</span>
                </div>
              </div>

              {/* 案例信息 */}
              <div className="p-6">
                <h3 className="font-semibold text-white mb-2 group-hover:text-[#6366f1] transition-colors">
                  {caseItem.title}
                </h3>
                <p className="text-[#9ca3af] text-sm mb-3 line-clamp-2">
                  {caseItem.description}
                </p>
                
                {/* 标签和处理时间 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-[#6b7280]">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-xs">{caseItem.processingTime}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {caseItem.tags.slice(0, 2).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-[#374151] text-[#9ca3af] text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* 更多案例按钮 */}
        {!isLoading && caseData.length > maxCases && (
          <div className="text-center">
            <button 
              className="btn-secondary"
              onClick={() => window.location.href = '/cases'}
            >
              查看更多案例 ({caseData.length - maxCases}+)
            </button>
          </div>
        )}
      </div>

      {/* 案例详情模态框 */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2d3238] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* 模态框头部 */}
            <div className="flex items-center justify-between p-6 border-b border-[#4b5563]">
              <h2 className="text-2xl font-bold text-white">{selectedCase.title}</h2>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-[#9ca3af] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* 处理前 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">处理前</h3>
                  <div className="aspect-square bg-gradient-to-br from-[#374151] to-[#6366f1]/20 rounded-lg flex items-center justify-center">
                    <div className="text-6xl opacity-70">📷</div>
                  </div>
                </div>

                {/* 处理后 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    处理后 {selectedCase.afterVideo && (
                      <span className="text-sm text-[#6366f1] ml-2">
                        <Play className="w-4 h-4 inline mr-1" />
                        视频
                      </span>
                    )}
                  </h3>
                  <div className="aspect-square bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-lg flex items-center justify-center">
                    <div className="text-6xl opacity-90">✨</div>
                  </div>
                </div>
              </div>

              {/* 详细信息 */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">处理详情</h4>
                  <p className="text-[#d1d5db]">{selectedCase.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#374151] rounded-lg p-3 text-center">
                    <div className="text-[#6366f1] font-semibold">{selectedCase.processingTime}</div>
                    <div className="text-xs text-[#9ca3af]">处理时间</div>
                  </div>
                  <div className="bg-[#374151] rounded-lg p-3 text-center">
                    <div className="text-[#6366f1] font-semibold flex items-center justify-center">
                      <Star className="w-4 h-4 mr-1" fill="currentColor" />
                      {selectedCase.rating}
                    </div>
                    <div className="text-xs text-[#9ca3af]">用户评分</div>
                  </div>
                  <div className="bg-[#374151] rounded-lg p-3 text-center">
                    <div className="text-[#6366f1] font-semibold">{selectedCase.category}</div>
                    <div className="text-xs text-[#9ca3af]">处理类型</div>
                  </div>
                  <div className="bg-[#374151] rounded-lg p-3 text-center">
                    <div className="text-[#6366f1] font-semibold">高清</div>
                    <div className="text-xs text-[#9ca3af]">输出质量</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">技术标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#6366f1]/20 text-[#6366f1] text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="p-6 border-t border-[#4b5563] flex justify-between">
              <div className="flex items-center text-sm text-[#9ca3af]">
                <span>💡 提示：点击"立即尝试"开始处理您的照片</span>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="btn-secondary"
                >
                  关闭
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setSelectedCase(null);
                    window.location.href = '/upload';
                  }}
                >
                  <span>🎬</span>
                  立即尝试
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CaseShowcase;