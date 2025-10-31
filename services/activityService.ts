// services/activityService.ts
import { Claim, User, AppNotification } from '../types';

// Helper to avoid notifying about empty field updates
const isMeaningfulUpdate = (oldValue: any, newValue: any): boolean => {
    return oldValue !== newValue && newValue !== '';
};

export const activityService = {
  generateNotifications: (oldClaim: Claim, newClaim: Claim, actor: User): AppNotification[] => {
    const notifications: AppNotification[] = [];
    const timestamp = new Date().toISOString();

    const createNotification = (message: string): AppNotification => ({
        id: `notif-${Date.now()}-${Math.random()}`,
        message,
        claimId: newClaim.id,
        userId: actor.id,
        isRead: false,
        timestamp,
    });

    if (oldClaim.status !== newClaim.status) {
        notifications.push(createNotification(
            `<strong>${actor.name}</strong> đã cập nhật <strong>trạng thái</strong> của claim <strong>${newClaim.id}</strong> từ "<em>${oldClaim.status}</em>" thành "<em>${newClaim.status}</em>".`
        ));
    }
    if (oldClaim.assignee.id !== newClaim.assignee.id) {
        notifications.push(createNotification(
             `<strong>${actor.name}</strong> đã gán claim <strong>${newClaim.id}</strong> cho <strong>${newClaim.assignee.name}</strong>.`
        ));
    }
    if (isMeaningfulUpdate(oldClaim.containmentActions, newClaim.containmentActions)) {
        notifications.push(createNotification(
            `<strong>${actor.name}</strong> đã cập nhật <strong>Hành động ngăn chặn (D3)</strong> cho claim <strong>${newClaim.id}</strong>.`
        ));
    }
    if (isMeaningfulUpdate(oldClaim.rootCauseAnalysis.rootCause, newClaim.rootCauseAnalysis.rootCause)) {
         notifications.push(createNotification(
            `<strong>${actor.name}</strong> đã cập nhật <strong>Nguyên nhân gốc rễ (D4)</strong> cho claim <strong>${newClaim.id}</strong>.`
        ));
    }
    if (isMeaningfulUpdate(oldClaim.correctiveActions, newClaim.correctiveActions)) {
        notifications.push(createNotification(
            `<strong>${actor.name}</strong> đã cập nhật <strong>Hành động khắc phục (D5)</strong> cho claim <strong>${newClaim.id}</strong>.`
        ));
    }
     if (isMeaningfulUpdate(oldClaim.preventiveActions, newClaim.preventiveActions)) {
        notifications.push(createNotification(
            `<strong>${actor.name}</strong> đã cập nhật <strong>Hành động phòng ngừa (D6)</strong> cho claim <strong>${newClaim.id}</strong>.`
        ));
    }
    if (oldClaim.customerConfirmation !== newClaim.customerConfirmation && newClaim.customerConfirmation) {
        notifications.push(createNotification(
            `<strong>${actor.name}</strong> đã xác nhận claim <strong>${newClaim.id}</strong> đã được <strong>khách hàng đồng ý</strong>.`
        ));
    }
    
    return notifications;
  }
};