/**
 * RolePorthole — OOP pattern for role-specific portal experiences.
 *
 * Each user role gets a dedicated porthole (portal dashboard) with its own
 * branding, navigation, and quick-stat configuration. This mirrors the
 * existing /vendor/dashboard porthole but extends the pattern to all roles.
 *
 * Usage:
 *   const porthole = PortholeFactory.for('admin');
 *   porthole.config.nav  // nav items for the sidebar
 *   porthole.config.accentTw  // tailwind accent color classes
 */

export type PortalRole =
	| 'admin'
	| 'leader'
	| 'sales'
	| 'vendor'
	| 'pro'
	| 'franchise_owner'
	| 'league_owner'
	| 'broadcaster'
	| 'manager'
	| 'marketing'
	| 'marketing_lead';

// ── Data structures ───────────────────────────────────────────────────────────

export interface PortholeNavItem {
	label: string;
	href: string;
	/** Lucide icon name string — resolved to component by the Svelte layout */
	icon: string;
}

export interface PortholeQuickStat {
	key: string;
	label: string;
	sub: string;
	icon: string;
}

export interface PortholeConfig {
	role: PortalRole;
	/** Human-readable role label */
	label: string;
	/** Short descriptor shown under the logo */
	tagline: string;
	/** Total users with this role (for display only) */
	userCount: number;
	/** Tailwind text + border color for accent elements */
	accentTw: string;
	/** Tailwind bg classes for the logo icon square */
	logoBg: string;
	/** Tailwind gradient for avatar/logo */
	logoGradient: string;
	/** Sidebar nav items */
	nav: PortholeNavItem[];
	/** KPI strip items shown on the dashboard page */
	quickStats: PortholeQuickStat[];
	/** Primary CTA button on dashboard */
	primaryAction: { label: string; href: string };
}

// ── Abstract base ─────────────────────────────────────────────────────────────

export abstract class RolePorthole {
	abstract readonly config: PortholeConfig;

	getNavItems(): PortholeNavItem[] {
		// Profile link is always appended so every porthole has it
		return [
			...this.config.nav,
			{ label: 'My Profile', href: '/portal/profile', icon: 'User' },
		];
	}

	getQuickStats(): PortholeQuickStat[] {
		return this.config.quickStats;
	}

	getPrimaryAction(): { label: string; href: string } {
		return this.config.primaryAction;
	}

	/** Welcome greeting shown at the top of the dashboard */
	greet(name: string): string {
		return `Welcome back, ${name}`;
	}
}

// ── Concrete porthole classes ─────────────────────────────────────────────────

export class AdminPorthole extends RolePorthole {
	readonly config: PortholeConfig = {
		role: 'admin',
		label: 'Admin',
		tagline: 'Full System Access',
		userCount: 7,
		accentTw: 'text-violet-400 border-violet-500',
		logoBg: 'bg-violet-600',
		logoGradient: 'from-violet-600 to-purple-700',
		nav: [
			{ label: 'Dashboard',       href: '/dashboard',                icon: 'LayoutDashboard' },
			{ label: 'Active Projects', href: '/dashboard/active-projects', icon: 'Zap' },
			{ label: 'Sponsors',        href: '/dashboard/sponsors',        icon: 'Star' },
			{ label: 'Franchises',      href: '/dashboard/franchises',      icon: 'Trophy' },
			{ label: 'People',          href: '/dashboard/people',          icon: 'Users' },
			{ label: 'Financials',      href: '/dashboard/use-of-proceeds', icon: 'DollarSign' },
			{ label: 'Import',          href: '/dashboard/import',          icon: 'Upload' },
		],
		quickStats: [
			{ key: 'activeProjects', label: 'Active Projects', sub: 'in flight',   icon: 'FolderKanban' },
			{ key: 'sponsors',       label: 'Sponsors',        sub: 'contracted',  icon: 'Star' },
			{ key: 'franchises',     label: 'Franchises',      sub: 'sold',        icon: 'Trophy' },
			{ key: 'openTasks',      label: 'Open Tasks',      sub: 'pending',     icon: 'CheckSquare' },
		],
		primaryAction: { label: 'Main Dashboard', href: '/dashboard' },
	};

	override greet(name: string): string {
		return `Admin Dashboard — ${name}`;
	}
}

