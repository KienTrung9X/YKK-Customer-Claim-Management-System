// components/TraceabilitySection.tsx
import React, { useState } from 'react';
import { TraceabilityAnalysis, TraceabilityAnalysisItem, User, Claim, FilterStatus } from '../types';
import { permissionService } from '../services/permissionService';
import { TableIcon, EditIcon } from './Icons';
import { TraceabilityModal } from './TraceabilityModal';
import { DEPARTMENTS } from '../constants';


const getStatusStyles = (status: FilterStatus) => {
    switch (status) {
        case FilterStatus.NotFiltered:
            return {
                label: 'Chưa lọc',
                badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                border: 'border-gray-300 dark:border-gray-600'
            };
        case FilterStatus.GettingItems:
            return {
                label: 'Đang lấy hàng',
                badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                border: 'border-blue-500'
            };
        case FilterStatus.Filtering:
            return {
                label: 'Đang lọc',
                badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
                border: 'border-orange-500'
            };
        case FilterStatus.Filtered:
            return {
                label: 'Đã lọc',
                badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                border: 'border-green-500'
            };
        default:
            return { label: 'Không xác định', badge: 'bg-gray-100 text-gray-800', border: 'border-gray-300' };
    }
};


interface TraceabilityGroupProps {
    label: string;
    item: TraceabilityAnalysisItem;
    onItemChange: (updatedItem: TraceabilityAnalysisItem) => void;
    isTextEditable: boolean;
}

