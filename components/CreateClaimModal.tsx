import React, { useState } from 'react';
import { Claim, ClaimSeverity, User, TraceabilityAnalysis, RootCauseAnalysis, FishboneAnalysisData, Attachment, FilterStatus } from '../types';
import { users, createDefaultFishboneData } from '../data/mockData';
import { XCircleIcon, PaperclipIcon, RefreshCwIcon } from './Icons';
import { DEPARTMENTS } from '../constants';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

interface CreateClaimModalProps {
    onClose: () => void;
    onCreateClaim: (newClaim: Omit<Claim, 'id' | 'createdAt' | 'status' | 'creator' | 'comments'>) => void;
}

const InputField: React.FC<{label: string, id: string, children: React.ReactNode}> = ({label, id, children}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        {children}
    </div>
);

const defaultTraceability: TraceabilityAnalysis = {
    originalPoLots: { tableData: [], involvedDepartments: [], personInChargeName: '', dataRetrievalDate: null, filteringDate: null, returnDate: null, filteredDefectCount: 0, filterStatus: FilterStatus.NotFiltered, notes: '' },
    otherPoSameLot: { tableData: [], involvedDepartments: [], personInChargeName: '', dataRetrievalDate: null, filteringDate: null, returnDate: null, filteredDefectCount: 0, filterStatus: FilterStatus.NotFiltered, notes: '' },
    otherPoSameMaterial: { tableData: [], involvedDepartments: [], personInChargeName: '', dataRetrievalDate: null, filteringDate: null, returnDate: null, filteredDefectCount: 0, filterStatus: FilterStatus.NotFiltered, notes: '' },
    summary: ''
};

const defaultFishboneAnalysis: FishboneAnalysisData = createDefaultFishboneData();

const defaultRootCauseAnalysis: RootCauseAnalysis = {
    analysisMethod: '',
    fishboneAnalysis: defaultFishboneAnalysis,
    fiveWhysAnalysis: '',
    rootCause: '',
    escapePoint: '',
    confirmationEvidence: '',
    attachments: [],
};


