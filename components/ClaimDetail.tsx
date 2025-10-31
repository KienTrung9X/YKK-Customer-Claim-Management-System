// FIX: Create the ClaimDetail component to display 8D report details for a claim.
import React, { useState } from 'react';
import { Claim, ClaimStatus, ClaimSeverity, User, FishboneAnalysisData, TraceabilityAnalysis, Attachment } from '../types';
import { IshikawaDiagram } from './IshikawaDiagram';
import { CommentSection } from './CommentSection';
import { permissionService } from '../services/permissionService';
import { PaperclipIcon, XCircleIcon, FileIcon, FileTextIcon, ZoomInIcon, SparklesIcon, RefreshCwIcon, ChevronDownIcon, CheckCircleIcon } from './Icons';
import { getTimeLeft } from '../utils/time';
import { TraceabilitySection } from './TraceabilitySection';
import { aiService } from '../services/aiService';
import { notificationService } from '../services/notificationService';
import { ReportModal } from './ReportModal';
import { storageService } from '../services/storageService';


// A generic section component for the 8D report
const ReportSection: React.FC<{ 
    title: string; 
    dNumber?: string; 
    children: React.ReactNode;
    isCollapsible?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
}> = ({ title, dNumber, children, isCollapsible, isExpanded, onToggle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <button 
            type="button"
            className={`w-full text-left p-4 flex justify-between items-center ${isExpanded ? 'border-b dark:border-gray-700' : ''} ${isCollapsible ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}`}
            onClick={isCollapsible ? onToggle : undefined}
            disabled={!isCollapsible}
            aria-expanded={isCollapsible ? isExpanded : undefined}
        >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {dNumber && <span className="text-ykk-blue font-bold">{dNumber}:</span>} {title}
            </h3>
            {isCollapsible && <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />}
        </button>
        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded || !isCollapsible ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
                <div className="p-4">{children}</div>
            </div>
        </div>
    </div>
);

const InfoItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-base text-gray-800 dark:text-gray-100 mt-1">{value}</p>
    </div>
);

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    return (
        <button
            onClick={handleCopy}
            className="ml-2 p-1 text-xs text-ykk-blue hover:bg-ykk-blue/10 rounded transition-colors"
            title="Copy"
        >
            {copied ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <span>📋</span>}
        </button>
    );
};

const PRList: React.FC<{ prs: string }> = ({ prs }) => {
    if (!prs || prs.trim() === '') return <span className="text-gray-400 italic">N/A</span>;
    
    const prArray = prs.split(',').map(pr => pr.trim()).filter(pr => pr);
    
    return (
        <div className="flex flex-wrap gap-2">
            {prArray.map((pr, index) => (
                <div key={index} className="flex items-center bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-700">
                    <span className="text-sm font-mono text-blue-700 dark:text-blue-300">{pr}</span>
                    <CopyButton text={pr} />
                </div>
            ))}
        </div>
    );
};

