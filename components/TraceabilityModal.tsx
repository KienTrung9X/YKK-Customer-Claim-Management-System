// components/TraceabilityModal.tsx
import React, { useState, useEffect } from 'react';
import { XCircleIcon } from './Icons';
import { notificationService } from '../services/notificationService';

interface TraceabilityModalProps {
    title: string;
    tableData: string[][];
    onSave: (data: string[][]) => void;
    onClose: () => void;
    isEditable: boolean;
}

export const TraceabilityModal: React.FC<TraceabilityModalProps> = ({ title, tableData, onSave, onClose, isEditable }) => {
    const [editText, setEditText] = useState('');
    const [parsedData, setParsedData] = useState<string[][]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showExcelInput, setShowExcelInput] = useState(false);

    useEffect(() => {
        const text = tableData.map(row => row.join('\t')).join('\n');
        setEditText(text);
        setParsedData(tableData);
        // Auto hide Excel input if there's data
        if (tableData.length > 0) {
            setShowExcelInput(false);
        }
    }, [tableData]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setEditText(text);
        
        if (text.trim() === '') {
            setParsedData([]);
        } else {
            const rows = text.split('\n').map(row => row.split('\t'));
            setParsedData(rows);
        }
    };

    const handleSave = () => {
        onSave(parsedData);
        notificationService.notify(`Dữ liệu cho '${title}' đã được cập nhật.`, { type: 'success' });
        onClose();
    };

    const handleCopyTable = async () => {
        if (parsedData.length === 0) return;
        
        try {
            const tableText = parsedData.map(row => row.join('\t')).join('\n');
            await navigator.clipboard.writeText(tableText);
            notificationService.notify('Bảng đã được sao chép!', { type: 'success' });
        } catch (error) {
            console.error('Lỗi khi sao chép:', error);
            notificationService.notify('Không thể sao chép bảng', { type: 'error' });
        }
    };

    const headerRow = parsedData.length > 0 ? parsedData[0] : [];
    const allDataRows = parsedData.length > 1 ? parsedData.slice(1) : [];
    
    // Filter data based on search term
    const filteredDataRows = searchTerm.trim() === '' ? allDataRows : 
        allDataRows.filter(row => 
            row.some(cell => cell.toLowerCase().includes(searchTerm.toLowerCase()))
        );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-ykk-blue/5 to-ykk-blue/10 dark:from-ykk-blue/10 dark:to-ykk-blue/20">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dữ liệu truy xuất: {title}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {allDataRows.length > 0 ? `${allDataRows.length} dòng dữ liệu, ${headerRow.length} cột` : 'Chưa có dữ liệu'}
                            {searchTerm && filteredDataRows.length !== allDataRows.length && ` (${filteredDataRows.length} dòng sau khi lọc)`}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
                    {isEditable && showExcelInput && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                                <label htmlFor="paste-area" className="text-sm font-medium text-blue-800 dark:text-blue-200">Dán dữ liệu từ Excel:</label>
                                <button 
                                    onClick={() => setShowExcelInput(false)}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm font-medium"
                                >
                                    Ẩn
                                </button>
                            </div>
                            <textarea
                                id="paste-area"
                                value={editText}
                                onChange={handleTextChange}
                                placeholder="Copy và dán dữ liệu từ Excel vào đây (bao gồm cả hàng tiêu đề)..."
                                className="w-full h-32 p-3 border border-blue-300 dark:border-blue-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 font-mono text-sm resize-none"
                            />
                        </div>
                    )}
                    <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Dữ liệu truy xuất</h3>
                            <div className="flex items-center space-x-3">
                                {parsedData.length > 0 && (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ykk-blue/50 focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 w-48"
                                        />
                                        <button
                                            onClick={handleCopyTable}
                                            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 border border-green-300 rounded-lg transition-colors flex items-center space-x-2"
                                            title="Sao chép bảng"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span>Copy</span>
                                        </button>
                                    </>
                                )}
                                {isEditable && (
                                    <button
                                        onClick={() => setShowExcelInput(!showExcelInput)}
                                        className="px-4 py-2 text-sm font-medium text-ykk-blue bg-ykk-blue/10 hover:bg-ykk-blue/20 border border-ykk-blue/30 rounded-lg transition-colors"
                                    >
                                        {showExcelInput ? 'Ẩn Excel' : 'Nhập Excel'}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                           {parsedData.length > 0 ? (
                               <div className="overflow-auto" style={{maxHeight: 'calc(100vh - 300px)'}}>
                                   <table className="border-collapse" style={{width: 'max-content', minWidth: '100%'}}>
                                       <thead>
                                           <tr className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-600">
                                               <th className="w-16 px-4 py-4 text-center text-xs font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wider border-r-2 border-white dark:border-gray-500 bg-slate-200 dark:bg-gray-600 sticky left-0 z-20 shadow-sm">
                                                   <div className="flex items-center justify-center">
                                                       <span className="bg-slate-600 dark:bg-gray-400 text-white dark:text-gray-800 px-2 py-1 rounded text-xs font-bold">#</span>
                                                   </div>
                                               </th>
                                               {headerRow.map((header, index) => (
                                                   <th key={index} className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wider border-r-2 border-white dark:border-gray-500 last:border-r-0 whitespace-nowrap bg-gradient-to-b from-slate-100 to-slate-150 dark:from-gray-700 dark:to-gray-650" style={{width: 'auto', minWidth: '120px'}}>
                                                       <div className="flex items-center space-x-2">
                                                           <div className="w-2 h-2 bg-ykk-blue rounded-full"></div>
                                                           <span className="font-semibold">{header || `Cột ${index + 1}`}</span>
                                                       </div>
                                                   </th>
                                               ))}
                                           </tr>
                                       </thead>
                                       <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                           {filteredDataRows.length > 0 ? filteredDataRows.map((row, rowIndex) => {
                                               const isEven = rowIndex % 2 === 0;
                                               return (
                                                   <tr key={rowIndex} className={`transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:shadow-sm ${
                                                       isEven 
                                                           ? 'bg-white dark:bg-gray-800' 
                                                           : 'bg-gray-50/80 dark:bg-gray-750/50'
                                                   }`}>
                                                       <td className="w-16 px-4 py-4 text-center border-r-2 border-gray-100 dark:border-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-650 sticky left-0 z-10 shadow-sm">
                                                           <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 dark:from-gray-500 dark:to-gray-600 text-white text-xs font-bold rounded-full shadow-sm">
                                                               {allDataRows.indexOf(row) + 1}
                                                           </div>
                                                       </td>
                                                       {row.map((cell, cellIndex) => {
                                                           const isHighlighted = searchTerm && cell && cell.toLowerCase().includes(searchTerm.toLowerCase());
                                                           const isEmpty = !cell || cell.trim() === '';
                                                           return (
                                                               <td key={cellIndex} className="px-4 py-4 border-r border-gray-100 dark:border-gray-700 last:border-r-0 whitespace-nowrap" style={{width: 'auto', minWidth: '120px'}}>
                                                                   <div className="flex items-center space-x-2">
                                                                       {!isEmpty && (
                                                                           <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
                                                                       )}
                                                                       {isHighlighted ? (
                                                                           <span className="bg-gradient-to-r from-yellow-200 to-yellow-300 dark:from-yellow-800/70 dark:to-yellow-700/70 px-2 py-1 rounded-md font-semibold text-gray-800 dark:text-yellow-100 shadow-sm">
                                                                               {cell}
                                                                           </span>
                                                                       ) : (
                                                                           <span className={`text-sm font-medium ${
                                                                               isEmpty 
                                                                                   ? 'text-gray-400 dark:text-gray-500 italic bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs' 
                                                                                   : 'text-gray-700 dark:text-gray-200'
                                                                           }`}>
                                                                               {cell || 'Trống'}
                                                                           </span>
                                                                       )}
                                                                   </div>
                                                               </td>
                                                           );
                                                       })}
                                                   </tr>
                                               );
                                           }) : (
                                               <tr>
                                                   <td colSpan={headerRow.length + 1} className="px-4 py-16 text-center">
                                                       <div className="text-gray-500 dark:text-gray-400">
                                                           <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                                                               <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                               </svg>
                                                           </div>
                                                           <p className="text-xl font-semibold mb-2 text-gray-600 dark:text-gray-300">
                                                               {searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
                                                           </p>
                                                           <p className="text-sm text-gray-500 dark:text-gray-400">
                                                               {searchTerm ? `Không có dữ liệu nào chứa "${searchTerm}"` : 'Nhấn "Nhập Excel" để thêm dữ liệu'}
                                                           </p>
                                                       </div>
                                                   </td>
                                               </tr>
                                           )}
                                       </tbody>
                                   </table>
                               </div>
                           ) : (
                                <div className="flex flex-col items-center justify-center h-80 text-gray-500 dark:text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                                    <div className="w-24 h-24 mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-2xl flex items-center justify-center shadow-xl">
                                        <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-gray-700 dark:text-gray-200">Chưa có dữ liệu</h3>
                                    <p className="text-center mb-6 max-w-md text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Nhấn nút "Nhập Excel" bên trên để dán dữ liệu từ Excel vào bảng
                                    </p>
                                    {isEditable && (
                                        <button
                                            onClick={() => setShowExcelInput(true)}
                                            className="px-8 py-3 bg-gradient-to-r from-ykk-blue to-ykk-blue/90 text-white rounded-xl hover:from-ykk-blue/90 hover:to-ykk-blue/80 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                <span>Nhập dữ liệu Excel</span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                           )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center p-6 border-t dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-b-xl flex-shrink-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {parsedData.length > 0 && (
                            <span>Tổng cộng: <strong>{allDataRows.length}</strong> dòng dữ liệu</span>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors">
                            {isEditable ? 'Hủy' : 'Đóng'}
                        </button>
                        {isEditable && (
                            <button onClick={handleSave} type="button" className="px-6 py-2 text-sm font-medium text-white bg-ykk-blue border border-transparent rounded-md shadow-sm hover:bg-ykk-blue/90 focus:outline-none focus:ring-2 focus:ring-ykk-blue/50 transition-colors">
                                Lưu dữ liệu
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
