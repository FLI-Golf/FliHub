import { getPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	try {
		event.locals.pb = getPocketBase();

		// Load auth state from cookie
		event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

		// Skip auth refresh to avoid blocking
		const response = await resolve(event);

		// Set auth cookie
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
		// Don't throw - allow app to continue
		return await resolve(event);
	}
};
