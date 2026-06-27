import { RequestContext } from '$lib/infra/RequestContext';
import { getEmailDeliveryStatus } from '$lib/server/email-config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { emailDeliveryEnabled } = getEmailDeliveryStatus();

	return {
		user: locals.pb?.authStore?.model ?? null,
		userProfile: ctx.profile ?? null,
		emailDeliveryEnabled
	};
};
