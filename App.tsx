// FIX: Create the main App component to manage state and render views.
import React, { useState, Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { Claim, ClaimStatus, User, Comment, AppNotification } from './types';
import { claims as mockClaims, users as mockUsers, currentUser as loggedInUser, mockNotifications } from './data/mockData';
import { emailService } from './services/emailService';
import { notificationService } from './services/notificationService';
import { permissionService } from './services/permissionService';
import { LoadingSpinner } from './components/Loading';
import { activityService } from './services/activityService';

// Lazy load page components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const ClaimsBoard = lazy(() => import('./components/ClaimsBoard').then(module => ({ default: module.ClaimsBoard })));
const ClaimDetail = lazy(() => import('./components/ClaimDetail').then(module => ({ default: module.ClaimDetail })));
const CreateClaimModal = lazy(() => import('./components/CreateClaimModal').then(module => ({ default: module.CreateClaimModal })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(module => ({ default: module.SettingsPage })));
const ReportsPage = lazy(() => import('./components/ReportsPage'));


function App() {
    const [claims, setClaims] = useState<Claim[]>(mockClaims);
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [currentUser, setCurrentUser] = useState<User>(loggedInUser);
    const [currentView, setCurrentView] = useState('dashboard'); // dashboard, claimsboard, claimDetail, reports, settings
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);

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

    const handleUpdateClaim = (updatedClaim: Claim) => {
        const oldClaim = claims.find(c => c.id === updatedClaim.id);
        if (!oldClaim) return;
        
        const oldStatus = oldClaim?.status;
        
        // Generate notifications from changes
        const newNotifications = activityService.generateNotifications(oldClaim, updatedClaim, currentUser);
        if (newNotifications.length > 0) {
            setNotifications(prev => [...newNotifications, ...prev]);
        }

        setClaims(prevClaims => prevClaims.map(c => c.id === updatedClaim.id ? updatedClaim : c));
        setSelectedClaim(updatedClaim); // Update the selected claim view as well
        notificationService.notify(`Claim ${updatedClaim.id} đã được cập nhật.`, { type: 'success', duration: 3000 });

        if (oldStatus && oldStatus !== updatedClaim.status) {
            emailService.sendStatusUpdateNotification(updatedClaim, oldStatus);
        }
    };
    
    const handleAddComment = (claimId: string, text: string) => {
        const newComment: Comment = {
            id: `comment-${Date.now()}`,
            user: currentUser,
            timestamp: new Date().toISOString(),
            text,
        };
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
        
        // Add notification for new comment
        const newNotif: AppNotification = {
            id: `notif-${Date.now()}`,
            message: `<strong>${currentUser.name}</strong> đã thêm một bình luận vào claim <strong>${claimId}</strong>.`,
            claimId,
            userId: currentUser.id,
            isRead: false,
            timestamp: new Date().toISOString()
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const handleCreateClaim = (newClaimData: Omit<Claim, 'id' | 'createdAt' | 'status' | 'creator' | 'comments'>) => {
        const newClaim: Claim = {
            ...newClaimData,
            id: `CLM-${String(claims.length + 1).padStart(3, '0')}`,
            createdAt: new Date().toISOString(),
            status: ClaimStatus.New,
            creator: currentUser,
            comments: [],
        };
        setClaims(prev => [newClaim, ...prev]);
        setIsCreateModalOpen(false);
        notificationService.notify(`Claim mới ${newClaim.id} đã được tạo.`, { type: 'success', duration: 3000 });
        emailService.sendNewClaimNotification(newClaim);

        // Add notification for new claim
         const newNotif: AppNotification = {
            id: `notif-${Date.now()}`,
            message: `Claim mới <strong>${newClaim.id}</strong> đã được tạo bởi <strong>${currentUser.name}</strong>.`,
            claimId: newClaim.id,
            userId: currentUser.id,
            isRead: false,
            timestamp: new Date().toISOString()
        };
        setNotifications(prev => [newNotif, ...prev]);
    };
    
    const handleMarkAllNotificationsAsRead = () => {
        setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    };

    const handleAddUser = (user: User) => {
        setUsers(prev => [...prev, user]);
        notificationService.notify(`Người dùng ${user.name} đã được thêm.`, { type: 'success', duration: 3000 });
    };

    const handleUpdateUser = (user: User) => {
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        notificationService.notify(`Thông tin người dùng ${user.name} đã được cập nhật.`, { type: 'success', duration: 3000 });
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
        </div>
    );
}

export default App;