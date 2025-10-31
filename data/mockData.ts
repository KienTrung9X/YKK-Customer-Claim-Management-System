import { User, Claim, ClaimSeverity, ClaimStatus, FishboneAnalysisData, TraceabilityAnalysis, RootCauseAnalysis, UserRole, FilterStatus, AppNotification } from '../types';

export const users: User[] = [
    { id: 'user-1', name: 'Nguyễn Văn An', avatarUrl: 'https://api.dicebear.com/8.x/micah/svg?seed=An', role: UserRole.QcManager, email: 'an.nguyen@ykk.com', department: 'QC' },
    { id: 'user-2', name: 'Trần Thị Bích', avatarUrl: 'https://api.dicebear.com/8.x/micah/svg?seed=Bich', role: UserRole.QcStaff, email: 'bich.tran@ykk.com', department: 'QC' },
    { id: 'user-3', name: 'Lê Minh Cường', avatarUrl: 'https://api.dicebear.com/8.x/micah/svg?seed=Cuong', role: UserRole.DepartmentStaff, email: 'cuong.le@ykk.com', department: 'Weaving' },
    { id: 'user-4', name: 'Phạm Thị Dung', avatarUrl: 'https://api.dicebear.com/8.x/micah/svg?seed=Dung', role: UserRole.DepartmentStaff, email: 'dung.pham@ykk.com', department: 'Dyeing' },
    { id: 'user-5', name: 'Hoàng Văn E', avatarUrl: 'https://api.dicebear.com/8.x/micah/svg?seed=E', role: UserRole.Admin, email: 'e.hoang@ykk.com', department: 'Admin' },
    { id: 'user-6', name: 'Vũ Thị F', avatarUrl: 'https://api.dicebear.com/8.x/micah/svg?seed=F', role: UserRole.Viewer, email: 'f.vu@ykk.com', department: 'N/A' },
    { id: 'user-7', name: 'Đặng Văn G', avatarUrl: 'https://api.dicebear.com/8.x/micah/svg?seed=G', role: UserRole.DepartmentStaff, email: 'g.dang@ykk.com', department: 'Shipping' },
];

export const currentUser: User = users[4]; // Logged in as Admin by default now

export const createDefaultFishboneData = (): FishboneAnalysisData => ({
    problem: '',
    categories: [
        { id: 'man', name: 'Con người', causes: [] },
        { id: 'machine', name: 'Máy móc', causes: [] },
        { id: 'method', name: 'Phương pháp', causes: [] },
        { id: 'material', name: 'Nguyên vật liệu', causes: [] },
        { id: 'measurement', name: 'Đo lường', causes: [] },
        { id: 'environment', name: 'Môi trường', causes: [] },
    ],
});

const defaultTraceability: TraceabilityAnalysis = {
    originalPoLots: { tableData: [], involvedDepartments: [], personInChargeName: '', dataRetrievalDate: null, filteringDate: null, returnDate: null, filteredDefectCount: 0, filterStatus: FilterStatus.NotFiltered, notes: '' },
    otherPoSameLot: { tableData: [], involvedDepartments: [], personInChargeName: '', dataRetrievalDate: null, filteringDate: null, returnDate: null, filteredDefectCount: 0, filterStatus: FilterStatus.NotFiltered, notes: '' },
    otherPoSameMaterial: { tableData: [], involvedDepartments: [], personInChargeName: '', dataRetrievalDate: null, filteringDate: null, returnDate: null, filteredDefectCount: 0, filterStatus: FilterStatus.NotFiltered, notes: '' },
    summary: 'Chưa có thông tin'
};

const defaultRootCauseAnalysis: RootCauseAnalysis = {
    analysisMethod: '',
    fishboneAnalysis: createDefaultFishboneData(),
    fiveWhysAnalysis: '',
    rootCause: '',
    escapePoint: '',
    confirmationEvidence: '',
    attachments: [],
};

// Helper functions for dates
const daysAgo = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

const daysFromNow = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};


