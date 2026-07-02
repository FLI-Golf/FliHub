import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	throw redirect(308, '/dashboard/events');
};
