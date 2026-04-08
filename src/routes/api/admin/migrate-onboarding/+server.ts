import { json } from '@sveltejs/kit';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { collections } from '$lib/migrations/collections';
import type { RequestHandler } from './$types';

const ONBOARDING_COLLECTIONS = ['onboarding_status', 'document_signatures', 'player_profiles'];

export const POST: RequestHandler = async () => {
	try {
		const pb = await getAdminPocketBase();
		const existing = await pb.collections.getFullList();
		const existingNames = new Set(existing.map((c) => c.name));

		const results: { name: string; action: string }[] = [];

		for (const col of collections) {
			if (!ONBOARDING_COLLECTIONS.includes(col.name)) continue;

			if (existingNames.has(col.name)) {
				results.push({ name: col.name, action: 'skipped (already exists)' });
				continue;
			}

			await pb.collections.create(col as any);
			results.push({ name: col.name, action: 'created' });
		}

		return json({ success: true, results });
	} catch (err: any) {
		console.error('Onboarding migration error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
