import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ntw_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ntw_token') || null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on refresh
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('ntw_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success && res.data) {
        const { user: userData, token: userToken } = res.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('ntw_token', userToken);
        localStorage.setItem('ntw_user', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.fullName}!`);
        return userData;
      }
    } catch (err) {
      toast.error(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.success) {
        toast.success('Account created successfully. You can sign in now.');
        return res.data?.user;
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ntw_token');
    localStorage.removeItem('ntw_user');
    toast.success('Logged out successfully');
  };

  const updateProfile = async (formData) => {
    try {
      const isFormData = formData instanceof FormData;
      const res = await api.put('/auth/profile', formData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      });
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('ntw_user', JSON.stringify(res.data.user));
        toast.success('Profile updated successfully');
        return res.data.user;
      }
    } catch (err) {
      toast.error(err.message || 'Profile update failed');
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator',
    isParticipant: user?.role === 'participant',
    isTrainer: user?.role === 'trainer',
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
