import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	return {
		user: locals.pb?.authStore?.model ?? null,
		userProfile: ctx.profile ?? null
	};
};
