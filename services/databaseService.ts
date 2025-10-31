import { supabase } from './supabaseClient';
import { Claim, User, Comment, AppNotification } from '../types';

export const databaseService = {
  // Users
  async getUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data as User[];
  },

  async createUser(user: User) {
    const { data, error } = await supabase.from('users').insert([{
      id: user.id,
      name: user.name,
      avatar_url: user.avatarUrl,
      role: user.role,
      email: user.email,
      department: user.department
    }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateUser(user: User) {
    const { data, error } = await supabase.from('users').update({
      name: user.name,
      avatar_url: user.avatarUrl,
      role: user.role,
      email: user.email,
      department: user.department
    }).eq('id', user.id).select().single();
    if (error) throw error;
    return data;
  },

  // Claims
  async getClaims() {
    const { data, error } = await supabase.from('claims').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    const users = await this.getUsers();
    const comments = await this.getComments();
    
    return data.map(claim => ({
      id: claim.id,
      customerName: claim.customer_name,
      orderId: claim.order_id,
      productCode: claim.product_code,
      defectType: claim.defect_type,
      quantity: claim.quantity,
      totalQuantity: claim.total_quantity,
      discoveryLocation: claim.discovery_location,
      responsibleDepartment: claim.responsible_department,
      description: claim.description,
      assignee: users.find(u => u.id === claim.assignee_id)!,
      creator: users.find(u => u.id === claim.creator_id)!,
      status: claim.status,
      severity: claim.severity,
      createdAt: claim.created_at,
      deadline: claim.deadline,
      attachments: claim.attachments || [],
      comments: comments.filter(c => c.claimId === claim.id),
      containmentActions: claim.containment_actions || '',
      rootCauseAnalysis: claim.root_cause_analysis || {},
      correctiveActions: claim.corrective_actions || '',
      preventiveActions: claim.preventive_actions || '',
      effectivenessValidation: claim.effectiveness_validation || '',
      closureSummary: claim.closure_summary || '',
      customerConfirmation: claim.customer_confirmation || false,
      completedPrs: claim.completed_prs || '',
      traceabilityAnalysis: claim.traceability_analysis || {}
    })) as Claim[];
  },

  async createClaim(claim: Claim) {
    const { data, error } = await supabase.from('claims').insert([{
      id: claim.id,
      customer_name: claim.customerName,
      order_id: claim.orderId,
      product_code: claim.productCode,
      defect_type: claim.defectType,
      quantity: claim.quantity,
      total_quantity: claim.totalQuantity,
      discovery_location: claim.discoveryLocation,
      responsible_department: claim.responsibleDepartment,
      description: claim.description,
      assignee_id: claim.assignee.id,
      creator_id: claim.creator.id,
      status: claim.status,
      severity: claim.severity,
      deadline: claim.deadline,
      root_cause_analysis: claim.rootCauseAnalysis,
      traceability_analysis: claim.traceabilityAnalysis
    }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateClaim(claim: Claim) {
    const { data, error } = await supabase.from('claims').update({
      status: claim.status,
      assignee_id: claim.assignee.id,
      containment_actions: claim.containmentActions,
      corrective_actions: claim.correctiveActions,
      preventive_actions: claim.preventiveActions,
      root_cause_analysis: claim.rootCauseAnalysis,
      traceability_analysis: claim.traceabilityAnalysis,
      effectiveness_validation: claim.effectivenessValidation,
      closure_summary: claim.closureSummary,
      customer_confirmation: claim.customerConfirmation,
      completed_prs: claim.completedPrs,
      attachments: claim.attachments
    }).eq('id', claim.id).select().single();
    if (error) throw error;
    return data;
  },

  // Comments
  async getComments() {
    const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    
    const users = await this.getUsers();
    
    return data.map(comment => ({
      id: comment.id,
      claimId: comment.claim_id,
      user: users.find(u => u.id === comment.user_id)!,
      timestamp: comment.created_at,
      text: comment.text
    })) as (Comment & { claimId: string })[];
  },

  async createComment(claimId: string, comment: Comment) {
    const { data, error } = await supabase.from('comments').insert([{
      id: comment.id,
      claim_id: claimId,
      user_id: comment.user.id,
      text: comment.text
    }]).select().single();
    if (error) throw error;
    return data;
  },

  // Notifications
  async getNotifications() {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    return data.map(notif => ({
      id: notif.id,
      message: notif.message,
      claimId: notif.claim_id,
      userId: notif.user_id,
      isRead: notif.is_read,
      timestamp: notif.created_at
    })) as AppNotification[];
  },

  async createNotification(notification: AppNotification) {
    const { data, error } = await supabase.from('notifications').insert([{
      id: notification.id,
      message: notification.message,
      claim_id: notification.claimId,
      user_id: notification.userId,
      is_read: notification.isRead
    }]).select().single();
    if (error) throw error;
    return data;
  },

  async markAllNotificationsAsRead() {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    if (error) throw error;
  }
};
