'use client';

import React from 'react';
import { TrendingUp, Users, Star, Clock } from 'lucide-react';

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
}

const CaseStats: React.FC = () => {
  const stats: StatItem[] = [
    {
      icon: <Users className="w-8 h-8" />,
      label: '用户总数',
      value: '50,000+',
      trend: '+12%'
    },
    {
      icon: <div className="text-2xl">📸</div>,
      label: '处理照片',
      value: '200,000+',
      trend: '+25%'
    },
    {
      icon: <Star className="w-8 h-8" fill="currentColor" />,
      label: '平均评分',
      value: '4.8',
      trend: '+0.2'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      label: '平均处理时间',
      value: '45秒',
      trend: '-15%'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="card p-6 text-center group hover:scale-105 transition-transform duration-300"
        >
          <div className="text-[#6366f1] mb-3 flex justify-center group-hover:scale-110 transition-transform">
            {stat.icon}
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {stat.value}
          </div>
          <div className="text-[#9ca3af] text-sm mb-2">
            {stat.label}
          </div>
          {stat.trend && (
            <div className={`text-xs flex items-center justify-center ${
              stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'
            }`}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {stat.trend}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CaseStats;