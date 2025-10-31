
export const getTimeLeft = (deadline: string): { timeLeft: string; isOverdue: boolean } => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    const isOverdue = diff < 0;
    const absDiff = Math.abs(diff);

    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

    const prefix = isOverdue ? '-' : '';

    if (days > 0) {
        return { timeLeft: `${prefix}${days}d ${hours}h`, isOverdue };
    }
    if (hours > 0) {
        return { timeLeft: `${prefix}${hours}h ${minutes}m`, isOverdue };
    }
    
    return { timeLeft: `${prefix}${minutes}m`, isOverdue };
};