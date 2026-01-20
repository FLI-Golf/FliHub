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
		'reports:read',
		'franchise_sales:*'
	],

	sales: [
		'franchise_leads:*',
		'franchise_opportunities:*',
		'franchise_deals:*',
		'franchise_territories:read',
		'projects:read',
		'tasks:*:own',
		'profile:*:own'
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
		'contracts:read:own',
		'pro_payments:read:own'
	],

	franchise_owner: [
		'franchise:*:own',
		'locations:*:own',
		'reports:read:own',
		'profile:*:own',
		'users:read:own'
	],

	league_owner: [
		'league:*:own',
		'tournaments:*:own',
		'reports:read:own',
		'profile:*:own'
	],

	broadcaster: [
		'tournaments:read',
		'pros:read',
		'profile:*:own',
		'broadcasts:*:own'
	],

	manager: [
		'pros:read:managed',
		'pros:write:managed',
		'pro_payments:read:managed',
		'contracts:read:managed',
		'tournaments:read',
		'profile:*:own'
	]
};

export const DEFAULT_ROUTES: Record<UserRole, string> = {
	leader: '/dashboard',
	admin: '/dashboard',
	sales: '/dashboard/sales',
	vendor: '/dashboard/vendors',
	pro: '/dashboard/talent',
	franchise_owner: '/dashboard/franchise',
	league_owner: '/dashboard/league',
	broadcaster: '/dashboard/broadcasts',
	manager: '/dashboard/managed-pros'
};
