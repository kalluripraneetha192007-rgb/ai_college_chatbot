import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('college-chat-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('college-chat-token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const authUser = response.data?.user || null;
        setUser(authUser);

        if (authUser) {
          localStorage.setItem('college-chat-user', JSON.stringify(authUser));
        }
      } catch (error) {
        localStorage.removeItem('college-chat-token');
        localStorage.removeItem('college-chat-user');
        setUser(null);
        setToken('');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token]);

  const handleAuthData = (authResponse) => {
    const authUser = authResponse.user;
    const authToken = authResponse.token;

    setUser(authUser);
    setToken(authToken);

    localStorage.setItem('college-chat-token', authToken);
    localStorage.setItem('college-chat-user', JSON.stringify(authUser));
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    handleAuthData(response.data);
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    handleAuthData(response.data);
    return response.data;
  };

  const adminLogin = async (email, password) => {
    const response = await api.post('/auth/admin-login', { email, password });
    handleAuthData(response.data);
    return response.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Logout request failed:', error.message);
    } finally {
      localStorage.removeItem('college-chat-token');
      localStorage.removeItem('college-chat-user');
      setUser(null);
      setToken('');
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      adminLogin,
      logout
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