const getSeverityStyles = (severity: ClaimSeverity) => {
    switch (severity) {
        case ClaimSeverity.Critical: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        case ClaimSeverity.High: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
        case ClaimSeverity.Medium: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case ClaimSeverity.Low: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

const getStatusStyles = (status: ClaimStatus) => {
    switch (status) {
        case ClaimStatus.New: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case ClaimStatus.InProgress: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case ClaimStatus.PendingCustomer: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
        case ClaimStatus.Completed: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

export const ClaimDetail: React.FC<{
  claim: Claim;
  onUpdateClaim: (updatedClaim: Claim) => void;
  onBack: () => void;
  currentUser: User;
  onAddComment: (claimId: string, text: string) => void;
}> = ({ claim, onUpdateClaim, onBack, currentUser, onAddComment }) => {
    const [editableClaim, setEditableClaim] = useState<Claim>(claim);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const [isUploadingRcaFiles, setIsUploadingRcaFiles] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'D3': false,
        'traceability': false,
        'D4': false,
        'D5': false,
        'D6': false,
        'D7': false,
        'D8': false,
    });

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const canEditAnything = permissionService.canEditAnythingOnClaim(currentUser, claim);
    const canEditHeader = permissionService.canEditClaimHeader(currentUser);
    const canEditContainment = permissionService.canEditContainmentActions(currentUser);
    const canEditInvestigation = permissionService.canEditInvestigation(currentUser, claim);
    const canEditClosure = permissionService.canEditClosure(currentUser);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name.startsWith('rootCauseAnalysis.')) {
            const field = name.split('.')[1];
            setEditableClaim(prev => ({
                ...prev,
                rootCauseAnalysis: { ...prev.rootCauseAnalysis, [field]: value }
            }));
        } else {
            setEditableClaim(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFishboneUpdate = (updatedData: FishboneAnalysisData) => {
        setEditableClaim(prev => ({
            ...prev,
            rootCauseAnalysis: { ...prev.rootCauseAnalysis, fishboneAnalysis: updatedData }
        }));
    };
    
    const handleTraceabilityUpdate = (updatedData: TraceabilityAnalysis) => {
        setEditableClaim(prev => ({
            ...prev,
            traceabilityAnalysis: updatedData
        }));
    };
    
    const handleFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            
            // Kiểm tra kích thước file (2MB = 2 * 1024 * 1024 bytes)
            const maxSize = 2 * 1024 * 1024;
            const oversizedFiles = newFiles.filter(f => f.size > maxSize);
            
            if (oversizedFiles.length > 0) {
                notificationService.notify(`File quá lớn: ${oversizedFiles.map(f => f.name).join(', ')}. Giới hạn 2MB/file`, { type: 'error', duration: 4000 });
                e.target.value = '';
                return;
            }
            
            setIsUploadingFiles(true);
            
            try {
                const uploadPromises = newFiles.map(async (file: File) => {
                    const url = await storageService.uploadFile(file, 'attachments');
                    return {
                        name: file.name,
                        url,
                        type: file.type.startsWith('image/') ? 'image' as const : 'document' as const,
                    };
                });

                const newAttachments = await Promise.all(uploadPromises);

                setEditableClaim(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, ...newAttachments]
                }));
                
                notificationService.notify('Upload file thành công', { type: 'success', duration: 2000 });
            } catch (error) {
                console.error('Error uploading files:', error);
                notificationService.notify('Lỗi khi upload file', { type: 'error', duration: 3000 });
            } finally {
                setIsUploadingFiles(false);
                e.target.value = '';
            }
        }
    };

    const handleFileRemove = (indexToRemove: number) => {
        setEditableClaim(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
        }));
    };
    
    const handleRcaFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            
            // Kiểm tra kích thước file (2MB)
            const maxSize = 2 * 1024 * 1024;
            const oversizedFiles = newFiles.filter(f => f.size > maxSize);
            
            if (oversizedFiles.length > 0) {
                notificationService.notify(`File quá lớn: ${oversizedFiles.map(f => f.name).join(', ')}. Giới hạn 2MB/file`, { type: 'error', duration: 4000 });
                e.target.value = '';
                return;
            }
            
            setIsUploadingRcaFiles(true);
            
            try {
                const uploadPromises = newFiles.map(async (file: File) => {
                    const url = await storageService.uploadFile(file, 'rca-attachments');
                    return {
                        name: file.name,
                        url,
                        type: file.type.startsWith('image/') ? 'image' as const : 'document' as const,
                    };
                });

                const newAttachments = await Promise.all(uploadPromises);

                setEditableClaim(prev => ({
                    ...prev,
                    rootCauseAnalysis: {
                        ...prev.rootCauseAnalysis,
                        attachments: [...prev.rootCauseAnalysis.attachments, ...newAttachments]
                    }
                }));
                
                notificationService.notify('Upload file thành công', { type: 'success', duration: 2000 });
            } catch (error) {
                console.error('Error uploading RCA files:', error);
                notificationService.notify('Lỗi khi upload file', { type: 'error', duration: 3000 });
            } finally {
                setIsUploadingRcaFiles(false);
                e.target.value = '';
            }
        }
    };

    const handleRcaFileRemove = (indexToRemove: number) => {
        setEditableClaim(prev => ({
            ...prev,
            rootCauseAnalysis: {
                ...prev.rootCauseAnalysis,
                attachments: prev.rootCauseAnalysis.attachments.filter((_, index) => index !== indexToRemove)
            }
        }));
    };


    const handleSave = () => {
        onUpdateClaim(editableClaim);
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        try {
            const reportContent = await aiService.generate8DReport(claim);
            setGeneratedReport(reportContent);
        } catch (error) {
            console.error("Failed to generate AI report:", error);
            notificationService.notify("Không thể tạo báo cáo. Vui lòng thử lại.", { type: 'error' });
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const getDocumentIcon = (fileName: string): React.ReactNode => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <FileTextIcon className="w-8 h-8 text-red-500 dark:text-red-400" />;
            case 'doc':
            case 'docx':
                return <FileTextIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />;
            case 'xls':
            case 'xlsx':
            case 'ppt':
            case 'pptx':
                return <FileTextIcon className="w-8 h-8 text-green-500 dark:text-green-400" />;
            default:
                return <FileIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />;
        }
    };

    const { timeLeft, isOverdue } = getTimeLeft(claim.deadline);

    const AttachmentList: React.FC<{
        attachments: Attachment[];
        onRemove: (index: number) => void;
        isEditable: boolean;
    }> = ({ attachments, onRemove, isEditable }) => (
        <div className="mt-2">
            {attachments.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                    {attachments.map((att, index) => (
                        <div key={`${att.name}-${index}`} className="relative group w-24 h-24">
                            {att.type === 'image' ? (
                                <button onClick={() => setViewingImage(att.url)} className="block w-full h-full relative group">
                                    <img src={att.url} alt={att.name} className="w-full h-full object-cover rounded-lg border dark:border-gray-600" />
                                    <div className="absolute inset-0 bg-black/60 flex items-end p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <p className="text-white text-xs leading-tight line-clamp-2">{att.name}</p>
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                                        <ZoomInIcon className="w-8 h-8" />
                                    </div>
                                </button>
                            ) : (
                                <a 
                                    href={att.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    title={att.name}
                                    className="block w-full h-full p-2 rounded-lg border dark:border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 hover:border-ykk-blue dark:hover:border-ykk-blue hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="w-full h-full flex flex-col items-center justify-center">
                                        {getDocumentIcon(att.name)}
                                        <p className="text-xs text-center mt-2 text-ykk-blue line-clamp-2 w-full">
                                            {att.name}
                                        </p>
                                    </div>
                                </a>
                            )}
                            {isEditable && (
                                <button 
                                    type="button" 
                                    onClick={() => onRemove(index)} 
                                    className="absolute -top-1.5 -right-1.5 bg-white dark:bg-gray-700 text-red-500 rounded-full p-0 leading-none shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 focus:outline-none"
                                    title="Xóa tệp"
                                >
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-400 italic">Không có file đính kèm.</p>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-10 bg-ykk-background dark:bg-gray-900 py-3 -mt-6 -mx-6 px-4 md:px-6 shadow-sm">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <button onClick={onBack} className="text-ykk-blue hover:underline text-sm">&larr; Quay lại</button>
                        <div className="flex items-center gap-1.5">
                            <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="flex items-center px-2 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 border border-transparent rounded-md shadow-sm hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed md:px-4 md:py-2 md:text-sm" title="AI Tạo Báo cáo 8D">
                                {isGeneratingReport ? (
                                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                    <SparklesIcon className="w-4 h-4" />
                                )}
                                <span className="hidden md:inline ml-2">AI Tạo Báo cáo 8D</span>
                            </button>
                            {canEditAnything && (
                                <>
                                    <button onClick={() => setEditableClaim(claim)} className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 md:px-4 md:py-2 md:text-sm">
                                        Hủy
                                    </button>
                                    <button onClick={handleSave} className="px-2 py-1.5 text-xs font-medium text-white bg-ykk-blue border border-transparent rounded-md shadow-sm hover:bg-ykk-blue/90 md:px-4 md:py-2 md:text-sm">
                                        Lưu
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 md:text-2xl">Chi tiết Claim: {claim.id}</h2>
                </div>
            </div>

            {/* General Info Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <InfoItem label="Khách hàng" value={claim.customerName} />
                <InfoItem label="Mã đơn hàng" value={claim.orderId} />
                <InfoItem label="Mã sản phẩm" value={claim.productCode} />
                <InfoItem label="Người xử lý" value={
                    <div className="flex items-center">
                        <img src={claim.assignee.avatarUrl} alt={claim.assignee.name} className="w-6 h-6 rounded-full mr-2" />
                        <span>{claim.assignee.name}</span>
                    </div>
                } />
                <InfoItem label="Trạng thái" value={
                    <select
                        name="status"
                        value={editableClaim.status}
                        onChange={handleChange}
                        disabled={!canEditHeader}
                        className={`px-2 py-1 rounded-full text-sm font-semibold border-0 focus:ring-2 focus:ring-ykk-blue ${getStatusStyles(editableClaim.status)}`}
                    >
                        {Object.values(ClaimStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                } />
                 <InfoItem label="Hạn xử lý" value={<span className={isOverdue ? 'text-red-500' : ''}>{new Date(claim.deadline).toLocaleDateString()} ({timeLeft})</span>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     {/* D1 & D2 in one card for brevity */}
                     <ReportSection title="Xác định & Mô tả vấn đề" dNumber="D1/D2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <InfoItem label="Mã đơn hàng" value={
                                <div className="flex items-center">
                                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{claim.orderId}</span>
                                    <CopyButton text={claim.orderId} />
                                </div>
                             } />
                             <InfoItem label="Loại lỗi" value={claim.defectType} />
                             <InfoItem label="Mức độ" value={<span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityStyles(claim.severity)}`}>{claim.severity}</span>} />
                             <InfoItem 
                                label="Bộ phận chịu trách nhiệm" 
                                value={
                                    <span className="px-2 py-1 rounded-md text-sm font-semibold bg-ykk-blue/10 text-ykk-blue dark:bg-ykk-blue/20 dark:text-ykk-blue-300">
                                        {claim.responsibleDepartment}
                                    </span>
                                } 
                            />
                             <InfoItem label="Số lượng lỗi" value={`${claim.quantity} / ${claim.totalQuantity} (${claim.totalQuantity > 0 ? ((claim.quantity/claim.totalQuantity)*100).toFixed(2) : 0}%)`} />
                             <InfoItem label="Nơi phát hiện" value={claim.discoveryLocation} />
                             <div className="md:col-span-3">
                                <InfoItem label="PR hoàn thành" value={<PRList prs={claim.completedPrs} />} />
                             </div>
                             <div className="md:col-span-3">
                                <InfoItem label="Mô tả chi tiết" value={<p className="whitespace-pre-wrap">{claim.description}</p>} />
                             </div>
                             <div className="md:col-span-3">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tài liệu đính kèm chung</p>
                                    {canEditAnything && (
                                        <div>
                                            <label htmlFor="file-upload-detail" className={`cursor-pointer text-sm font-medium text-ykk-blue hover:underline ${isUploadingFiles ? 'opacity-50 pointer-events-none' : ''}`}>
                                                <div className="flex items-center">
                                                    {isUploadingFiles ? (
                                                        <RefreshCwIcon className="w-4 h-4 mr-1 animate-spin" />
                                                    ) : (
                                                        <PaperclipIcon className="w-4 h-4 mr-1" />
                                                    )}
                                                    <span>{isUploadingFiles ? 'Đang upload...' : 'Thêm tệp'}</span>
                                                </div>
                                            </label>
                                            <input key={editableClaim.attachments.length} id="file-upload-detail" type="file" className="sr-only" multiple onChange={handleFileAdd} disabled={isUploadingFiles} />
                                        </div>
                                    )}
                                </div>
                                <AttachmentList attachments={editableClaim.attachments} onRemove={handleFileRemove} isEditable={canEditAnything} />
                             </div>
                        </div>
                    </ReportSection>

                    <ReportSection 
                        title="Hành động ngăn chặn tạm thời" 
                        dNumber="D3"
                        isCollapsible={true}
                        isExpanded={!!expandedSections['D3']}
                        onToggle={() => toggleSection('D3')}
                    >
                         <textarea name="containmentActions" value={editableClaim.containmentActions} onChange={handleChange} readOnly={!canEditContainment} rows={4} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 resize-none" placeholder="Mô tả các hành động đã thực hiện để cô lập vấn đề..."></textarea>
                    </ReportSection>

                    <ReportSection 
                        title="Truy xuất nguồn gốc"
                        isCollapsible={true}
                        isExpanded={!!expandedSections['traceability']}
                        onToggle={() => toggleSection('traceability')}
                    >
                        <TraceabilitySection 
                            traceabilityAnalysis={editableClaim.traceabilityAnalysis}
                            onUpdate={handleTraceabilityUpdate}
                            currentUser={currentUser}
                            claim={editableClaim}
                        />
                    </ReportSection>

                    <ReportSection 
                        title="Phân tích Nguyên nhân gốc rễ (RCA)" 
                        dNumber="D4"
                        isCollapsible={true}
                        isExpanded={!!expandedSections['D4']}
                        onToggle={() => toggleSection('D4')}
                    >
                        <div className="space-y-4">
                            <div>
                               <label htmlFor="analysisMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phương pháp phân tích</label>
                               <select id="analysisMethod" name="rootCauseAnalysis.analysisMethod" value={editableClaim.rootCauseAnalysis.analysisMethod} onChange={handleChange} disabled={!canEditInvestigation} className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                   <option value="">-- Chọn phương pháp --</option>
                                   <option value="Fishbone">Sơ đồ xương cá (Fishbone)</option>
                                   <option value="5 Whys">5 Whys</option>
                                   <option value="Other">Khác</option>
                               </select>
                            </div>
                            {editableClaim.rootCauseAnalysis.analysisMethod === 'Fishbone' && (
                                <IshikawaDiagram data={editableClaim.rootCauseAnalysis.fishboneAnalysis} onUpdate={handleFishboneUpdate} isEditable={canEditInvestigation} />
                            )}
                            {editableClaim.rootCauseAnalysis.analysisMethod === '5 Whys' && (
                                <textarea name="rootCauseAnalysis.fiveWhysAnalysis" value={editableClaim.rootCauseAnalysis.fiveWhysAnalysis} onChange={handleChange} readOnly={!canEditInvestigation} rows={6} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 resize-none" placeholder="1. Why? ..."></textarea>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nguyên nhân gốc rễ</label>
                                <textarea name="rootCauseAnalysis.rootCause" value={editableClaim.rootCauseAnalysis.rootCause} onChange={handleChange} readOnly={!canEditInvestigation} rows={3} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" placeholder="Mô tả nguyên nhân chính..."></textarea>
                            </div>
                            <div className="pt-4 border-t dark:border-gray-700/50">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tài liệu đính kèm RCA</p>
                                    {canEditInvestigation && (
                                        <div>
                                            <label htmlFor="rca-file-upload" className={`cursor-pointer text-sm font-medium text-ykk-blue hover:underline ${isUploadingRcaFiles ? 'opacity-50 pointer-events-none' : ''}`}>
                                                <div className="flex items-center">
                                                    {isUploadingRcaFiles ? (
                                                        <RefreshCwIcon className="w-4 h-4 mr-1 animate-spin" />
                                                    ) : (
                                                        <PaperclipIcon className="w-4 h-4 mr-1" />
                                                    )}
                                                    <span>{isUploadingRcaFiles ? 'Đang upload...' : 'Thêm tệp'}</span>
                                                </div>
                                            </label>
                                            <input key={editableClaim.rootCauseAnalysis.attachments.length} id="rca-file-upload" type="file" className="sr-only" multiple onChange={handleRcaFileAdd} disabled={isUploadingRcaFiles} />
                                        </div>
                                    )}
                                </div>
                                <AttachmentList attachments={editableClaim.rootCauseAnalysis.attachments} onRemove={handleRcaFileRemove} isEditable={canEditInvestigation} />
                            </div>
                        </div>
                    </ReportSection>

                     <ReportSection 
                        title="Hành động khắc phục" 
                        dNumber="D5"
                        isCollapsible={true}
                        isExpanded={!!expandedSections['D5']}
                        onToggle={() => toggleSection('D5')}
                    >
                         <textarea name="correctiveActions" value={editableClaim.correctiveActions} onChange={handleChange} readOnly={!canEditInvestigation} rows={4} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 resize-none" placeholder="Mô tả các hành động khắc phục..."></textarea>
                    </ReportSection>
                     <ReportSection 
                        title="Hành động phòng ngừa" 
                        dNumber="D6"
                        isCollapsible={true}
                        isExpanded={!!expandedSections['D6']}
                        onToggle={() => toggleSection('D6')}
                     >
                         <textarea name="preventiveActions" value={editableClaim.preventiveActions} onChange={handleChange} readOnly={!canEditInvestigation} rows={4} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 resize-none" placeholder="Mô tả các hành động phòng ngừa tái diễn..."></textarea>
                    </ReportSection>
                     <ReportSection 
                        title="Xác nhận hiệu quả" 
                        dNumber="D7"
                        isCollapsible={true}
                        isExpanded={!!expandedSections['D7']}
                        onToggle={() => toggleSection('D7')}
                    >
                         <textarea name="effectivenessValidation" value={editableClaim.effectivenessValidation} onChange={handleChange} readOnly={!canEditInvestigation} rows={4} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 resize-none" placeholder="Mô tả cách xác nhận hiệu quả của các hành động..."></textarea>
                    </ReportSection>
                     <ReportSection 
                        title="Đóng Claim" 
                        dNumber="D8"
                        isCollapsible={true}
                        isExpanded={!!expandedSections['D8']}
                        onToggle={() => toggleSection('D8')}
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tóm tắt đóng</label>
                                <textarea name="closureSummary" value={editableClaim.closureSummary} onChange={handleChange} readOnly={!canEditClosure} rows={4} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 resize-none" placeholder="Tóm tắt quá trình xử lý..."></textarea>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="customerConfirmation" name="customerConfirmation" checked={editableClaim.customerConfirmation} onChange={(e) => setEditableClaim(prev => ({ ...prev, customerConfirmation: e.target.checked}))} disabled={!canEditClosure} className="h-4 w-4 text-ykk-blue focus:ring-ykk-blue border-gray-300 rounded" />
                                <label htmlFor="customerConfirmation" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Khách hàng đã xác nhận</label>
                            </div>
                        </div>
                    </ReportSection>
                </div>

                <div className="lg:col-span-1">
                    <CommentSection comments={claim.comments} currentUser={currentUser} onAddComment={(text) => onAddComment(claim.id, text)} />
                </div>
            </div>

            {/* Image Viewer Modal */}
            {viewingImage && (
                <div 
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={() => setViewingImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <img src={viewingImage} alt="Preview" className="w-auto h-auto max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
                        <button 
                            onClick={() => setViewingImage(null)}
                            className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                            title="Close"
                        >
                            <XCircleIcon className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            )}
            
            {/* AI Report Modal */}
            {generatedReport && (
                <ReportModal 
                    reportContent={generatedReport}
                    claimId={claim.id}
                    onClose={() => setGeneratedReport(null)}
                />
            )}
        </div>
    );
};