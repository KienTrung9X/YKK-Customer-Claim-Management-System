// FIX: Create the main App component to manage state and render views.
import React, { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import './i18n';
import { ThemeProvider } from './context/ThemeContext';
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

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info', duration = 3000) => {
        const id = `toast-${Date.now()}`;
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        loadData();
        
        // Thiết lập realtime subscription cho claims và notifications
        const channel = databaseService.supabase
            .channel('realtime-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'claims' },
                (payload) => {
                    console.log('🔄 Claims realtime update:', payload.eventType, payload.new?.id || payload.old?.id);
                    setTimeout(() => loadData(), 500);
                }
            )
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'notifications' },
                (payload) => {
                    console.log('🔔 Notifications realtime update:', payload.eventType);
                    setTimeout(() => loadData(), 500);
                }
            )
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'users' },
                (payload) => {
                    console.log('👤 Users realtime update:', payload.eventType);
                    setTimeout(() => loadData(), 500);
                }
            )
            .subscribe((status) => {
                console.log('📡 Realtime subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Realtime connected successfully');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Realtime connection error');
                }
            });
            
        // Cleanup subscription
        return () => {
            console.log('🔌 Disconnecting realtime subscription');
            channel.unsubscribe();
        };
    }, []);

    const loadData = async () => {
        try {
            console.log('🔄 Loading data from database...');
            const [dbUsers, dbClaims, dbNotifications] = await Promise.all([
                databaseService.getUsers(),
                databaseService.getClaims(),
                databaseService.getNotifications()
            ]);
            console.log('📊 Data loaded:', {
                users: dbUsers.length,
                claims: dbClaims.length, 
                notifications: dbNotifications.length
            });
            
            setUsers(dbUsers.length > 0 ? dbUsers : []);
            setClaims(dbClaims.length > 0 ? dbClaims : []);
            setNotifications(dbNotifications.length > 0 ? dbNotifications : []);
        } catch (error) {
            console.error('❌ Error loading data:', error);
            setUsers([]);
            setClaims([]);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = useCallback((view: string) => {
        if (view === 'reports' && !permissionService.canViewReports(currentUser)) {
            notificationService.notify("Bạn không có quyền truy cập trang báo cáo.", { type: 'error' });
            return;
        }
         if (view === 'settings' && !permissionService.canViewSettings(currentUser)) {
            notificationService.notify("Bạn không có quyền truy cập trang cài đặt.", { type: 'error' });
            return;
        }
        setCurrentView(view);
        setSelectedClaim(null);
    }, [currentUser]);

    const handleClaimSelect = useCallback((claim: Claim) => {
        setSelectedClaim(claim);
        setCurrentView('claimDetail');
    }, []);

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
        const oldConfirmation = oldClaim?.confirmation;
        
        try {
            console.log('Saving claim with attachments:', updatedClaim.attachments);
            await databaseService.updateClaim(updatedClaim);
            console.log('Claim saved successfully');
            
            const newNotifications = activityService.generateNotifications(oldClaim, updatedClaim, currentUser);
            
            // Thêm notification cho thay đổi confirmation
            if (oldConfirmation !== updatedClaim.confirmation) {
                const confirmationMessage = updatedClaim.confirmation === 'OK' 
                    ? `<strong>${currentUser.name}</strong> đã xác nhận claim <strong>${updatedClaim.id}</strong> là <strong>OK</strong> - không tính thống kê`
                    : updatedClaim.confirmation === 'NG' 
                    ? `<strong>${currentUser.name}</strong> đã xác nhận claim <strong>${updatedClaim.id}</strong> là <strong>NG</strong> - tính vào thống kê`
                    : `<strong>${currentUser.name}</strong> đã đặt claim <strong>${updatedClaim.id}</strong> về trạng thái chờ xác nhận`;
                
                const confirmationNotif = {
                    id: `notif-${Date.now()}-confirmation`,
                    message: confirmationMessage,
                    claimId: updatedClaim.id,
                    userId: currentUser.id,
                    isRead: false,
                    timestamp: new Date().toISOString()
                };
                
                newNotifications.push(confirmationNotif);
            }
            
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
            console.error('Error updating claim:', error, error);
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
            return <ClaimDetail claim={selectedClaim} onUpdateClaim={handleUpdateClaim} onBack={handleBackToList} currentUser={currentUser} onAddComment={handleAddComment} showToast={showToast} />;
        }
        switch (currentView) {
            case 'dashboard':
                return <Dashboard key={`dashboard-${claims.length}-${claims.map(c => c.id).join(',')}`} claims={claims} onClaimSelect={handleClaimSelect} />;
            case 'claimsboard':
                return <ClaimsBoard claims={claims} onClaimSelect={handleClaimSelect} onNewClaimClick={() => setIsCreateModalOpen(true)} currentUser={currentUser}/>;
            case 'reports':
                return <ReportsPage notifications={notifications} users={users} claims={claims} onClaimSelect={handleNavigateFromNotif}/>;
            case 'settings':
                return <SettingsPage users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} />;
            default:
                return <Dashboard key={`dashboard-${claims.length}-${claims.map(c => c.id).join(',')}`} claims={claims} onClaimSelect={handleClaimSelect} />;
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <ThemeProvider>
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
        </ThemeProvider>
    );
}

export default App;