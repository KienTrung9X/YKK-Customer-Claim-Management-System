// components/ReportModal.tsx
import React, { useState } from 'react';
import { XCircleIcon } from './Icons';
import { notificationService } from '../services/notificationService';

interface ReportModalProps {
    reportContent: string;
    claimId: string;
    onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ reportContent, claimId, onClose }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(reportContent);
        setIsCopied(true);
        notificationService.notify("Đã sao chép báo cáo vào clipboard!", { type: 'success', duration: 2000 });
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Báo cáo 8D - Claim ' + claimId + '</title>');
            printWindow.document.write('<style>body { font-family: sans-serif; line-height: 1.6; } h1, h2, h3 { color: #0033a0; } hr { border: 0; border-top: 1px solid #ccc; } pre { white-space: pre-wrap; word-wrap: break-word; font-family: sans-serif; } </style>');
            printWindow.document.write('</head><body>');
            // Convert markdown-like headers to styled HTML
            const formattedContent = reportContent.replace(/# (.*)/g, '<h1>$1</h1>').replace(/## (.*)/g, '<h2>$1</h2>');
            printWindow.document.write(`<pre>${formattedContent}</pre>`);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:hidden">
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #print-section, #print-section * {
                            visibility: visible;
                        }
                        #print-section {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                    }
                `}
            </style>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Báo cáo 8D do AI tạo - Claim: {claimId}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    <pre id="print-section" className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans leading-relaxed">
                        {reportContent}
                    </pre>
                </div>
                <div className="flex justify-end items-center p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex-shrink-0 space-x-3">
                    <button onClick={handlePrint} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">
                        In báo cáo
                    </button>
                    <button onClick={handleCopy} type="button" className="px-4 py-2 text-sm font-medium text-white bg-ykk-blue border border-transparent rounded-md shadow-sm hover:bg-ykk-blue/90 focus:outline-none">
                        {isCopied ? 'Đã sao chép!' : 'Sao chép nội dung'}
                    </button>
                </div>
            </div>
        </div>
    );
};