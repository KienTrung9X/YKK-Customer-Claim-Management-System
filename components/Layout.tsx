// FIX: Create the Layout component to provide the main application structure.
import React, { useState } from 'react';
import {
  DashboardIcon, ClaimsIcon, ReportsIcon, SettingsIcon, BellIcon, ChevronDownIcon, SunIcon, MoonIcon, CheckCircleIcon
} from './Icons';
import { useTheme } from '../context/ThemeContext';
import { permissionService } from '../services/permissionService';
import { User } from '../types';

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


const Sidebar: React.FC<{ onNavigate: (view: string) => void; currentView: string; user: User }> = ({ onNavigate, currentView, user }) => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" />, canView: () => true },
      { id: 'claimsboard', label: 'Claims Board', icon: <ClaimsIcon className="w-5 h-5" />, canView: () => true },
      { id: 'reports', label: 'Báo cáo', icon: <ReportsIcon className="w-5 h-5" />, canView: permissionService.canViewReports },
      { id: 'settings', label: 'Cài đặt', icon: <SettingsIcon className="w-5 h-5" />, canView: permissionService.canViewSettings },
    ];
  
    return (
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b dark:border-gray-700">
          <h1 className="text-2xl font-bold text-ykk-blue">YKK CCMS</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.filter(item => item.canView(user)).map((item) => (
                <NavLink
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={currentView === item.id}
                    onClick={() => onNavigate(item.id)}
                />
            ))}
        </nav>
      </aside>
    );
};
  
const Header: React.FC<{ user: User, allUsers: User[], setCurrentUser: (user: User) => void }> = ({ user, allUsers, setCurrentUser }) => {
    const { theme, toggleTheme } = useTheme();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleUserSelect = (selectedUser: User) => {
        setCurrentUser(selectedUser);
        setUserMenuOpen(false);
    }

    return (
      <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center">
            {/* Search can be implemented later */}
        </div>
        <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
          <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-full"
                />
                <div className="ml-3 text-sm text-left">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{user.name}</p>
                    <p className="text-gray-500 dark:text-gray-400">{user.role}</p>
                </div>
                <ChevronDownIcon className={`w-4 h-4 ml-2 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
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
}> = ({ children, onNavigate, currentView, user, allUsers, setCurrentUser }) => {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
        <Sidebar onNavigate={onNavigate} currentView={currentView} user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} allUsers={allUsers} setCurrentUser={setCurrentUser} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    );
};