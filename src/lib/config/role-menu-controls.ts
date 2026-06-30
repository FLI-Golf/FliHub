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
	// ── My Portal ──
	{ title: 'My Payments', url: '/dashboard/my-payments' },
	{ title: 'My Reimbursements', url: '/dashboard/reimbursements' },
	{ title: 'Reimbursements Admin', url: '/dashboard/reimbursements/admin' },
	{ title: 'My Profile', url: '/dashboard/player-profile' },
	{ title: 'Settings', url: '/dashboard/settings' },
	// ── My Onboarding ──
	{ title: 'Welcome', url: '/dashboard/welcome' },
	{ title: 'Documents & Signing', url: '/dashboard/onboarding' },
	// ── Overview ──
	{ title: 'Active Projects', url: '/dashboard/active-projects' },
	{ title: 'Active Goals', url: '/dashboard/active-goals' },
	{ title: 'Manage Events', url: '/dashboard/manage-events' },
	{ title: 'Manage Media Content', url: '/dashboard/manage-media-content' },
	{ title: 'Manage Bank Accounts', url: '/dashboard/bank-accounts' },
	{ title: 'Active Income', url: '/dashboard/active-income' },
	// ── Sales ──
	{ title: 'Franchise Sales', url: '/dashboard/sales' },
	{ title: 'Franchise Forecast', url: '/dashboard/franchise-sales' },
	{ title: 'Franchises', url: '/dashboard/franchises' },
	{ title: 'Sponsors', url: '/dashboard/sponsors' },
	{ title: 'Collections', url: '/dashboard/sponsor-collections' },
	{ title: 'Active Collections', url: '/dashboard/active-collections' },
	{ title: 'Territories', url: '/dashboard/territories' },
	// ── Operations ──
	{ title: 'Departments', url: '/dashboard/departments' },
	{ title: 'People', url: '/dashboard/people' },
	{ title: 'Projects', url: '/dashboard/projects' },
	{ title: 'Tasks', url: '/dashboard/tasks' },
	{ title: 'Expenses', url: '/dashboard/expenses' },
	{ title: 'Vendors', url: '/dashboard/vendors' },
	{ title: 'Bid Pipeline', url: '/dashboard/bids' },
	{ title: 'Purchase Orders', url: '/dashboard/purchase-orders' },
	{ title: 'Approvals', url: '/dashboard/approvals' },
	{ title: 'Work Orders', url: '/dashboard/work-orders' },
	{ title: 'Import Data', url: '/dashboard/import' },
	{ title: 'Media', url: '/dashboard/media' },
	{ title: 'Content Pipeline', url: '/dashboard/content' },
	{ title: 'Continuous Improvements', url: '/dashboard/continuous-improvements' },
	// ── League Management ──
	{ title: 'League Logos', url: '/dashboard/league' },
	{ title: 'Talent Management', url: '/dashboard/talent' },
	{ title: 'Tournaments', url: '/dashboard/talent/tournaments' },
	{ title: 'Events', url: '/dashboard/events' },
	{ title: 'Event Bookings', url: '/dashboard/events/bookings' },
	{ title: 'Special Events', url: '/dashboard/talent/special-events' },
	{ title: 'Franchise Payouts', url: '/dashboard/talent/franchise-payouts' },
	{ title: 'Pro Payments', url: '/dashboard/talent/payments' },
	{ title: 'Payout Testing', url: '/dashboard/talent/payout-testing' },
	// ── Marketing ──
	{ title: 'Marketing Goals', url: '/dashboard/marketing-goals' },
	{ title: 'Geo Marketing', url: '/dashboard/geo-marketing' },
	{ title: 'Campaigns', url: '/dashboard/campaigns' },
	{ title: 'New Campaign', url: '/dashboard/marketing/campaigns/new' },
	{ title: 'Talent & Ambassadors', url: '/dashboard/marketing/talent' },
	{ title: 'Manager Dashboard', url: '/dashboard/managers' },
	// ── Legal & IP ──
	{ title: 'Trademark Pipeline', url: '/dashboard/trademarks' },
	{ title: 'Legal Budget', url: '/dashboard/legal-budget' },
	// ── Finance ──
	{ title: 'Payments & Income', url: '/dashboard/payments' },
	{ title: 'Income Pipeline', url: '/dashboard/income' },
	{ title: 'Ticket Revenue', url: '/dashboard/ticket-revenue' },
	{ title: 'Financial Projections', url: '/dashboard/financial-projections' },
	{ title: 'Funding Model', url: '/dashboard/funding-model' },
	{ title: 'Use of Proceeds', url: '/dashboard/use-of-proceeds' },
	{ title: 'Travel Budget', url: '/dashboard/travel-budget' },
	{ title: 'Prize Purse', url: '/dashboard/prize-purse' },
	{ title: 'Entertainment', url: '/dashboard/entertainment' },
	{ title: 'Player Travel', url: '/dashboard/player-travel' },
	{ title: 'Stage Production', url: '/dashboard/stage-production' },
	{ title: 'On-Course Branding', url: '/dashboard/on-course-branding' },
	{ title: 'Branding Revenue', url: '/dashboard/on-course-branding/pipeline' },
	{ title: 'Advertising', url: '/dashboard/advertising' },
	{ title: 'Stadium Course #1', url: '/dashboard/stadium-course' },
	{ title: 'Scoreboards', url: '/dashboard/stadium-course/scoreboards' },
	{ title: 'Sponsorship Revenue', url: '/dashboard/sponsorship-revenue' },
	{ title: 'Bag Licensing', url: '/dashboard/bag-licensing' },
	{ title: 'Disc Licensing', url: '/dashboard/disc-licensing' },
	{ title: 'Fantasy & Gaming', url: '/dashboard/fantasy-gaming' },
	{ title: 'Streaming & Media', url: '/dashboard/streaming-media' },
	{ title: 'League Licensing', url: '/dashboard/league-licensing' },
	// ── System ──
	{ title: 'Admin Panel', url: '/dashboard/admin' },
	{ title: 'Pipeline Tests', url: '/dashboard/pipeline-tests' },
];

