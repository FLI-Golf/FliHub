import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import PocketBase from 'pocketbase';

export const load: PageServerLoad = async () => {
	const pb = new PocketBase(env.POCKETBASE_URL);

	try {
		await pb.collection('_superusers').authWithPassword(
			env.POCKETBASE_ADMIN_EMAIL!,
			env.POCKETBASE_ADMIN_PASSWORD!
		);
	} catch (err: any) {
		console.error('Admin auth failed:', err.message);
	}

	const [assets, franchises, projects, campaigns] = await Promise.all([
		pb.collection('media_assets').getFullList().catch((err: any) => {
			console.error('Failed to fetch media_assets:', err?.message, err?.status);
			return [];
		}),
		pb.collection('franchises').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
		pb.collection('projects').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
		pb.collection('campaigns').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => [])
	]);

	return { assets, franchises, projects, campaigns };
};
