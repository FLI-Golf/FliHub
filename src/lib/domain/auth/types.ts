import type { UserRole } from '../schemas/user-profile.schema';

export type { UserRole };

export type Permission = string;

export type Resource =
	| 'users'
	| 'departments'
	| 'vendors'
	| 'pros'
	| 'campaigns'
	| 'tasks'
	| 'approvals'
	| 'invoices'
	| 'contracts'
	| 'tournaments'
	| 'franchise'
	| 'locations'
	| 'reports'
	| 'profile'
	| 'stats';

export type Action = 'read' | 'write' | 'delete' | 'approve' | 'register' | '*';

export type Scope = 'all' | 'own' | 'department' | 'vendor';

export interface PermissionCheck {
	resource: Resource;
	action: Action;
	scope?: Scope;
}

export interface RolePermissions {
	role: UserRole;
	permissions: Permission[];
}

/**
 * Permission format: "resource:action:scope"
 * Examples:
 * - "campaigns:*" - All actions on campaigns
 * - "vendors:read:own" - Read own vendor data
 * - "users:write" - Write users (all)
 * - "*" - All permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	leader: ['*'], // Full access to everything

	admin: [
		'users:read',
		'users:write',
		'departments:*',
		'vendors:*',
		'pros:*',
		'campaigns:*',
		'tasks:*',
		'approvals:*',
		'invoices:read',
		'contracts:read',
		'reports:read'
	],

	vendor: [
		'vendors:read:own',
		'vendors:write:own',
		'invoices:*:own',
		'contracts:read:own',
		'profile:*:own'
	],

	pro: [
		'tournaments:read',
		'tournaments:register',
		'profile:*:own',
		'stats:read:own',
		'contracts:read:own'
	],

	franchise_owner: [
		'franchise:*:own',
		'locations:*:own',
		'reports:read:own',
		'profile:*:own',
		'users:read:own'
	]
};

export const DEFAULT_ROUTES: Record<UserRole, string> = {
	leader: '/dashboard',
	admin: '/dashboard',
	vendor: '/dashboard/vendors',
	pro: '/dashboard/pros',
	franchise_owner: '/dashboard/franchise'
};
