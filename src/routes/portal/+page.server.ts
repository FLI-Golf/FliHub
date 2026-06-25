import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { PortholeFactory } from '$lib/domain/porthole/RolePorthole';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) throw redirect(303, '/auth/login');

	// Get the porthole for this user's role
	const porthole = PortholeFactory.for(ctx.role);
	
	// Redirect to the first nav item (if available) or projects as default
	if (porthole.nav && porthole.nav.length > 0) {
		const firstNav = porthole.nav[0];
		// Convert nav label to route (e.g., "My Department" → "projects", "Dashboard" → "dashboard")
		const routeMap: Record<string, string> = {
			'Dashboard': 'dashboard',
			'My Department': 'projects',
			'My Projects': 'projects',
			'Tasks': 'tasks',
			'Expenses': 'expenses',
			'Goals': 'goals',
			'Campaigns': 'campaigns',
			'Earnings': 'earnings',
			'Profile': 'profile'
		};
		const route = routeMap[firstNav] || 'projects';
		throw redirect(303, `/portal/${route}`);
	}

	// Fallback to projects
	throw redirect(303, '/portal/projects');
};