export type RoleMenuVisibility = Record<string, Record<RoleMenuControlRole, boolean>>;

const ENABLED_BY_DEFAULT: Record<string, RoleMenuControlRole[]> = {
	// ── My Portal ──
	'/dashboard/my-payments': ['manager', 'pro', 'broadcaster'],
	'/dashboard/reimbursements': ['leader', 'sales', 'marketing_lead', 'franchise_owner', 'league_owner', 'manager', 'pro', 'broadcaster'],
	'/dashboard/reimbursements/admin': ['manager', 'pro', 'broadcaster'],
	'/dashboard/player-profile': ['manager', 'pro', 'broadcaster'],
	'/dashboard/settings': ['manager', 'pro', 'broadcaster'],
	// ── My Onboarding ──
	'/dashboard/welcome': ['pro', 'manager', 'broadcaster'],
	'/dashboard/onboarding': ['pro', 'manager', 'broadcaster'],
	// ── Overview ──
	'/dashboard/active-projects': ['leader', 'marketing', 'marketing_lead'],
	'/dashboard/active-goals': ['leader', 'marketing', 'marketing_lead'],
	'/dashboard/manage-events': ['leader', 'marketing', 'marketing_lead'],
	'/dashboard/manage-media-content': ['leader', 'marketing', 'marketing_lead'],
	'/dashboard/bank-accounts': ['leader'],
	'/dashboard/active-income': ['leader'],
	// ── Sales ──
	'/dashboard/sales': ['sales'],
	'/dashboard/franchise-sales': ['sales'],
	'/dashboard/franchises': ['sales'],
	'/dashboard/sponsors': ['leader', 'sales', 'marketing_lead', 'marketing'],
	'/dashboard/sponsor-collections': ['sales', 'marketing_lead'],
	'/dashboard/active-collections': [],
	'/dashboard/territories': ['sales'],
	// ── Operations ──
	'/dashboard/departments': ['leader'],
	'/dashboard/people': ['leader'],
	'/dashboard/projects': ['leader'],
	'/dashboard/tasks': ['leader'],
	'/dashboard/expenses': ['leader'],
	'/dashboard/vendors': ['leader'],
	'/dashboard/bids': ['leader'],
	'/dashboard/purchase-orders': ['leader'],
	'/dashboard/approvals': ['leader'],
	'/dashboard/work-orders': ['leader'],
	'/dashboard/import': ['leader', 'sales', 'marketing_lead', 'franchise_owner', 'league_owner', 'manager', 'pro', 'broadcaster'],
	'/dashboard/media': ['leader'],
	'/dashboard/content': ['leader'],
	'/dashboard/continuous-improvements': ['leader'],
	// ── League Management ──
	'/dashboard/league': ['leader'],
	'/dashboard/talent': ['leader'],
	'/dashboard/talent/tournaments': ['leader'],
	'/dashboard/events': ['leader'],
	'/dashboard/events/bookings': ['leader'],
	'/dashboard/talent/special-events': ['leader'],
	'/dashboard/talent/franchise-payouts': ['leader'],
	'/dashboard/talent/payments': ['leader'],
	'/dashboard/talent/payout-testing': ['leader'],
	// ── Marketing ──
	'/dashboard/marketing-goals': ['marketing', 'marketing_lead'],
	'/dashboard/geo-marketing': ['marketing', 'marketing_lead'],
	'/dashboard/campaigns': ['marketing', 'marketing_lead'],
	'/dashboard/marketing/campaigns/new': ['marketing', 'marketing_lead'],
	'/dashboard/marketing/talent': ['marketing', 'marketing_lead'],
	'/dashboard/managers': [],
	// ── Legal & IP ──
	'/dashboard/trademarks': [],
	'/dashboard/legal-budget': [],
	// ── Finance ──
	'/dashboard/payments': [],
	'/dashboard/income': [],
	'/dashboard/ticket-revenue': ['leader'],
	'/dashboard/financial-projections': ['marketing', 'marketing_lead'],
	'/dashboard/funding-model': [],
	'/dashboard/use-of-proceeds': ['marketing', 'marketing_lead'],
	'/dashboard/travel-budget': [],
	'/dashboard/prize-purse': [],
	'/dashboard/entertainment': [],
	'/dashboard/player-travel': [],
	'/dashboard/stage-production': [],
	'/dashboard/on-course-branding': [],
	'/dashboard/on-course-branding/pipeline': ['leader'],
	'/dashboard/advertising': ['marketing', 'marketing_lead'],
	'/dashboard/stadium-course': [],
	'/dashboard/stadium-course/scoreboards': [],
	'/dashboard/sponsorship-revenue': ['marketing', 'marketing_lead'],
	'/dashboard/bag-licensing': [],
	'/dashboard/disc-licensing': [],
	'/dashboard/fantasy-gaming': [],
	'/dashboard/streaming-media': [],
	'/dashboard/league-licensing': [],
	// ── System ──
	'/dashboard/admin': [],
	'/dashboard/pipeline-tests': [],
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
