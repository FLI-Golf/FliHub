import type { UserRole } from '$lib/infra/RequestContext';

export type AppShell = 'portal' | 'dashboard' | 'vendor';

export interface RoleNavItem {
	label: string;
	href: string;
	icon: string;
}

export interface DashboardNavItem {
	title: string;
	url: string;
	icon: string;
	roles?: string[];
	badge?: string;
}

export interface DashboardNavGroup {
	id: string;
	title: string;
	labelClass: string;
	activeClass: string;
	hoverClass: string;
	borderClass: string;
	iconActiveClass: string;
	items: DashboardNavItem[];
	roles?: string[];
}

export interface RoleRoutePolicy {
	role: UserRole;
	appShell: AppShell;
	homeHref: string;
	allowPortalLayout: boolean;
	allowedHrefPrefixes: string[];
	portalNav: RoleNavItem[];
}

const ROLE_ROUTE_MANIFEST: Record<UserRole, RoleRoutePolicy> = {
	admin: {
		role: 'admin',
		appShell: 'dashboard',
		homeHref: '/dashboard',
		allowPortalLayout: false,
		allowedHrefPrefixes: ['/dashboard'],
		portalNav: [],
	},
	leader: {
		role: 'leader',
		appShell: 'portal',
		homeHref: '/portal/projects',
		allowPortalLayout: true,
		allowedHrefPrefixes: ['/portal', '/dashboard'],
		portalNav: [
			{ label: 'My Department', href: '/portal/projects', icon: 'FolderKanban' },
			{ label: 'Tasks', href: '/portal/tasks', icon: 'CheckSquare' },
			{ label: 'Expenses', href: '/portal/expenses', icon: 'Receipt' },
		],
	},
	sales: {
		role: 'sales',
		appShell: 'portal',
		homeHref: '/portal/leads',
		allowPortalLayout: true,
		allowedHrefPrefixes: ['/portal', '/dashboard'],
		portalNav: [
			{ label: 'Leads & Pipeline', href: '/portal/leads', icon: 'Target' },
			{ label: 'Territories', href: '/portal/territories', icon: 'MapPin' },
			{ label: 'Schedule', href: '/portal/tournaments', icon: 'Calendar' },
		],
	},
	vendor: {
		role: 'vendor',
		appShell: 'portal',
		homeHref: '/portal/vendor/dashboard',
		allowPortalLayout: true,
		allowedHrefPrefixes: ['/portal/vendor'],
		portalNav: [
			{ label: 'Dashboard', href: '/portal/vendor/dashboard', icon: 'LayoutDashboard' },
			{ label: 'Open Projects', href: '/portal/vendor/projects', icon: 'FolderOpen' },
			{ label: 'My Bids', href: '/portal/vendor/bids', icon: 'FileText' },
		],
	},
	pro: {
		role: 'pro',
		appShell: 'portal',
		homeHref: '/portal/tournaments',
		allowPortalLayout: true,
		allowedHrefPrefixes: ['/portal', '/dashboard'],
		portalNav: [
			{ label: 'Tournament Schedule', href: '/portal/tournaments', icon: 'Calendar' },
			{ label: 'Earnings', href: '/portal/earnings', icon: 'DollarSign' },
		],
	},
	franchise_owner: {
		role: 'franchise_owner',
		appShell: 'portal',
		homeHref: '/portal/franchise',
		allowPortalLayout: true,
		allowedHrefPrefixes: ['/portal', '/dashboard'],
		portalNav: [
			{ label: 'My Franchise', href: '/portal/franchise', icon: 'Trophy' },
			{ label: 'Schedule', href: '/portal/tournaments', icon: 'Calendar' },
		],
	},
	league_owner: {
		role: 'league_owner',
		appShell: 'dashboard',
		homeHref: '/dashboard',
		allowPortalLayout: false,
		allowedHrefPrefixes: ['/dashboard'],
		portalNav: [
			{ label: 'Executive Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
			{ label: 'Financials', href: '/dashboard/use-of-proceeds', icon: 'DollarSign' },
			{ label: 'Active Projects', href: '/dashboard/active-projects', icon: 'Zap' },
		],
	},
	broadcaster: {
		role: 'broadcaster',
		appShell: 'portal',
		homeHref: '/portal/media',
		allowPortalLayout: true,
		allowedHrefPrefixes: ['/portal', '/dashboard'],
		portalNav: [
			{ label: 'Media', href: '/portal/media', icon: 'Tv' },
			{ label: 'Schedule', href: '/portal/tournaments', icon: 'Calendar' },
		],
	},
	manager: {
		role: 'manager',
		appShell: 'portal',
		homeHref: '/portal/payments',
		allowPortalLayout: true,
		allowedHrefPrefixes: ['/portal', '/dashboard'],
		portalNav: [
			{ label: 'Payments', href: '/portal/payments', icon: 'DollarSign' },
			{ label: 'Schedule', href: '/portal/tournaments', icon: 'Calendar' },
		],
	},
	marketing: {
		role: 'marketing',
		appShell: 'portal',
		homeHref: '/portal/marketing/goals',
		allowPortalLayout: true,
		allowedHrefPrefixes: ['/portal', '/dashboard'],
		portalNav: [
			{ label: 'Goals', href: '/portal/marketing/goals', icon: 'Target' },
			{ label: 'Campaigns', href: '/portal/marketing/campaigns', icon: 'Megaphone' },
		],
	},
	marketing_lead: {
		role: 'marketing_lead',
		appShell: 'portal',
		homeHref: '/portal/marketing/dashboard',
		allowPortalLayout: true,
		allowedHrefPrefixes: ['/portal', '/dashboard'],
		portalNav: [
			{ label: 'Dashboard', href: '/portal/marketing/dashboard', icon: 'LayoutDashboard' },
			{ label: 'Goals', href: '/portal/marketing/goals', icon: 'Target' },
			{ label: 'Campaigns', href: '/portal/marketing/campaigns', icon: 'Megaphone' },
			{ label: 'Sponsorships', href: '/portal/marketing/sponsors', icon: 'Handshake' },
		],
	},
};

const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
	{
		id: 'manager-portal',
		title: 'My Portal',
		labelClass: 'text-amber-600 dark:text-amber-400',
		activeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100',
		hoverClass: 'hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-100',
		borderClass: 'border-amber-500',
		iconActiveClass: 'text-amber-600 dark:text-amber-400',
		roles: ['manager', 'pro', 'broadcaster'],
		items: [
			{ title: 'My Payments', url: '/dashboard/my-payments', icon: 'Wallet', roles: ['manager', 'pro', 'broadcaster'] },
			{ title: 'My Reimbursements', url: '/dashboard/reimbursements', icon: 'Receipt', roles: ['manager', 'pro', 'broadcaster'] },
			{ title: 'My Profile', url: '/portal/player-profile', icon: 'UserCircle', roles: ['manager', 'pro', 'broadcaster'] },
			{ title: 'Settings', url: '/dashboard/settings', icon: 'BadgeCheck', roles: ['manager', 'pro', 'broadcaster'] },
		],
	},
	{
		id: 'onboarding',
		title: 'My Onboarding',
		labelClass: 'text-emerald-600 dark:text-emerald-400',
		activeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100',
		hoverClass: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-100',
		borderClass: 'border-emerald-500',
		iconActiveClass: 'text-emerald-600 dark:text-emerald-400',
		roles: ['pro', 'manager', 'broadcaster'],
		items: [
			{ title: 'Welcome', url: '/dashboard/welcome', icon: 'PartyPopper', roles: ['pro', 'manager', 'broadcaster'] },
			{ title: 'Documents & Signing', url: '/dashboard/onboarding', icon: 'FileText', roles: ['pro', 'manager', 'broadcaster'] },
			{ title: 'Player Profile', url: '/portal/player-profile', icon: 'ClipboardList', roles: ['pro', 'manager', 'broadcaster'] },
			{ title: 'Onboarding Pipeline', url: '/dashboard/onboarding/admin', icon: 'FolderKanban', roles: ['admin', 'leader'] },
		],
	},
	{
		id: 'overview',
		title: 'Overview',
		labelClass: 'text-slate-500 dark:text-slate-400',
		activeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
		hoverClass: 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
		borderClass: 'border-slate-500',
		iconActiveClass: 'text-slate-700 dark:text-slate-200',
		roles: ['admin', 'leader', 'sales', 'marketing', 'marketing_lead'],
		items: [
			{ title: 'Dashboard', url: '/dashboard', icon: 'LayoutDashboard', roles: ['admin', 'leader', 'sales', 'marketing', 'marketing_lead'] },
			{ title: 'Active Projects', url: '/dashboard/active-projects', icon: 'Zap', roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
			{ title: 'Active Goals', url: '/dashboard/active-goals', icon: 'Target', roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
			{ title: 'Manage Events', url: '/dashboard/manage-events', icon: 'PartyPopper', roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
			{ title: 'Manage Media Content', url: '/dashboard/manage-media-content', icon: 'Images', roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
			{ title: 'Manage Bank Accounts', url: '/dashboard/bank-accounts', icon: 'Landmark', roles: ['admin', 'leader'] },
			{ title: 'Active Income', url: '/dashboard/active-income', icon: 'TrendingUp', roles: ['admin', 'leader'] },
		],
	},
	{
		id: 'sales',
		title: 'Sales',
		labelClass: 'text-emerald-600 dark:text-emerald-400',
		activeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100',
		hoverClass: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-100',
		borderClass: 'border-emerald-500',
		iconActiveClass: 'text-emerald-600 dark:text-emerald-400',
		roles: ['sales', 'admin'],
		items: [
			{ title: 'Franchise Sales', url: '/dashboard/sales', icon: 'TrendingUp', roles: ['sales', 'admin'] },
			{ title: 'Franchise Forecast', url: '/dashboard/franchise-sales', icon: 'BarChart3', roles: ['sales', 'admin'] },
			{ title: 'Franchises', url: '/dashboard/franchises', icon: 'Trophy' },
			{ title: 'Sponsors', url: '/dashboard/sponsors', icon: 'Star', roles: ['sales', 'admin', 'marketing_lead'] },
			{ title: 'Collections', url: '/dashboard/sponsor-collections', icon: 'DollarSign', roles: ['sales', 'admin', 'marketing_lead'] },
			{ title: 'Active Collections', url: '/dashboard/active-collections', icon: 'DollarSign', roles: ['admin'] },
			{ title: 'Territories', url: '/dashboard/territories', icon: 'MapPin', roles: ['sales', 'admin'] },
		],
	},
	{
		id: 'operations',
		title: 'Operations',
		labelClass: 'text-blue-600 dark:text-blue-400',
		activeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100',
		hoverClass: 'hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-900 dark:hover:text-blue-100',
		borderClass: 'border-blue-500',
		iconActiveClass: 'text-blue-600 dark:text-blue-400',
		roles: ['admin', 'leader'],
		items: [
			{ title: 'Departments', url: '/dashboard/departments', icon: 'Building2', roles: ['admin', 'leader'] },
			{ title: 'People', url: '/dashboard/people', icon: 'Users', roles: ['admin', 'leader'] },
			{ title: 'Projects', url: '/dashboard/projects', icon: 'FolderKanban', roles: ['admin', 'leader'] },
			{ title: 'Tasks', url: '/dashboard/tasks', icon: 'ListTodo', roles: ['admin', 'leader'] },
			{ title: 'Expenses', url: '/dashboard/expenses', icon: 'Receipt', roles: ['admin', 'leader'] },
			{ title: 'Vendors', url: '/dashboard/vendors', icon: 'Store', roles: ['admin', 'leader'] },
			{ title: 'Bid Pipeline', url: '/dashboard/bids', icon: 'Send', roles: ['admin', 'leader'] },
			{ title: 'Purchase Orders', url: '/dashboard/purchase-orders', icon: 'FileText', roles: ['admin', 'leader'] },
			{ title: 'Approvals', url: '/dashboard/approvals', icon: 'CheckSquare', roles: ['admin', 'leader'] },
			{ title: 'Work Orders', url: '/dashboard/work-orders', icon: 'ClipboardList', roles: ['admin', 'leader'] },
			{ title: 'Reimbursements', url: '/dashboard/reimbursements', icon: 'Wallet', roles: ['admin', 'leader'] },
			{ title: 'Reimbursements Admin', url: '/dashboard/reimbursements/admin', icon: 'ShieldCheck', roles: ['admin', 'leader'] },
			{ title: 'Media', url: '/dashboard/media', icon: 'Images', roles: ['admin', 'leader'] },
			{ title: 'Content Pipeline', url: '/dashboard/content', icon: 'FolderKanban', roles: ['admin', 'leader'] },
			{ title: 'Continuous Improvements', url: '/dashboard/continuous-improvements', icon: 'Zap', roles: ['admin', 'leader'] },
		],
	},
	{
		id: 'league',
		title: 'League Management',
		labelClass: 'text-violet-600 dark:text-violet-400',
		activeClass: 'bg-violet-50 dark:bg-violet-950/60 text-violet-900 dark:text-violet-100',
		hoverClass: 'hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-900 dark:hover:text-violet-100',
		borderClass: 'border-violet-500',
		iconActiveClass: 'text-violet-600 dark:text-violet-400',
		roles: ['admin', 'leader'],
		items: [
			{ title: 'League Overview', url: '/dashboard/league', icon: 'Award', roles: ['admin', 'leader'] },
			{ title: 'Talent Management', url: '/dashboard/talent', icon: 'UserCircle', roles: ['admin', 'leader'] },
			{ title: 'Tournaments', url: '/dashboard/talent/tournaments', icon: 'Trophy', roles: ['admin', 'leader'] },
			{ title: 'Events', url: '/dashboard/events', icon: 'PartyPopper', roles: ['admin', 'leader'] },
			{ title: 'Event Bookings', url: '/dashboard/events/bookings', icon: 'Music', roles: ['admin', 'leader'] },
			{ title: 'Special Events', url: '/dashboard/talent/special-events', icon: 'Medal', roles: ['admin', 'leader'] },
			{ title: 'Franchise Payouts', url: '/dashboard/talent/franchise-payouts', icon: 'DollarSign', roles: ['admin', 'leader'] },
			{ title: 'Pro Payments', url: '/dashboard/talent/payments', icon: 'Flag', roles: ['admin', 'leader'] },
			{ title: 'Payout Testing', url: '/dashboard/talent/payout-testing', icon: 'Zap', roles: ['admin', 'leader'] },
		],
	},
	{
		id: 'marketing',
		title: 'Marketing',
		roles: ['admin', 'leader', 'marketing', 'marketing_lead'],
		labelClass: 'text-orange-600 dark:text-orange-400',
		activeClass: 'bg-orange-50 dark:bg-orange-950/60 text-orange-900 dark:text-orange-100',
		hoverClass: 'hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-900 dark:hover:text-orange-100',
		borderClass: 'border-orange-500',
		iconActiveClass: 'text-orange-600 dark:text-orange-400',
		items: [
			{ title: 'Marketing Goals', url: '/dashboard/marketing-goals', icon: 'Target', roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
			{ title: 'Geo Marketing', url: '/dashboard/geo-marketing', icon: 'MapPin', roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
			{ title: 'Campaigns', url: '/dashboard/campaigns', icon: 'Megaphone', roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
			{ title: 'New Campaign', url: '/dashboard/marketing/campaigns/new', icon: 'Plus', roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
			{ title: 'Talent & Ambassadors', url: '/dashboard/marketing/talent', icon: 'UserCircle', roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
			{ title: 'Manager Dashboard', url: '/dashboard/managers', icon: 'Users', roles: ['admin'] },
		],
	},
	{
		id: 'legal',
		title: 'Legal & IP',
		labelClass: 'text-violet-600 dark:text-violet-400',
		activeClass: 'bg-violet-50 dark:bg-violet-950/60 text-violet-900 dark:text-violet-100',
		hoverClass: 'hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-900 dark:hover:text-violet-100',
		borderClass: 'border-violet-500',
		iconActiveClass: 'text-violet-600 dark:text-violet-400',
		roles: ['admin'],
		items: [
			{ title: 'Trademark Pipeline', url: '/dashboard/trademarks', icon: 'BadgeCheck', roles: ['admin'] },
			{ title: 'Legal Budget', url: '/dashboard/legal-budget', icon: 'Scale', roles: ['admin'] },
		],
	},
	{
		id: 'finance',
		title: 'Finance',
		labelClass: 'text-amber-600 dark:text-amber-400',
		activeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100',
		hoverClass: 'hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-100',
		borderClass: 'border-amber-500',
		iconActiveClass: 'text-amber-600 dark:text-amber-400',
		roles: ['admin', 'marketing', 'marketing_lead'],
		items: [
			{ title: 'Payments & Income', url: '/dashboard/payments', icon: 'Wallet', roles: ['admin'] },
			{ title: 'Income Pipeline', url: '/dashboard/income', icon: 'ArrowDownLeft', roles: ['admin'] },
			{ title: 'Ticket Revenue', url: '/dashboard/ticket-revenue', icon: 'Ticket', roles: ['admin', 'leader'] },
			{ title: 'Financial Projections', url: '/dashboard/financial-projections', icon: 'BarChart3', roles: ['admin', 'marketing', 'marketing_lead'] },
			{ title: 'Funding Model', url: '/dashboard/funding-model', icon: 'Landmark', roles: ['admin'] },
			{ title: 'Use of Proceeds', url: '/dashboard/use-of-proceeds', icon: 'DollarSign', roles: ['admin', 'marketing', 'marketing_lead'] },
			{ title: 'Travel Budget', url: '/dashboard/travel-budget', icon: 'Plane', roles: ['admin'] },
			{ title: 'Prize Purse', url: '/dashboard/prize-purse', icon: 'Trophy', roles: ['admin'] },
			{ title: 'Entertainment', url: '/dashboard/entertainment', icon: 'Music', roles: ['admin'] },
			{ title: 'Player Travel', url: '/dashboard/player-travel', icon: 'Luggage', roles: ['admin'] },
			{ title: 'Stage Production', url: '/dashboard/stage-production', icon: 'Mic2', roles: ['admin'] },
			{ title: 'On-Course Branding', url: '/dashboard/on-course-branding', icon: 'Flag', roles: ['admin'] },
			{ title: 'Branding Revenue', url: '/dashboard/on-course-branding/pipeline', icon: 'TrendingUp', roles: ['admin', 'leader'] },
			{ title: 'Advertising', url: '/dashboard/advertising', icon: 'Megaphone', roles: ['admin', 'marketing', 'marketing_lead'] },
			{ title: 'Stadium Course #1', url: '/dashboard/stadium-course', icon: 'Hammer', roles: ['admin'] },
			{ title: 'Scoreboards', url: '/dashboard/stadium-course/scoreboards', icon: 'Monitor', roles: ['admin'] },
			{ title: 'Sponsorship Revenue', url: '/dashboard/sponsorship-revenue', icon: 'Star', roles: ['admin', 'marketing', 'marketing_lead'] },
			{ title: 'Bag Licensing', url: '/dashboard/bag-licensing', icon: 'ShoppingBag', roles: ['admin'] },
			{ title: 'Disc Licensing', url: '/dashboard/disc-licensing', icon: 'Disc3', roles: ['admin'] },
			{ title: 'Fantasy & Gaming', url: '/dashboard/fantasy-gaming', icon: 'Gamepad2', roles: ['admin'] },
			{ title: 'Streaming & Media', url: '/dashboard/streaming-media', icon: 'Tv', roles: ['admin'] },
			{ title: 'League Licensing', url: '/dashboard/league-licensing', icon: 'FileText', roles: ['admin'] },
		],
	},
	{
		id: 'system',
		title: 'System',
		labelClass: 'text-rose-600 dark:text-rose-400',
		activeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100',
		hoverClass: 'hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-900 dark:hover:text-rose-100',
		borderClass: 'border-rose-500',
		iconActiveClass: 'text-rose-600 dark:text-rose-400',
		roles: ['admin'],
		items: [
			{ title: 'Import Data', url: '/dashboard/import', icon: 'Upload', roles: ['admin'] },
			{ title: 'Admin Panel', url: '/dashboard/admin', icon: 'ShieldCheck', roles: ['admin'] },
			{ title: '[TEMP] Pipeline Tests', url: '/dashboard/pipeline-tests', icon: 'Zap', roles: ['admin'] },
		],
	},
];

export function getRoleRoutePolicy(role: string | null | undefined): RoleRoutePolicy {
	const normalized = (role ?? 'leader') as UserRole;
	return ROLE_ROUTE_MANIFEST[normalized] ?? ROLE_ROUTE_MANIFEST.leader;
}

export function getRoleHomeHref(role: string | null | undefined): string {
	return getRoleRoutePolicy(role).homeHref;
}

export function getRolePortalNav(role: string | null | undefined): RoleNavItem[] {
	const policy = getRoleRoutePolicy(role);
	const profileHref = role === 'pro' || role === 'manager' || role === 'broadcaster'
		? '/portal/player-profile'
		: '/portal/profile';
	const withProfile = [
		...policy.portalNav,
		{ label: 'My Profile', href: profileHref, icon: 'User' },
	];

	const seen = new Set<string>();
	return withProfile.filter((item) => {
		if (seen.has(item.href)) return false;
		seen.add(item.href);
		return canRoleAccessHref(role, item.href);
	});
}

function roleCanSee(roles: string[] | undefined, role: string): boolean {
	if (!roles || roles.length === 0) return true;
	return roles.includes(role);
}

export function getDashboardNavGroups(role: string | null | undefined): DashboardNavGroup[] {
	const normalizedRole = role ?? 'admin';

	return DASHBOARD_NAV_GROUPS
		.filter((group) => normalizedRole === 'admin' || roleCanSee(group.roles, normalizedRole))
		.map((group) => ({
			...group,
			items: group.items.filter((item) => {
				if (!canRoleAccessHref(normalizedRole, item.url)) return false;
				if (normalizedRole === 'admin') return true;
				return roleCanSee(item.roles, normalizedRole);
			}),
		}))
		.filter((group) => group.items.length > 0);
}

function matchesPrefix(pathname: string, prefix: string): boolean {
	if (pathname === prefix) return true;
	const normalized = prefix.endsWith('/') ? prefix : `${prefix}/`;
	return pathname.startsWith(normalized);
}

export function canRoleAccessHref(role: string | null | undefined, href: string): boolean {
	const policy = getRoleRoutePolicy(role);
	const pathname = (href || '').split('?')[0].split('#')[0] || '/';
	if (matchesPrefix(pathname, '/portal/vendor') && policy.role !== 'vendor') {
		return false;
	}
	return policy.allowedHrefPrefixes.some((prefix) => matchesPrefix(pathname, prefix));
}
