import { createPocketBaseClient } from '$lib/infra/pocketbase/pbClient';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	try {
		// Create a fresh per-request client — never share the singleton here,
		// because admin-authenticated server loads would otherwise overwrite
		// the user auth store and corrupt the session cookie.
		event.locals.pb = createPocketBaseClient();

		// Load auth state from cookie
		event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

		const response = await resolve(event);

		// Persist the user auth state back to cookie
		try {
			response.headers.append(
				'set-cookie',
				event.locals.pb.authStore.exportToCookie({ secure: false })
			);
		} catch (e) {
			// Ignore cookie errors
		}

		return response;
	} catch (error) {
		console.error('Hook error:', error);
		return await resolve(event);
	}
};