export class LeaderPorthole extends RolePorthole {
	readonly config: PortholeConfig = {
		role: 'leader',
		label: 'Leader',
		tagline: 'Department Leadership',
		userCount: 9,
		accentTw: 'text-blue-400 border-blue-500',
		logoBg: 'bg-blue-600',
		logoGradient: 'from-blue-600 to-indigo-700',
		nav: [
			{ label: 'My Department', href: '/portal/projects',  icon: 'FolderKanban' },
			{ label: 'Tasks',         href: '/portal/tasks',     icon: 'CheckSquare'  },
			{ label: 'Expenses',      href: '/portal/expenses',  icon: 'Receipt'      },
		],
		quickStats: [
			{ key: 'activeProjects', label: 'Active Projects', sub: 'in dept',    icon: 'FolderKanban' },
			{ key: 'openTasks',      label: 'Open Tasks',      sub: 'pending',    icon: 'CheckSquare' },
			{ key: 'expenses',       label: 'Expenses',        sub: 'submitted',  icon: 'Receipt' },
			{ key: 'teamSize',       label: 'Team Members',    sub: 'in dept',    icon: 'Users' },
		],
		primaryAction: { label: 'My Department', href: '/portal/projects' },
	};
}

export class SalesPorthole extends RolePorthole {
	readonly config: PortholeConfig = {
		role: 'sales',
		label: 'Sales',
		tagline: 'Franchise Sales',
		userCount: 4,
		accentTw: 'text-amber-400 border-amber-500',
		logoBg: 'bg-amber-600',
		logoGradient: 'from-amber-500 to-orange-600',
		nav: [
			{ label: 'Leads & Pipeline', href: '/portal/leads',        icon: 'Target'    },
			{ label: 'Territories',      href: '/portal/territories',  icon: 'MapPin'    },
			{ label: 'Schedule',         href: '/portal/tournaments',  icon: 'Calendar'  },
		],
		quickStats: [
			{ key: 'leads',       label: 'Active Leads',    sub: 'in pipeline',  icon: 'Target' },
			{ key: 'pipeline',    label: 'In Pipeline',     sub: 'opportunities', icon: 'TrendingUp' },
			{ key: 'closedDeals', label: 'Closed Deals',    sub: 'signed',        icon: 'CheckCircle2' },
			{ key: 'revenue',     label: 'Pipeline Value',  sub: 'projected',     icon: 'DollarSign' },
		],
		primaryAction: { label: 'Leads & Pipeline', href: '/portal/leads' },
	};
}

export class VendorPorthole extends RolePorthole {
	readonly config: PortholeConfig = {
		role: 'vendor',
		label: 'Vendor',
		tagline: 'Vendor Portal',
		userCount: 5,
		accentTw: 'text-orange-400 border-orange-500',
		logoBg: 'bg-orange-600',
		logoGradient: 'from-orange-500 to-amber-600',
		nav: [
			{ label: 'Dashboard',      href: '/portal/vendor/dashboard', icon: 'LayoutDashboard' },
			{ label: 'Open Projects',  href: '/portal/vendor/projects',  icon: 'FolderOpen' },
			{ label: 'My Bids',        href: '/portal/vendor/bids',      icon: 'FileText' },
		],
		quickStats: [
			{ key: 'openProjects', label: 'Open Projects', sub: 'to bid on',  icon: 'FolderOpen' },
			{ key: 'totalBids',    label: 'Total Bids',    sub: 'submitted',  icon: 'FileText' },
			{ key: 'shortlisted',  label: 'Shortlisted',   sub: 'in review',  icon: 'Star' },
			{ key: 'awarded',      label: 'Awarded',        sub: 'won',        icon: 'Trophy' },
		],
		primaryAction: { label: 'Vendor Dashboard', href: '/portal/vendor/dashboard' },
	};
}

export class ProPorthole extends RolePorthole {
	readonly config: PortholeConfig = {
		role: 'pro',
		label: 'Pro',
		tagline: 'Professional Player',
		userCount: 24,
		accentTw: 'text-emerald-400 border-emerald-500',
		logoBg: 'bg-emerald-600',
		logoGradient: 'from-emerald-500 to-green-700',
		nav: [
			{ label: 'Tournament Schedule', href: '/portal/tournaments', icon: 'Calendar'   },
			{ label: 'Earnings',            href: '/portal/earnings',   icon: 'DollarSign' },
		],
		quickStats: [
			{ key: 'tournaments', label: 'Tournaments',    sub: 'upcoming',     icon: 'Calendar' },
			{ key: 'earnings',    label: 'Earnings',       sub: 'YTD',          icon: 'DollarSign' },
			{ key: 'rank',        label: 'Current Rank',   sub: 'in standings', icon: 'Trophy' },
			{ key: 'events',      label: 'Events Played',  sub: 'this season',  icon: 'CheckCircle2' },
		],
		primaryAction: { label: 'Tournament Schedule', href: '/portal/tournaments' },
	};

