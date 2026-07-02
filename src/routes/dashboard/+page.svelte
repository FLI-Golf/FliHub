<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		ROLE_MENU_CONTROL_ITEMS,
		ROLE_MENU_CONTROL_ROLES,
		createDefaultRoleMenuVisibility,
		type RoleMenuControlRole,
		type RoleMenuVisibility,
	} from '$lib/config/role-menu-controls';
	import {
		DollarSign, Users, FolderKanban, Receipt,
		Trophy, Star, Building2, TrendingUp, ArrowRight, Flag,
		Video, Wrench, Megaphone, Cpu, Scale, Wallet, ShieldCheck, Globe, Handshake, Medal,
		Landmark, Briefcase, Film, Ticket, BadgeCheck,
		CheckCircle2, Clock, AlertCircle, Images, PartyPopper, UserCircle, Zap, Loader2
	} from 'lucide-svelte';

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	const m = $derived(data.metrics ?? {});
	const sponsors = $derived(data.metrics?.sponsors ?? { total: 0, totalCommitted: 0, totalPaid: 0, byTier: {} });
	const franchise = $derived(data.metrics?.franchise ?? { pipeline: { leads: 0, opportunities: 0, deals: 0 } });
	const tickets  = $derived(data.metrics?.tickets  ?? { totalGross: 0, totalNet: 0, totalReceived: 0, totalProjected: 0, count: 0 });
	const branding = $derived(data.metrics?.branding ?? { totalContracted: 0, totalPaid: 0, totalProposed: 0, count: 0 });
	const cashflow = $derived(data.metrics?.cashflow ?? {
		totalBankBalance: 0,
		projectedRevenue: 0,
		revenueBreakdown: {
			ticketsProjected: 0,
			sponsorsCommitted: 0,
			brandingContracted: 0,
			brandingProposed: 0,
		}
	});
	const deptBudgets = $derived(data.metrics?.departmentBudgets ?? []);
	const budget = $derived(data.metrics?.budget ?? { total: 0, actual: 0, forecasted: 0, remaining: 0, seedRaise: 0, operatingPlanTotal: 0 });
	const projects = $derived(data.metrics?.projects ?? { total: 0, in_progress: 0, planned: 0, completed: 0 });
	const expenses = $derived(data.metrics?.expenses ?? { total: 0, totalAmount: 0, approvedAmount: 0, submitted: 0, approved: 0, paid: 0, draft: 0 });
	const workOrders = $derived(data.metrics?.workOrders ?? { total: 0, totalAmount: 0, open: 0, paid: 0, cancelled: 0 });
	const approvals = $derived(data.metrics?.approvals ?? { pending: 0, approved: 0, rejected: 0 });
	const roleLabel = $derived.by(() => {
		const rawRole = String(data.userProfile?.role ?? '').trim();
		if (!rawRole) return '';
		return rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
	});
	const welcomeName = $derived.by(() => {
		const firstName = String(data.userProfile?.firstName ?? '').trim();
		if (firstName) return firstName;

		const email = String(data.user?.email ?? '').trim();
		if (!email) return 'there';
		const [localPart] = email.split('@');
		return localPart || email;
	});
	const activeRole = $derived(String(data.userProfile?.role ?? ''));
	const isAdmin = $derived(activeRole === 'admin');
	const isLeader = $derived(activeRole === 'leader');
	const myDepartmentId = $derived(String((data as any).userDepartment?.id ?? ''));
	const canUseMyDepartmentsFilter = $derived((isLeader || isAdmin) && Boolean(myDepartmentId));
	const onboardingBadge = $derived((data.onboardingBadge as string | null) ?? null);
	const playerProfileNote = $derived((data.playerProfileNote as string | null) ?? null);
	const onboardingState = $derived((data.onboardingState as {
		stageKey: string;
		stageLabel: string;
		completionPercent: number;
		isComplete: boolean;
		message: string;
		ctaLabel: string;
		ctaHref: string;
	} | null) ?? null);
	const upcoming = $derived((data.upcoming as any) ?? { tournaments: [], specialEvents: [], campaigns: [] });
	const upcomingTournaments = $derived((upcoming.tournaments as any[]) ?? []);
	const upcomingSpecialEvents = $derived((upcoming.specialEvents as any[]) ?? []);
	const upcomingCampaigns = $derived((upcoming.campaigns as any[]) ?? []);
	const canShowOnboardingTestControls = $derived.by(() => {
		const role = String(data.userProfile?.role ?? '').toLowerCase();
		const email = String(data.user?.email ?? '').toLowerCase();
		return role === 'admin' || role === 'leader' || email === 'paige@fligolf.com';
	});
	let pendingOnboardingAction = $state<'' | 'seed-stage' | 'complete' | 'seed-data' | 'reset'>('');
	const hasPendingOnboardingAction = $derived(pendingOnboardingAction !== '');

	function beginOnboardingAction(action: 'seed-stage' | 'complete' | 'seed-data' | 'reset') {
		pendingOnboardingAction = action;
	}

	const onboardingToneClasses = $derived.by(() => {
		if (!onboardingState) return 'border-slate-700 bg-slate-900/40 text-slate-300';
		if (onboardingState.isComplete) return 'border-emerald-700 bg-emerald-900/20 text-emerald-200';
		if (onboardingState.stageKey === 'in_progress') return 'border-blue-700 bg-blue-900/20 text-blue-200';
		if (onboardingState.stageKey === 'ready_for_approval') return 'border-amber-700 bg-amber-900/20 text-amber-200';
		return 'border-slate-700 bg-slate-900/40 text-slate-300';
	});

	function normalizeTalentProgressState(label: 'Documents' | 'Player Profile', state: string): string {
		const value = String(state ?? '').trim().toLowerCase();
		if (label === 'Documents' && (value === '0 pending' || value === 'complete' || value === 'completed')) {
			return 'complete';
		}
		if (label === 'Player Profile' && ['submitted', 'approved', 'complete', 'completed'].includes(value)) {
			return 'complete';
		}
		return state;
	}

	function normalizeRoleMenuVisibility(raw: unknown): RoleMenuVisibility {
		const normalized = createDefaultRoleMenuVisibility();
		const root = (raw && typeof raw === 'object' && !Array.isArray(raw))
			? (raw as Record<string, unknown>)
			: {};

		for (const item of ROLE_MENU_CONTROL_ITEMS) {
			const row = root[item.url];
			const rowObj = (row && typeof row === 'object' && !Array.isArray(row))
				? (row as Record<string, unknown>)
				: {};

			for (const role of ROLE_MENU_CONTROL_ROLES) {
				const value = rowObj[role];
				if (typeof value === 'boolean') {
					normalized[item.url][role] = value;
				}
			}
		}

		return normalized;
	}

	let roleMenuVisibility = $state<RoleMenuVisibility>(createDefaultRoleMenuVisibility());
	let roleSettingsBusy = $state(false);
	let roleSettingsMessage = $state('');
	let roleSettingsError = $state('');
	let roleSettingsFilterText = $state('');
	let roleSettingsRoleFilters = $state<RoleMenuControlRole[]>([]);

	$effect(() => {
		roleMenuVisibility = normalizeRoleMenuVisibility(data.roleMenuVisibility);
	});

	function formatRoleLabel(role: string): string {
		return role.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
	}

	function canRoleSeeQuickAccess(url: string): boolean {
		if (activeRole === 'admin') return true;
		const controlled = roleMenuVisibility[url];
		if (!controlled) return true;
		if (!ROLE_MENU_CONTROL_ROLES.includes(activeRole as RoleMenuControlRole)) return false;
		return Boolean(controlled[activeRole as RoleMenuControlRole]);
	}

	function isRoleSettingsRoleSelected(role: RoleMenuControlRole): boolean {
		return roleSettingsRoleFilters.includes(role);
	}

	function toggleRoleSettingsRoleFilter(role: RoleMenuControlRole): void {
		if (roleSettingsRoleFilters.includes(role)) {
			roleSettingsRoleFilters = roleSettingsRoleFilters.filter((item) => item !== role);
			return;
		}

		roleSettingsRoleFilters = [...roleSettingsRoleFilters, role];
	}

	async function saveRoleMenuVisibility(next: RoleMenuVisibility): Promise<void> {
		roleSettingsBusy = true;
		roleSettingsError = '';
		roleSettingsMessage = '';

		try {
			const response = await fetch('/api/admin/role-menu-visibility', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ visibility: next }),
			});

			if (!response.ok) {
				const payload = await response.json().catch(() => ({}));
				throw new Error(payload?.message ?? 'Unable to save role settings');
			}

			const payload = await response.json();
			roleMenuVisibility = normalizeRoleMenuVisibility(payload?.visibility ?? {});
			roleSettingsMessage = 'Role menu visibility updated';
		} catch (error: any) {
			roleSettingsError = error?.message ?? 'Unable to save role settings';
			roleMenuVisibility = normalizeRoleMenuVisibility(data.roleMenuVisibility);
		} finally {
			roleSettingsBusy = false;
		}
	}

	async function toggleRoleVisibility(url: string, role: RoleMenuControlRole): Promise<void> {
		if (roleSettingsBusy) return;

		const next = normalizeRoleMenuVisibility(roleMenuVisibility);
		next[url][role] = !Boolean(next[url][role]);
		roleMenuVisibility = next;
		await saveRoleMenuVisibility(next);
	}

	const filteredRoleMenuItems = $derived.by(() => {
		const filter = roleSettingsFilterText.toLowerCase().trim();
		return ROLE_MENU_CONTROL_ITEMS.filter((item) => {
			if (!filter) return true;
			return item.title.toLowerCase().includes(filter) || item.url.toLowerCase().includes(filter);
		});
	});

	const visibleRoleMenuColumns = $derived.by(() => {
		const selectedRoles = new Set(roleSettingsRoleFilters);
		if (selectedRoles.size === 0) return ROLE_MENU_CONTROL_ROLES;
		return [
			...ROLE_MENU_CONTROL_ROLES.filter((role) => selectedRoles.has(role)),
			...ROLE_MENU_CONTROL_ROLES.filter((role) => !selectedRoles.has(role)),
		];
	});

	const orderedRoleSettingsFilterRoles = $derived.by(() => {
		if (roleSettingsRoleFilters.length === 0) return ROLE_MENU_CONTROL_ROLES;
		const selectedRoles = new Set(roleSettingsRoleFilters);
		return [
			...ROLE_MENU_CONTROL_ROLES.filter((role) => selectedRoles.has(role)),
			...ROLE_MENU_CONTROL_ROLES.filter((role) => !selectedRoles.has(role)),
		];
	});

	const quickAccessLinks = [
		{ label: 'Departments',  href: '/dashboard/departments',         icon: Building2,    color: 'text-blue-400',   bg: 'bg-blue-950/50 border-blue-800/50' },
		{ label: 'Projects',     href: '/dashboard/projects',          icon: FolderKanban, color: 'text-emerald-400', bg: 'bg-emerald-950/50 border-emerald-800/50' },
		{ label: 'Expenses',     href: '/dashboard/expenses',          icon: Receipt,      color: 'text-orange-400', bg: 'bg-orange-950/50 border-orange-800/50' },
		{ label: 'People',       href: '/dashboard/people',            icon: Users,        color: 'text-violet-400', bg: 'bg-violet-950/50 border-violet-800/50' },
		{ label: 'Reimbursements', href: '/dashboard/reimbursements',  icon: Wallet,       color: 'text-fuchsia-400', bg: 'bg-fuchsia-950/50 border-fuchsia-800/50' },
		{ label: 'Vendors',      href: '/dashboard/vendors',           icon: Briefcase,    color: 'text-sky-400',    bg: 'bg-sky-950/50 border-sky-800/50' },
		{ label: 'Sponsors',     href: '/dashboard/sponsors',          icon: Star,         color: 'text-yellow-400', bg: 'bg-yellow-950/50 border-yellow-800/50' },
		{ label: 'Franchises',   href: '/dashboard/franchises',        icon: Trophy,       color: 'text-rose-400',   bg: 'bg-rose-950/50 border-rose-800/50' },
		{ label: 'Collections',  href: '/dashboard/active-collections', icon: DollarSign,   color: 'text-teal-400',   bg: 'bg-teal-950/50 border-teal-800/50' },
		{ label: 'Trademarks',   href: '/dashboard/trademarks',        icon: BadgeCheck,   color: 'text-lime-400',   bg: 'bg-lime-950/50 border-lime-800/50' },
		{ label: 'Import CSV Data', href: '/dashboard/import',         icon: Cpu,          color: 'text-cyan-400',   bg: 'bg-cyan-950/50 border-cyan-800/50' },
	];

	const visibleQuickAccessLinks = $derived.by(() => quickAccessLinks.filter((link) => canRoleSeeQuickAccess(link.href)));
	const roleKey = $derived.by(() => {
		const role = String(data.userProfile?.role ?? '').trim().toLowerCase();
		if (role === 'admin' || role === 'leader') return 'admin_leader';
		if (role === 'sales') return 'sales';
		if (role === 'marketing' || role === 'marketing_lead') return 'marketing';
		if (role === 'manager' || role === 'pro' || role === 'broadcaster') return 'talent';
		return 'general';
	});

	const roleTheme = $derived.by(() => {
		if (roleKey === 'admin_leader') {
			return {
				card: 'border-blue-800/60 bg-blue-950/25',
				title: 'text-blue-200',
				subtitle: 'text-blue-300/80'
			};
		}
		if (roleKey === 'sales') {
			return {
				card: 'border-emerald-800/60 bg-emerald-950/25',
				title: 'text-emerald-200',
				subtitle: 'text-emerald-300/80'
			};
		}
		if (roleKey === 'marketing') {
			return {
				card: 'border-fuchsia-800/80 bg-fuchsia-950/45',
				title: 'text-fuchsia-200',
				subtitle: 'text-fuchsia-300/80'
			};
		}
		if (roleKey === 'talent') {
			return {
				card: 'border-indigo-800/60 bg-indigo-950/25',
				title: 'text-indigo-200',
				subtitle: 'text-indigo-300/80'
			};
		}
		return {
			card: 'border-slate-800 bg-slate-950/70',
			title: 'text-slate-200',
			subtitle: 'text-slate-400'
		};
	});

	const roleQuickAccessOrder = $derived.by(() => {
		if (roleKey === 'admin_leader') {
			return [
				'/dashboard/departments',
				'/dashboard/projects',
				'/dashboard/people',
				'/dashboard/expenses',
				'/dashboard/vendors',
				'/dashboard/reimbursements',
				'/dashboard/sponsors',
				'/dashboard/franchises',
				'/dashboard/active-collections',
				'/dashboard/trademarks',
				'/dashboard/import',
			];
		}

		if (roleKey === 'sales') {
			return [
				'/dashboard/sponsors',
				'/dashboard/franchises',
				'/dashboard/active-collections',
				'/dashboard/reimbursements',
				'/dashboard/import',
				'/dashboard/projects',
			];
		}

		if (roleKey === 'marketing') {
			return [
				'/dashboard/sponsors',
				'/dashboard/projects',
				'/dashboard/events',
				'/dashboard/reimbursements',
				'/dashboard/import',
				'/dashboard/active-collections',
			];
		}

		if (roleKey === 'talent') {
			return [
				'/dashboard/reimbursements',
				'/dashboard/import',
			];
		}

		return quickAccessLinks.map((link) => link.href);
	});

	const roleQuickAccessLinks = $derived.by(() => {
		const order = roleQuickAccessOrder;
		const ordered = visibleQuickAccessLinks
			.filter((link) => order.includes(link.href))
			.sort((a, b) => order.indexOf(a.href) - order.indexOf(b.href));

		if (ordered.length > 0) return ordered;
		return visibleQuickAccessLinks.slice(0, 6);
	});

	let hasLoggedTalentUpcoming = $state(false);
	$effect(() => {
		if (roleKey !== 'talent' || hasLoggedTalentUpcoming) return;
		hasLoggedTalentUpcoming = true;
		console.log('[dashboard][talent][onboarding-status]', {
			role: activeRole,
			onboardingBadge,
			playerProfileNote,
		});
		console.log('[dashboard][talent][upcoming-tournaments]', upcomingTournaments);
		console.log('[dashboard][talent][upcoming-special-events]', upcomingSpecialEvents);
		console.log('[dashboard][talent][upcoming-campaigns]', upcomingCampaigns);
	});

	const rolePrimaryCards = $derived.by(() => {
		if (roleKey === 'admin_leader') {
			return [
				{ label: 'Open Projects', value: String(projects.in_progress ?? 0), hint: 'in progress now', href: '/dashboard/projects', icon: FolderKanban },
				{ label: 'Pending Approvals', value: String(approvals.pending ?? 0), hint: 'awaiting decision', href: '/dashboard/approvals', icon: CheckCircle2 },
				{ label: 'Submitted Expenses', value: String(expenses.submitted ?? 0), hint: 'need review', href: '/dashboard/expenses', icon: Receipt },
				{ label: 'Active Income', value: fmt(cashflow.projectedRevenue ?? 0), hint: 'pipeline value', href: '/dashboard/active-income', icon: TrendingUp },
			];
		}

		if (roleKey === 'sales') {
			return [
				{ label: 'Sponsor Commitments', value: fmt(sponsors.totalCommitted ?? 0), hint: 'signed value', href: '/dashboard/sponsors', icon: Star },
				{ label: 'Franchise Leads', value: String(franchise.pipeline.leads ?? 0), hint: 'active leads', href: '/dashboard/sales', icon: Users },
				{ label: 'Projected Tickets', value: fmt(tickets.totalProjected ?? 0), hint: 'ticket pipeline', href: '/dashboard/ticket-revenue', icon: Ticket },
				{ label: 'Collections', value: fmt(tickets.totalReceived ?? 0), hint: 'received to date', href: '/dashboard/active-collections', icon: DollarSign },
			];
		}

		if (roleKey === 'marketing') {
			return [
				{ label: 'Campaigns Running', value: String((projects.in_progress ?? 0) + (projects.planned ?? 0)), hint: 'active initiatives', href: '/dashboard/campaigns', icon: Megaphone },
				{ label: 'Branding Pipeline', value: fmt((branding.totalContracted ?? 0) + (branding.totalProposed ?? 0)), hint: 'contracted + proposed', href: '/dashboard/on-course-branding/pipeline', icon: Flag },
				{ label: 'Media Queue', value: String(m.content ?? 0), hint: 'content workload', href: '/dashboard/manage-media-content', icon: Images },
				{ label: 'Sponsor Revenue', value: fmt(sponsors.totalCommitted ?? 0), hint: 'marketing impact', href: '/dashboard/sponsors', icon: TrendingUp },
			];
		}

		if (roleKey === 'talent') {
			return [
				{ label: 'My Reimbursements', value: String(expenses.total ?? 0), hint: 'tracked requests', href: '/dashboard/reimbursements', icon: Wallet },
				{ label: 'Onboarding Status', value: onboardingBadge ?? 'up to date', hint: 'docs progress', href: '/dashboard/onboarding', icon: BadgeCheck },
				{ label: 'My Profile', value: playerProfileNote ?? 'ready', hint: 'player profile', href: '/dashboard/player-profile', icon: UserCircle },
			];
		}

		return [
			{ label: 'Projects', value: String(projects.total ?? 0), hint: 'total tracked', href: '/dashboard/projects', icon: FolderKanban },
			{ label: 'Sponsors', value: String(sponsors.total ?? 0), hint: 'active records', href: '/dashboard/sponsors', icon: Star },
			{ label: 'Revenue Pipeline', value: fmt(cashflow.projectedRevenue ?? 0), hint: 'projected total', href: '/dashboard/active-income', icon: TrendingUp },
			{ label: 'People', value: String(m.people ?? 0), hint: 'team size', href: '/dashboard/people', icon: Users },
		];
	});

	const rolePrimaryTitle = $derived.by(() => {
		if (roleKey === 'admin_leader') return 'Executive Command Center';
		if (roleKey === 'sales') return 'Sales Command Center';
		if (roleKey === 'marketing') return 'Marketing Command Center';
		if (roleKey === 'talent') return 'My Portal Snapshot';
		return 'Dashboard Snapshot';
	});

	let primaryPanelView = $state<'departments' | 'income'>('departments');
	let departmentScope = $state<'my' | 'all'>(isLeader && myDepartmentId ? 'my' : 'all');
	const visibleDeptBudgets = $derived.by(() => {
		if (departmentScope === 'my' && myDepartmentId) {
			return deptBudgets.filter((dept: any) => dept.id === myDepartmentId);
		}
		return deptBudgets;
	});

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
	}
	function pct(a: number, b: number) {
		return b === 0 ? 0 : Math.min(100, (a / b) * 100);
	}

	const workOrderChartSummary = $derived.by(() => {
		const income = Number(cashflow.projectedRevenue ?? 0);
		const expense = Number(expenses.totalAmount ?? 0);
		const bank = Number(cashflow.totalBankBalance ?? 0);
		const maxValue = Math.max(income, expense, bank, 1);
		const chartHeight = 112;
		const topPadding = 10;
		const usableHeight = chartHeight - (topPadding * 2);

		const toY = (value: number) => {
			const ratio = value <= 0 ? 0 : value / maxValue;
			return chartHeight - topPadding - (ratio * usableHeight);
		};

		const xPoints = [12, 112, 212, 312];
		return {
			maxValue,
			series: [
				{
					label: 'Income',
					value: income,
					stroke: '#34d399',
					dot: '#6ee7b7',
					points: xPoints.map((x) => `${x},${toY(income)}`).join(' '),
					dotX: xPoints[xPoints.length - 1],
					dotY: toY(income),
				},
				{
					label: 'Expense',
					value: expense,
					stroke: '#fb923c',
					dot: '#fdba74',
					points: xPoints.map((x) => `${x},${toY(expense)}`).join(' '),
					dotX: xPoints[xPoints.length - 1],
					dotY: toY(expense),
				},
				{
					label: 'Bank Total',
					value: bank,
					stroke: '#38bdf8',
					dot: '#7dd3fc',
					points: xPoints.map((x) => `${x},${toY(bank)}`).join(' '),
					dotX: xPoints[xPoints.length - 1],
					dotY: toY(bank),
				},
			],
		};
	});

	// Maps department name keywords → { icon, colors }
	const DEPT_ICONS: Array<{ keywords: string[]; icon: any; bg: string; fg: string }> = [
		{ keywords: ['content', 'media'],            icon: Video,      bg: 'bg-pink-100 dark:bg-pink-900/30',    fg: 'text-pink-600 dark:text-pink-400' },
		{ keywords: ['operations', 'ops'],            icon: Wrench,     bg: 'bg-blue-100 dark:bg-blue-900/30',    fg: 'text-blue-600 dark:text-blue-400' },
		{ keywords: ['marketing'],                    icon: Megaphone,  bg: 'bg-orange-100 dark:bg-orange-900/30', fg: 'text-orange-600 dark:text-orange-400' },
		{ keywords: ['technology', 'tech', 'it'],     icon: Cpu,        bg: 'bg-cyan-100 dark:bg-cyan-900/30',    fg: 'text-cyan-600 dark:text-cyan-400' },
		{ keywords: ['player', 'development', 'talent'], icon: Trophy,  bg: 'bg-emerald-100 dark:bg-emerald-900/30', fg: 'text-emerald-600 dark:text-emerald-400' },
		{ keywords: ['executive', 'leadership'],      icon: Briefcase,  bg: 'bg-violet-100 dark:bg-violet-900/30', fg: 'text-violet-600 dark:text-violet-400' },
		{ keywords: ['legal', 'compliance'],          icon: Scale,      bg: 'bg-red-100 dark:bg-red-900/30',      fg: 'text-red-600 dark:text-red-400' },
		{ keywords: ['finance', 'financial'],         icon: Wallet,     bg: 'bg-green-100 dark:bg-green-900/30',  fg: 'text-green-600 dark:text-green-400' },
		{ keywords: ['sales'],                        icon: Handshake,  bg: 'bg-yellow-100 dark:bg-yellow-900/30', fg: 'text-yellow-600 dark:text-yellow-400' },
		{ keywords: ['people', 'hr', 'human'],        icon: Users,      bg: 'bg-indigo-100 dark:bg-indigo-900/30', fg: 'text-indigo-600 dark:text-indigo-400' },
		{ keywords: ['league'],                       icon: Globe,      bg: 'bg-teal-100 dark:bg-teal-900/30',    fg: 'text-teal-600 dark:text-teal-400' },
		{ keywords: ['sponsor'],                      icon: Star,       bg: 'bg-amber-100 dark:bg-amber-900/30',  fg: 'text-amber-600 dark:text-amber-400' },
		{ keywords: ['film', 'documentary'],          icon: Film,       bg: 'bg-rose-100 dark:bg-rose-900/30',    fg: 'text-rose-600 dark:text-rose-400' },
	];

	function getDeptIcon(name: string) {
		const lower = name.toLowerCase();
		const match = DEPT_ICONS.find(d => d.keywords.some(k => lower.includes(k)));
		return match ?? { icon: Building2, bg: 'bg-slate-100 dark:bg-slate-800', fg: 'text-slate-600 dark:text-slate-400' };
	}

	const otherIncomeSources = $derived([
		{
			label: 'Active Income',
			description: 'Combined sponsorship, ticket, and branding pipeline',
			href: '/dashboard/active-income',
			amount: cashflow.projectedRevenue,
			icon: TrendingUp,
			accent: 'text-emerald-300',
			bg: 'bg-emerald-900/30'
		},
		{
			label: 'Sponsor Commitments',
			description: 'Committed sponsorship contracts',
			href: '/dashboard/sponsors',
			amount: sponsors.totalCommitted,
			icon: Star,
			accent: 'text-amber-300',
			bg: 'bg-amber-900/30'
		},
		{
			label: 'Ticket Revenue',
			description: 'Projected ticket sales intake',
			href: '/dashboard/ticket-revenue',
			amount: tickets.totalProjected,
			icon: Ticket,
			accent: 'text-cyan-300',
			bg: 'bg-cyan-900/30'
		},
		{
			label: 'Branding Revenue',
			description: 'Contracted and proposed branding placements',
			href: '/dashboard/on-course-branding/pipeline',
			amount: branding.totalContracted + branding.totalProposed,
			icon: Flag,
			accent: 'text-violet-300',
			bg: 'bg-violet-900/30'
		}
	]);

