// Import functions we need for initialization
import { initializeTheme } from './uiStore';
import { setupAuthInterceptors } from './authStore';

// 导出所有stores
export { useAuthStore } from './authStore';
export { usePhotoStore } from './photoStore';
export { useUIStore, useNotifications } from './uiStore';

// Note: Type exports would need to be defined in each store file
// For now, these are commented out as the stores don't export types as default
// export type { AuthState } from './authStore';
// export type { PhotoState } from './photoStore';  
// export type { UIState } from './uiStore';

// Store初始化函数
export const initializeStores = () => {
  // 初始化主题
  initializeTheme();
  
  // 设置认证拦截器
  setupAuthInterceptors();
  
  console.log('Stores initialized successfully');
};