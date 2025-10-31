
import React from 'react';
import { Claim, ClaimSeverity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// FIX: Import missing icons used in KpiCard components.
import { ClockIcon, AlertTriangleIcon, ClaimsIcon, CheckCircleIcon } from './Icons';
import { getTimeLeft } from '../utils/time';

interface KpiCardProps {
    title: string;
    value: string;
    change?: string;
    changeType?: 'increase' | 'decrease';
    icon: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, changeType, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
            {change && (
                <p className={`text-xs mt-2 ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                    {change} so với tháng trước
                </p>
            )}
        </div>
        <div className="p-3 bg-ykk-blue/10 rounded-full">
            {icon}
        </div>
    </div>
);

const getSeverityStyles = (severity: ClaimSeverity) => {
    switch (severity) {
        case ClaimSeverity.Critical: return 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900/50 dark:text-red-300';
        case ClaimSeverity.High: return 'bg-orange-100 text-orange-800 border-orange-500 dark:bg-orange-900/50 dark:text-orange-300';
        case ClaimSeverity.Medium: return 'bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-900/50 dark:text-yellow-300';
        case ClaimSeverity.Low: return 'bg-blue-100 text-blue-800 border-blue-500 dark:bg-blue-900/50 dark:text-blue-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-500 dark:bg-gray-700 dark:text-gray-300';
    }
};


const UrgentClaimsTable: React.FC<{ claims: Claim[], onClaimSelect: (claim: Claim) => void }> = ({ claims, onClaimSelect }) => {
    const urgentClaims = claims
        .filter(c => c.status !== 'Hoàn tất')
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 5);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Claim cần xử lý gấp</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Claim ID</th>
                            <th scope="col" className="px-6 py-3">Khách hàng</th>
                            <th scope="col" className="px-6 py-3">Loại lỗi</th>
                            <th scope="col" className="px-6 py-3">Mức độ</th>
                            <th scope="col" className="px-6 py-3">Người xử lý</th>
                            <th scope="col" className="px-6 py-3">Thời gian còn lại</th>
                        </tr>
                    </thead>
                    <tbody>
                        {urgentClaims.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    Không có claim nào cần xử lý gấp
                                </td>
                            </tr>
                        ) : urgentClaims.map(claim => {
                            const { timeLeft, isOverdue } = getTimeLeft(claim.deadline);
                            return (
                                <tr key={claim.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => onClaimSelect(claim)}>
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{claim.id}</th>
                                    <td className="px-6 py-4">{claim.customerName}</td>
                                    <td className="px-6 py-4">{claim.defectType}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getSeverityStyles(claim.severity)}`}>{claim.severity}</span>
                                    </td>
                                    <td className="px-6 py-4">{claim.assignee.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center font-bold ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                            {isOverdue ? <AlertTriangleIcon className="w-4 h-4 mr-1"/> : <ClockIcon className="w-4 h-4 mr-1"/>}
                                            {timeLeft}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<{ claims: Claim[], onClaimSelect: (claim: Claim) => void }> = ({ claims, onClaimSelect }) => {
    // Tính toán dữ liệu thực tế
    const totalClaims = claims.length;
    const inProgressClaims = claims.filter(c => c.status === 'Đang xử lý').length;
    const overdueClaims = claims.filter(c => {
        const { isOverdue } = getTimeLeft(c.deadline);
        return isOverdue && c.status !== 'Hoàn tất';
    }).length;
    
    // Biểu đồ theo tuần (4 tuần gần nhất)
    const chartData = [
        { name: 'Tuần 1', claims: 0 },
        { name: 'Tuần 2', claims: 0 },
        { name: 'Tuần 3', claims: 0 },
        { name: 'Tuần 4', claims: 0 },
    ];

    // Phân bổ loại lỗi
    const defectTypes: Record<string, number> = {};
    claims.forEach(claim => {
        defectTypes[claim.defectType] = (defectTypes[claim.defectType] || 0) + 1;
    });
    
    const pieData = Object.entries(defectTypes).map(([name, value]) => ({ name, value }));
    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Tổng số Claim" value={totalClaims.toString()} icon={<ClaimsIcon className="w-6 h-6 text-ykk-blue"/>} />
                <KpiCard title="Đang xử lý" value={inProgressClaims.toString()} icon={<ClockIcon className="w-6 h-6 text-ykk-blue"/>} />
                <KpiCard title="Quá hạn" value={overdueClaims.toString()} icon={<AlertTriangleIcon className="w-6 h-6 text-ykk-blue"/>} />
                <KpiCard title="Hoàn tất" value={claims.filter(c => c.status === 'Hoàn tất').length.toString()} icon={<CheckCircleIcon className="w-6 h-6 text-ykk-blue"/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Claim theo tuần</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis dataKey="name" tick={{fill: '#9ca3af', fontSize: 12}} />
                            <YAxis tick={{fill: '#9ca3af', fontSize: 12}} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none' }} itemStyle={{ color: '#e5e7eb' }} />
                            <Legend wrapperStyle={{ color: '#9ca3af' }}/>
                            <Bar dataKey="claims" fill="#0033a0" name="Số lượng Claim" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Phân bổ loại lỗi</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => entry.name}>
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none' }} itemStyle={{ color: '#e5e7eb' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <UrgentClaimsTable claims={claims} onClaimSelect={onClaimSelect} />
        </div>
    );
};