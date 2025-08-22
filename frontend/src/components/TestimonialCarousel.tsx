'use client';

import React, { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  comment: string;
  caseType: string;
  beforeImage: string;
  afterImage: string;
}

const TestimonialCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: '李女士',
      avatar: '👩',
      location: '北京',
      rating: 5,
      comment: '非常惊喜！我奶奶的老照片修复得如此完美，仿佛重新回到了那个年代。家人看到都非常感动，这真是一份珍贵的礼物。',
      caseType: '人像修复',
      beforeImage: '/api/placeholder/150/150?text=修复前',
      afterImage: '/api/placeholder/150/150?text=修复后'
    },
    {
      id: '2',
      name: '王先生',
      avatar: '👨',
      location: '上海',
      rating: 5,
      comment: '黑白照片上色效果超出期待！颜色自然真实，完全没有人工痕迹。让我们看到了父亲年轻时的真实模样，太感谢了！',
      caseType: '智能上色',
      beforeImage: '/api/placeholder/150/150?text=黑白照',
      afterImage: '/api/placeholder/150/150?text=彩色照'
    },
    {
      id: '3',
      name: '张小姐',
      avatar: '👩‍💼',
      location: '深圳',
      rating: 5,
      comment: '人物复活功能太神奇了！看到去世的爷爷在照片里"说话"，全家人都哭了。技术真的可以传递爱和回忆。',
      caseType: '人物复活',
      beforeImage: '/api/placeholder/150/150?text=静态照',
      afterImage: '/api/placeholder/150/150?text=动态视频'
    },
    {
      id: '4',
      name: '陈先生',
      avatar: '👨‍💻',
      location: '广州',
      rating: 4,
      comment: '处理速度很快，质量也不错。唯一的建议是希望能提供更多风格选择。总体来说是个很棒的服务！',
      caseType: '图生视频',
      beforeImage: '/api/placeholder/150/150?text=风景照',
      afterImage: '/api/placeholder/150/150?text=动态效果'
    },
    {
      id: '5',
      name: '刘女士',
      avatar: '👵',
      location: '成都',
      rating: 5,
      comment: '作为一个不太懂技术的人，这个平台使用起来非常简单。上传照片后很快就收到了处理结果，效果让我非常满意。',
      caseType: '综合修复',
      beforeImage: '/api/placeholder/150/150?text=老旧照片',
      afterImage: '/api/placeholder/150/150?text=清晰照片'
    }
  ];

  useEffect(() => {
    if (!autoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, testimonials.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000); // 10秒后恢复自动播放
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative">
      {/* 主要内容区域 */}
      <div className="card p-8 md:p-12 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#6366f1]/10 to-[#8b5cf6]/10 rounded-full -translate-y-16 translate-x-16"></div>
        
        <div className="relative z-10">
          {/* 引用图标 */}
          <div className="flex justify-center mb-6">
            <Quote className="w-12 h-12 text-[#6366f1]/30" />
          </div>

          {/* 用户评价 */}
          <div className="text-center mb-8">
            <p className="text-lg md:text-xl text-[#d1d5db] leading-relaxed mb-6 italic">
              "{currentTestimonial.comment}"
            </p>
            
            {/* 星级评分 */}
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`w-5 h-5 ${
                    index < currentTestimonial.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-[#4b5563]'
                  }`}
                />
              ))}
            </div>

            {/* 用户信息 */}
            <div className="flex items-center justify-center space-x-4">
              <div className="text-3xl">{currentTestimonial.avatar}</div>
              <div>
                <h4 className="font-semibold text-white">{currentTestimonial.name}</h4>
                <p className="text-[#9ca3af] text-sm">{currentTestimonial.location} · {currentTestimonial.caseType}</p>
              </div>
            </div>
          </div>

          {/* 案例对比图 */}
          <div className="flex justify-center space-x-6 mb-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#374151] to-[#6366f1]/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-2xl">📷</span>
              </div>
              <span className="text-xs text-[#9ca3af]">处理前</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]"></div>
              <div className="w-3 h-3 bg-[#6366f1] rounded-full mx-2"></div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]"></div>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-lg flex items-center justify-center mb-2">
                <span className="text-2xl">✨</span>
              </div>
              <span className="text-xs text-[#9ca3af]">处理后</span>
            </div>
          </div>
        </div>

        {/* 导航按钮 */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-[#374151] hover:bg-[#4b5563] rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-[#374151] hover:bg-[#4b5563] rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* 指示器 */}
      <div className="flex justify-center space-x-2 mt-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-[#6366f1] w-8'
                : 'bg-[#4b5563] hover:bg-[#6b7280]'
            }`}
          />
        ))}
      </div>

      {/* 自动播放指示器 */}
      {autoPlay && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-2 text-[#9ca3af] text-xs">
            <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-pulse"></div>
            <span>自动播放中</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialCarousel;