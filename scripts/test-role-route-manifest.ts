import assert from 'node:assert/strict';
import {
	getRoleHomeHref,
	getRoleRoutePolicy,
	canRoleAccessHref,
	getDashboardNavGroups,
	getRolePortalNav,
} from '../src/lib/domain/routing/RoleRouteManifest';

type HomeCase = {
	role: string | null | undefined;
	expectedHome: string;
	expectedPortalLayout: boolean;
};

const homeCases: HomeCase[] = [
	{ role: 'admin', expectedHome: '/dashboard', expectedPortalLayout: false },
	{ role: 'leader', expectedHome: '/portal/projects', expectedPortalLayout: true },
	{ role: 'sales', expectedHome: '/portal/leads', expectedPortalLayout: true },
	{ role: 'vendor', expectedHome: '/portal/vendor/dashboard', expectedPortalLayout: true },
	{ role: 'pro', expectedHome: '/portal/tournaments', expectedPortalLayout: true },
	{ role: 'franchise_owner', expectedHome: '/portal/franchise', expectedPortalLayout: true },
	{ role: 'league_owner', expectedHome: '/dashboard', expectedPortalLayout: false },
	{ role: 'broadcaster', expectedHome: '/portal/media', expectedPortalLayout: true },
	{ role: 'manager', expectedHome: '/portal/payments', expectedPortalLayout: true },
	{ role: 'marketing', expectedHome: '/portal/marketing/goals', expectedPortalLayout: true },
	{ role: 'marketing_lead', expectedHome: '/portal/marketing/dashboard', expectedPortalLayout: true },
	{ role: undefined, expectedHome: '/portal/projects', expectedPortalLayout: true },
	{ role: null, expectedHome: '/portal/projects', expectedPortalLayout: true },
	{ role: 'unknown-role', expectedHome: '/portal/projects', expectedPortalLayout: true },
];

for (const testCase of homeCases) {
	const policy = getRoleRoutePolicy(testCase.role);
	assert.equal(getRoleHomeHref(testCase.role), testCase.expectedHome, `home href mismatch for role ${String(testCase.role)}`);
	assert.equal(policy.allowPortalLayout, testCase.expectedPortalLayout, `portal layout policy mismatch for role ${String(testCase.role)}`);
}

type AccessCase = {
	role: string;
	href: string;
	expected: boolean;
};

const accessCases: AccessCase[] = [
	{ role: 'admin', href: '/dashboard/projects', expected: true },
	{ role: 'admin', href: '/portal/projects', expected: false },
	{ role: 'leader', href: '/portal/projects', expected: true },
	{ role: 'leader', href: '/dashboard/tasks', expected: true },
	{ role: 'leader', href: '/portal/vendor/dashboard', expected: false },
	{ role: 'vendor', href: '/portal/vendor/dashboard', expected: true },
	{ role: 'vendor', href: '/vendor/dashboard', expected: false },
	{ role: 'vendor', href: '/portal/profile', expected: false },
	{ role: 'league_owner', href: '/dashboard/use-of-proceeds', expected: true },
	{ role: 'league_owner', href: '/portal/profile', expected: false },
	{ role: 'marketing_lead', href: '/portal/marketing/dashboard', expected: true },
	{ role: 'marketing_lead', href: '/dashboard/marketing-goals', expected: true },
	{ role: 'marketing_lead', href: '/portal/vendor/bids', expected: false },
];

for (const testCase of accessCases) {
	assert.equal(
		canRoleAccessHref(testCase.role, testCase.href),
		testCase.expected,
		`access policy mismatch for ${testCase.role} -> ${testCase.href}`
	);
}

// Ensure portal nav is already policy-filtered.
assert.equal(
	getRolePortalNav('vendor').every((item) => item.href.startsWith('/portal/vendor')),
	true,
	'vendor portal nav should be scoped to /portal/vendor'
);

// Ensure dashboard nav renderer receives filtered groups/items.
const vendorDashboardGroups = getDashboardNavGroups('vendor');
assert.equal(vendorDashboardGroups.length, 0, 'vendor should not receive dashboard nav groups under strict shell policy');

const adminDashboardGroups = getDashboardNavGroups('admin');
assert.ok(adminDashboardGroups.length > 0, 'admin should receive dashboard nav groups');

console.log('Role route manifest matrix tests passed.');