	override greet(name: string): string {
		return `Welcome, ${name} 🏆`;
	}
}

export class FranchiseOwnerPorthole extends RolePorthole {
	readonly config: PortholeConfig = {
		role: 'franchise_owner',
		label: 'Franchise Owner',
		tagline: 'Franchise Operations',
		userCount: 12,
		accentTw: 'text-yellow-400 border-yellow-500',
		logoBg: 'bg-yellow-600',
		logoGradient: 'from-yellow-500 to-amber-600',
		nav: [
			{ label: 'My Franchise',  href: '/portal/franchise',    icon: 'Trophy'    },
			{ label: 'Schedule',      href: '/portal/tournaments',  icon: 'Calendar'  },
		],
		quickStats: [
			{ key: 'franchises',  label: 'Franchises',  sub: 'owned',       icon: 'Trophy'    },
			{ key: 'territories', label: 'Territories', sub: 'covered',     icon: 'MapPin'    },
			{ key: 'deals',       label: 'Active Deals', sub: 'signed',     icon: 'CheckCircle2' },
			{ key: 'revenue',     label: 'Revenue',     sub: 'projected',   icon: 'DollarSign' },
		],
		primaryAction: { label: 'My Franchise', href: '/portal/franchise' },
	};
}

export class LeagueOwnerPorthole extends RolePorthole {
	readonly config: PortholeConfig = {
		role: 'league_owner',
		label: 'League Owner',
		tagline: 'League Executive',
		userCount: 1,
		accentTw: 'text-rose-400 border-rose-500',
		logoBg: 'bg-rose-700',
		logoGradient: 'from-rose-600 to-red-800',
		nav: [
			{ label: 'Executive Dashboard', href: '/dashboard',                  icon: 'LayoutDashboard' },
			{ label: 'Financials',          href: '/dashboard/use-of-proceeds',  icon: 'DollarSign' },
			{ label: 'Active Projects',     href: '/dashboard/active-projects',  icon: 'Zap' },
			{ label: 'Sponsors',            href: '/dashboard/sponsors',         icon: 'Star' },
			{ label: 'Franchises',          href: '/dashboard/franchises',       icon: 'Trophy' },
			{ label: 'Analytics',           href: '/dashboard/active-income',    icon: 'TrendingUp' },
		],
		quickStats: [
			{ key: 'totalRevenue',   label: 'Total Revenue',   sub: 'projected',  icon: 'DollarSign' },
			{ key: 'sponsors',       label: 'Sponsors',        sub: 'active',     icon: 'Star' },
			{ key: 'franchises',     label: 'Franchises',      sub: 'sold',       icon: 'Trophy' },
			{ key: 'activeProjects', label: 'Active Projects', sub: 'in flight',  icon: 'Zap' },
		],
		primaryAction: { label: 'Executive Dashboard', href: '/dashboard' },
	};

	override greet(name: string): string {
		return `League Executive — ${name}`;
	}
}

export class BroadcasterPorthole extends RolePorthole {
	readonly config: PortholeConfig = {
		role: 'broadcaster',
		label: 'Broadcaster',
		tagline: 'Media & Broadcast',
		userCount: 10,
		accentTw: 'text-cyan-400 border-cyan-500',
		logoBg: 'bg-cyan-600',
		logoGradient: 'from-cyan-500 to-teal-700',
		nav: [
			{ label: 'Tournament Schedule', href: '/portal/tournaments', icon: 'Calendar' },
			{ label: 'Media Hub',           href: '/portal/media',       icon: 'Film'     },
		],
		quickStats: [
			{ key: 'tournaments', label: 'Upcoming Events',  sub: 'to cover',    icon: 'Calendar' },
			{ key: 'events',      label: 'Events',          sub: 'scheduled',   icon: 'Tv' },
			{ key: 'contentItems', label: 'Content Items',  sub: 'in pipeline', icon: 'Film' },
			{ key: 'mediaAssets', label: 'Media Assets',    sub: 'published',   icon: 'Images' },
		],
		primaryAction: { label: 'Tournament Schedule', href: '/portal/tournaments' },
	};
}

