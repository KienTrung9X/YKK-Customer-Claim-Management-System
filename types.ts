// types.ts

export enum UserRole {
  Admin = 'Admin',
  QcManager = 'QC Manager',
  QcStaff = 'QC Staff',
  DepartmentStaff = 'Department Staff',
  Viewer = 'Viewer',
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  email: string;
  department: string;
}

export enum ClaimSeverity {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum ClaimStatus {
  New = 'Mới',
  InProgress = 'Đang xử lý',
  PendingCustomer = 'Chờ khách hàng',
  Completed = 'Hoàn tất',
}

export interface FishboneCategory {
  id: string;
  name: string;
  causes: string[];
}

export interface FishboneAnalysisData {
  problem: string;
  categories: FishboneCategory[];
}

export interface RootCauseAnalysis {
  analysisMethod: 'Fishbone' | '5 Whys' | 'Other' | '';
  fishboneAnalysis: FishboneAnalysisData;
  fiveWhysAnalysis: string;
  rootCause: string;
  escapePoint: string;
  confirmationEvidence: string;
  attachments: Attachment[];
}

export enum FilterStatus {
    NotFiltered = 'Chưa lọc',
    GettingItems = 'Đang lấy hàng lọc',
    Filtering = 'Đang lọc',
    Filtered = 'Đã lọc',
}

export interface TraceabilityAnalysisItem {
  tableData: string[][]; // First row is header, subsequent rows are data
  filteredDefectCount: number;
  filterStatus: FilterStatus;
  involvedDepartments: string[];
  personInChargeName: string;
  dataRetrievalDate: string | null;
  filteringDate: string | null;
  returnDate: string | null;
  notes: string;
}

export interface TraceabilityAnalysis {
    originalPoLots: TraceabilityAnalysisItem;
    otherPoSameLot: TraceabilityAnalysisItem;
    otherPoSameMaterial: TraceabilityAnalysisItem;
    summary: string;
}

export interface Attachment {
    name: string;
    url: string;
    type: 'image' | 'document';
}

export interface Comment {
    id: string;
    user: User;
    timestamp: string;
    text: string;
}

export interface AppNotification {
  id: string;
  message: string; // Can contain safe HTML (e.g., <strong>)
  timestamp: string;
  isRead: boolean;
  claimId: string;
  userId: string; // ID of the user who performed the action
}

export interface Claim {
  id: string;
  customerName: string;
  orderId: string;
  productCode: string;
  defectType: string;
  quantity: number;
  totalQuantity: number;
  discoveryLocation: string;
  responsibleDepartment: string;
  description: string;
  assignee: User;
  creator: User;
  status: ClaimStatus;
  severity: ClaimSeverity;
  createdAt: string;
  deadline: string;
  attachments: Attachment[];
  comments: Comment[];
  completedPrs: string;
  // 8D Report fields
  containmentActions: string;
  rootCauseAnalysis: RootCauseAnalysis;
  correctiveActions: string;
  preventiveActions: string;
  effectivenessValidation: string;
  closureSummary: string;
  customerConfirmation: boolean;
  traceabilityAnalysis: TraceabilityAnalysis;
}