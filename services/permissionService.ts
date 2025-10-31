import { User, Claim, UserRole } from '../types';

const isQCRole = (user: User) => [UserRole.QcManager, UserRole.QcStaff].includes(user.role);
const isDepartmentRole = (user: User) => user.role === UserRole.DepartmentStaff;
const isAdmin = (user: User) => user.role === UserRole.Admin;

// Check if user's department is responsible for the claim's investigation
const isFromResponsibleDepartment = (user: User, claim: Claim) => {
    return user.department === claim.responsibleDepartment;
};

export const permissionService = {
  // Can this user edit ANYTHING on the claim detail page? (To show/hide save/cancel buttons)
  canEditAnythingOnClaim: (user: User, claim: Claim): boolean => {
    if (isAdmin(user)) return true;
    // QC can edit containment and closure
    if (isQCRole(user)) return true;
    // Staff from the responsible department can edit investigation sections
    if (isDepartmentRole(user) && isFromResponsibleDepartment(user, claim)) return true;
    return false;
  },

  // Can edit fields in the header like Status
  canEditClaimHeader: (user: User): boolean => {
    // Only managers and admins should change status or re-assign
    return user.role === UserRole.Admin || user.role === UserRole.QcManager;
  },

  // D3: Containment Actions
  canEditContainmentActions: (user: User): boolean => {
    // QC roles and Admin can set containment actions.
    return isAdmin(user) || isQCRole(user);
  },

  // Investigation Sections: Traceability, RCA (D4), Corrective (D5), Preventive (D6), Validation (D7)
  canEditInvestigation: (user: User, claim: Claim): boolean => {
    // Admin and staff from the responsible department can edit these.
    return isAdmin(user) || (isDepartmentRole(user) && isFromResponsibleDepartment(user, claim));
  },

  // D8: Closure
  canEditClosure: (user: User): boolean => {
    // QC roles and Admin can close the claim and write the summary.
    return isAdmin(user) || isQCRole(user);
  },

  // --- Existing permissions ---
  canDeleteClaim: (user: User): boolean => {
    return isAdmin(user);
  },
  
  canCreateClaim: (user: User): boolean => {
    // Admins, QC Managers, and QC Staff can create claims.
    return [UserRole.Admin, UserRole.QcManager, UserRole.QcStaff].includes(user.role);
  },

  canViewSettings: (user: User): boolean => {
    // Only Admins can access the settings/user management page.
    return user.role === UserRole.Admin;
  },

  canViewReports: (user: User): boolean => {
     // Admins and QC Managers can view reports.
    return [UserRole.Admin, UserRole.QcManager].includes(user.role);
  }
};