const TraceabilityGroup: React.FC<TraceabilityGroupProps> = ({ label, item, onItemChange, isTextEditable }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingDepartments, setIsEditingDepartments] = useState(false);

    const handleTableSave = (newTableData: string[][]) => {
        onItemChange({ ...item, tableData: newTableData });
    };

    const handleFieldChange = (field: keyof TraceabilityAnalysisItem, value: any) => {
        onItemChange({ ...item, [field]: value });
    };

    const handleDepartmentToggle = (dept: string) => {
        const newDepartments = item.involvedDepartments.includes(dept)
            ? item.involvedDepartments.filter(d => d !== dept)
            : [...item.involvedDepartments, dept];
        onItemChange({ ...item, involvedDepartments: newDepartments.sort() });
    };

    const rowCount = item.tableData.length > 1 ? item.tableData.length - 1 : 0;
    const colCount = item.tableData.length > 0 ? item.tableData[0].length : 0;
    const statusStyle = getStatusStyles(item.filterStatus);

    return (
        <div className={`space-y-4 p-4 border-2 rounded-lg ${statusStyle.border} bg-gray-50 dark:bg-gray-800/50 transition-colors`}>
            <div className="flex justify-between items-start">
                <div>
                     <label className="block text-base font-semibold text-gray-800 dark:text-gray-200">{label}</label>
                     <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyle.badge}`}>{statusStyle.label}</span>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-ykk-blue bg-ykk-blue/10 dark:bg-ykk-blue/20 rounded-md hover:bg-ykk-blue/20 dark:hover:bg-ykk-blue/30 transition-colors"
                >
                    <TableIcon className="w-4 h-4 mr-2" />
                    <span>{isTextEditable ? 'Xem / Chỉnh sửa' : 'Xem dữ liệu'} ({rowCount} dòng, {colCount} cột)</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t dark:border-gray-700/50">
                 <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Người chịu trách nhiệm</label>
                    <input
                        type="text"
                        value={item.personInChargeName}
                        onChange={(e) => handleFieldChange('personInChargeName', e.target.value)}
                        disabled={!isTextEditable}
                        placeholder="Nhập tên..."
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Trạng thái lọc</label>
                    <select
                        value={item.filterStatus}
                        onChange={(e) => handleFieldChange('filterStatus', e.target.value as FilterStatus)}
                        disabled={!isTextEditable}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    >
                        {Object.values(FilterStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Số hàng lỗi đã lọc</label>
                    <input
                        type="number"
                        value={item.filteredDefectCount}
                        onChange={(e) => handleFieldChange('filteredDefectCount', parseInt(e.target.value, 10) || 0)}
                        disabled={!isTextEditable}
                        min="0"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ngày lấy dữ liệu</label>
                    <input
                        type="date"
                        value={item.dataRetrievalDate || ''}
                        onChange={(e) => handleFieldChange('dataRetrievalDate', e.target.value || null)}
                        disabled={!isTextEditable}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ngày lọc</label>
                     <input
                        type="date"
                        value={item.filteringDate || ''}
                        onChange={(e) => handleFieldChange('filteringDate', e.target.value || null)}
                        disabled={!isTextEditable}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    />
                </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ngày trả</label>
                     <input
                        type="date"
                        value={item.returnDate || ''}
                        onChange={(e) => handleFieldChange('returnDate', e.target.value || null)}
                        disabled={!isTextEditable}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    />
                </div>

                <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Bộ phận liên quan</label>
                        {isTextEditable && (
                            <button onClick={() => setIsEditingDepartments(prev => !prev)} className="flex items-center text-xs font-medium text-ykk-blue hover:underline">
                                <EditIcon className="w-3 h-3 mr-1" />
                                {isEditingDepartments ? 'Xong' : 'Chỉnh sửa'}
                            </button>
                        )}
                    </div>
                     <div className="p-2 rounded-md bg-white dark:bg-gray-700/50 border dark:border-gray-600 min-h-[40px]">
                        {isEditingDepartments ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {DEPARTMENTS.map(dept => (
                                    <label key={dept} className="flex items-center space-x-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={item.involvedDepartments.includes(dept)}
                                            onChange={() => handleDepartmentToggle(dept)}
                                            className="h-4 w-4 rounded border-gray-300 text-ykk-blue focus:ring-ykk-blue"
                                        />
                                        <span>{dept}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {item.involvedDepartments.length > 0 ? item.involvedDepartments.map(dept => (
                                    <span key={dept} className="px-2 py-1 text-xs font-semibold rounded-md bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                        {dept}
                                    </span>
                                )) : <p className="text-sm text-gray-400 italic">Chưa có bộ phận nào được chọn.</p>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ghi chú</label>
                    <textarea
                        value={item.notes}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        disabled={!isTextEditable}
                        rows={3}
                        placeholder="Thêm ghi chú nếu cần..."
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 resize-y"
                    />
                </div>
            </div>
            
            {isModalOpen && (
                <TraceabilityModal
                    title={label}
                    tableData={item.tableData}
                    onSave={handleTableSave}
                    onClose={() => setIsModalOpen(false)}
                    isEditable={isTextEditable}
                />
            )}
        </div>
    );
};


export const TraceabilitySection: React.FC<{
    traceabilityAnalysis: TraceabilityAnalysis;
    onUpdate: (updatedData: TraceabilityAnalysis) => void;
    currentUser: User;
    claim: Claim;
}> = ({ traceabilityAnalysis, onUpdate, currentUser, claim }) => {
    
    const canEditText = permissionService.canEditInvestigation(currentUser, claim);

    const handleItemChange = (key: keyof Omit<TraceabilityAnalysis, 'summary'>, updatedItem: TraceabilityAnalysisItem) => {
        onUpdate({ ...traceabilityAnalysis, [key]: updatedItem });
    };

    const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate({ ...traceabilityAnalysis, summary: e.target.value });
    };

    return (
        <div className="space-y-6">
            <TraceabilityGroup
                label="Lô hàng trên PO gốc"
                item={traceabilityAnalysis.originalPoLots}
                onItemChange={(item) => handleItemChange('originalPoLots', item)}
                isTextEditable={canEditText}
            />
            <TraceabilityGroup
                label="Các PO khác cùng lô"
                item={traceabilityAnalysis.otherPoSameLot}
                onItemChange={(item) => handleItemChange('otherPoSameLot', item)}
                isTextEditable={canEditText}
            />
            <TraceabilityGroup
                label="Các PO khác cùng Nguyên vật liệu"
                item={traceabilityAnalysis.otherPoSameMaterial}
                onItemChange={(item) => handleItemChange('otherPoSameMaterial', item)}
                isTextEditable={canEditText}
            />
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng kết truy xuất</label>
                 <textarea
                    value={traceabilityAnalysis.summary}
                    onChange={handleSummaryChange}
                    readOnly={!canEditText}
                    rows={3}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 resize-none"
                    placeholder="Tóm tắt kết quả truy xuất..."
                />
            </div>
        </div>
    );
};