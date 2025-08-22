'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useNotifications } from '../../hooks';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showNavigation?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title = 'RELIVE',
  showHeader = true,
  showNavigation = true,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 mobile:bg-white">
      {/* Mobile Header */}
      {showHeader && (
        <MobileHeader 
          title={title}
          user={user}
          isAuthenticated={isAuthenticated}
          isMenuOpen={isMenuOpen}
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        />
      )}

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <MobileMenuOverlay 
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          user={user}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Main Content */}
      <main className={`
        ${showHeader ? 'pt-16' : ''} 
        ${showNavigation ? 'pb-20' : ''} 
        safe-area-top safe-area-bottom
      `}>
        <div className="mobile-container min-h-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      {showNavigation && <MobileBottomNavigation />}
    </div>
  );
};

// Mobile Header Component
interface MobileHeaderProps {
  title: string;
  user: any;
  isAuthenticated: boolean;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  user,
  isAuthenticated,
  isMenuOpen,
  onMenuToggle,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 safe-area-top">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>

        {/* User Info & Menu */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user && (
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-600">
                {user.credits || 0} 积分
              </div>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs text-gray-600">
                    {user.username?.[0] || user.email?.[0] || 'U'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Menu Button */}
          <button
            onClick={onMenuToggle}
            className="mobile-button p-2"
            aria-label="菜单"
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className={`h-0.5 bg-gray-600 transition-all duration-200 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <div className={`h-0.5 bg-gray-600 transition-all duration-200 ${isMenuOpen ? 'opacity-0' : ''}`} />
              <div className={`h-0.5 bg-gray-600 transition-all duration-200 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

// Mobile Menu Overlay
interface MobileMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isAuthenticated: boolean;
}

const MobileMenuOverlay: React.FC<MobileMenuOverlayProps> = ({
  isOpen,
  onClose,
  user,
  isAuthenticated,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed top-0 right-0 w-80 max-w-[80vw] h-full bg-white shadow-xl safe-area-top safe-area-bottom">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">菜单</h2>
            <button
              onClick={onClose}
              className="mobile-button p-2"
              aria-label="关闭菜单"
            >
              <span className="text-2xl text-gray-400">×</span>
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex-1 overflow-y-auto smooth-scroll">
            {isAuthenticated ? (
              <AuthenticatedMenu user={user} onClose={onClose} />
            ) : (
              <UnauthenticatedMenu onClose={onClose} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Authenticated Menu Content
const AuthenticatedMenu: React.FC<{ user: any; onClose: () => void }> = ({ user, onClose }) => {
  const menuItems = [
    { label: '我的照片', href: '/photos', icon: '📷' },
    { label: '处理历史', href: '/history', icon: '📋' },
    { label: '积分记录', href: '/credits', icon: '💎' },
    { label: '会员中心', href: '/membership', icon: '👑' },
    { label: '设置', href: '/settings', icon: '⚙️' },
    { label: '帮助中心', href: '/help', icon: '❓' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* User Profile */}
      <div className="text-center py-6">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt="Avatar"
            className="w-20 h-20 rounded-full mx-auto mb-4"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-600">
              {user?.username?.[0] || user?.email?.[0] || 'U'}
            </span>
          </div>
        )}
        <h3 className="text-lg font-medium text-gray-900">
          {user?.username || user?.email}
        </h3>
        <p className="text-sm text-gray-600">
          {user?.membershipLevel === 'free' ? '免费用户' : 'VIP用户'}
        </p>
      </div>

      {/* Menu Items */}
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 touch-target"
            onClick={onClose}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-gray-900">{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="pt-6 border-t border-gray-200">
        <button
          className="w-full flex items-center justify-center space-x-2 p-3 text-red-600 hover:bg-red-50 rounded-lg touch-target"
          onClick={() => {
            // Handle logout
            onClose();
          }}
        >
          <span>🚪</span>
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
};

// Unauthenticated Menu Content
const UnauthenticatedMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="p-4 space-y-6">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">👋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          欢迎使用 RELIVE
        </h3>
        <p className="text-gray-600">
          登录后享受完整功能
        </p>
      </div>

      <div className="space-y-3">
        <button
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium touch-target"
          onClick={onClose}
        >
          立即登录
        </button>
        <button
          className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium touch-target"
          onClick={onClose}
        >
          注册账号
        </button>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <nav className="space-y-2">
          <a
            href="/about"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 touch-target"
            onClick={onClose}
          >
            <span className="text-xl">ℹ️</span>
            <span className="text-gray-900">关于我们</span>
          </a>
          <a
            href="/help"
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 touch-target"
            onClick={onClose}
          >
            <span className="text-xl">❓</span>
            <span className="text-gray-900">帮助中心</span>
          </a>
        </nav>
      </div>
    </div>
  );
};

// Bottom Navigation
const MobileBottomNavigation: React.FC = () => {
  const navItems = [
    { label: '首页', href: '/', icon: '🏠', active: true },
    { label: '上传', href: '/upload', icon: '📤' },
    { label: '案例', href: '/cases', icon: '🖼️' },
    { label: '我的', href: '/profile', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-2 touch-target ${
              item.active
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};