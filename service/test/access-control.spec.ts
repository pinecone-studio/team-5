import {
	canAccessOwnEmployeeRecord,
	canReviewBenefitRequests,
	isManagerRole,
	normalizeClerkRole,
} from '../src/graphql/resolvers/shared/access-control';

describe('access control', () => {
	it('normalizes supported Clerk role values', () => {
		expect(normalizeClerkRole('admin')).toBe('admin');
		expect(normalizeClerkRole('hr')).toBe('hr');
		expect(normalizeClerkRole('hr_admin')).toBe('hr');
		expect(normalizeClerkRole('HR Admin')).toBe('hr');
		expect(normalizeClerkRole('HRAdmin')).toBe('hr');
		expect(normalizeClerkRole('financeManager')).toBe('finance_manager');
		expect(normalizeClerkRole('finance-manager')).toBe('finance_manager');
		expect(normalizeClerkRole('finance_admin')).toBe('finance_manager');
		expect(normalizeClerkRole('FinanceAdmin')).toBe('finance_manager');
		expect(normalizeClerkRole('finance')).toBe('finance_manager');
	});

	it('defaults unsupported or missing roles to employee', () => {
		expect(normalizeClerkRole(undefined)).toBe('employee');
		expect(normalizeClerkRole('   ')).toBe('employee');
		expect(normalizeClerkRole(null)).toBe('employee');
		expect(normalizeClerkRole('teacher')).toBe('employee');
	});

	it('recognizes manager and reviewer roles', () => {
		expect(isManagerRole('admin')).toBe(true);
		expect(isManagerRole('hr')).toBe(true);
		expect(isManagerRole('employee')).toBe(false);
		expect(isManagerRole('finance_manager')).toBe(false);
		expect(canReviewBenefitRequests('admin')).toBe(true);
		expect(canReviewBenefitRequests('hr')).toBe(true);
		expect(canReviewBenefitRequests('finance_manager')).toBe(true);
		expect(canReviewBenefitRequests('employee')).toBe(false);
	});

	it('limits employee record access for non-reviewers', () => {
		expect(canAccessOwnEmployeeRecord('employee', 'emp-1', 'emp-1')).toBe(true);
		expect(canAccessOwnEmployeeRecord('employee', 'emp-1', 'emp-2')).toBe(false);
		expect(canAccessOwnEmployeeRecord('admin', 'emp-1', 'emp-2')).toBe(true);
		expect(canAccessOwnEmployeeRecord('finance_manager', 'emp-1', 'emp-2')).toBe(true);
	});
});
