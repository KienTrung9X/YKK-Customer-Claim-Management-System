// Utility functions for fiscal year calculations (March to April)
export const getFiscalYear = (date: Date): string => {
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    
    if (month >= 4) {
        return `${year}-${year + 1}`;
    } else {
        return `${year - 1}-${year}`;
    }
};

export const getCurrentFiscalYear = (): string => {
    return getFiscalYear(new Date());
};

export const getFiscalYearRange = (fiscalYear: string): { start: Date; end: Date } => {
    const [startYear, endYear] = fiscalYear.split('-').map(Number);
    return {
        start: new Date(startYear, 3, 1), // April 1st
        end: new Date(endYear, 2, 31, 23, 59, 59) // March 31st
    };
};

export const getAvailableFiscalYears = (claims: any[]): string[] => {
    const years = new Set<string>();
    claims.forEach(claim => {
        years.add(getFiscalYear(new Date(claim.createdAt)));
    });
    return Array.from(years).sort().reverse();
};

export const filterClaimsByFiscalYear = (claims: any[], fiscalYear: string): any[] => {
    const { start, end } = getFiscalYearRange(fiscalYear);
    return claims.filter(claim => {
        const claimDate = new Date(claim.createdAt);
        return claimDate >= start && claimDate <= end;
    });
};