export const claims: Claim[] = [
    {
        id: 'CLM-001',
        customerName: 'Công ty ABC',
        orderId: 'PO-12345',
        productCode: 'YK-Z-5C-N',
        defectType: 'Lỗi màu sắc',
        quantity: 50,
        totalQuantity: 1000,
        discoveryLocation: 'Xưởng khách hàng',
        responsibleDepartment: 'Dyeing',
        description: 'Sản phẩm có màu sắc không đồng đều, loang lổ. Khách hàng yêu cầu kiểm tra lại toàn bộ lô hàng.',
        assignee: users[3], // Pham Thi Dung - Dyeing
        creator: users[0],
        status: ClaimStatus.InProgress,
        severity: ClaimSeverity.High,
        createdAt: daysAgo(3).toISOString(),
        deadline: daysFromNow(5).toISOString(),
        attachments: [
            { name: 'product_image_1.jpg', url: 'https://picsum.photos/seed/clm001-1/400/300', type: 'image' },
            { name: 'product_image_2.jpg', url: 'https://picsum.photos/seed/clm001-2/400/300', type: 'image' }
        ],
        comments: [
            { id: 'comment-1', user: users[0], timestamp: daysAgo(3).toISOString(), text: 'Dung, phòng Nhuộm xử lý case này nhé. Cần gấp!' },
            { id: 'comment-2', user: users[3], timestamp: daysAgo(2).toISOString(), text: 'Vâng sếp, em đã nhận được thông tin và sẽ tiến hành kiểm tra ngay.' },
        ],
        containmentActions: 'Đã cô lập lô hàng nghi ngờ tại kho. Liên hệ khách hàng để thu hồi sản phẩm lỗi.',
        rootCauseAnalysis: defaultRootCauseAnalysis,
        correctiveActions: 'Chưa xác định',
        preventiveActions: 'Chưa xác định',
        effectivenessValidation: 'Chưa xác định',
        closureSummary: '',
        customerConfirmation: false,
        completedPrs: '',
        traceabilityAnalysis: {
            originalPoLots: { 
                tableData: [
                    ['Mã Lô', 'Ngày SX', 'Máy', 'Số Lượng', 'Ghi Chú'],
                    ['LOT-A123', '2023-10-20', 'M-05', '500', 'Kiểm tra OK'],
                    ['LOT-A124', '2023-10-21', 'M-05', '500', 'Lô nghi ngờ']
                ], 
                involvedDepartments: ['QC', 'Kho'],
                personInChargeName: 'Lê Minh Cường',
                dataRetrievalDate: '2023-10-27',
                filteringDate: '2023-10-28',
                returnDate: null,
                filteredDefectCount: 5,
                filterStatus: FilterStatus.Filtering,
                notes: 'Lô A124 cần được ưu tiên kiểm tra trước do nghi ngờ cao.',
            },
            otherPoSameLot: { tableData: [], involvedDepartments: [], personInChargeName: '', dataRetrievalDate: null, filteringDate: null, returnDate: null, filteredDefectCount: 0, filterStatus: FilterStatus.NotFiltered, notes: '' },
            otherPoSameMaterial: { tableData: [], involvedDepartments: [], personInChargeName: '', dataRetrievalDate: null, filteringDate: null, returnDate: null, filteredDefectCount: 0, filterStatus: FilterStatus.NotFiltered, notes: '' },
            summary: 'Lô LOT-A124 có vấn đề, cần kiểm tra lại các PO liên quan.'
        },
    },
    {
        id: 'CLM-002',
        customerName: 'Tập đoàn XYZ',
        orderId: 'PO-67890',
        productCode: 'YK-V-3A-B',
        defectType: 'Lỗi độ bền',
        quantity: 15,
        totalQuantity: 500,
        discoveryLocation: 'Trong quá trình sử dụng',
        responsibleDepartment: 'Weaving',
        description: 'Khóa kéo bị gãy răng sau vài lần sử dụng. Khách hàng phàn nàn về chất lượng sản phẩm.',
        assignee: users[2], // Le Minh Cuong - Weaving
        creator: users[0],
        status: ClaimStatus.New,
        severity: ClaimSeverity.Critical,
        createdAt: daysAgo(1).toISOString(),
        deadline: daysFromNow(2).toISOString(),
        attachments: [
            { name: 'broken_zipper.png', url: 'https://picsum.photos/seed/clm002-1/400/300', type: 'image' }
        ],
        comments: [],
        containmentActions: '',
        rootCauseAnalysis: defaultRootCauseAnalysis,
        correctiveActions: '',
        preventiveActions: '',
        effectivenessValidation: '',
        closureSummary: '',
        customerConfirmation: false,
        completedPrs: '',
        traceabilityAnalysis: defaultTraceability,
    },
    {
        id: 'CLM-003',
        customerName: 'Xưởng may Thời Trang',
        orderId: 'PO-54321',
        productCode: 'YK-C-4D-G',
        defectType: 'Sai kích thước',
        quantity: 120,
        totalQuantity: 2500,
        discoveryLocation: 'Kiểm tra đầu vào',
        responsibleDepartment: 'Sewing',
        description: 'Chiều dài dây kéo không đúng theo yêu cầu kỹ thuật, ngắn hơn 0.5cm.',
        assignee: users[1], // QC Staff
        creator: users[0],
        status: ClaimStatus.Completed,
        severity: ClaimSeverity.Medium,
        createdAt: daysAgo(40).toISOString(),
        deadline: daysAgo(35).toISOString(),
        attachments: [
            { name: 'tech_spec.pdf', url: '#', type: 'document' }
        ],
        comments: [],
        containmentActions: 'Đã thu hồi và thay thế lô hàng mới cho khách hàng.',
        rootCauseAnalysis: {
            ...defaultRootCauseAnalysis,
            rootCause: 'Nhân viên cài đặt thông số máy cắt sai.',
            attachments: [],
        },
        correctiveActions: 'Đào tạo lại nhân viên vận hành máy cắt. Thực hiện kiểm tra chéo thông số trước khi sản xuất hàng loạt.',
        preventiveActions: 'Cập nhật quy trình kiểm tra, thêm bước xác nhận thông số bởi trưởng ca.',
        effectivenessValidation: 'Kiểm tra 5 lô hàng tiếp theo, không phát hiện lỗi tương tự.',
        closureSummary: 'Vấn đề đã được giải quyết triệt để. Khách hàng hài lòng với phương án xử lý.',
        customerConfirmation: true,
        completedPrs: 'PR-5543, PR-5544',
        traceabilityAnalysis: defaultTraceability,
    },
    {
        id: 'CLM-004',
        customerName: 'Công ty May Mặc Việt',
        orderId: 'PO-11223',
        productCode: 'YK-Z-5C-N',
        defectType: 'Bề mặt trầy xước',
        quantity: 200,
        totalQuantity: 3000,
        discoveryLocation: 'QC khách hàng',
        responsibleDepartment: 'Shipping',
        description: 'Nhiều sản phẩm bị trầy xước trên bề mặt con trượt khóa kéo.',
        assignee: users[6], // Dang Van G - Shipping
        creator: users[0],
        status: ClaimStatus.PendingCustomer,
        severity: ClaimSeverity.Medium,
        createdAt: daysAgo(10).toISOString(),
        deadline: daysAgo(2).toISOString(),
        attachments: [
            { name: 'scratched_surface.jpg', url: 'https://picsum.photos/seed/clm004-1/400/300', type: 'image' },
            { name: 'shipping_box.jpg', url: 'https://picsum.photos/seed/clm004-2/400/300', type: 'image' }
        ],
        comments: [],
        containmentActions: 'Đề nghị khách hàng giữ lại lô hàng để kiểm tra.',
        rootCauseAnalysis: defaultRootCauseAnalysis,
        correctiveActions: '',
        preventiveActions: '',
        effectivenessValidation: '',
        closureSummary: '',
        customerConfirmation: false,
        completedPrs: '',
        traceabilityAnalysis: defaultTraceability,
    },
    {
        id: 'CLM-005',
        customerName: 'Công ty TNHH Sáng Tạo',
        orderId: 'PO-33445',
        productCode: 'YK-V-3A-B',
        defectType: 'Lỗi dệt',
        quantity: 35,
        totalQuantity: 1500,
        discoveryLocation: 'Xưởng may',
        responsibleDepartment: 'Weaving',
        description: 'Dây kéo có hiện tượng sổ chỉ, ảnh hưởng đến thẩm mỹ.',
        assignee: users[2], // Le Minh Cuong - Weaving
        creator: users[0],
        status: ClaimStatus.InProgress,
        severity: ClaimSeverity.Low,
        createdAt: daysAgo(1).toISOString(),
        deadline: daysFromNow(10).toISOString(),
        attachments: [
            { name: 'frayed_zipper_tape.jpg', url: 'https://picsum.photos/seed/clm005-1/400/300', type: 'image' },
            { name: 'weaving_report.pdf', url: '#', type: 'document' },
        ],
        comments: [],
        containmentActions: '',
        rootCauseAnalysis: defaultRootCauseAnalysis,
        correctiveActions: '',
        preventiveActions: '',
        effectivenessValidation: '',
        closureSummary: '',
        customerConfirmation: false,
        completedPrs: '',
        traceabilityAnalysis: defaultTraceability,
    }
];


