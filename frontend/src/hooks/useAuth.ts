import { useAuthStore } from '../store/authStore';
import { LoginForm, RegisterForm } from '../types';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
  } = useAuthStore();

  const handleLogin = async (credentials: LoginForm) => {
    const success = await login(credentials);
    return success;
  };

  const handleRegister = async (userData: RegisterForm) => {
    const success = await register(userData);
    return success;
  };

  const handleLogout = () => {
    logout();
  };

  return {
    // 状态
    user,
    isAuthenticated,
    loading,
    error,
    
    // 操作
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateUser,
    clearError,
    
    // 计算属性
    isVIP: user?.membershipLevel !== 'free',
    credits: user?.credits || 0,
    hasValidMembership: user?.membershipExpiry ? new Date(user.membershipExpiry) > new Date() : false,
  };
};