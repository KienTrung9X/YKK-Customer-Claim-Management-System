import React from 'react';
import { Claim, ClaimStatus, ClaimSeverity, User } from '../types';
import { PlusCircleIcon, ClockIcon, AlertTriangleIcon } from './Icons';
import { getTimeLeft } from '../utils/time';
import { permissionService } from '../services/permissionService';

const getSeverityStyles = (severity: ClaimSeverity) => {
    switch (severity) {
        case ClaimSeverity.Critical: return 'bg-red-500';
        case ClaimSeverity.High: return 'bg-orange-500';
        case ClaimSeverity.Medium: return 'bg-yellow-500';
        case ClaimSeverity.Low: return 'bg-blue-500';
        default: return 'bg-gray-500';
    }
};

// Helper function to format the assignee's name into two lines.
const formatAssigneeName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length <= 1) {
        // If there's only one word, display it on the first line.
        return { line1: name, line2: '' };
    }
    // The last word of the name goes to the second line.
    const line2 = parts.pop() || '';
    const line1 = parts.join(' ');
    return { line1, line2 };
};


const ClaimCard: React.FC<{ claim: Claim, onClaimSelect: (claim: Claim) => void }> = ({ claim, onClaimSelect }) => {
    const { timeLeft, isOverdue } = getTimeLeft(claim.deadline);
    const defectRate = claim.totalQuantity > 0 ? ((claim.quantity / claim.totalQuantity) * 100).toFixed(1) : 0;
    const { line1, line2 } = formatAssigneeName(claim.assignee.name);

    return (
        <div onClick={() => onClaimSelect(claim)} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-ykk-blue cursor-pointer transition-all duration-200">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-1">{claim.id} - {claim.customerName}</h4>
                <div className={`w-3 h-3 rounded-full ${getSeverityStyles(claim.severity)}`} title={`Severity: ${claim.severity}`}></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{claim.defectType}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{claim.description}</p>
            
            <div className="flex justify-between items-center mt-3 text-xs text-gray-500 dark:text-gray-400">
                <div className={`flex items-center font-medium ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {isOverdue ? <AlertTriangleIcon className="w-3 h-3 mr-1" /> : <ClockIcon className="w-3 h-3 mr-1" />}
                    <span>{timeLeft}</span>
                </div>
                <div className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full font-semibold">
                    {defectRate}%
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center">
                <div className="flex items-center">
                    <span className="px-2 py-1 text-xs font-semibold rounded-md bg-ykk-blue text-white">
                        {claim.responsibleDepartment}
                    </span>
                     <div className="ml-2">
                         <div className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">{line1}</div>
                         <div className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">{line2}</div>
                    </div>
                </div>
                <img src={claim.assignee.avatarUrl} alt={claim.assignee.name} className="w-8 h-8 rounded-full" />
            </div>
        </div>
    );
};

const statusColumns: { title: string; status: ClaimStatus }[] = [
    { title: 'Mới', status: ClaimStatus.New },
    { title: 'Đang xử lý', status: ClaimStatus.InProgress },
    { title: 'Chờ khách hàng', status: ClaimStatus.PendingCustomer },
    { title: 'Hoàn tất', status: ClaimStatus.Completed },
];

interface ClaimsBoardProps {
    claims: Claim[];
    onClaimSelect: (claim: Claim) => void;
    onNewClaimClick: () => void;
    currentUser: User;
}

export const ClaimsBoard: React.FC<ClaimsBoardProps> = ({ claims, onClaimSelect, onNewClaimClick, currentUser }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Claims Board</h2>
                {permissionService.canCreateClaim(currentUser) && (
                    <button 
                        onClick={onNewClaimClick}
                        className="flex items-center px-4 py-2 bg-ykk-blue text-white rounded-lg shadow-sm hover:bg-ykk-blue/90 transition-colors"
                    >
                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                        Tạo Claim
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-5">
                {statusColumns.map(column => {
                    const claimsInColumn = claims.filter(c => c.status === column.status);
                    return (
                        <div key={column.status} className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-3 flex-shrink-0 w-full min-w-0">
                            <div className="flex justify-between items-center mb-3 px-1">
                                <h3 className="font-semibold text-sm lg:text-base text-gray-700 dark:text-gray-300">{column.title}</h3>
                                <span className="text-xs lg:text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{claimsInColumn.length}</span>
                            </div>
                            <div className="space-y-3 max-h-[60vh] lg:h-[calc(100vh-200px)] overflow-y-auto pr-1">
                                {claimsInColumn.map(claim => (
                                    <ClaimCard key={claim.id} claim={claim} onClaimSelect={onClaimSelect} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};