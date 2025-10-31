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

    useEffect(() => {
        const text = tableData.map(row => row.join('\t')).join('\n');
        setEditText(text);
        setParsedData(tableData);
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

    const headerRow = parsedData.length > 0 ? parsedData[0] : [];
    const dataRows = parsedData.length > 1 ? parsedData.slice(1) : [];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dữ liệu truy xuất: {title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 p-6 overflow-hidden flex flex-col lg:flex-row gap-6">
                    {isEditable && (
                        <div className="lg:w-1/3 flex flex-col">
                            <label htmlFor="paste-area" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dán dữ liệu từ Excel tại đây:</label>
                            <textarea
                                id="paste-area"
                                value={editText}
                                onChange={handleTextChange}
                                placeholder="Copy và dán dữ liệu từ Excel vào đây (bao gồm cả hàng tiêu đề)..."
                                className="w-full flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 font-mono text-sm resize-none"
                            />
                        </div>
                    )}
                    <div className={isEditable ? "lg:w-2/3 flex flex-col" : "w-full flex flex-col"}>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Xem trước dữ liệu:</h3>
                        <div className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg overflow-auto">
                           {parsedData.length > 0 ? (
                               <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                                   <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                       <tr>
                                           {headerRow.map((header, index) => (
                                               <th key={index} scope="col" className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                                                   {header}
                                               </th>
                                           ))}
                                       </tr>
                                   </thead>
                                   <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                       {dataRows.map((row, rowIndex) => (
                                           <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                               {row.map((cell, cellIndex) => (
                                                   <td key={cellIndex} className="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                       {cell}
                                                   </td>
                                               ))}
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    <p>Không có dữ liệu để hiển thị.</p>
                                </div>
                           )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex-shrink-0">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">
                        {isEditable ? 'Hủy' : 'Đóng'}
                    </button>
                    {isEditable && (
                        <button onClick={handleSave} type="button" className="ml-3 px-4 py-2 text-sm font-medium text-white bg-ykk-blue border border-transparent rounded-md shadow-sm hover:bg-ykk-blue/90 focus:outline-none">
                            Lưu dữ liệu
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
