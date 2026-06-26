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
	{ role: 'league_owner', expectedHome: '/portal/profile', expectedPortalLayout: true },
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
	{ role: 'leader', href: '/dashboard/tasks', expected: false },
	{ role: 'leader', href: '/portal/vendor/dashboard', expected: false },
	{ role: 'vendor', href: '/portal/vendor/dashboard', expected: true },
	{ role: 'vendor', href: '/vendor/dashboard', expected: false },
	{ role: 'vendor', href: '/portal/profile', expected: false },
	{ role: 'league_owner', href: '/dashboard/use-of-proceeds', expected: false },
	{ role: 'league_owner', href: '/portal/profile', expected: true },
	{ role: 'marketing_lead', href: '/portal/marketing/dashboard', expected: true },
	{ role: 'marketing_lead', href: '/dashboard/marketing-goals', expected: false },
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

assert.equal(
	getRolePortalNav('leader').some((item) => item.href === '/portal/reimbursements'),
	true,
	'leader portal nav should include reimbursements'
);

assert.equal(
	getRolePortalNav('leader').find((item) => item.href === '/portal/reimbursements')?.label,
	'My Reimbursements',
	'leader portal reimbursements label should expose personal claimant workspace'
);

assert.equal(
	getRolePortalNav('leader').find((item) => item.href === '/portal/reimbursements/admin')?.label,
	'Reimbursements Admin',
	'leader portal reimbursements admin label should expose session admin workspace'
);

assert.equal(
	getRolePortalNav('leader').some((item) => item.href === '/portal/import'),
	true,
	'leader portal nav should include import data'
);

assert.equal(
	getRolePortalNav('marketing').some((item) => item.href === '/portal/reimbursements'),
	true,
	'marketing portal nav should include reimbursements'
);

assert.equal(
	getRolePortalNav('marketing').find((item) => item.href === '/portal/reimbursements')?.label,
	'My Reimbursements',
	'marketing portal reimbursements label should expose personal claimant workspace'
);

assert.equal(
	getRolePortalNav('marketing').find((item) => item.href === '/portal/reimbursements/admin')?.label,
	'Reimbursements Admin',
	'marketing portal reimbursements admin label should expose session admin workspace'
);

assert.equal(
	getRolePortalNav('marketing').some((item) => item.href === '/portal/import'),
	true,
	'marketing portal nav should include import data'
);

assert.equal(
	getRolePortalNav('marketing_lead').some((item) => item.href === '/portal/reimbursements'),
	true,
	'marketing lead portal nav should include reimbursements'
);

assert.equal(
	getRolePortalNav('marketing_lead').find((item) => item.href === '/portal/reimbursements')?.label,
	'My Reimbursements',
	'marketing lead portal reimbursements label should expose personal claimant workspace'
);

assert.equal(
	getRolePortalNav('marketing_lead').find((item) => item.href === '/portal/reimbursements/admin')?.label,
	'Reimbursements Admin',
	'marketing lead portal reimbursements admin label should expose session admin workspace'
);

assert.equal(
	getRolePortalNav('marketing_lead').some((item) => item.href === '/portal/import'),
	true,
	'marketing lead portal nav should include import data'
);

// Ensure dashboard nav renderer receives filtered groups/items.
const vendorDashboardGroups = getDashboardNavGroups('vendor');
assert.equal(vendorDashboardGroups.length, 0, 'vendor should not receive dashboard nav groups under strict shell policy');

const adminDashboardGroups = getDashboardNavGroups('admin');
assert.ok(adminDashboardGroups.length > 0, 'admin should receive dashboard nav groups');

console.log('Role route manifest matrix tests passed.');
