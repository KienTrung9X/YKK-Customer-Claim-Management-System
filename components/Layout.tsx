// FIX: Create the Layout component to provide the main application structure.
// FIX: Import `useState` from React to resolve 'Cannot find name' error and fix import syntax.
import React, { useState } from 'react';
import {
  DashboardIcon, ClaimsIcon, ReportsIcon, SettingsIcon, BellIcon, ChevronDownIcon, SunIcon, MoonIcon, CheckCircleIcon
} from './Icons';
import { useTheme } from '../context/ThemeContext';
import { permissionService } from '../services/permissionService';
import { User, AppNotification, Claim } from '../types';
import { NotificationBell } from './NotificationBell';

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-ykk-blue text-white shadow-md'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);


const Sidebar: React.FC<{ onNavigate: (view: string) => void; currentView: string; user: User; isOpen: boolean; onClose: () => void }> = ({ onNavigate, currentView, user, isOpen, onClose }) => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" />, canView: () => true },
      { id: 'claimsboard', label: 'Claims Board', icon: <ClaimsIcon className="w-5 h-5" />, canView: () => true },
      { id: 'reports', label: 'Báo cáo & Phân tích', icon: <ReportsIcon className="w-5 h-5" />, canView: permissionService.canViewReports },
      { id: 'settings', label: 'Cài đặt', icon: <SettingsIcon className="w-5 h-5" />, canView: permissionService.canViewSettings },
    ];

    const handleNavClick = (view: string) => {
      onNavigate(view);
      onClose();
    };
  
    return (
      <>
        {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose}></div>}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="h-16 flex items-center justify-between px-4 border-b dark:border-gray-700">
            <h1 className="text-xl lg:text-2xl font-bold text-ykk-blue">YKK CCMS</h1>
            <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navItems.filter(item => item.canView(user)).map((item) => (
                  <NavLink
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      isActive={currentView === item.id}
                      onClick={() => handleNavClick(item.id)}
                  />
              ))}
          </nav>
        </aside>
      </>
    );
};
  
const Header: React.FC<{ 
    user: User, 
    allUsers: User[], 
    setCurrentUser: (user: User) => void,
    notifications: AppNotification[],
    onMarkAllNotificationsAsRead: () => void,
    onNavigateToClaim: (claim: Claim) => void,
    claims: Claim[],
    onNavigate: (view: string) => void,
    onMenuClick: () => void,
}> = ({ user, allUsers, setCurrentUser, notifications, onMarkAllNotificationsAsRead, onNavigateToClaim, claims, onNavigate, onMenuClick }) => {
    const { theme, toggleTheme } = useTheme();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleUserSelect = (selectedUser: User) => {
        setCurrentUser(selectedUser);
        setUserMenuOpen(false);
    }

    return (
      <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-3 lg:px-6 flex-shrink-0">
        <div className="flex items-center">
            <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 mr-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
        </div>
        <div className="flex items-center space-x-2 lg:space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                {theme === 'light' ? <MoonIcon className="w-4 h-4 lg:w-5 lg:h-5" /> : <SunIcon className="w-4 h-4 lg:w-5 lg:h-5" />}
            </button>
            <NotificationBell 
                notifications={notifications}
                onMarkAllRead={onMarkAllNotificationsAsRead}
                onNavigateToClaim={onNavigateToClaim}
                claims={claims}
                onNavigate={onNavigate}
            />
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 lg:w-9 lg:h-9 rounded-full"
                />
                <div className="hidden md:block ml-2 lg:ml-3 text-sm text-left">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{user.name}</p>
                    <p className="text-gray-500 dark:text-gray-400">{user.role}</p>
                </div>
                <ChevronDownIcon className={`hidden md:block w-4 h-4 ml-2 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border dark:border-gray-700">
                    <div className="p-2 text-xs text-gray-500 dark:text-gray-400">Đăng nhập với vai trò...</div>
                    <div className="max-h-60 overflow-y-auto">
                    {allUsers.map(u => (
                        <button key={u.id} onClick={() => handleUserSelect(u)} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full mr-3" />
                            <div className="flex-1">
                                <div>{u.name}</div>
                                <div className="text-xs text-gray-500">{u.role}</div>
                            </div>
                            {user.id === u.id && <CheckCircleIcon className="w-5 h-5 text-ykk-blue" />}
                        </button>
                    ))}
                    </div>
                </div>
            )}
          </div>
        </div>
      </header>
    );
};

export const Layout: React.FC<{
  children: React.ReactNode;
  onNavigate: (view: string) => void;
  currentView: string;
  user: User;
  allUsers: User[];
  setCurrentUser: (user: User) => void;
  notifications: AppNotification[];
  onMarkAllNotificationsAsRead: () => void;
  onNavigateToClaim: (claim: Claim) => void;
  claims: Claim[];
}> = ({ children, onNavigate, currentView, user, allUsers, setCurrentUser, notifications, onMarkAllNotificationsAsRead, onNavigateToClaim, claims }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
        <Sidebar 
          onNavigate={onNavigate} 
          currentView={currentView} 
          user={user} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          <Header 
            user={user} 
            allUsers={allUsers} 
            setCurrentUser={setCurrentUser} 
            notifications={notifications}
            onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
            onNavigateToClaim={onNavigateToClaim}
            claims={claims}
            onNavigate={onNavigate}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    );
};
