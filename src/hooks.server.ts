import { getPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.pb = getPocketBase();

	// Load auth state from cookie
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		// Refresh auth if valid
		if (event.locals.pb.authStore.isValid) {
			await event.locals.pb.collection('users').authRefresh();
		}
	} catch (_) {
		event.locals.pb.authStore.clear();
	}

	const response = await resolve(event);

	// Set auth cookie
	response.headers.set(
		'set-cookie',
		event.locals.pb.authStore.exportToCookie({ secure: false })
	);

	return response;
};
