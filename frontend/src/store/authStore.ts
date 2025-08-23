import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, LoginForm, RegisterForm, ApiResponse } from '../types';

interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // 操作
  login: (credentials: LoginForm) => Promise<boolean>;
  register: (userData: RegisterForm) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const authApi = {
  async login(credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  async register(userData: RegisterForm): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async refreshToken(): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  async getMe(): Promise<ApiResponse<User>> {
    const response = await fetch('/api/auth/me', {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,

        // 登录
        login: async (credentials: LoginForm) => {
          set({ loading: true, error: null });
          
          try {
            const response = await authApi.login(credentials);
            
            if (response.success && response.data) {
              const { user, token } = response.data;
              
              // 设置token到请求头
              localStorage.setItem('token', token);
              
              set({
                user,
                token,
                isAuthenticated: true,
                loading: false,
                error: null,
              });
              
              return true;
            } else {
              set({
                error: response.error || '登录失败',
                loading: false,
              });
              return false;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '网络错误',
              loading: false,
            });
            return false;
          }
        },

        // 注册
        register: async (userData: RegisterForm) => {
          set({ loading: true, error: null });
          
          try {
            const response = await authApi.register(userData);
            
            if (response.success && response.data) {
              const { user, token } = response.data;
              
              localStorage.setItem('token', token);
              
              set({
                user,
                token,
                isAuthenticated: true,
                loading: false,
                error: null,
              });
              
              return true;
            } else {
              set({
                error: response.error || '注册失败',
                loading: false,
              });
              return false;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '网络错误',
              loading: false,
            });
            return false;
          }
        },

        // 登出
        logout: () => {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        },

        // 刷新token
        refreshToken: async () => {
          try {
            const response = await authApi.refreshToken();
            
            if (response.success && response.data) {
              const { user, token } = response.data;
              
              localStorage.setItem('token', token);
              
              set({
                user,
                token,
                isAuthenticated: true,
                error: null,
              });
              
              return true;
            } else {
              // Token刷新失败，需要重新登录
              get().logout();
              return false;
            }
          } catch (error) {
            get().logout();
            return false;
          }
        },

        // 更新用户信息
        updateUser: (userData: Partial<User>) => {
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser, ...userData },
            });
          }
        },

        // 清除错误
        clearError: () => set({ error: null }),

        // 设置加载状态
        setLoading: (loading: boolean) => set({ loading }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Token自动刷新中间件
export const setupAuthInterceptors = () => {
  const { refreshToken, logout } = useAuthStore.getState();
  
  // 每30分钟尝试刷新token
  setInterval(async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      const success = await refreshToken();
      if (!success) {
        console.warn('Token refresh failed, user logged out');
      }
    }
  }, 30 * 60 * 1000);

  // 页面可见性变化时刷新token
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        await refreshToken();
      }
    }
  });
};