export class ManagerPorthole extends RolePorthole {
	readonly config: PortholeConfig = {
		role: 'manager',
		label: 'Manager',
		tagline: 'Player Management',
		userCount: 2,
		accentTw: 'text-slate-300 border-slate-400',
		logoBg: 'bg-slate-600',
		logoGradient: 'from-slate-500 to-slate-700',
		nav: [
			{ label: 'Payments',  href: '/portal/payments',    icon: 'DollarSign' },
			{ label: 'Schedule',  href: '/portal/tournaments', icon: 'Calendar'   },
		],
		quickStats: [
			{ key: 'payments',    label: 'Pending Payments', sub: 'to process',  icon: 'DollarSign' },
			{ key: 'tournaments', label: 'Events',           sub: 'upcoming',    icon: 'Calendar' },
		],
		primaryAction: { label: 'Payments', href: '/portal/payments' },
	};
}

export class MarketingPorthole extends RolePorthole {
	readonly config: PortholeConfig = {
		role: 'marketing',
		label: 'Marketing',
		tagline: 'Marketing & Campaigns',
		userCount: 3,
		accentTw: 'text-orange-400 border-orange-500',
		logoBg: 'bg-orange-600',
		logoGradient: 'from-orange-500 to-red-600',
		nav: [
			{ label: 'Goals',      href: '/portal/marketing/goals',  icon: 'Target'     },
			{ label: 'Campaigns',  href: '/portal/marketing/campaigns', icon: 'Megaphone' },
		],
		quickStats: [
			{ key: 'goals',      label: 'Marketing Goals',   sub: 'active',       icon: 'Target' },
			{ key: 'campaigns',  label: 'Campaigns',         sub: 'in progress',  icon: 'Megaphone' },
			{ key: 'tasks',      label: 'Tasks',            sub: 'pending',      icon: 'CheckSquare' },
		],
		primaryAction: { label: 'Marketing Goals', href: '/portal/marketing/goals' },
	};
}

export class MarketingLeadPorthole extends RolePorthole {
	readonly config: PortholeConfig = {
		role: 'marketing_lead',
		label: 'Marketing Lead',
		tagline: 'Marketing Operations',
		userCount: 1,
		accentTw: 'text-orange-400 border-orange-500',
		logoBg: 'bg-orange-600',
		logoGradient: 'from-orange-500 to-red-600',
		nav: [
			{ label: 'Dashboard',    href: '/portal/marketing/dashboard', icon: 'LayoutDashboard' },
			{ label: 'Goals',        href: '/portal/marketing/goals',     icon: 'Target' },
			{ label: 'Campaigns',    href: '/portal/marketing/campaigns', icon: 'Megaphone' },
			{ label: 'Sponsorships', href: '/portal/marketing/sponsors',  icon: 'Handshake' },
		],
		quickStats: [
			{ key: 'goals',      label: 'Marketing Goals',    sub: 'active',      icon: 'Target' },
			{ key: 'campaigns',  label: 'Campaigns',          sub: 'in progress', icon: 'Megaphone' },
			{ key: 'sponsors',   label: 'Sponsors',           sub: 'active',      icon: 'Handshake' },
			{ key: 'budget',     label: 'Budget Remaining',   sub: 'available',   icon: 'DollarSign' },
		],
		primaryAction: { label: 'Marketing Dashboard', href: '/portal/marketing/dashboard' },
	};

	override greet(name: string): string {
		return `Welcome, Marketing Lead — ${name} 📊`;
	}
}

// ── Factory ───────────────────────────────────────────────────────────────────

export class PortholeFactory {
	private static readonly registry = new Map<PortalRole, RolePorthole>([
		['admin',           new AdminPorthole()],
		['leader',          new LeaderPorthole()],
		['sales',           new SalesPorthole()],
		['vendor',          new VendorPorthole()],
		['pro',             new ProPorthole()],
		['franchise_owner', new FranchiseOwnerPorthole()],
		['league_owner',    new LeagueOwnerPorthole()],
		['broadcaster',     new BroadcasterPorthole()],
		['manager',         new ManagerPorthole()],
		['marketing',       new MarketingPorthole()],
		['marketing_lead',  new MarketingLeadPorthole()],
	]);

	/** Returns the porthole for the given role, falling back to admin. */
	static for(role: string): RolePorthole {
		return this.registry.get(role as PortalRole) ?? this.registry.get('admin')!;
	}

	/** Returns the porthole config for the given role. */
	static configFor(role: string): PortholeConfig {
		return this.for(role).config;
	}

	/** All registered porthole configs (useful for admin overview). */
	static all(): PortholeConfig[] {
		return [...this.registry.values()].map(p => p.config);
	}
}
