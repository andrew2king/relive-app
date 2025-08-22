// 导出所有stores
export { useAuthStore, setupAuthInterceptors } from './authStore';
export { usePhotoStore } from './photoStore';
export { useUIStore, useNotifications, initializeTheme } from './uiStore';

// 导出类型
export type { default as AuthState } from './authStore';
export type { default as PhotoState } from './photoStore';
export type { default as UIState } from './uiStore';

// Store初始化函数
export const initializeStores = () => {
  // 初始化主题
  initializeTheme();
  
  // 设置认证拦截器
  setupAuthInterceptors();
  
  console.log('Stores initialized successfully');
};