import type { PageServerLoad } from './$types';
import { loadReimbursementsPageData } from '$lib/server/reimbursements/loadReimbursementsPageData';

export const load: PageServerLoad = async ({ locals, url }) => loadReimbursementsPageData(locals, url);
