import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Notification } from '../types';

interface UIState {
  // 布局状态
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // 主题状态
  theme: 'light' | 'dark' | 'auto';
  
  // 语言状态
  language: 'zh' | 'en';
  
  // 通知状态
  notifications: Notification[];
  
  // 模态框状态
  modals: {
    login: boolean;
    register: boolean;
    photoUpload: boolean;
    photoEditor: boolean;
    settings: boolean;
    preview: boolean;
  };
  
  // 加载状态
  globalLoading: boolean;
  
  // 错误状态
  globalError: string | null;

  // 操作
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (language: 'zh' | 'en') => void;
  
  showNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  hideNotification: (id: string) => void;
  clearNotifications: () => void;
  
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  
  setGlobalLoading: (loading: boolean) => void;
  setGlobalError: (error: string | null) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        sidebarOpen: true,
        sidebarCollapsed: false,
        theme: 'light',
        language: 'zh',
        notifications: [],
        modals: {
          login: false,
          register: false,
          photoUpload: false,
          photoEditor: false,
          settings: false,
          preview: false,
        },
        globalLoading: false,
        globalError: null,

        // 侧边栏操作
        toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
        setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),

        // 主题操作
        setTheme: (theme: 'light' | 'dark' | 'auto') => {
          set({ theme });
          
          // 应用主题到DOM
          const root = document.documentElement;
          if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', prefersDark);
          } else {
            root.classList.toggle('dark', theme === 'dark');
          }
        },

        // 语言操作
        setLanguage: (language: 'zh' | 'en') => set({ language }),

        // 通知操作
        showNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => {
          const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newNotification: Notification = {
            ...notification,
            id,
            createdAt: new Date(),
            autoClose: notification.autoClose ?? true,
            duration: notification.duration ?? 5000,
          };

          set(state => ({
            notifications: [...state.notifications, newNotification]
          }));

          // 自动关闭通知
          if (newNotification.autoClose) {
            setTimeout(() => {
              get().hideNotification(id);
            }, newNotification.duration);
          }
        },

        hideNotification: (id: string) => {
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }));
        },

        clearNotifications: () => set({ notifications: [] }),

        // 模态框操作
        openModal: (modal: keyof UIState['modals']) => {
          set(state => ({
            modals: { ...state.modals, [modal]: true }
          }));
        },

        closeModal: (modal: keyof UIState['modals']) => {
          set(state => ({
            modals: { ...state.modals, [modal]: false }
          }));
        },

        closeAllModals: () => {
          set(state => ({
            modals: Object.keys(state.modals).reduce((acc, key) => {
              acc[key as keyof UIState['modals']] = false;
              return acc;
            }, {} as UIState['modals'])
          }));
        },

        // 全局状态操作
        setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }),
        setGlobalError: (error: string | null) => set({ globalError: error }),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// 通知帮助函数
export const useNotifications = () => {
  const showNotification = useUIStore(state => state.showNotification);
  
  return {
    success: (title: string, message?: string) => 
      showNotification({ type: 'success', title, message: message || '' }),
    
    error: (title: string, message?: string) => 
      showNotification({ type: 'error', title, message: message || '', autoClose: false }),
    
    warning: (title: string, message?: string) => 
      showNotification({ type: 'warning', title, message: message || '' }),
    
    info: (title: string, message?: string) => 
      showNotification({ type: 'info', title, message: message || '' }),
  };
};

// 主题自动应用
export const initializeTheme = () => {
  const theme = useUIStore.getState().theme;
  const root = document.documentElement;
  
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (useUIStore.getState().theme === 'auto') {
        root.classList.toggle('dark', e.matches);
      }
    });
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
};