import type { UserRole } from '$lib/infra/RequestContext';

export type RoleMenuControlRole = Exclude<UserRole, 'admin'>;

export type RoleMenuItem = {
	title: string;
	url: string;
};

export const ROLE_MENU_CONTROL_ROLES: RoleMenuControlRole[] = [
	'leader',
	'sales',
	'marketing',
	'marketing_lead',
	'franchise_owner',
	'league_owner',
	'manager',
	'pro',
	'broadcaster',
	'vendor',
];

export const ROLE_MENU_CONTROL_ITEMS: RoleMenuItem[] = [
	{ title: 'Departments', url: '/dashboard/departments' },
	{ title: 'Projects', url: '/dashboard/projects' },
	{ title: 'Expenses', url: '/dashboard/expenses' },
	{ title: 'People', url: '/dashboard/people' },
	{ title: 'Reimbursements', url: '/dashboard/reimbursements' },
	{ title: 'Vendors', url: '/dashboard/vendors' },
	{ title: 'Sponsors', url: '/dashboard/sponsors' },
	{ title: 'Franchises', url: '/dashboard/franchises' },
	{ title: 'Collections', url: '/dashboard/active-collections' },
	{ title: 'Trademarks', url: '/dashboard/trademarks' },
	{ title: 'Import CSV Data', url: '/dashboard/import' },
];

export type RoleMenuVisibility = Record<string, Record<RoleMenuControlRole, boolean>>;

const ENABLED_BY_DEFAULT: Record<string, RoleMenuControlRole[]> = {
	'/dashboard/departments': ['leader', 'league_owner'],
	'/dashboard/projects': ['leader', 'league_owner'],
	'/dashboard/expenses': ['leader', 'league_owner'],
	'/dashboard/people': ['leader', 'league_owner'],
	'/dashboard/reimbursements': ['leader', 'sales', 'marketing_lead', 'franchise_owner', 'league_owner', 'manager', 'pro', 'broadcaster'],
	'/dashboard/vendors': ['leader', 'league_owner'],
	'/dashboard/sponsors': ['leader', 'sales', 'marketing_lead', 'marketing'],
	'/dashboard/franchises': ['sales'],
	'/dashboard/active-collections': [],
	'/dashboard/trademarks': [],
	'/dashboard/import': ['leader', 'sales', 'marketing_lead', 'franchise_owner', 'league_owner', 'manager', 'pro', 'broadcaster'],
};

export function createDefaultRoleMenuVisibility(): RoleMenuVisibility {
	const visibility: RoleMenuVisibility = {};

	for (const item of ROLE_MENU_CONTROL_ITEMS) {
		visibility[item.url] = {} as Record<RoleMenuControlRole, boolean>;
		const enabledRoles = new Set(ENABLED_BY_DEFAULT[item.url] ?? []);
		for (const role of ROLE_MENU_CONTROL_ROLES) {
			visibility[item.url][role] = enabledRoles.has(role);
		}
	}

	return visibility;
}
