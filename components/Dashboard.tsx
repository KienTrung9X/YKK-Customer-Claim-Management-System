
import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Claim, ClaimSeverity, ClaimStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
// FIX: Import missing icons used in KpiCard components.
import { ClockIcon, AlertTriangleIcon, ClaimsIcon, CheckCircleIcon } from './Icons';
import { getTimeLeft } from '../utils/time';
import { DEPARTMENTS } from '../constants';
import { getCurrentFiscalYear, getAvailableFiscalYears, filterClaimsByFiscalYear, getFiscalYearRange } from '../utils/fiscalYear';

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
                    {change} {t('common.comparedToPreviousMonth')}
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
    const { t } = useTranslation();
    const urgentClaims = claims
        .filter(c => c.status !== ClaimStatus.Completed)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 5);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('dashboard.urgentClaims')}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t('claims.claimId')}</th>
                            <th scope="col" className="px-6 py-3">{t('claims.customer')}</th>
                            <th scope="col" className="px-6 py-3">{t('claims.defectType')}</th>
                            <th scope="col" className="px-6 py-3">{t('claims.severity')}</th>
                            <th scope="col" className="px-6 py-3">{t('claims.assignee')}</th>
                            <th scope="col" className="px-6 py-3">{t('claims.timeRemaining')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {urgentClaims.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    {t('dashboard.noUrgentClaims')}
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

export const Dashboard: React.FC<{ claims: Claim[], onClaimSelect: (claim: Claim) => void }> = React.memo(({ claims, onClaimSelect }) => {
    const { t } = useTranslation();
    const [selectedFiscalYear, setSelectedFiscalYear] = useState(getCurrentFiscalYear());
    
    // Memoized fiscal year calculations for performance
    const availableFiscalYears = useMemo(() => getAvailableFiscalYears(claims), [claims]);
    const filteredClaims = useMemo(() => {
        const fiscalFiltered = filterClaimsByFiscalYear(claims, selectedFiscalYear);
        // Only count NG and Pending claims, exclude OK claims
        return fiscalFiltered.filter(claim => claim.confirmation !== 'OK');
    }, [claims, selectedFiscalYear]);
    
    // Optimized calculations with memoization
    const { totalClaims, inProgressClaims, overdueClaims, completedClaims } = useMemo(() => {
        const total = filteredClaims.length;
        const inProgress = filteredClaims.filter(c => c.status === 'Đang xử lý').length;
        const overdue = filteredClaims.filter(c => {
            const { isOverdue } = getTimeLeft(c.deadline);
            return isOverdue && c.status !== ClaimStatus.Completed;
        }).length;
        const completed = filteredClaims.filter(c => c.status === ClaimStatus.Completed).length;
        
        return { totalClaims: total, inProgressClaims: inProgress, overdueClaims: overdue, completedClaims: completed };
    }, [filteredClaims]);
    
    // Memoized chart data calculations
    const departmentChartData = useMemo(() => {
        const monthlyDeptData: Record<string, Record<string, number>> = {};
        
        try {
            // Tạo dữ liệu cho 12 tháng của năm tài chính
            const { start } = getFiscalYearRange(selectedFiscalYear);
            for (let i = 0; i < 12; i++) {
                const date = new Date(start);
                date.setMonth(start.getMonth() + i);
                const monthKey = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
                monthlyDeptData[monthKey] = {};
                
                // Khởi tạo tất cả bộ phận với 0
                DEPARTMENTS.forEach(dept => {
                    monthlyDeptData[monthKey][dept] = 0;
                });
            }
        } catch (error) {
            console.error('Error creating department chart data:', error);
            return [];
        }
        
        // Đếm claim theo bộ phận và tháng từ filtered claims
        filteredClaims.forEach(claim => {
            const createdDate = new Date(claim.createdAt);
            const monthKey = createdDate.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
            const department = claim.responsibleDepartment || claim.assignee?.department || 'N/A';
            
            if (monthlyDeptData[monthKey]) {
                const deptKey = DEPARTMENTS.includes(department) ? department : 'N/A';
                monthlyDeptData[monthKey][deptKey]++;
            }
        });
        
        return Object.entries(monthlyDeptData).map(([month, deptData]) => ({
            month,
            ...deptData
        }));
    }, [filteredClaims]);
    
    // Màu sắc cho các bộ phận
    const DEPT_COLORS = [
        '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF',
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#D5DBDB'
    ];

    // Memoized pie chart data
    const pieData = useMemo(() => {
        const defectTypes: Record<string, number> = {};
        filteredClaims.forEach(claim => {
            defectTypes[claim.defectType] = (defectTypes[claim.defectType] || 0) + 1;
        });
        return Object.entries(defectTypes).map(([name, value]) => ({ name, value }));
    }, [filteredClaims]);
    
    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    // Memoized monthly completion data
    const monthlyCompletionData = useMemo(() => {
        const monthlyData: Record<string, { onTime: number; overdue: number; month: string }> = {};
        
        try {
            // Lấy 12 tháng của năm tài chính
            const { start } = getFiscalYearRange(selectedFiscalYear);
            for (let i = 0; i < 12; i++) {
                const date = new Date(start);
                date.setMonth(start.getMonth() + i);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthName = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
                monthlyData[monthKey] = { onTime: 0, overdue: 0, month: monthName };
            }
        } catch (error) {
            console.error('Error creating monthly completion data:', error);
            return [];
        }
        
        // Phân loại claim đã hoàn thành từ filtered claims
        const completedFilteredClaims = filteredClaims.filter(c => c.status === ClaimStatus.Completed);
        
        completedFilteredClaims.forEach(claim => {
            const createdDate = new Date(claim.createdAt);
            const deadline = new Date(claim.deadline);
            const now = new Date();
            const isWellCompleted = claim.customerConfirmation && claim.closureSummary.trim() !== '';
            const isDeadlinePassed = deadline < now;
            const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthlyData[monthKey]) {
                if (isWellCompleted || !isDeadlinePassed) {
                    monthlyData[monthKey].onTime++;
                } else {
                    monthlyData[monthKey].overdue++;
                }
            }
        });
        
        return Object.values(monthlyData);
    }, [filteredClaims]);

    const handleFiscalYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFiscalYear(e.target.value);
    }, []);

    return (
        <div>
            {/* Fiscal Year Filter */}
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('dashboard.title')}</h2>
                <div className="flex items-center space-x-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                        <strong>{t('dashboard.note')}:</strong> {t('dashboard.okClaimsExcluded')}
                    </div>
                    <div className="flex items-center space-x-3">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.fiscalYear')}:</label>
                        <select 
                            value={selectedFiscalYear} 
                            onChange={handleFiscalYearChange}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-ykk-blue focus:border-transparent transition-all"
                        >
                            {availableFiscalYears.map(year => (
                                <option key={year} value={year}>
                                    {year.replace('-', ' - ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                <KpiCard title={t('dashboard.totalClaims')} value={totalClaims.toString()} icon={<ClaimsIcon className="w-6 h-6 text-ykk-blue"/>} />
                <KpiCard title={t('dashboard.claimsByCustomer')} value={filteredClaims.filter(c => c.claimType === 'Khách hàng').length.toString()} icon={<ClaimsIcon className="w-6 h-6 text-blue-600"/>} />
                <KpiCard title={t('dashboard.claimsByInternal')} value={filteredClaims.filter(c => c.claimType === 'Nội bộ').length.toString()} icon={<ClaimsIcon className="w-6 h-6 text-green-600"/>} />
                <KpiCard title={t('dashboard.inProgressClaims')} value={inProgressClaims.toString()} icon={<ClockIcon className="w-6 h-6 text-ykk-blue"/>} />
                <KpiCard title={t('dashboard.overdue')} value={overdueClaims.toString()} icon={<AlertTriangleIcon className="w-6 h-6 text-ykk-blue"/>} />
                <KpiCard title={t('dashboard.completedClaims')} value={completedClaims.toString()} icon={<CheckCircleIcon className="w-6 h-6 text-ykk-blue"/>} />
            </div>

            {/* Biểu đồ xu hướng claim theo tháng - Line Chart */}
            <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.claimTrend')}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t('common.fiscalYear')} {selectedFiscalYear.replace('-', ' - ')}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={departmentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                        <XAxis 
                            dataKey="month" 
                            tick={{fill: '#9ca3af', fontSize: 12}} 
                            axisLine={{stroke: '#e5e7eb'}}
                            tickLine={{stroke: '#e5e7eb'}}
                        />
                        <YAxis 
                            tick={{fill: '#9ca3af', fontSize: 12}} 
                            axisLine={{stroke: '#e5e7eb'}}
                            tickLine={{stroke: '#e5e7eb'}}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                color: '#374151'
                            }} 
                            formatter={(value, name) => value > 0 ? [`${value} ${t('common.claimCount')}`, name] : null}
                            labelFormatter={(label) => `${t('common.month')}: ${label}`}
                        />
                        {/* Hiển thị các bộ phận có claim */}
                        {(() => {
                            // Tìm các bộ phận có ít nhất 1 claim trong 3 tháng
                            const activeDepts = DEPARTMENTS.filter(dept => 
                                departmentChartData.some(monthData => monthData[dept] > 0)
                            ).slice(0, 8); // Giới hạn 8 bộ phận để không quá tải
                            
                            return activeDepts.map((dept, index) => (
                                <Line 
                                    key={dept}
                                    type="monotone"
                                    dataKey={dept} 
                                    stroke={DEPT_COLORS[index]} 
                                    strokeWidth={2.5}
                                    dot={{ fill: DEPT_COLORS[index], strokeWidth: 2, r: 3 }}
                                    activeDot={{ r: 5, stroke: DEPT_COLORS[index], strokeWidth: 2, fill: '#fff' }}
                                    name={dept}
                                    connectNulls={false}
                                />
                            ));
                        })()}
                        <Legend 
                            wrapperStyle={{ 
                                color: '#6b7280', 
                                fontSize: '12px',
                                paddingTop: '15px'
                            }}
                            iconType="line"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Biểu đồ tổng quan bộ phận - Enhanced Bar Chart */}
            <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.claimsByDepartment')}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t('common.fiscalYear')} {selectedFiscalYear.replace('-', ' - ')}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={450}>
                    <BarChart 
                        data={useMemo(() => {
                            // Hiển thị tất cả bộ phẫn, kể cả những bộ phận có 0 claim
                            const deptData = DEPARTMENTS.map((dept, index) => {
                                const count = filteredClaims.filter(claim => {
                                    const claimDept = claim.responsibleDepartment || claim.assignee?.department || 'N/A';
                                    return claimDept === dept;
                                }).length;
                                return { 
                                    name: dept, 
                                    value: count,
                                    color: DEPT_COLORS[index % DEPT_COLORS.length]
                                };
                            }).sort((a, b) => b.value - a.value);
                            return deptData;
                        }, [filteredClaims])}
                        margin={{ top: 30, right: 30, left: 20, bottom: 80 }}
                        barCategoryGap="20%"
                    >
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.6}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="rgba(148, 163, 184, 0.2)" 
                            vertical={false} 
                        />
                        <XAxis 
                            dataKey="name"
                            tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} 
                            axisLine={{stroke: '#cbd5e1', strokeWidth: 1}}
                            tickLine={false}
                            interval={0}
                        />
                        <YAxis 
                            tick={{fill: '#64748b', fontSize: 12}} 
                            axisLine={{stroke: '#cbd5e1', strokeWidth: 1}}
                            tickLine={false}
                            domain={[0, 'dataMax + 1']}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                color: '#1e293b',
                                fontSize: '14px',
                                fontWeight: '500'
                            }} 
                            formatter={(value) => [
                                <span style={{color: '#3b82f6', fontWeight: 'bold'}}>{value} {t('common.claimCount')}</span>, 
                                t('common.quantity')
                            ]}
                            labelFormatter={(label) => (
                                <span style={{color: '#0f172a', fontWeight: '600'}}>{t('common.department')}: {label}</span>
                            )}
                            cursor={{fill: 'rgba(59, 130, 246, 0.05)'}}
                        />
                        <Bar 
                            dataKey="value" 
                            fill="url(#barGradient)"
                            radius={[6, 6, 0, 0]}
                            name={t('common.claimCount')}
                            stroke="#3b82f6"
                            strokeWidth={1}
                        >
                            {useMemo(() => {
                                const deptData = DEPARTMENTS.map((dept, index) => {
                                    const count = filteredClaims.filter(claim => {
                                        const claimDept = claim.responsibleDepartment || claim.assignee?.department || 'N/A';
                                        return claimDept === dept;
                                    }).length;
                                    return { name: dept, value: count };
                                }).sort((a, b) => b.value - a.value);
                                
                                return deptData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.value > 0 ? DEPT_COLORS[index % DEPT_COLORS.length] : '#e2e8f0'}
                                        stroke={entry.value > 0 ? DEPT_COLORS[index % DEPT_COLORS.length] : '#cbd5e1'}
                                        strokeWidth={entry.value > 0 ? 2 : 1}
                                    />
                                ));
                            }, [filteredClaims])}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>



            {/* Biểu đồ phân bổ loại lỗi - Donut Chart chuyên nghiệp */}
            <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.defectDistribution')}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t('common.fiscalYear')} {selectedFiscalYear.replace('-', ' - ')}
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="flex justify-center">
                        <ResponsiveContainer width={350} height={350}>
                            <PieChart>
                                <Pie 
                                    data={pieData} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={80}
                                    outerRadius={140} 
                                    paddingAngle={2}
                                    dataKey="value" 
                                    nameKey="name"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                                        border: '1px solid #e5e7eb', 
                                        borderRadius: '12px',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                        color: '#374151'
                                    }} 
                                    formatter={(value, name) => [`${value} ${t('common.claimCount')}`, name]}
                                />

                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                        {pieData.map((entry, index) => {
                            const percentage = totalClaims > 0 ? ((entry.value / totalClaims) * 100).toFixed(1) : '0';
                            return (
                                <div key={entry.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div 
                                            className="w-4 h-4 rounded-full" 
                                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {entry.name}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                            {entry.value} {t('common.claimCount')}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {percentage}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Biểu đồ thống kê theo tháng - Claim hoàn thành đúng hạn vs không đúng hạn */}
            <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.monthlyCompletion')}</h3>
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-400">{t('common.onTimeCompletion')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-400">{t('common.overdueCompletion')}</span>
                        </div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={monthlyCompletionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis 
                            dataKey="month" 
                            tick={{fill: '#9ca3af', fontSize: 12}} 
                            axisLine={{stroke: '#e5e7eb'}}
                        />
                        <YAxis 
                            tick={{fill: '#9ca3af', fontSize: 12}} 
                            axisLine={{stroke: '#e5e7eb'}}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'rgba(31, 41, 55, 0.95)', 
                                border: 'none', 
                                borderRadius: '8px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                            }} 
                            itemStyle={{ color: '#e5e7eb' }}
                            formatter={(value, name) => [
                                `${value} ${t('common.claimCount')}`,
                                name === 'onTime' ? t('common.onTimeCompletion') : t('common.overdueCompletion')
                            ]}
                            labelFormatter={(label) => `${t('common.month')}: ${label}`}
                        />
                        <Legend 
                            wrapperStyle={{ color: '#9ca3af' }}
                            formatter={(value) => value === 'onTime' ? t('common.onTimeCompletion') : t('common.overdueCompletion')}
                        />
                        <Bar 
                            dataKey="onTime" 
                            fill="#10b981" 
                            name="onTime"
                            radius={[4, 4, 0, 0]}
                            stackId="completion"
                        />
                        <Bar 
                            dataKey="overdue" 
                            fill="#ef4444" 
                            name="overdue"
                            radius={[4, 4, 0, 0]}
                            stackId="completion"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <UrgentClaimsTable claims={filteredClaims} onClaimSelect={onClaimSelect} />
        </div>
    );
});