
export const getTimeLeft = (deadline: string): { timeLeft: string; isOverdue: boolean } => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    const isOverdue = diff < 0;
    const absDiff = Math.abs(diff);

    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return { timeLeft: `${isOverdue ? '-' : ''}${hours}h ${minutes}m`, isOverdue };
    }
    
    return { timeLeft: `${isOverdue ? '-' : ''}${minutes}m`, isOverdue };
};
