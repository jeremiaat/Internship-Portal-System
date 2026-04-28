import React, { createContext, useContext, useReducer } from 'react';
import { notificationAPI } from '../services/api';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_NOTIFICATIONS_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_NOTIFICATIONS_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        notifications: action.payload,
        error: null 
      };
    case 'FETCH_NOTIFICATIONS_FAILURE':
      return { 
        ...state, 
        loading: false, 
        error: action.payload
      };
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications]
      };
    case 'MARK_AS_READ':
      return { 
        ...state, 
        notifications: state.notifications.map(notification =>
          notification.id === action.payload 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      };
    case 'MARK_ALL_AS_READ':
      return { 
        ...state, 
        notifications: state.notifications.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      };
    case 'UPDATE_PREFERENCES':
      return { 
        ...state, 
        preferences: { ...state.preferences, ...action.payload }
      };
    default:
      return state;
  }
};

const initialState = {
  notifications: [],
  loading: false,
  error: null,
  preferences: {
    email_notifications: true,
    push_notifications: true,
    application_updates: true,
    grade_updates: true,
    report_reminders: true,
    new_internships: true,
  },
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const fetchNotifications = async () => {
    dispatch({ type: 'FETCH_NOTIFICATIONS_START' });
    try {
      const response = await notificationAPI.getNotifications();
      dispatch({
        type: 'FETCH_NOTIFICATIONS_SUCCESS',
        payload: response.data.results
      });
    } catch (error) {
      dispatch({
        type: 'FETCH_NOTIFICATIONS_FAILURE',
        payload: error.response?.data?.message || 'Failed to fetch notifications'
      });
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const updatePreferences = async (preferences) => {
    try {
      await notificationAPI.updatePreferences(preferences);
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  };

  const addNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const getUnreadCount = () => {
    return state.notifications.filter(n => !n.is_read).length;
  };

  const value = {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    addNotification,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
