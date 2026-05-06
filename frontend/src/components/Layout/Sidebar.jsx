import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  GraduationCap,
  Building2,
  Users,
  ClipboardList,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const iconMap = {
  Dashboard: LayoutDashboard,
  Internships: Briefcase,
  'My Internships': Briefcase,
  Applications: FileText,
  Grades: GraduationCap,
  Companies: Building2,
  Reports: ClipboardList,
  Students: Users,
  'Student Assignments': Users,
};

const Sidebar = ({ isMobileMenuOpen, onCloseMobileMenu }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const baseMenu = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Internships', href: '/internships' },
  ];

  let menuItems = baseMenu;
  if (user?.role === 'student') {
    menuItems = [...baseMenu, { name: 'Applications', href: '/applications' }, { name: 'Grades', href: '/grades' }];
  } else if (user?.role === 'company') {
    menuItems = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'My Internships', href: '/company/internships' },
      { name: 'Applications', href: '/company/applications' },
    ];
  } else if (user?.role === 'coordinator') {
    menuItems = [...baseMenu, { name: 'Companies', href: '/companies' }, { name: 'Applications', href: '/applications' }, { name: 'Grades', href: '/grades' }];
  } else if (user?.role === 'registrar') {
    menuItems = [...baseMenu, { name: 'Applications', href: '/applications' }, { name: 'Grades', href: '/grades' }];
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}
      <aside className={`bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] flex flex-col transition-all duration-300 fixed lg:relative z-50 lg:z-auto
        ${collapsed ? 'w-20' : 'w-64'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {!collapsed && <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</h2>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4 text-gray-500" /> : <ChevronLeft className="w-4 h-4 text-gray-500" />}
          </button>
          <button
            onClick={onCloseMobileMenu}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
            title="Close menu"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.name] || LayoutDashboard;
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onCloseMobileMenu}
                className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={collapsed ? item.name : ''}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-100">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary-600">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
