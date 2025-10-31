import React from 'react';
import { AppNotification, User, Claim } from '../types';
import { FileTextIcon } from './Icons';
import { getTimeLeft } from '../utils/time';

interface ReportsPageProps {
    notifications: AppNotification[];
    users: User[];
    claims: Claim[];
    onClaimSelect: (claim: Claim) => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ notifications, users, claims, onClaimSelect }) => {
    
    const findUser = (userId: string) => users.find(u => u.id === userId);
    const findClaim = (claimId: string) => claims.find(c => c.id === claimId);

    const handleNotificationClick = (claimId: string) => {
        const claim = findClaim(claimId);
        if (claim) {
            onClaimSelect(claim);
        }
    };
    
    return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Báo cáo & Phân tích</h2>
        <p className="text-gray-500 dark:text-gray-400">Xem lại toàn bộ lịch sử hoạt động và các thay đổi trong hệ thống.</p>
        
        <div className="mt-6 flow-root">
            <ul role="list" className="-mb-8">
                 {notifications.map((notification, notificationIdx) => {
                     const user = findUser(notification.userId);
                     const isLast = notificationIdx === notifications.length - 1;

                     return (
                        <li key={notification.id}>
                            <div className="relative pb-8">
                                {!isLast ? (
                                    <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex items-start space-x-4">
                                     <div>
                                        <div className="relative px-1">
                                            <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-full ring-8 ring-white dark:ring-gray-800 flex items-center justify-center">
                                                {user ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full" /> : <FileTextIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1 py-1.5">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            <p
                                                dangerouslySetInnerHTML={{ __html: notification.message }}
                                                className="cursor-pointer hover:underline"
                                                onClick={() => handleNotificationClick(notification.claimId)}
                                            />
                                        </div>
                                         <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                            <time dateTime={notification.timestamp}>{new Date(notification.timestamp).toLocaleString('vi-VN')}</time>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                     );
                 })}
            </ul>
        </div>
    </div>
    )
};

export default ReportsPage;