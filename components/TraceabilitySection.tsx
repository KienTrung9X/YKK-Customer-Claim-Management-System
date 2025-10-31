// components/TraceabilitySection.tsx
import React from 'react';
import { TraceabilityAnalysis, TraceabilityAnalysisItem, TraceabilityRow, User, Claim, UserRole } from '../types';
import { permissionService } from '../services/permissionService';
import { PlusCircleIcon, Trash2Icon } from './Icons';

const tableHeaders: { key: keyof Omit<TraceabilityRow, 'id'>; label: string; width: string }[] = [
    { key: 'lot', label: 'Mã Lô', width: 'w-1/5' },
    { key: 'date', label: 'Ngày SX', width: 'w-1/6' },
    { key: 'machine', label: 'Máy', width: 'w-1/6' },
    { key: 'quantity', label: 'Số Lượng', width: 'w-1/6' },
    { key: 'notes', label: 'Ghi Chú', width: 'w-1/3' },
];

interface TraceabilityTableProps {
    rows: TraceabilityRow[];
    onUpdate: (updatedRows: TraceabilityRow[]) => void;
    isEditable: boolean;
}

const TraceabilityTable: React.FC<TraceabilityTableProps> = ({ rows, onUpdate, isEditable }) => {
    
    const handleCellChange = (rowIndex: number, columnKey: keyof Omit<TraceabilityRow, 'id'>, value: string) => {
        const updatedRows = rows.map((row, i) => 
            i === rowIndex ? { ...row, [columnKey]: value } : row
        );
        onUpdate(updatedRows);
    };
    
    const handleAddRow = () => {
        const newRow: TraceabilityRow = {
            id: `row-${Date.now()}`,
            lot: '', date: '', machine: '', quantity: '', notes: ''
        };
        onUpdate([...rows, newRow]);
    };
    
    const handleRemoveRow = (rowId: string) => {
        onUpdate(rows.filter(row => row.id !== rowId));
    };
    
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const newRows: TraceabilityRow[] = pastedText
            .split('\n')
            .filter(row => row.trim() !== '')
            .map((row, rowIndex) => {
                const cells = row.split('\t');
                return {
                    id: `paste-${Date.now()}-${rowIndex}`,
                    lot: cells[0] || '',
                    date: cells[1] || '',
                    machine: cells[2] || '',
                    quantity: cells[3] || '',
                    notes: cells[4] || '',
                };
            });
        if (newRows.length > 0) {
            onUpdate(newRows);
        }
    };
    
    return (
        <div className="w-full" onPaste={isEditable ? handlePaste : undefined}>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            {tableHeaders.map(header => (
                                <th key={header.key} scope="col" className={`px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${header.width}`}>
                                    {header.label}
                                </th>
                            ))}
                            <th scope="col" className="relative px-3 py-2 w-12"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {rows.map((row, rowIndex) => (
                            <tr key={row.id}>
                                {tableHeaders.map(header => (
                                    <td key={header.key} className="px-2 py-1 align-top">
                                        <input
                                            type="text"
                                            value={row[header.key]}
                                            onChange={(e) => handleCellChange(rowIndex, header.key, e.target.value)}
                                            readOnly={!isEditable}
                                            className="w-full px-1 py-1 border-transparent bg-transparent rounded-md focus:outline-none focus:ring-1 focus:ring-ykk-blue focus:border-ykk-blue dark:focus:bg-gray-700"
                                            placeholder={isEditable ? header.label : ''}
                                        />
                                    </td>
                                ))}
                                <td className="px-2 py-1 text-center align-middle">
                                    {isEditable && (
                                        <button onClick={() => handleRemoveRow(row.id)} className="text-gray-400 hover:text-red-500" title="Xóa dòng">
                                            <Trash2Icon className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isEditable && (
                <button onClick={handleAddRow} className="mt-2 flex items-center text-sm font-medium text-ykk-blue hover:underline">
                    <PlusCircleIcon className="w-4 h-4 mr-1" />
                    Thêm dòng
                </button>
            )}
        </div>
    );
};

const departments: { key: keyof TraceabilityAnalysisItem['departments']; label: string }[] = [
    { key: 'shipping', label: 'Giao hàng' },
    { key: 'finishing', label: 'Hoàn thiện' },
    { key: 'warehouse', label: 'Kho' },
    { key: 'planning', label: 'Kế hoạch' },
    { key: 'qc', label: 'QC' },
];

const deptKeyMap: { [key in keyof TraceabilityAnalysisItem['departments']]: string } = {
    shipping: 'Shipping',
    finishing: 'Set', // Best guess mapping
    warehouse: 'Kho',
    planning: 'PC',
    qc: 'QC',
};

interface TraceabilityGroupProps {
    label: string;
    item: TraceabilityAnalysisItem;
    onItemChange: (updatedItem: TraceabilityAnalysisItem) => void;
    isTextEditable: boolean;
    currentUser: User;
}

const TraceabilityGroup: React.FC<TraceabilityGroupProps> = ({ label, item, onItemChange, isTextEditable, currentUser }) => {
    const handleTableUpdate = (newRows: TraceabilityRow[]) => {
        onItemChange({ ...item, data: newRows });
    };

    const handleCheckboxChange = (deptKey: keyof TraceabilityAnalysisItem['departments']) => {
        onItemChange({
            ...item,
            departments: {
                ...item.departments,
                [deptKey]: !item.departments[deptKey],
            },
        });
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <TraceabilityTable 
                rows={item.data}
                onUpdate={handleTableUpdate}
                isEditable={isTextEditable}
            />
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Bộ phận xác nhận:</span>
                {departments.map(dept => {
                     const isMyDepartment = deptKeyMap[dept.key] === currentUser.department;
                     const canToggleCheckbox = currentUser.role === UserRole.Admin || isMyDepartment;
                     return (
                         <div key={dept.key} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`${label}-${dept.key}`}
                                checked={item.departments[dept.key]}
                                onChange={() => handleCheckboxChange(dept.key)}
                                disabled={!canToggleCheckbox}
                                className="h-4 w-4 text-ykk-blue focus:ring-ykk-blue border-gray-300 rounded disabled:opacity-50"
                            />
                            <label htmlFor={`${label}-${dept.key}`} className="ml-2 text-sm text-gray-600 dark:text-gray-300">{dept.label}</label>
                        </div>
                     );
                })}
            </div>
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
                currentUser={currentUser}
            />
            <TraceabilityGroup
                label="Các PO khác cùng lô"
                item={traceabilityAnalysis.otherPoSameLot}
                onItemChange={(item) => handleItemChange('otherPoSameLot', item)}
                isTextEditable={canEditText}
                currentUser={currentUser}
            />
            <TraceabilityGroup
                label="Các PO khác cùng Nguyên vật liệu"
                item={traceabilityAnalysis.otherPoSameMaterial}
                onItemChange={(item) => handleItemChange('otherPoSameMaterial', item)}
                isTextEditable={canEditText}
                currentUser={currentUser}
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