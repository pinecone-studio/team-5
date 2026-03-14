export type AppRole = 'employee' | 'admin' | 'hr' | 'finance_manager';

function normalizeRoleValue(role: unknown): string | null {
	if (typeof role !== 'string') return null;

	const normalized = role
		.trim()
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
		.toLowerCase()
		.replace(/[\s-]+/g, '_')
		.replace(/_+/g, '_');
	return normalized.length > 0 ? normalized : null;
}

export function normalizeClerkRole(role: unknown): AppRole {
	switch (normalizeRoleValue(role)) {
		case 'admin':
			return 'admin';
		case 'hr':
		case 'hr_admin':
		case 'hradmin':
			return 'hr';
		case 'finance_manager':
		case 'financemanager':
		case 'finance':
		case 'finance_admin':
		case 'financeadmin':
			return 'finance_manager';
		default:
			return 'employee';
	}
}

export function isManagerRole(role: AppRole): boolean {
	return role === 'admin' || role === 'hr';
}

export function canReviewBenefitRequests(role: AppRole): boolean {
	return isManagerRole(role) || role === 'finance_manager';
}

export function canAccessOwnEmployeeRecord(
	role: AppRole,
	authenticatedEmployeeId: string,
	targetEmployeeId: string,
): boolean {
	if (canReviewBenefitRequests(role)) {
		return true;
	}

	return authenticatedEmployeeId === targetEmployeeId;
}