export const mockNotifications: AppNotification[] = [
    {
        id: 'notif-1',
        message: `<strong>Trần Thị Bích</strong> đã thêm một bình luận vào claim <strong>CLM-001</strong>.`,
        timestamp: daysAgo(1).toISOString(),
        isRead: false,
        claimId: 'CLM-001',
        userId: 'user-2'
    },
    {
        id: 'notif-2',
        message: `Claim <strong>CLM-002</strong> đã được gán cho <strong>Lê Minh Cường</strong>.`,
        timestamp: daysAgo(1).toISOString(),
        isRead: false,
        claimId: 'CLM-002',
        userId: 'user-1'
    },
    {
        id: 'notif-3',
        message: `Trạng thái của claim <strong>CLM-003</strong> đã được cập nhật thành "<strong>Hoàn tất</strong>".`,
        timestamp: daysAgo(35).toISOString(),
        isRead: true,
        claimId: 'CLM-003',
        userId: 'user-5'
    },
    {
        id: 'notif-4',
        message: `<strong>Phạm Thị Dung</strong> đã cập nhật <strong>Hành động ngăn chặn tạm thời</strong> cho claim <strong>CLM-004</strong>.`,
        timestamp: daysAgo(9).toISOString(),
        isRead: true,
        claimId: 'CLM-004',
        userId: 'user-4'
    }
];