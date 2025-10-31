// FIX: Create the main App component to manage state and render views.
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { Claim, ClaimStatus, User, Comment, AppNotification } from './types';
import { claims as mockClaims, users as mockUsers, currentUser as loggedInUser, mockNotifications } from './data/mockData';
import { emailService } from './services/emailService';
import { notificationService } from './services/notificationService';
import { permissionService } from './services/permissionService';
import { LoadingSpinner } from './components/Loading';
import { activityService } from './services/activityService';
import { databaseService } from './services/databaseService';
import { ToastContainer } from './components/Toast';

// Lazy load page components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const ClaimsBoard = lazy(() => import('./components/ClaimsBoard').then(module => ({ default: module.ClaimsBoard })));
const ClaimDetail = lazy(() => import('./components/ClaimDetail').then(module => ({ default: module.ClaimDetail })));
const CreateClaimModal = lazy(() => import('./components/CreateClaimModal').then(module => ({ default: module.CreateClaimModal })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(module => ({ default: module.SettingsPage })));
const ReportsPage = lazy(() => import('./components/ReportsPage'));


function App() {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User>(loggedInUser);
    const [currentView, setCurrentView] = useState('dashboard'); // dashboard, claimsboard, claimDetail, reports, settings
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info'; duration?: number }>>([]);

    const showToast = (message: string, type: 'success' | 'error' | 'info', duration = 3000) => {
        const id = `toast-${Date.now()}`;
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [dbUsers, dbClaims, dbNotifications] = await Promise.all([
                databaseService.getUsers(),
                databaseService.getClaims(),
                databaseService.getNotifications()
            ]);
            
            if (dbUsers.length === 0) {
                await Promise.all(mockUsers.map(u => databaseService.createUser(u)));
                setUsers(mockUsers);
            } else {
                setUsers(dbUsers);
            }
            
            if (dbClaims.length === 0) {
                await Promise.all(mockClaims.map(c => databaseService.createClaim(c)));
                setClaims(mockClaims);
            } else {
                setClaims(dbClaims);
            }
            
            if (dbNotifications.length === 0) {
                await Promise.all(mockNotifications.map(n => databaseService.createNotification(n)));
                setNotifications(mockNotifications);
            } else {
                setNotifications(dbNotifications);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setUsers(mockUsers);
            setClaims(mockClaims);
            setNotifications(mockNotifications);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (view: string) => {
        if (view === 'reports' && !permissionService.canViewReports(currentUser)) {
            notificationService.notify("Bạn không có quyền truy cập trang báo cáo.", { type: 'error' });
            return;
        }
         if (view === 'settings' && !permissionService.canViewSettings(currentUser)) {
            notificationService.notify("Bạn không có quyền truy cập trang cài đặt.", { type: 'error' });
            return;
        }
        setCurrentView(view);
        setSelectedClaim(null); // Reset selected claim on navigation
    };

    const handleClaimSelect = (claim: Claim) => {
        setSelectedClaim(claim);
        setCurrentView('claimDetail');
    };

    const handleNavigateFromNotif = (claim: Claim) => {
        // Mark notifications related to this claim as read
        setNotifications(prev => prev.map(n => n.claimId === claim.id ? {...n, isRead: true} : n));
        handleClaimSelect(claim);
    };

    const handleBackToList = () => {
        setSelectedClaim(null);
        setCurrentView('claimsboard');
    };

    const handleUpdateClaim = async (updatedClaim: Claim) => {
        const oldClaim = claims.find(c => c.id === updatedClaim.id);
        if (!oldClaim) return;
        
        const oldStatus = oldClaim?.status;
        
        try {
            await databaseService.updateClaim(updatedClaim);
            
            const newNotifications = activityService.generateNotifications(oldClaim, updatedClaim, currentUser);
            if (newNotifications.length > 0) {
                await Promise.all(newNotifications.map(n => databaseService.createNotification(n)));
                setNotifications(prev => [...newNotifications, ...prev]);
            }

            setClaims(prevClaims => prevClaims.map(c => c.id === updatedClaim.id ? updatedClaim : c));
            setSelectedClaim(updatedClaim);
            showToast(`Claim ${updatedClaim.id} đã được lưu thành công!`, 'success');
            notificationService.notify(`Claim ${updatedClaim.id} đã được cập nhật.`, { type: 'success', duration: 3000 });

            if (oldStatus && oldStatus !== updatedClaim.status) {
                emailService.sendStatusUpdateNotification(updatedClaim, oldStatus);
            }
        } catch (error) {
            console.error('Error updating claim:', error);
            showToast('Lỗi khi lưu claim', 'error');
            notificationService.notify('Lỗi khi cập nhật claim', { type: 'error', duration: 3000 });
        }
    };
    
    const handleAddComment = async (claimId: string, text: string) => {
        const newComment: Comment = {
            id: `comment-${Date.now()}`,
            user: currentUser,
            timestamp: new Date().toISOString(),
            text,
        };
        
        try {
            await databaseService.createComment(claimId, newComment);
            
            const updatedClaims = claims.map(claim => {
                if (claim.id === claimId) {
                    return { ...claim, comments: [...claim.comments, newComment] };
                }
                return claim;
            });
            setClaims(updatedClaims);

            const updatedSelectedClaim = updatedClaims.find(c => c.id === claimId);
            if (updatedSelectedClaim) {
                setSelectedClaim(updatedSelectedClaim);
            }
            
            const newNotif: AppNotification = {
                id: `notif-${Date.now()}`,
                message: `<strong>${currentUser.name}</strong> đã thêm một bình luận vào claim <strong>${claimId}</strong>.`,
                claimId,
                userId: currentUser.id,
                isRead: false,
                timestamp: new Date().toISOString()
            };
            await databaseService.createNotification(newNotif);
            setNotifications(prev => [newNotif, ...prev]);
        } catch (error) {
            console.error('Error adding comment:', error);
            notificationService.notify('Lỗi khi thêm bình luận', { type: 'error', duration: 3000 });
        }
    };

    const handleCreateClaim = async (newClaimData: Omit<Claim, 'id' | 'createdAt' | 'status' | 'creator' | 'comments'>) => {
        const newClaim: Claim = {
            ...newClaimData,
            id: `CLM-${String(claims.length + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString(),
            status: ClaimStatus.New,
            creator: currentUser,
            comments: [],
        };
        
        try {
            await databaseService.createClaim(newClaim);
            setClaims(prev => [newClaim, ...prev]);
            setIsCreateModalOpen(false);
            showToast(`Claim ${newClaim.id} đã được tạo thành công!`, 'success');
            notificationService.notify(`Claim mới ${newClaim.id} đã được tạo.`, { type: 'success', duration: 3000 });
            emailService.sendNewClaimNotification(newClaim);

            const newNotif: AppNotification = {
                id: `notif-${Date.now()}`,
                message: `Claim mới <strong>${newClaim.id}</strong> đã được tạo bởi <strong>${currentUser.name}</strong>.`,
                claimId: newClaim.id,
                userId: currentUser.id,
                isRead: false,
                timestamp: new Date().toISOString()
            };
            await databaseService.createNotification(newNotif);
            setNotifications(prev => [newNotif, ...prev]);
        } catch (error) {
            console.error('Error creating claim:', error);
            showToast('Lỗi khi tạo claim', 'error');
            notificationService.notify('Lỗi khi tạo claim', { type: 'error', duration: 3000 });
        }
    };
    
    const handleMarkAllNotificationsAsRead = async () => {
        try {
            await databaseService.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({...n, isRead: true})));
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const handleAddUser = async (user: User) => {
        try {
            await databaseService.createUser(user);
            setUsers(prev => [...prev, user]);
            notificationService.notify(`Người dùng ${user.name} đã được thêm.`, { type: 'success', duration: 3000 });
        } catch (error) {
            console.error('Error adding user:', error);
            notificationService.notify('Lỗi khi thêm người dùng', { type: 'error', duration: 3000 });
        }
    };

    const handleUpdateUser = async (user: User) => {
        try {
            await databaseService.updateUser(user);
            setUsers(prev => prev.map(u => u.id === user.id ? user : u));
            notificationService.notify(`Thông tin người dùng ${user.name} đã được cập nhật.`, { type: 'success', duration: 3000 });
        } catch (error) {
            console.error('Error updating user:', error);
            notificationService.notify('Lỗi khi cập nhật người dùng', { type: 'error', duration: 3000 });
        }
    };

    const renderContent = () => {
        if (selectedClaim && currentView === 'claimDetail') {
            return <ClaimDetail claim={selectedClaim} onUpdateClaim={handleUpdateClaim} onBack={handleBackToList} currentUser={currentUser} onAddComment={handleAddComment} />;
        }
        switch (currentView) {
            case 'dashboard':
                return <Dashboard claims={claims} onClaimSelect={handleClaimSelect} />;
            case 'claimsboard':
                return <ClaimsBoard claims={claims} onClaimSelect={handleClaimSelect} onNewClaimClick={() => setIsCreateModalOpen(true)} currentUser={currentUser}/>;
            case 'reports':
                return <ReportsPage notifications={notifications} users={users} claims={claims} onClaimSelect={handleNavigateFromNotif}/>;
            case 'settings':
                return <SettingsPage users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} />;
            default:
                return <Dashboard claims={claims} onClaimSelect={handleClaimSelect} />;
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="app">
            <Layout 
                onNavigate={handleNavigate} 
                currentView={currentView} 
                user={currentUser} 
                allUsers={users} 
                setCurrentUser={setCurrentUser}
                notifications={notifications}
                onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
                onNavigateToClaim={handleNavigateFromNotif}
                claims={claims}
            >
                <Suspense fallback={<LoadingSpinner />}>
                    {renderContent()}
                </Suspense>
            </Layout>
            <Suspense fallback={null}>
              {isCreateModalOpen && <CreateClaimModal onClose={() => setIsCreateModalOpen(false)} onCreateClaim={handleCreateClaim} />}
            </Suspense>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}

export default App;