</script>

<svelte:head><title>Dashboard — FliHub</title></svelte:head>

<div class="flex flex-col gap-8">

	<!-- Page header -->
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Dashboard{roleLabel ? ` (${roleLabel})` : ''}</h1>
			<p class="text-muted-foreground mt-1">Welcome back, {welcomeName}</p>
			{#if onboardingState}
				<div class="mt-2 flex items-center gap-2 flex-wrap">
					<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold {onboardingToneClasses}">
						Onboarding: {onboardingState.stageLabel}
					</span>
					<span class="text-xs text-muted-foreground">{onboardingState.completionPercent}% complete</span>
				</div>
				<p class="text-xs mt-1 text-muted-foreground">{onboardingState.message}</p>
				<div class="mt-2 flex items-center gap-2 flex-wrap">
					<a href={onboardingState.ctaHref} class="inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors">
						{onboardingState.ctaLabel}
					</a>
					{#if onboardingState.isComplete}
						<a href="/dashboard/player-profile" class="inline-flex items-center rounded-md border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-900 transition-colors">
							Update My Info
						</a>
					{/if}
				</div>
			{/if}
			{#if form?.onboardingActionMessage}
				<p class="text-xs mt-2 text-emerald-500">{form.onboardingActionMessage}</p>
			{:else if form?.onboardingActionError}
				<p class="text-xs mt-2 text-rose-500">{form.onboardingActionError}</p>
			{/if}
		</div>
		<div class="flex items-center gap-2 flex-wrap justify-end">
			{#if canShowOnboardingTestControls}
				<form method="POST" action="?/seedOnboardingStage" class="inline-flex items-center gap-2" onsubmit={() => beginOnboardingAction('seed-stage')}>
					<select
						name="stage"
						disabled={hasPendingOnboardingAction}
						class="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100"
					>
						<option value="invited">Seed: Invited</option>
						<option value="documents_sent" selected>Seed: Documents Sent</option>
						<option value="documents_signed">Seed: Documents Signed</option>
						<option value="profile_complete">Seed: Profile Complete</option>
						<option value="approved">Seed: Approved</option>
					</select>
					<button type="submit" disabled={hasPendingOnboardingAction} class="h-8 rounded-md border border-blue-700 bg-blue-900/40 px-2.5 text-xs text-blue-200 hover:bg-blue-800/50 transition-colors inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
						{#if pendingOnboardingAction === 'seed-stage'}
							<Loader2 class="size-3.5 animate-spin" />
						{/if}
						<span>Seed Stage</span>
					</button>
				</form>
				<form method="POST" action="?/completeOnboarding" onsubmit={() => beginOnboardingAction('complete')}>
					<button type="submit" disabled={hasPendingOnboardingAction} class="h-8 rounded-md border border-emerald-700 bg-emerald-900/40 px-2.5 text-xs text-emerald-200 hover:bg-emerald-800/50 transition-colors inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
						{#if pendingOnboardingAction === 'complete'}
							<Loader2 class="size-3.5 animate-spin" />
						{/if}
						<span>Complete + Seed Data</span>
					</button>
				</form>
				<form method="POST" action="?/seedOnboardingDataOnly" onsubmit={() => beginOnboardingAction('seed-data')}>
					<button type="submit" disabled={hasPendingOnboardingAction} class="h-8 rounded-md border border-amber-700 bg-amber-900/40 px-2.5 text-xs text-amber-200 hover:bg-amber-800/50 transition-colors inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
						{#if pendingOnboardingAction === 'seed-data'}
							<Loader2 class="size-3.5 animate-spin" />
						{/if}
						<span>Seed Only Docs/Profile</span>
					</button>
				</form>
				<form method="POST" action="?/resetOnboarding" onsubmit={() => beginOnboardingAction('reset')}>
					<button type="submit" disabled={hasPendingOnboardingAction} class="h-8 rounded-md border border-rose-700 bg-rose-900/40 px-2.5 text-xs text-rose-200 hover:bg-rose-800/50 transition-colors inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
						{#if pendingOnboardingAction === 'reset'}
							<Loader2 class="size-3.5 animate-spin" />
						{/if}
						<span>Reset Onboarding</span>
					</button>
				</form>
			{/if}

			<a href="/dashboard/financial-projections" class="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
				<TrendingUp class="size-3" /> Financial Projections
			</a>
		</div>
	</div>

	<!-- Role-specific main content -->
	<div class="rounded-xl border {roleTheme.card} p-4 sm:p-5">
		<div class="flex items-center justify-between gap-3 flex-wrap">
			<div>
				<h2 class="text-sm sm:text-base font-semibold {roleTheme.title} inline-flex items-center gap-2">
					{#if roleKey === 'talent'}
						<UserCircle class="size-4" />
					{/if}
					{rolePrimaryTitle}
				</h2>
				<p class="text-xs mt-1 {roleTheme.subtitle}">Tailored priorities for {roleLabel || 'your role'}.</p>
			</div>
		</div>
		<div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
			{#each rolePrimaryCards as card}
				<a href={card.href} class="group rounded-lg border border-slate-800 bg-slate-900/80 p-3 hover:border-slate-600 transition-colors">
					<div class="flex items-center justify-between">
						<p class="text-[11px] uppercase tracking-wide text-slate-400">{card.label}</p>
						<card.icon class="size-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
					</div>
					<p class="mt-2 text-lg font-semibold text-slate-100">{card.value}</p>
					<p class="text-[11px] text-slate-500 mt-1">{card.hint}</p>
				</a>
			{/each}
		</div>
	</div>

	{#if roleKey === 'sales' || roleKey === 'admin_leader' || roleKey === 'general'}
		<!-- Role-aware quick access (top) -->
		<div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
			<div class="flex items-center justify-between mb-3">
				<h3 class="text-xs font-semibold uppercase tracking-wide text-slate-300">{roleLabel || 'Role'} Shortcuts</h3>
				<span class="text-[10px] text-slate-500">{roleQuickAccessLinks.length} shown</span>
			</div>
			<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
				{#each roleQuickAccessLinks as link}
					<a href={link.href}
						class="group flex flex-col items-center gap-2 rounded-xl border {link.bg} px-2 py-3 text-center hover:brightness-125 transition-all duration-150">
						<link.icon class="size-5 {link.color} transition-transform group-hover:scale-110" />
						<span class="text-[11px] font-medium text-slate-300">{link.label}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	{#if roleKey === 'admin_leader'}
	{#if isAdmin}
		<Card class="p-5 border border-slate-700 bg-slate-950 text-slate-100">
			<details>
				<summary class="list-none cursor-pointer flex items-start justify-between gap-4">
					<div>
						<h2 class="text-base font-semibold inline-flex items-center gap-2">
							<ShieldCheck class="size-4 text-cyan-300" />
							Role Settings
						</h2>
						<p class="text-xs text-slate-400 mt-1">Toggle which roles can see the selected dashboard menu items.</p>
					</div>
					<div class="flex items-center gap-2 shrink-0">
						{#if roleSettingsBusy}
							<span class="text-xs text-amber-300">Saving...</span>
						{/if}
						<span class="text-xs text-slate-400">Expand</span>
					</div>
				</summary>

				{#if roleSettingsError}
					<p class="mt-4 text-xs text-red-300">{roleSettingsError}</p>
				{:else if roleSettingsMessage}
					<p class="mt-4 text-xs text-emerald-300">{roleSettingsMessage}</p>
				{/if}

				<div class="mt-4 flex items-center gap-3">
					<input
						type="text"
						placeholder="Search routes..."
						bind:value={roleSettingsFilterText}
						class="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 flex-1"
					/>
					{#if roleSettingsFilterText}
						<span class="text-[10px] text-slate-400 whitespace-nowrap">
							{filteredRoleMenuItems.length} of {ROLE_MENU_CONTROL_ITEMS.length}
						</span>
					{/if}
				</div>

				<div class="mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
					<span class="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Role filter</span>
					{#each orderedRoleSettingsFilterRoles as role}
						<label class="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-[10px] font-medium text-slate-200 transition-colors {isRoleSettingsRoleSelected(role) ? 'ring-1 ring-cyan-500/40' : ''}">
							<input
								type="checkbox"
								checked={isRoleSettingsRoleSelected(role)}
								onchange={() => toggleRoleSettingsRoleFilter(role)}
								class="size-3.5 rounded border-slate-600 bg-slate-950 text-cyan-400 focus:ring-cyan-500"
							/>
							<span>{formatRoleLabel(role)}</span>
						</label>
					{/each}
				</div>

				<div class="mt-4 overflow-x-auto rounded-lg border border-slate-800">
					<table class="min-w-full text-xs">
						<thead class="bg-slate-900/80">
							<tr class="border-b border-slate-800">
								<th class="px-3 py-2 text-left font-semibold text-slate-300">Menu Item</th>
								{#each visibleRoleMenuColumns as role}
									<th class="px-2 py-2 text-center font-semibold text-slate-300 whitespace-nowrap">{formatRoleLabel(role)}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each filteredRoleMenuItems as item}
								<tr class="border-b border-slate-900 last:border-b-0">
									<td class="px-3 py-2">
										<div class="font-medium text-slate-200">{item.title}</div>
										<div class="text-[10px] text-slate-500">{item.url}</div>
									</td>
									{#each visibleRoleMenuColumns as role}
										<td class="px-2 py-2 text-center">
											<button
												type="button"
												onclick={() => toggleRoleVisibility(item.url, role)}
												disabled={roleSettingsBusy}
												class="w-12 rounded-full px-2 py-1 text-[10px] font-semibold transition-colors disabled:opacity-50 {roleMenuVisibility[item.url][role] ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}"
											>
												{roleMenuVisibility[item.url][role] ? 'On' : 'Off'}
											</button>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<p class="mt-3 text-[11px] text-slate-500">Admin access remains available regardless of these toggles.</p>
			</details>
		</Card>
	{/if}

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
		{#each [
			{ label: 'Start Project', href: '/dashboard/projects', icon: FolderKanban, color: 'text-cyan-300', bg: 'bg-cyan-950/40 border-cyan-800/60' },
			{ label: 'Start Campain', href: '/dashboard/marketing/campaigns/new', icon: Megaphone, color: 'text-fuchsia-300', bg: 'bg-fuchsia-950/40 border-fuchsia-800/60' },
			{ label: 'Start Event', href: '/dashboard/events/new', icon: Flag, color: 'text-lime-300', bg: 'bg-lime-950/40 border-lime-800/60' },
			{ label: 'Start Media Content', href: '/dashboard/content', icon: Film, color: 'text-rose-300', bg: 'bg-rose-950/40 border-rose-800/60' },
		] as action}
			<a href={action.href}
				class="group flex items-center justify-between gap-3 rounded-xl border {action.bg} px-4 py-3 text-left hover:brightness-125 transition-all duration-150">
				<div class="flex items-center gap-2 min-w-0">
					<action.icon class="size-4 {action.color} transition-transform group-hover:scale-110" />
					<span class="text-sm font-semibold text-slate-200 truncate">{action.label}</span>
				</div>
				<ArrowRight class="size-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
			</a>
		{/each}
	</div>

	<!-- Top KPI row -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 order-last">

		<!-- Budget -->
		<div class="group/card relative">
			<Card class="p-5 border-l-4 border-l-blue-500 bg-slate-950 border-slate-800 text-slate-100 [&_.text-muted-foreground]:text-slate-400 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-default">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-muted-foreground">Seed Raise Budget</p>
					<div class="size-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
						<DollarSign class="size-5 text-blue-600 dark:text-blue-400" />
					</div>
				</div>
				<p class="text-2xl font-bold">{fmt(budget.total)}</p>
				<div class="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
					<div class="h-full rounded-full bg-blue-500 transition-all" style="width:{pct(budget.actual, budget.total).toFixed(1)}%"></div>
				</div>
				<p class="text-xs text-muted-foreground mt-1">{pct(budget.actual, budget.total).toFixed(0)}% spent · {fmt(budget.remaining)} remaining from seed</p>
			</Card>
			<!-- Hover tooltip -->
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-blue-400 mb-2">Budget Detail</p>
					<div class="flex justify-between"><span class="text-slate-400">Seed raise</span><span class="font-medium">{fmt(budget.seedRaise ?? budget.total)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Dept plan</span><span class="font-medium">{fmt(budget.operatingPlanTotal ?? budget.total)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Actual</span><span class="font-medium">{fmt(budget.actual)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Forecasted</span><span class="font-medium">{fmt(budget.forecasted)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Seed remaining</span><span class="font-medium text-emerald-600">{fmt(budget.remaining)}</span></div>
				</div>
			</div>
		</div>

		<!-- Projects -->
		<div class="group/card relative">
			<Card class="p-5 border-l-4 border-l-emerald-500 bg-slate-950 border-slate-800 text-slate-100 [&_.text-muted-foreground]:text-slate-400 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-default">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-muted-foreground">Projects</p>
					<div class="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
						<FolderKanban class="size-5 text-emerald-600 dark:text-emerald-400" />
					</div>
				</div>
				<p class="text-2xl font-bold">{projects.total}</p>
				<p class="text-xs text-muted-foreground mt-1">{projects.in_progress} active · {projects.planned} planned · {projects.completed} done</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-emerald-400 mb-2">By Status</p>
					{#each [['In Progress', projects.in_progress, 'bg-blue-500'], ['Planned', projects.planned, 'bg-yellow-500'], ['Completed', projects.completed, 'bg-emerald-500']] as [label, count, color]}
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-2"><span class="size-2 rounded-full {color}"></span><span class="text-slate-400">{label}</span></div>
							<span class="font-medium tabular-nums">{count}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Sponsors -->
		<div class="group/card relative">
			<Card class="p-5 border-l-4 border-l-orange-500 bg-slate-950 border-slate-800 text-slate-100 [&_.text-muted-foreground]:text-slate-400 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-default">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-muted-foreground">Sponsors</p>
					<div class="size-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
						<Star class="size-5 text-orange-600 dark:text-orange-400" />
					</div>
				</div>
				<p class="text-2xl font-bold">{sponsors.total}</p>
				<p class="text-xs text-muted-foreground mt-1">{fmt(sponsors.totalCommitted)} committed · {fmt(sponsors.totalPaid)} paid</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-orange-400 mb-2">By Tier</p>
					{#each Object.entries(sponsors.byTier ?? {}) as [tier, count]}
						<div class="flex justify-between"><span class="text-slate-400 capitalize">{tier.replace('_', ' ')}</span><span class="font-medium">{count}</span></div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Franchise Pipeline -->
		<div class="group/card relative">
			<Card class="p-5 border-l-4 border-l-violet-500 bg-slate-950 border-slate-800 text-slate-100 [&_.text-muted-foreground]:text-slate-400 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-default">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-muted-foreground">Franchise Pipeline</p>
					<div class="size-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
						<Trophy class="size-5 text-violet-600 dark:text-violet-400" />
					</div>
				</div>
				<p class="text-2xl font-bold">{(franchise.pipeline.leads ?? 0) + (franchise.pipeline.opportunities ?? 0) + (franchise.pipeline.deals ?? 0)}</p>
				<p class="text-xs text-muted-foreground mt-1">{franchise.pipeline.leads} leads · {franchise.pipeline.opportunities} opps · {franchise.pipeline.deals} deals</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-violet-400 mb-2">Pipeline Stages</p>
					<div class="flex justify-between"><span class="text-slate-400">Leads</span><span class="font-medium">{franchise.pipeline.leads}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Opportunities</span><span class="font-medium">{franchise.pipeline.opportunities}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Deals</span><span class="font-medium">{franchise.pipeline.deals}</span></div>
				</div>
			</div>
		</div>

		<!-- Ticket Revenue -->
		<div class="group/card relative">
			<a href="/dashboard/ticket-revenue">
				<Card class="p-5 border-l-4 border-l-amber-500 bg-slate-950 border-slate-800 text-slate-100 [&_.text-muted-foreground]:text-slate-400 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
					<div class="flex items-center justify-between mb-3">
						<p class="text-sm font-medium text-muted-foreground">Ticket Revenue</p>
						<div class="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
							<Ticket class="size-5 text-amber-600 dark:text-amber-400" />
						</div>
					</div>
					<p class="text-2xl font-bold">{fmt(tickets.totalGross)}</p>
					<p class="text-xs text-muted-foreground mt-1">{fmt(tickets.totalReceived)} received · {fmt(tickets.totalProjected)} projected</p>
				</Card>
			</a>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-amber-400 mb-2">Ticket Sales</p>
					<div class="flex justify-between"><span class="text-slate-400">Gross</span><span class="font-medium">{fmt(tickets.totalGross)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Net</span><span class="font-medium">{fmt(tickets.totalNet)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Received</span><span class="font-medium">{fmt(tickets.totalReceived)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Events</span><span class="font-medium">{tickets.count}</span></div>
				</div>
			</div>
		</div>

		<!-- On-Course Branding Revenue -->
		<div class="group/card relative">
			<a href="/dashboard/on-course-branding/pipeline">
				<Card class="p-5 border-l-4 border-l-emerald-500 bg-slate-950 border-slate-800 text-slate-100 [&_.text-muted-foreground]:text-slate-400 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
					<div class="flex items-center justify-between mb-3">
						<p class="text-sm font-medium text-muted-foreground">Branding Revenue</p>
						<div class="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
							<Flag class="size-5 text-emerald-600 dark:text-emerald-400" />
						</div>
					</div>
					<p class="text-2xl font-bold">{fmt(branding.totalContracted)}</p>
					<p class="text-xs text-muted-foreground mt-1">{fmt(branding.totalPaid)} paid · {fmt(branding.totalProposed)} proposed</p>
				</Card>
			</a>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-emerald-400 mb-2">On-Course Branding</p>
					<div class="flex justify-between"><span class="text-slate-400">Contracted</span><span class="font-medium">{fmt(branding.totalContracted)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Paid</span><span class="font-medium">{fmt(branding.totalPaid)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Proposed</span><span class="font-medium">{fmt(branding.totalProposed)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Deals</span><span class="font-medium">{branding.count}</span></div>
				</div>
			</div>
		</div>

		<!-- Total Bank Balance -->
		<div class="group/card relative">
			<a href="/dashboard/bank-accounts">
				<Card class="p-5 border-l-4 border-l-teal-500 bg-slate-950 border-slate-800 text-slate-100 [&_.text-muted-foreground]:text-slate-400 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
					<div class="flex items-center justify-between mb-3">
						<p class="text-sm font-medium text-muted-foreground">Total Bank Balance</p>
						<div class="size-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
							<Landmark class="size-5 text-teal-600 dark:text-teal-400" />
						</div>
					</div>
					<p class="text-2xl font-bold">{fmt(cashflow.totalBankBalance)}</p>
					<p class="text-xs text-muted-foreground mt-1">Active bank account allocations</p>
				</Card>
			</a>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-teal-400 mb-2">Bank Accounts</p>
					<div class="flex justify-between"><span class="text-slate-400">Total balance</span><span class="font-medium">{fmt(cashflow.totalBankBalance)}</span></div>
					<div class="text-[11px] text-slate-400 mt-1">Based on active bank account allocation totals.</div>
				</div>
			</div>
		</div>

		<!-- Projected Revenue -->
		<div class="group/card relative">
			<a href="/dashboard/income">
				<Card class="p-5 border-l-4 border-l-sky-500 bg-slate-950 border-slate-800 text-slate-100 [&_.text-muted-foreground]:text-slate-400 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
					<div class="flex items-center justify-between mb-3">
						<p class="text-sm font-medium text-muted-foreground">Projected Revenue</p>
						<div class="size-9 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
							<TrendingUp class="size-5 text-sky-600 dark:text-sky-400" />
						</div>
					</div>
					<p class="text-2xl font-bold">{fmt(cashflow.projectedRevenue)}</p>
					<p class="text-xs text-muted-foreground mt-1">Tickets + sponsors + branding pipeline</p>
				</Card>
			</a>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-sky-400 mb-2">Revenue Mix</p>
					<div class="flex justify-between"><span class="text-slate-400">Tickets projected</span><span class="font-medium">{fmt(cashflow.revenueBreakdown.ticketsProjected)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Sponsors committed</span><span class="font-medium">{fmt(cashflow.revenueBreakdown.sponsorsCommitted)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Branding contracted</span><span class="font-medium">{fmt(cashflow.revenueBreakdown.brandingContracted)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Branding proposed</span><span class="font-medium">{fmt(cashflow.revenueBreakdown.brandingProposed)}</span></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Department budgets + Approvals/Expenses row -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<!-- Department budget list -->
		<div class="lg:col-span-2">
			<div class="flex items-center justify-between mb-3 gap-3 flex-wrap">
				<div>
					<div class="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 {primaryPanelView === 'departments' ? 'border-blue-700/60 bg-blue-950/50 text-blue-300' : 'border-emerald-700/60 bg-emerald-950/50 text-emerald-300'}">
						{#if primaryPanelView === 'departments'}
							<Building2 class="size-4" />
						{:else}
							<TrendingUp class="size-4" />
						{/if}
						<h2 class="text-sm font-semibold">{primaryPanelView === 'departments' ? 'Departments' : 'Income'}</h2>
					</div>
					<p class="text-xs text-muted-foreground">{primaryPanelView === 'departments' ? 'Active projects first' : 'Top income streams to explore'}</p>
				</div>
				<div class="flex items-center gap-2">
					<div class="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 p-1">
						<button
							onclick={() => {
								primaryPanelView = 'departments';
								departmentScope = 'all';
							}}
							class="h-10 px-4 text-sm font-bold rounded-md border transition-colors {primaryPanelView === 'departments' ? 'bg-blue-700 border-blue-600 text-white' : 'border-slate-700 text-slate-200 hover:text-white hover:border-slate-500'}"
						>
							<span class="inline-flex items-center gap-1.5">
								<Building2 class="size-3.5" /> All
							</span>
						</button>
						{#if canUseMyDepartmentsFilter}
							<button
								onclick={() => {
									primaryPanelView = 'departments';
									departmentScope = 'my';
								}}
								class="h-10 px-4 text-sm font-bold rounded-md border transition-colors {departmentScope === 'my' && primaryPanelView === 'departments' ? 'bg-blue-700 border-blue-600 text-white' : 'border-slate-700 text-slate-200 hover:text-white hover:border-slate-500'}"
							>
								<span class="inline-flex items-center gap-1.5">
									<Users class="size-3.5" /> My Departments
								</span>
							</button>
						{/if}
						<button
							onclick={() => {
								primaryPanelView = 'income';
								departmentScope = 'all';
							}}
							class="h-10 px-4 text-sm font-bold rounded-md border transition-colors bg-green-900 {primaryPanelView === 'income' ? 'border-green-500 text-white shadow-[0_0_0_1px_rgba(34,197,94,0.25)]' : 'border-green-700 text-green-100 hover:border-green-500 hover:text-white'}"
						>
							<span class="inline-flex items-center gap-1.5">
								<TrendingUp class="size-3.5" /> Income
							</span>
						</button>
					</div>
					<Button href={primaryPanelView === 'departments' ? '/dashboard/departments' : '/dashboard/active-income'} variant="outline" size="sm" class="gap-1 text-xs {primaryPanelView === 'departments' ? 'border-blue-700/70 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40' : 'border-green-800/80 bg-green-950/50 text-green-200 hover:bg-green-900/60'}">
						{#if primaryPanelView === 'departments'}
							<Building2 class="size-3" />
						{:else}
							<TrendingUp class="size-3" />
						{/if}
						View all <ArrowRight class="size-3" />
					</Button>
				</div>
			</div>
			<Card class="overflow-hidden">
				{#if primaryPanelView === 'departments'}
				{#each visibleDeptBudgets.slice(0, 8) as dept, i}
					{@const used       = pct(dept.actual ?? 0, dept.budget || 0)}
					{@const forecasted = pct(dept.forecasted ?? 0, dept.budget || 0)}
					{@const deptIcon   = getDeptIcon(dept.name)}
					{@const activeCount = dept.projects.filter((p: any) => p.status === 'in_progress').length}
					<a href="/dashboard/departments/{dept.id}"
						class="flex items-start gap-4 px-4 py-4 transition-colors group {i % 2 === 0 ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-800/70 hover:bg-slate-700/70'}">

						<!-- Icon -->
						<div class="flex size-9 items-center justify-center rounded-lg {deptIcon.bg} shrink-0 mt-0.5 transition-transform group-hover:scale-105">
							<deptIcon.icon class="size-4 {deptIcon.fg}" />
						</div>

						<!-- Body -->
						<div class="flex-1 min-w-0">
							<!-- Name + budget numbers -->
							<div class="flex items-start justify-between gap-2 mb-1">
								<div class="flex items-center gap-2 min-w-0">
									<span class="text-sm font-semibold leading-tight group-hover:text-primary transition-colors truncate">{dept.name}</span>
									{#if activeCount > 0}
										<span class="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{activeCount} active</span>
									{/if}
								</div>
								<div class="text-right shrink-0">
									<span class="text-sm font-bold tabular-nums">{fmt(dept.actual ?? 0)}</span>
									<span class="text-xs text-muted-foreground"> / {fmt(dept.budget ?? 0)}</span>
								</div>
							</div>

							<!-- Description -->
							{#if dept.description}
								<p class="text-xs text-muted-foreground leading-snug mb-2 line-clamp-1">{dept.description}</p>
							{/if}

							<!-- Stacked progress: actual + forecasted -->
							<div class="h-2 rounded-full bg-muted overflow-hidden mb-1.5 relative">
								<!-- Forecasted (lighter, behind) -->
								{#if forecasted > used}
									<div class="absolute inset-y-0 left-0 rounded-full opacity-40 transition-all {used > 90 ? 'bg-red-500' : used > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}"
										style="width:{Math.min(forecasted, 100).toFixed(1)}%"></div>
								{/if}
								<!-- Actual (solid, on top) -->
								<div class="absolute inset-y-0 left-0 rounded-full transition-all {used > 90 ? 'bg-red-500' : used > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}"
									style="width:{used.toFixed(1)}%"></div>
							</div>

							<!-- Meta row: % spent · forecasted · projects -->
							<div class="flex items-center gap-3 text-xs text-muted-foreground">
								<span class="font-medium {used > 90 ? 'text-red-500' : used > 70 ? 'text-yellow-500' : 'text-emerald-500'}">{used.toFixed(0)}% spent</span>
								{#if (dept.forecasted ?? 0) > 0}
									<span>·</span>
									<span>{fmt(dept.forecasted)} forecasted</span>
								{/if}
								{#if dept.projectCount > 0}
									<span>·</span>
									<span>{dept.projectCount} project{dept.projectCount !== 1 ? 's' : ''}</span>
								{/if}

							</div>
						</div>
					</a>
				{/each}
					{#if visibleDeptBudgets.length === 0}
						<p class="px-4 py-6 text-sm text-muted-foreground text-center">No department data</p>
					{/if}
				{:else}
					{#each otherIncomeSources as income}
						{@const IncomeIcon = income.icon}
						<a href={income.href} class="flex items-center gap-3 px-4 py-3 transition-colors group {income.label === 'Active Income' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-800/70 hover:bg-slate-700/70'}">
							<div class="size-8 rounded-lg {income.bg} flex items-center justify-center shrink-0">
								<IncomeIcon class="size-4 {income.accent}" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-semibold truncate">{income.label}</p>
								<p class="text-xs text-muted-foreground truncate">{income.description}</p>
							</div>
							<div class="text-right shrink-0">
								<p class="text-sm font-bold tabular-nums">{fmt(income.amount)}</p>
								<p class="text-[10px] text-muted-foreground">pipeline</p>
							</div>
							<ArrowRight class="size-3 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
						</a>
					{/each}
				{/if}
			</Card>
		</div>

		<!-- Right column: Approvals + Expenses -->
		<div class="flex flex-col gap-4">

			<!-- Approvals -->
			<div>
				<div class="flex items-center justify-between mb-3">
					<div class="inline-flex items-center gap-2 rounded-lg border border-amber-700/60 bg-amber-950/50 px-2.5 py-1.5 text-amber-300">
						<ShieldCheck class="size-4" />
						<h2 class="text-sm font-semibold">Approvals</h2>
					</div>
					<Button href="/dashboard/approvals" variant="outline" size="sm" class="gap-1 text-xs border-amber-700/70 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40">
						<ShieldCheck class="size-3" /> View all <ArrowRight class="size-3" />
					</Button>
				</div>
				<a href="/dashboard/approvals" class="group/card block">
					<Card class="p-4 space-y-3 transition-all duration-150 group-hover/card:-translate-y-0.5 group-hover/card:shadow-lg">
						{#each [
							{ label: 'Pending', count: approvals.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
							{ label: 'Approved', count: approvals.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
							{ label: 'Rejected', count: approvals.rejected, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
						] as row}
							<div class="flex items-center gap-3 group/row hover:bg-muted/40 -mx-2 px-2 py-1 rounded-lg transition-colors">
								<div class="size-8 rounded-lg {row.bg} flex items-center justify-center shrink-0 transition-transform group-hover/row:scale-110">
									<row.icon class="size-4 {row.color}" />
								</div>
								<span class="text-sm text-muted-foreground flex-1">{row.label}</span>
								<span class="text-sm font-bold tabular-nums">{row.count}</span>
							</div>
						{/each}
					</Card>
				</a>
			</div>

			<!-- Expenses -->
			<div>
				<div class="flex items-center justify-between mb-3">
					<div class="inline-flex items-center gap-2 rounded-lg border border-orange-700/60 bg-orange-950/50 px-2.5 py-1.5 text-orange-300">
						<Receipt class="size-4" />
						<h2 class="text-sm font-semibold">Expenses</h2>
					</div>
					<Button href="/dashboard/expenses" variant="outline" size="sm" class="gap-1 text-xs border-orange-700/70 bg-orange-950/30 text-orange-300 hover:bg-orange-900/40">
						<Receipt class="size-3" /> View all <ArrowRight class="size-3" />
					</Button>
				</div>
				<a href="/dashboard/expenses" class="group/card block">
					<Card class="p-4 space-y-2 transition-all duration-150 group-hover/card:-translate-y-0.5 group-hover/card:shadow-lg">
						<div class="flex justify-between items-baseline">
							<span class="text-sm text-muted-foreground">Total</span>
							<span class="font-bold">{fmt(expenses.totalAmount)}</span>
						</div>
						<div class="flex justify-between items-baseline">
							<span class="text-sm text-muted-foreground">Approved</span>
							<span class="font-medium text-emerald-600">{fmt(expenses.approvedAmount ?? 0)}</span>
						</div>
						<div class="flex justify-between items-baseline">
							<span class="text-sm text-muted-foreground">Pending review</span>
							<span class="font-medium text-yellow-600">{expenses.submitted ?? 0} items</span>
						</div>
						<div class="h-px bg-border my-1"></div>
						<div class="flex justify-between items-baseline">
							<span class="text-sm text-muted-foreground">Transactions</span>
							<span class="font-medium">{expenses.total}</span>
						</div>
					</Card>
				</a>
			</div>

			<!-- Work Orders -->
			<div>
				<div class="flex items-center justify-between mb-3">
					<div class="inline-flex items-center gap-2 rounded-lg border border-sky-700/60 bg-sky-950/50 px-2.5 py-1.5 text-sky-300">
						<Briefcase class="size-4" />
						<h2 class="text-sm font-semibold">Work Orders</h2>
					</div>
					<Button href="/dashboard/work-orders" variant="outline" size="sm" class="gap-1 text-xs border-sky-700/70 bg-sky-950/30 text-sky-300 hover:bg-sky-900/40">
						<Briefcase class="size-3" /> View all <ArrowRight class="size-3" />
					</Button>
				</div>
				<a href="/dashboard/work-orders" class="group/card block">
					<Card class="p-4 space-y-2 transition-all duration-150 group-hover/card:-translate-y-0.5 group-hover/card:shadow-lg">
						<div class="flex justify-between items-baseline">
							<span class="text-sm text-muted-foreground">Total</span>
							<span class="font-bold">{fmt(workOrders.totalAmount)}</span>
						</div>
						<div class="flex justify-between items-baseline">
							<span class="text-sm text-muted-foreground">Open</span>
							<span class="font-medium text-blue-600">{workOrders.open}</span>
						</div>
						<div class="flex justify-between items-baseline">
							<span class="text-sm text-muted-foreground">Paid</span>
							<span class="font-medium text-emerald-600">{workOrders.paid}</span>
						</div>
						<div class="h-px bg-border my-1"></div>
						<div class="flex justify-between items-baseline">
							<span class="text-sm text-muted-foreground">Transactions</span>
							<span class="font-medium">{workOrders.total}</span>
						</div>
					</Card>
				</a>

				<Card class="mt-3 p-4 border border-slate-800 bg-slate-950/90">
					<div class="flex items-center justify-between mb-2">
						<h3 class="text-xs font-semibold uppercase tracking-wide text-slate-300">Income vs Expense vs Bank</h3>
						<span class="text-[10px] text-slate-500">normalized to max</span>
					</div>

					<div class="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
						<svg viewBox="0 0 324 112" class="w-full h-32" role="img" aria-label="Income, expense, and bank total line chart">
							<line x1="12" y1="10" x2="312" y2="10" stroke="rgba(148,163,184,0.25)" stroke-width="1" />
							<line x1="12" y1="56" x2="312" y2="56" stroke="rgba(148,163,184,0.18)" stroke-width="1" />
							<line x1="12" y1="102" x2="312" y2="102" stroke="rgba(148,163,184,0.25)" stroke-width="1" />

							{#each workOrderChartSummary.series as line}
								<polyline
									fill="none"
									stroke={line.stroke}
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									points={line.points}
								/>
								<circle cx={line.dotX} cy={line.dotY} r="3" fill={line.dot} />
							{/each}
						</svg>
					</div>

					<div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
						{#each workOrderChartSummary.series as line}
							<div class="rounded-md border border-slate-800 bg-slate-900/70 px-2.5 py-2">
								<div class="flex items-center justify-between gap-2">
									<span class="text-[11px] text-slate-300 inline-flex items-center gap-1.5">
										<span class="size-2 rounded-full" style={`background:${line.stroke}`}></span>
										{line.label}
									</span>
									<span class="text-xs font-semibold tabular-nums text-slate-100">{fmt(line.value)}</span>
								</div>
							</div>
						{/each}
					</div>
				</Card>
			</div>
		</div>
	</div>
	{:else if roleKey === 'sales'}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<Card class="p-4 lg:col-span-2 border border-emerald-800/70 bg-emerald-950/30 text-slate-100">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-sm font-semibold">Sales Pipeline</h2>
					<a href="/dashboard/sales" class="text-xs text-emerald-300 hover:text-emerald-200">Open Sales Board</a>
				</div>
				<div class="space-y-3">
					{#each [
						{ label: 'Leads', value: franchise.pipeline.leads ?? 0, color: 'bg-emerald-500' },
						{ label: 'Opportunities', value: franchise.pipeline.opportunities ?? 0, color: 'bg-cyan-500' },
						{ label: 'Deals', value: franchise.pipeline.deals ?? 0, color: 'bg-amber-500' }
					] as row}
						<div>
							<div class="flex justify-between text-xs mb-1">
								<span class="text-slate-300">{row.label}</span>
								<span class="font-semibold">{row.value}</span>
							</div>
							<div class="h-2 rounded-full bg-slate-800 overflow-hidden">
								<div class="h-full {row.color}" style="width:{Math.min(100, (row.value / Math.max(1, (franchise.pipeline.leads ?? 0))) * 100)}%"></div>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<Card class="p-4 border border-slate-800 bg-slate-950 text-slate-100">
				<h3 class="text-sm font-semibold mb-3">Sales Actions</h3>
				<div class="space-y-2">
					<a href="/dashboard/sponsors" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600">Manage Sponsors</a>
					<a href="/dashboard/franchise-sales" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600">Review Forecast</a>
					<a href="/dashboard/active-collections" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600">Track Collections</a>
					<a href="/dashboard/ticket-revenue" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600">Open Ticket Revenue</a>
				</div>
			</Card>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<Card class="p-4 border border-amber-800/70 bg-amber-950/30 text-slate-100">
				<p class="text-xs text-amber-200">Sponsor Commitments</p>
				<p class="text-xl font-bold mt-1">{fmt(sponsors.totalCommitted ?? 0)}</p>
			</Card>
			<Card class="p-4 border border-cyan-800/70 bg-cyan-950/30 text-slate-100">
				<p class="text-xs text-cyan-200">Ticket Projection</p>
				<p class="text-xl font-bold mt-1">{fmt(tickets.totalProjected ?? 0)}</p>
			</Card>
			<Card class="p-4 border border-violet-800/70 bg-violet-950/30 text-slate-100">
				<p class="text-xs text-violet-200">Branding Pipeline</p>
				<p class="text-xl font-bold mt-1">{fmt((branding.totalContracted ?? 0) + (branding.totalProposed ?? 0))}</p>
			</Card>
		</div>
	{:else if roleKey === 'marketing'}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<Card class="p-4 lg:col-span-2 border border-fuchsia-800/80 bg-fuchsia-950/50 text-slate-100 shadow-lg shadow-fuchsia-950/20">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-sm font-semibold inline-flex items-center gap-2">
						<Megaphone class="size-4 text-fuchsia-300" />
						Marketing Performance
					</h2>
					<a href="/dashboard/campaigns" class="text-xs text-fuchsia-300 hover:text-fuchsia-200 inline-flex items-center gap-1">
						<ArrowRight class="size-3" />
						Open Campaigns
					</a>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each [
						{ label: 'Sponsor Revenue', value: sponsors.totalCommitted ?? 0, color: 'bg-amber-500', icon: Star, iconColor: 'text-amber-300' },
						{ label: 'Branding Contracted', value: branding.totalContracted ?? 0, color: 'bg-emerald-500', icon: Flag, iconColor: 'text-emerald-300' },
						{ label: 'Branding Proposed', value: branding.totalProposed ?? 0, color: 'bg-violet-500', icon: Film, iconColor: 'text-violet-300' },
						{ label: 'Ticket Pipeline', value: tickets.totalProjected ?? 0, color: 'bg-cyan-500', icon: Ticket, iconColor: 'text-cyan-300' }
					] as row}
						<div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
							<p class="text-[11px] uppercase tracking-wide text-slate-400 inline-flex items-center gap-2">
								<row.icon class="size-3.5 {row.iconColor}" />
								{row.label}
							</p>
							<p class="text-lg font-semibold mt-1">{fmt(row.value)}</p>
							<div class="h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
								<div class="h-full {row.color}" style="width:{Math.min(100, (row.value / Math.max(1, cashflow.projectedRevenue || 1)) * 100)}%"></div>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<Card class="p-4 border border-fuchsia-900/60 bg-slate-950 text-slate-100 shadow-lg shadow-black/20">
				<h3 class="text-sm font-semibold mb-3 inline-flex items-center gap-2">
					<Zap class="size-4 text-fuchsia-300" />
					Marketing Actions
				</h3>
				<div class="space-y-2">
					<a href="/dashboard/campaigns" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600 inline-flex items-center gap-2 w-full">
						<Megaphone class="size-3.5 text-fuchsia-300" />
						Campaign Board
					</a>
					<a href="/dashboard/marketing/campaigns/new" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600 inline-flex items-center gap-2 w-full">
						<ArrowRight class="size-3.5 text-emerald-300" />
						Create Campaign
					</a>
					<a href="/dashboard/manage-media-content" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600 inline-flex items-center gap-2 w-full">
						<Images class="size-3.5 text-rose-300" />
						Manage Media Content
					</a>
					<a href="/dashboard/events" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600 inline-flex items-center gap-2 w-full">
						<PartyPopper class="size-3.5 text-cyan-300" />
						Events
					</a>
					<a href="/dashboard/sponsors" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600 inline-flex items-center gap-2 w-full">
						<Star class="size-3.5 text-amber-300" />
						Sponsor Accounts
					</a>
				</div>
			</Card>
		</div>

		<!-- Role-aware quick access (middle) -->
		<div class="rounded-xl border border-fuchsia-900/60 bg-slate-950/90 p-4 shadow-lg shadow-fuchsia-950/10">
			<div class="flex items-center justify-between mb-3">
				<h3 class="text-xs font-semibold uppercase tracking-wide text-slate-300 inline-flex items-center gap-2">
					<Cpu class="size-3.5 text-fuchsia-300" />
					{roleLabel || 'Role'} Shortcuts
				</h3>
				<span class="text-[10px] text-slate-500">{roleQuickAccessLinks.length} shown</span>
			</div>
			<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
				{#each roleQuickAccessLinks as link}
					<a href={link.href}
						class="group flex flex-col items-center gap-2 rounded-xl border {link.bg} px-2 py-3 text-center hover:brightness-125 transition-all duration-150">
						<link.icon class="size-5 {link.color} transition-transform group-hover:scale-110" />
						<span class="text-[11px] font-medium text-slate-300">{link.label}</span>
					</a>
				{/each}
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<Card class="p-4 border border-rose-800/80 bg-rose-950/45 text-slate-100 shadow-lg shadow-rose-950/10">
				<p class="text-xs text-rose-200 inline-flex items-center gap-2">
					<Images class="size-3.5" />
					Content Queue
				</p>
				<p class="text-xl font-bold mt-1">{Number(m.content ?? 0)}</p>
			</Card>
			<Card class="p-4 border border-blue-800/80 bg-blue-950/45 text-slate-100 shadow-lg shadow-blue-950/10">
				<p class="text-xs text-blue-200 inline-flex items-center gap-2">
					<CheckCircle2 class="size-3.5" />
					Active Goals
				</p>
				<p class="text-xl font-bold mt-1">{Number(m.goals ?? 0)}</p>
			</Card>
			<Card class="p-4 border border-emerald-800/80 bg-emerald-950/45 text-slate-100 shadow-lg shadow-emerald-950/10">
				<p class="text-xs text-emerald-200 inline-flex items-center gap-2">
					<PartyPopper class="size-3.5" />
					Events in Pipeline
				</p>
				<p class="text-xl font-bold mt-1">{Number(m.events ?? 0)}</p>
			</Card>
		</div>
	{:else if roleKey === 'talent'}
		{@const progressRows = [
			{ label: 'Documents' as const, state: onboardingBadge ?? 'pending', icon: BadgeCheck, href: '/dashboard/onboarding' },
			{ label: 'Player Profile' as const, state: playerProfileNote ?? 'pending', icon: UserCircle, href: '/dashboard/player-profile' }
		]}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<Card class="p-4 lg:col-span-2 border border-indigo-800/70 bg-indigo-950/30 text-slate-100">
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-sm font-semibold inline-flex items-center gap-2">
						<BadgeCheck class="size-4 text-indigo-300" />
						My Progress
					</h2>
					<a href="/dashboard/onboarding" class="text-xs text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1">
						<ArrowRight class="size-3" />
						Open Onboarding
					</a>
				</div>
				<div class="space-y-3">
					{#each progressRows as row}
						<a href={row.href} class="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 flex items-center justify-between hover:border-slate-600 transition-colors">
							<span class="text-xs text-slate-300 inline-flex items-center gap-2">
								<row.icon class="size-3.5 text-indigo-300" />
								{row.label}
							</span>
							<span class="text-xs font-semibold text-emerald-300">{normalizeTalentProgressState(row.label, row.state)}</span>
						</a>
					{/each}
				</div>
			</Card>

			<Card class="p-4 border border-slate-800 bg-slate-950 text-slate-100">
				<h3 class="text-sm font-semibold mb-3 inline-flex items-center gap-2">
					<Zap class="size-4 text-cyan-300" />
					My Actions
				</h3>
				<div class="space-y-2">
					<a href="/dashboard/my-payments" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600 inline-flex items-center gap-2 w-full">
						<Wallet class="size-3.5 text-cyan-300" />
						View My Payments
					</a>
					<a href="/dashboard/reimbursements" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600 inline-flex items-center gap-2 w-full">
						<Receipt class="size-3.5 text-fuchsia-300" />
						Submit Reimbursement
					</a>
					<a href="/dashboard/player-profile" class="block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs hover:border-slate-600 inline-flex items-center gap-2 w-full">
						<UserCircle class="size-3.5 text-emerald-300" />
						Update Profile
					</a>
				</div>
			</Card>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<Card class="p-4 border border-fuchsia-800/70 bg-fuchsia-950/30 text-slate-100">
				<p class="text-xs text-fuchsia-200 inline-flex items-center gap-2">
					<Receipt class="size-3.5" />
					My Claims
				</p>
				<p class="text-xl font-bold mt-1">{Number(m.reimbursements ?? 0)}</p>
			</Card>
			<Card class="p-4 border border-cyan-800/70 bg-cyan-950/30 text-slate-100">
				<p class="text-xs text-cyan-200 inline-flex items-center gap-2">
					<Wallet class="size-3.5" />
					Open Payments
				</p>
				<p class="text-xl font-bold mt-1">{Number(m.payments ?? 0)}</p>
			</Card>
			<Card class="p-4 border border-amber-800/70 bg-amber-950/30 text-slate-100">
				<p class="text-xs text-amber-200 inline-flex items-center gap-2">
					<UserCircle class="size-3.5" />
					Profile Readiness
				</p>
				<p class="text-xl font-bold mt-1">{playerProfileNote ?? 'pending'}</p>
			</Card>
		</div>

		<!-- Role-aware quick access (bottom) -->
		<div class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
			<div class="flex items-center justify-between mb-3">
				<h3 class="text-xs font-semibold uppercase tracking-wide text-slate-300">{roleLabel || 'Role'} Shortcuts</h3>
				<span class="text-[10px] text-slate-500">{roleQuickAccessLinks.length} shown</span>
			</div>
			<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
				{#each roleQuickAccessLinks as link}
					<a href={link.href}
						class="group flex flex-col items-center gap-2 rounded-xl border {link.bg} px-2 py-3 text-center hover:brightness-125 transition-all duration-150">
						<link.icon class="size-5 {link.color} transition-transform group-hover:scale-110" />
						<span class="text-[11px] font-medium text-slate-300">{link.label}</span>
					</a>
				{/each}
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
			{#each rolePrimaryCards as card}
				<a href={card.href} class="rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 hover:border-slate-600 transition-colors">
					<p class="text-[11px] uppercase tracking-wide text-slate-400">{card.label}</p>
					<p class="text-lg font-semibold mt-1 text-slate-100">{card.value}</p>
					<p class="text-[11px] text-slate-500 mt-1">{card.hint}</p>
				</a>
			{/each}
		</div>
	{/if}


</div>
