import { Claim, ClaimStatus, User } from '../types';

/**
 * MOCK EMAIL SERVICE
 * In a real full-stack application, these functions would make API calls
 * to a backend endpoint that uses a service like Nodemailer to send actual emails.
 * For this frontend-only example, we are logging the content to the console.
 */

const formatEmail = (to: string, subject: string, body: string) => {
    console.log(`
--------------------------------------------------
--- SIMULATING EMAIL ---
To: ${to}
Subject: ${subject}
--------------------------------------------------
${body}
--------------------------------------------------
    `);
};

export const emailService = {
    /**
     * Sends a notification when a new claim is created.
     * @param claim The newly created claim object.
     */
    sendNewClaimNotification: (claim: Claim) => {
        const subject = `[YKK CCMS] New Claim Assigned: ${claim.id}`;
        const body = `
Hello ${claim.assignee.name},

A new customer claim has been created and assigned to you:

  - Claim ID: ${claim.id}
  - Customer: ${claim.customerName}
  - Defect Type: ${claim.defectType}
  - Severity: ${claim.severity}
  - Deadline: ${new Date(claim.deadline).toLocaleString()}

Please review the details and begin the analysis process.

Thank you,
YKK Claim Management System
        `;
        // In a real app, we might also notify a manager.
        formatEmail(claim.assignee.name, subject, body);
    },

    /**
     * Sends a notification when a claim's status is updated.
     * @param claim The updated claim object.
     * @param oldStatus The previous status of the claim.
     */
    sendStatusUpdateNotification: (claim: Claim, oldStatus: ClaimStatus) => {
        const subject = `[YKK CCMS] Status Update for Claim: ${claim.id}`;
        const body = `
Hello Team,

The status for claim ${claim.id} has been updated.

  - Customer: ${claim.customerName}
  - Previous Status: ${oldStatus}
  - New Status: ${claim.status}

Assignee: ${claim.assignee.name}

Thank you,
YKK Claim Management System
        `;
        // Notify the assignee about the change.
        formatEmail(claim.assignee.name, subject, body);
    }
};
