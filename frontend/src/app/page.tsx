'use client';

import React from 'react';
import { Camera, Palette, Tags, BookOpen, Users, Crown } from 'lucide-react';
import Button from '@/components/ui/Button';
import CaseShowcase from '@/components/CaseShowcase';
import CaseStats from '@/components/CaseStats';
import TestimonialCarousel from '@/components/TestimonialCarousel';

const HomePage: React.FC = () => {
  // Button click handlers
  const handleStartExperience = () => {
    // 导航到上传页面
    window.location.href = '/upload';
  };

  const handleViewCases = () => {
    // 滚动到案例展示区域
    document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePricingClick = (planType: string) => {
    alert(`选择了 ${planType} 方案，将跳转到支付页面`);
  };

  const handleRegister = () => {
    alert('注册功能将在后续版本中实现');
  };

  const handleInviteFriends = () => {
    alert('邀请好友功能将在后续版本中实现');
  };

  const features = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: '照片修复',
      description: '破损修复、模糊增强、智能修复',
      color: 'from-blue-400 to-blue-600',
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: '人物复活',
      description: '让老照片中的人物动起来',
      color: 'from-purple-400 to-purple-600',
    },
    {
      icon: <Tags className="w-8 h-8" />,
      title: '智能标注',
      description: '自动识别时间、人物、地点',
      color: 'from-green-400 to-green-600',
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: '时光相册',
      description: '制作精美的数字相册',
      color: 'from-orange-400 to-orange-600',
    },
  ];

  const showcaseImages = [
    '/images/showcase-1.jpg',
    '/images/showcase-2.jpg', 
    '/images/showcase-3.jpg',
  ];

  return (
    <div className="min-h-screen bg-[#1a1e23]">
      {/* Navigation */}
      <nav className="bg-[#2d3238] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">RELIVE</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#9ca3af]">积分: 1,234</span>
              <Crown className="w-5 h-5 text-[#6366f1]" />
              <div className="w-8 h-8 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full"></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              重现时光
              <span className="block text-gradient">连接回忆</span>
            </h1>
            <p className="text-xl text-[#d1d5db] mb-8 max-w-2xl mx-auto">
              用AI技术让每一张珍贵的老照片重新焕发生命力，让回忆变得更加生动
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary" onClick={handleStartExperience}>
                <span>🎬</span>
                开始体验
              </button>
              <button className="btn-secondary" onClick={handleViewCases}>
                查看案例
              </button>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-[#6366f1]/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-[#8b5cf6]/20 rounded-full animate-pulse"></div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-[#1a1e23]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">核心功能</h2>
            <p className="text-[#9ca3af]">专业AI技术，为您的回忆保驾护航</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card p-6 hover:transform hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#9ca3af]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-20 bg-[#2d3238]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">精选案例</h2>
            <p className="text-[#9ca3af]">探索AI技术如何让珍贵回忆重现光彩</p>
          </div>
          
          <CaseShowcase maxCases={6} />
          
          {/* 统计数据 */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-white mb-4">平台数据</h3>
              <p className="text-[#9ca3af]">用数据见证我们的专业与品质</p>
            </div>
            <CaseStats />
          </div>
          
          {/* 查看更多案例按钮 */}
          <div className="text-center mt-12">
            <button 
              className="btn-secondary"
              onClick={() => window.location.href = '/cases'}
            >
              查看所有案例
            </button>
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section className="py-20 bg-[#1a1e23]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">用户评价</h2>
            <p className="text-[#9ca3af]">听听用户对我们服务的真实反馈</p>
          </div>
          
          <TestimonialCarousel />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-[#1a1e23]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">选择您的方案</h2>
            <p className="text-[#9ca3af]">灵活的价格方案，满足不同需求</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <div className="card p-8 text-center border-2 border-[#4b5563]">
              <h3 className="text-xl font-semibold text-white mb-4">月度会员</h3>
              <div className="text-4xl font-bold text-gradient mb-6">
                ¥29.9<span className="text-base text-[#9ca3af]">/月</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="text-[#d1d5db]">1000 积分</li>
                <li className="text-[#d1d5db]">无水印下载</li>
                <li className="text-[#d1d5db]">优先处理</li>
              </ul>
              <button className="btn-secondary w-full" onClick={() => handlePricingClick('月度会员')}>选择方案</button>
            </div>
            
            {/* Yearly Plan - Popular */}
            <div className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white rounded-2xl p-8 text-center transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#f59e0b] text-white px-4 py-1 rounded-full text-sm font-medium">
                最受欢迎
              </div>
              <h3 className="text-xl font-semibold mb-4">年度会员</h3>
              <div className="text-4xl font-bold mb-6">
                ¥199<span className="text-base opacity-80">/年</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li>15000 积分</li>
                <li>无水印下载</li>
                <li>优先处理</li>
                <li>专属客服</li>
                <li>批量处理</li>
              </ul>
              <button className="w-full bg-white text-[#6366f1] hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-all" onClick={() => handlePricingClick('年度会员')}>
                选择方案
              </button>
            </div>
            
            {/* Credits Package */}
            <div className="card p-8 text-center border-2 border-[#4b5563]">
              <h3 className="text-xl font-semibold text-white mb-4">按次付费</h3>
              <div className="text-4xl font-bold text-gradient mb-6">
                ¥49.9
              </div>
              <ul className="space-y-3 mb-8">
                <li className="text-[#d1d5db]">3000 积分</li>
                <li className="text-[#d1d5db]">永不过期</li>
                <li className="text-[#d1d5db]">灵活使用</li>
              </ul>
              <button className="btn-secondary w-full" onClick={() => handlePricingClick('按次付费')}>选择方案</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            开启您的时光之旅
          </h2>
          <p className="text-xl text-white/90 mb-8">
            现在注册，免费获得200积分体验AI照片修复
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-[#6366f1] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all" onClick={handleRegister}>
              立即注册
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#6366f1] transition-all flex items-center justify-center" onClick={handleInviteFriends}>
              <Users className="w-5 h-5 mr-2" />
              邀请好友
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1419] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-gradient">RELIVE</h3>
              <p className="text-white/70">
                让每一张珍贵的老照片重新焕发生命力
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#d1d5db]">产品功能</h4>
              <ul className="space-y-2 text-[#9ca3af]">
                <li>照片修复</li>
                <li>人物复活</li>
                <li>智能标注</li>
                <li>时光相册</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#d1d5db]">服务支持</h4>
              <ul className="space-y-2 text-[#9ca3af]">
                <li>使用帮助</li>
                <li>技术支持</li>
                <li>意见反馈</li>
                <li>联系我们</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#d1d5db]">关于我们</h4>
              <ul className="space-y-2 text-[#9ca3af]">
                <li>公司介绍</li>
                <li>隐私政策</li>
                <li>服务条款</li>
                <li>加入我们</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/70">
            <p>&copy; 2024 RELIVE. All rights reserved.</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>自动部署已启用 · 构建版本 v1.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;