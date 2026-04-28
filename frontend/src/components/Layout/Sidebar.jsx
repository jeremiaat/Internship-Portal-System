import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const baseMenu = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Internships', href: '/internships' },
  ];

  let menuItems = baseMenu;
  if (user?.role === 'student') {
    menuItems = [...baseMenu, { name: 'Applications', href: '/applications' }, { name: 'Grades', href: '/grades' }];
  } else if (user?.role === 'company') {
    menuItems = [{ name: 'Dashboard', href: '/dashboard' }, { name: 'My Internships', href: '/company/internships' }, { name: 'Applications', href: '/applications' }];
  } else if (user?.role === 'coordinator') {
    menuItems = [...baseMenu, { name: 'Companies', href: '/companies' }, { name: 'Applications', href: '/applications' }, { name: 'Grades', href: '/grades' }];
  } else if (user?.role === 'registrar') {
    menuItems = [...baseMenu, { name: 'Applications', href: '/applications' }, { name: 'Grades', href: '/grades' }];
  }

  return (
    <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
      </div>
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