export const CreateClaimModal: React.FC<CreateClaimModalProps> = ({ onClose, onCreateClaim }) => {
    const [formData, setFormData] = useState({
        customerName: '',
        orderId: '',
        productCode: '',
        defectType: '',
        quantity: 0,
        totalQuantity: 0,
        discoveryLocation: '',
        responsibleDepartment: 'Weaving',
        description: '',
        assigneeId: users[0].id,
        severity: ClaimSeverity.Medium,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completedPrs: '',
    });

    const [attachments, setAttachments] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const maxSize = 2 * 1024 * 1024;
            const oversizedFiles = newFiles.filter(f => f.size > maxSize);
            
            if (oversizedFiles.length > 0) {
                notificationService.notify(`File quá lớn: ${oversizedFiles.map(f => f.name).join(', ')}. Giới hạn 2MB/file`, { type: 'error', duration: 4000 });
                e.target.value = '';
                return;
            }
            
            setAttachments(prev => [...prev, ...newFiles]);
            e.target.value = '';
        }
    };

    const handleRemoveFile = (fileNameToRemove: string) => {
        setAttachments(prev => prev.filter(file => file.name !== fileNameToRemove));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: (name === 'quantity' || name === 'totalQuantity') ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const assignee = users.find(u => u.id === formData.assigneeId);
        if (!assignee) {
            alert("Invalid assignee selected.");
            return;
        }
        
        setIsUploading(true);
        
        try {
            const { assigneeId, ...rest } = formData;
            
            // Upload files to Supabase
            const uploadPromises = attachments.map(async (file) => {
                const url = await storageService.uploadFile(file, 'attachments');
                return {
                    name: file.name,
                    url,
                    type: file.type.startsWith('image/') ? 'image' as const : 'document' as const
                };
            });
            
            const attachmentData = await Promise.all(uploadPromises);

            onCreateClaim({
                ...rest,
                assignee,
                attachments: attachmentData,
                containmentActions: '',
                rootCauseAnalysis: defaultRootCauseAnalysis,
                correctiveActions: '',
                preventiveActions: '',
                effectivenessValidation: '',
                closureSummary: '',
                customerConfirmation: false,
                traceabilityAnalysis: defaultTraceability,
            });
        } catch (error) {
            console.error('Error uploading files:', error);
            notificationService.notify('Lỗi khi upload file', { type: 'error', duration: 3000 });
        } finally {
            setIsUploading(false);
        }
    };
    
    const productionDepartments = DEPARTMENTS.filter(d => !['Admin', 'QC', 'N/A'].includes(d));

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Tạo Claim Mới (Báo cáo 8D)</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 font-semibold text-ykk-blue">D1: Thông tin chung</div>
                            <InputField label="Tên khách hàng" id="customerName">
                                <input type="text" id="customerName" name="customerName" value={formData.customerName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                            </InputField>
                            <InputField label="Mã đơn hàng" id="orderId">
                                <input type="text" id="orderId" name="orderId" value={formData.orderId} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                            </InputField>
                            <InputField label="Mã sản phẩm" id="productCode">
                                <input type="text" id="productCode" name="productCode" value={formData.productCode} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                            </InputField>
                            <InputField label="PR hoàn thành (nhiều PR cách nhau bằng dấu phẩy)" id="completedPrs">
                                <input type="text" id="completedPrs" name="completedPrs" value={formData.completedPrs} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                            </InputField>
                            <InputField label="Bộ phận chịu trách nhiệm" id="responsibleDepartment">
                                <select id="responsibleDepartment" name="responsibleDepartment" value={formData.responsibleDepartment} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    {productionDepartments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                                </select>
                            </InputField>
                             <InputField label="Người xử lý" id="assigneeId">
                                <select id="assigneeId" name="assigneeId" value={formData.assigneeId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    {users.map(user => <option key={user.id} value={user.id}>{user.name} ({user.department})</option>)}
                                </select>
                            </InputField>
                            <InputField label="Hạn xử lý" id="deadline">
                                <input type="date" id="deadline" name="deadline" value={formData.deadline} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                            </InputField>

                             <div className="md:col-span-2 mt-4 font-semibold text-ykk-blue">D2: Mô tả vấn đề</div>
                             <InputField label="Loại lỗi" id="defectType">
                                <input type="text" id="defectType" name="defectType" value={formData.defectType} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                            </InputField>
                             <InputField label="Mức độ nghiêm trọng" id="severity">
                                <select id="severity" name="severity" value={formData.severity} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                    {Object.values(ClaimSeverity).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </InputField>
                             <InputField label="Số lượng lỗi" id="quantity">
                                <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                            </InputField>
                             <InputField label="Tổng số lượng lô" id="totalQuantity">
                                <input type="number" id="totalQuantity" name="totalQuantity" value={formData.totalQuantity} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                            </InputField>
                            <div className="md:col-span-2">
                                <InputField label="Nơi phát hiện lỗi" id="discoveryLocation">
                                    <input type="text" id="discoveryLocation" name="discoveryLocation" value={formData.discoveryLocation} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                                </InputField>
                            </div>
                             <div className="md:col-span-2">
                                <InputField label="Mô tả chi tiết" id="description">
                                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"></textarea>
                                </InputField>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File đính kèm</label>
                                <div className="flex items-center">
                                    <label htmlFor="file-upload" className={`cursor-pointer flex items-center px-4 py-2 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <PaperclipIcon className="w-4 h-4 mr-2" />
                                        <span>Chọn tệp</span>
                                    </label>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                                </div>
                                {attachments.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {attachments.map(file => (
                                            <div key={file.name} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                                <span className="text-sm text-gray-800 dark:text-gray-200 truncate pr-2">{file.name}</span>
                                                <button type="button" onClick={() => handleRemoveFile(file.name)} className="text-red-500 hover:text-red-700">
                                                    <XCircleIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end items-center p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex-shrink-0">
                        <button onClick={onClose} type="button" disabled={isUploading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none disabled:opacity-50">Hủy</button>
                        <button type="submit" disabled={isUploading} className="ml-3 px-4 py-2 text-sm font-medium text-white bg-ykk-blue border border-transparent rounded-md shadow-sm hover:bg-ykk-blue/90 focus:outline-none disabled:opacity-50 flex items-center">
                            {isUploading && <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />}
                            {isUploading ? 'Đang upload...' : 'Tạo Claim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};