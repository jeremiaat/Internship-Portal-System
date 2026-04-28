import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialToken = localStorage.getItem('token');
const initialState = {
  isAuthenticated: Boolean(initialToken),
  user: null,
  token: initialToken,
  loading: Boolean(initialToken),
  error: null,
};

const extractError = (error, fallback) => {
  const payload = error?.response?.data;
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (payload.detail) return payload.detail;
  const firstValue = Object.values(payload)[0];
  if (Array.isArray(firstValue)) return firstValue[0];
  if (typeof firstValue === 'string') return firstValue;
  return fallback;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      dispatch({ type: 'AUTH_START' });
      try {
        const response = await authAPI.getProfile();
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.data, token } });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired. Please sign in again.' });
      }
    };
    bootstrapAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.login(credentials);
      const { user, access, refresh } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token: access } });
      return response.data;
    } catch (error) {
      const message = extractError(error, 'Login failed');
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.register(userData);
      const { user, access, refresh } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token: access } });
      return response.data;
    } catch (error) {
      const message = extractError(error, 'Registration failed');
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refreshToken');
    try {
      if (refresh) {
        await authAPI.logout(refresh);
      }
    } catch (_error) {
      // Best effort logout on backend.
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
