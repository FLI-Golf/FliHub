import type { PageServerLoad } from './$types';
import { loadReimbursementsAdminPageData } from '$lib/server/reimbursements/loadReimbursementsAdminPageData';

export const load: PageServerLoad = async ({ locals, url }) =>
	loadReimbursementsAdminPageData(locals, url, { scope: 'session' });
