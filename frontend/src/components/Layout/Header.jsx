import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext.jsx';

const Header = () => {
  const { user, logout } = useAuth();
  const { notifications, getUnreadCount, fetchNotifications, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notificationRef = useRef(null);

  const unreadCount = getUnreadCount();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-semibold text-gray-900">
          Internship Portal
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Notifications
              {getUnreadCount() > 0 && (
                <span className="ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 text-white text-xs px-1">
                  {getUnreadCount()}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-12 w-96 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="flex items-center justify-between p-3 border-b border-gray-100">
                  <p className="font-medium text-sm">Recent Notifications</p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => fetchNotifications()} 
                      className="text-xs text-blue-700 hover:text-blue-900"
                      title="Refresh notifications"
                    >
                      Refresh
                    </button>
                    <button onClick={markAllAsRead} className="text-xs text-blue-700 hover:text-blue-900">
                      Mark all read
                    </button>
                  </div>
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-600">No notifications yet.</p>
                ) : (
                  notifications.slice(0, 8).map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                        !item.is_read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setShowNotifications(false)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        {!item.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 ml-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-700">
            {user?.first_name} {user?.last_name} ({user?.role})
          </div>
          <button
            onClick={logout}
            className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
