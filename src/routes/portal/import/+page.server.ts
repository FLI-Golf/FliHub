import type { PageServerLoad } from './$types';
import { loadImportPageData } from '$lib/server/import/loadImportPageData';

export const load: PageServerLoad = async ({ locals, url }) => loadImportPageData(locals, url);
