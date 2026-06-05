import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

async function readPhase5State(pb: any) {
	const [packages, collections, items] = await Promise.all([
		pb.collection('highlight_packages').getFullList({ sort: '-created' }).catch(() => []),
		pb.collection('media_collections').getFullList({ sort: '-created' }).catch(() => []),
		pb.collection('highlight_package_items').getFullList({ sort: 'sort_order,created' }).catch(() => [])
	]);

	return { packages, collections, items };
}

export const GET: RequestHandler = async ({ locals }) => {
	const pb = locals.pb;
	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const payload = await readPhase5State(pb);
		return json(payload);
	} catch (error) {
		console.error('Error loading highlight packages:', error);
		return json({ message: 'Failed to load highlight packages', error: String(error) }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const pb = locals.pb;
	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		if (!data?.name) {
			return json({ message: 'Package name is required' }, { status: 400 });
		}

		const packageRecord = await pb.collection('highlight_packages').create({
			name: data.name,
			package_type: data.package_type || 'other',
			status: data.status || 'draft',
			export_target: data.export_target || 'internal',
			approval_status: data.approval_status || 'pending',
			notes: data.notes || ''
		});

		let collectionRecord = null;
		if (data.create_collection) {
			collectionRecord = await pb.collection('media_collections').create({
				name: data.collection_name || `${data.name} Collection`,
				collection_type: data.collection_type || data.package_type || 'other',
				season: data.season || null,
				tournament: data.tournament || null,
				special_event: data.special_event || null,
				sponsor: data.sponsor || null,
				owner: data.owner || '',
				status: data.collection_status || 'draft',
				notes: data.collection_notes || ''
			});
		}

		return json({ package: packageRecord, collection: collectionRecord }, { status: 201 });
	} catch (error) {
		console.error('Error creating highlight package:', error);
		return json({ message: 'Failed to create highlight package', error: String(error) }, { status: 500 });
	}
};
