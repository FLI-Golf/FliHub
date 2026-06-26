import assert from 'node:assert/strict';
import { createServer } from 'vite';

type MockContext = {
	userId: string | null;
	role: string;
	profile?: Record<string, unknown> | null;
};

const testUrl = new URL('http://localhost/portal');
const fakeLocals = {} as any;

function assertRedirect(error: any, status: number, location: string) {
	assert.equal(error?.status, status, 'redirect status mismatch');
	assert.equal(error?.location, location, 'redirect location mismatch');
}

async function expectRedirect(run: () => Promise<unknown>, expectedLocation: string, expectedStatus = 303) {
	try {
		await run();
		assert.fail(`expected redirect to ${expectedLocation}`);
	} catch (error: any) {
		assertRedirect(error, expectedStatus, expectedLocation);
	}
}

async function run() {
	const vite = await createServer({
		logLevel: 'error',
		server: { middlewareMode: true },
		appType: 'custom',
	});

	try {
		const requestContextModule = await vite.ssrLoadModule('/src/lib/infra/RequestContext.ts');
		const pageModule = await vite.ssrLoadModule('/src/routes/portal/+page.server.ts');
		const layoutModule = await vite.ssrLoadModule('/src/routes/portal/+layout.server.ts');
		const vendorLayoutModule = await vite.ssrLoadModule('/src/routes/vendor/+layout.server.ts');
		const vendorDashboardModule = await vite.ssrLoadModule('/src/routes/vendor/dashboard/+page.server.ts');
		const vendorProjectsModule = await vite.ssrLoadModule('/src/routes/vendor/projects/+page.server.ts');
		const vendorBidsModule = await vite.ssrLoadModule('/src/routes/vendor/bids/+page.server.ts');

		const RequestContext = requestContextModule.RequestContext as any;
		const portalPageLoad = pageModule.load as any;
		const portalLayoutLoad = layoutModule.load as any;
		const vendorLayoutLoad = vendorLayoutModule.load as any;
		const vendorDashboardLoad = vendorDashboardModule.load as any;
		const vendorProjectsLoad = vendorProjectsModule.load as any;
		const vendorBidsLoad = vendorBidsModule.load as any;
		const originalFrom = RequestContext.from;

		const setMockContext = (mockContext: MockContext | null, mode: 'return' | 'throw-login' = 'return') => {
			RequestContext.from = async () => {
				if (mode === 'throw-login') {
					const err: any = new Error('Redirect');
					err.status = 303;
					err.location = '/auth/login?redirect=%2Fportal';
					throw err;
				}

				return {
					userId: mockContext?.userId,
					role: mockContext?.role,
					profile: mockContext?.profile ?? null,
				} as any;
			};
		};

		const restoreRequestContext = () => {
			RequestContext.from = originalFrom;
		};

		// Page load redirects by role home route
		setMockContext({ userId: 'u1', role: 'leader' });
		await expectRedirect(
			() => portalPageLoad({ locals: fakeLocals, url: testUrl, parent: async () => ({}) }),
			'/portal/projects'
		);

		setMockContext({ userId: 'u1', role: 'marketing_lead' });
		await expectRedirect(
			() => portalPageLoad({ locals: fakeLocals, url: testUrl, parent: async () => ({}) }),
			'/portal/marketing/dashboard'
		);

		setMockContext({ userId: 'u1', role: 'vendor' });
		await expectRedirect(
			() => portalPageLoad({ locals: fakeLocals, url: testUrl, parent: async () => ({}) }),
			'/portal/vendor/dashboard'
		);

		// Layout load redirects users whose policy disallows portal layout
		setMockContext({ userId: 'u1', role: 'admin' });
		await expectRedirect(() => portalLayoutLoad({ locals: fakeLocals, url: testUrl }), '/dashboard');

		setMockContext({ userId: 'u1', role: 'vendor' });
		const vendorPortalResult: any = await portalLayoutLoad({ locals: fakeLocals, url: testUrl });
		assert.equal(vendorPortalResult.portalRole, 'vendor');
		assert.ok(Array.isArray(vendorPortalResult.portalConfig?.nav), 'expected vendor portal nav array');
		assert.ok(
			vendorPortalResult.portalConfig.nav.every((item: any) => item.href.startsWith('/portal/vendor') || item.href === '/portal/profile'),
			'expected vendor portal nav entries to be vendor scoped'
		);

		setMockContext({ userId: 'u1', role: 'league_owner' });
		await expectRedirect(() => portalLayoutLoad({ locals: fakeLocals, url: testUrl }), '/dashboard');

		// Layout load returns hydrated config for allowed role
		setMockContext({
			userId: 'u1',
			role: 'leader',
			profile: { firstName: 'Corey', lastName: 'La Russo', email: 'corey@example.com' },
		});

		const leaderResult: any = await portalLayoutLoad({ locals: fakeLocals, url: testUrl });
		assert.equal(leaderResult.portalRole, 'leader');
		assert.ok(Array.isArray(leaderResult.portalConfig?.nav), 'expected portal nav array');
		assert.ok(
			leaderResult.portalConfig.nav.some((item: any) => item.href === '/portal/profile'),
			'expected profile link in portal nav'
		);
		assert.equal(leaderResult.portalProfile?.firstName, 'Corey');

		// RequestContext login redirects are propagated by both loaders
		setMockContext(null, 'throw-login');
		await expectRedirect(
			() => portalPageLoad({ locals: fakeLocals, url: testUrl, parent: async () => ({}) }),
			'/auth/login?redirect=%2Fportal'
		);
		await expectRedirect(
			() => portalLayoutLoad({ locals: fakeLocals, url: testUrl }),
			'/auth/login?redirect=%2Fportal'
		);

		// Legacy /vendor compatibility redirects to canonical /portal/vendor routes
		const vendorBaseUrl = new URL('http://localhost/vendor');
		const vendorBaseWithQueryUrl = new URL('http://localhost/vendor?next=projects&tab=open');
		const vendorBaseWithHashUrl = new URL('http://localhost/vendor?next=dashboard#overview');
		const vendorDashboardUrl = new URL('http://localhost/vendor/dashboard?view=summary');
		const vendorProjectsUrl = new URL('http://localhost/vendor/projects?status=open');
		const vendorBidsUrl = new URL('http://localhost/vendor/bids?page=2');

		setMockContext({ userId: 'u1', role: 'vendor' });
		await expectRedirect(
			() => vendorLayoutLoad({ locals: fakeLocals, url: vendorBaseUrl }),
			'/portal/vendor/dashboard',
			308
		);
		await expectRedirect(
			() => vendorLayoutLoad({ locals: fakeLocals, url: vendorBaseWithQueryUrl }),
			'/portal/vendor/dashboard?next=projects&tab=open',
			308
		);
		// Hash fragments are client-only in real HTTP requests; querystring is what must be preserved.
		await expectRedirect(
			() => vendorLayoutLoad({ locals: fakeLocals, url: vendorBaseWithHashUrl }),
			'/portal/vendor/dashboard?next=dashboard',
			308
		);
		await expectRedirect(
			() => vendorDashboardLoad({ locals: fakeLocals, url: vendorDashboardUrl, parent: async () => ({}) }),
			'/portal/vendor/dashboard?view=summary',
			308
		);
		await expectRedirect(
			() => vendorProjectsLoad({ locals: fakeLocals, url: vendorProjectsUrl, parent: async () => ({}) }),
			'/portal/vendor/projects?status=open',
			308
		);
		await expectRedirect(
			() => vendorBidsLoad({ locals: fakeLocals, url: vendorBidsUrl, parent: async () => ({}) }),
			'/portal/vendor/bids?page=2',
			308
		);

		setMockContext({ userId: 'u1', role: 'admin' });
		await expectRedirect(
			() => vendorLayoutLoad({ locals: fakeLocals, url: vendorBaseUrl }),
			'/dashboard',
			303
		);

		restoreRequestContext();
	} finally {
		await vite.close();
	}
}

run()
	.then(() => {
		console.log('Portal server-load redirect integration tests passed.');
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
