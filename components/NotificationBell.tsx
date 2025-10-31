// components/NotificationBell.tsx
import React, { useState, useRef, useEffect } from 'react';
import { AppNotification, Claim } from '../types';
import { BellIcon, CheckBadgeIcon } from './Icons';
import { getTimeLeft } from '../utils/time';

interface NotificationBellProps {
    notifications: AppNotification[];
    onMarkAllRead: () => void;
    onNavigateToClaim: (claim: Claim) => void;
    claims: Claim[];
    onNavigate: (view: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onMarkAllRead, onNavigateToClaim, claims, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const recentNotifications = notifications.slice(0, 7);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => setIsOpen(prev => !prev);

    const handleNotificationClick = (notification: AppNotification) => {
        const claim = claims.find(c => c.id === notification.claimId);
        if (claim) {
            onNavigateToClaim(claim);
        }
        setIsOpen(false);
    };

    const handleViewAllClick = () => {
        onNavigate('reports');
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={toggleDropdown} className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border dark:border-gray-700">
                    <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">Thông báo</h4>
                        {unreadCount > 0 && (
                            <button onClick={onMarkAllRead} className="text-xs font-medium text-ykk-blue hover:underline">
                                Đánh dấu đã đọc tất cả
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {recentNotifications.length > 0 ? (
                            recentNotifications.map(notification => (
                                <div 
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`flex items-start p-3 space-x-3 transition-colors cursor-pointer ${!notification.isRead ? 'bg-ykk-blue/5 dark:bg-ykk-blue/10 hover:bg-ykk-blue/10 dark:hover:bg-ykk-blue/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                                >
                                    {!notification.isRead && <div className="w-2 h-2 mt-1.5 bg-ykk-blue rounded-full flex-shrink-0"></div>}
                                    <div className={`flex-1 ${notification.isRead ? 'pl-5' : ''}`}>
                                        <p className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{__html: notification.message}}></p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(notification.timestamp).toLocaleString('vi-VN')}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                Không có thông báo nào.
                            </div>
                        )}
                    </div>
                    <div className="p-2 border-t dark:border-gray-700 text-center">
                        <button onClick={handleViewAllClick} className="w-full text-sm font-medium text-ykk-blue hover:underline p-1 rounded-md">
                            Xem tất cả hoạt động
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};