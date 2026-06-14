import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function normalize(value: unknown): string {
	return String(value ?? '').trim().toLowerCase();
}

function nextStage(stage: string): string {
	switch (normalize(stage)) {
		case 'brief':
		case 'shoot':
			return 'edit';
		case 'edit':
			return 'approval';
		case 'approval':
			return 'published';
		case 'published':
			return 'published';
		default:
			return 'brief';
	}
}

function buildItem(record: any, order: number) {
	const stage = normalize(record.stage) || 'brief';
	const approvalStatus = normalize(record.approvalStatus) || 'pending';

	let recommendedAction = 'review';
	if (stage === 'brief' || stage === 'shoot') recommendedAction = 'advance to edit';
	else if (stage === 'edit') recommendedAction = 'send to approval';
	else if (stage === 'approval' && approvalStatus !== 'approved') recommendedAction = 'approve';
	else if (stage === 'approval' && approvalStatus === 'approved') recommendedAction = 'publish';
	else if (stage === 'published') recommendedAction = 'export manifest';

	return {
		id: record.id,
		order,
		title: record.title || 'Untitled package',
		contentType: record.contentType || 'highlight',
		stage,
		approvalStatus,
		recommendedAction,
		description: record.description || '',
		notes: record.notes || '',
		budget: Number(record.budget || 0),
		actualCost: Number(record.actualCost || 0),
		dueDate: record.dueDate || null,
		approvedBy: record.approvedBy || null,
		approvedAt: record.approvedAt || null,
		publishedUrl: record.publishedUrl || null,
	};
}

function buildPackages(records: any[]) {
	const groups = new Map<string, any[]>();

	for (const record of records) {
		const title = record.title || 'Untitled package';
		const existing = groups.get(title) ?? [];
		existing.push(record);
		groups.set(title, existing);
	}

	return Array.from(groups.entries()).map(([title, items]) => {
		const latest = items[0];
		return {
			title,
			count: items.length,
			stage: normalize(latest?.stage) || 'brief',
			approvalStatus: normalize(latest?.approvalStatus) || 'pending',
			contentType: latest?.contentType || 'highlight',
		};
	});
}

function buildManifest(title: string, items: any[]) {
	return {
		title,
		generatedAt: new Date().toISOString(),
		items: items.map((item) => ({
			id: item.id,
			title: item.title,
			stage: item.stage,
			approvalStatus: item.approvalStatus,
			recommendedAction: item.recommendedAction,
		})),
		clipSpan: `${items.length} items`,
	};
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const packageTitle = url.searchParams.get('packageTitle')?.trim() || '';
		const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 8) || 8, 1), 25);

		const records = await pb.collection('content_production').getFullList({
			sort: '-created',
		}).catch(() => []);

		const highlightRecords = records.filter((record: any) => normalize(record.contentType) === 'highlight');
		const packages = buildPackages(highlightRecords);
		const filteredRecords = packageTitle
			? highlightRecords.filter((record: any) => (record.title || '') === packageTitle)
			: highlightRecords;
		const items = filteredRecords.slice(0, limit).map((record: any, index: number) => buildItem(record, index + 1));
		const manifestTitle = packageTitle || packages[0]?.title || 'Latest highlight package';

		return json({
			selectedPackage: packageTitle || packages[0]?.title || 'none',
			packageStatus: normalize(filteredRecords[0]?.stage) || 'draft',
			packages,
			items,
			counts: {
				total: highlightRecords.length,
				packages: packages.length,
				brief: highlightRecords.filter((record: any) => normalize(record.stage) === 'brief').length,
				edit: highlightRecords.filter((record: any) => normalize(record.stage) === 'edit').length,
				approval: highlightRecords.filter((record: any) => normalize(record.stage) === 'approval').length,
				published: highlightRecords.filter((record: any) => normalize(record.stage) === 'published').length,
			},
			clipSpan: `${items.length} items`,
			manifest: buildManifest(manifestTitle, items),
		});
	} catch (error) {
		console.error('Error fetching Phase 5 packages:', error);
		return json({ message: 'Failed to fetch Phase 5 packages', error: String(error) }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json().catch(() => ({}));
		const action = normalize(body.action);
		const id = String(body.id || '').trim();
		const packageTitle = String(body.packageTitle || '').trim();
		const packageType = String(body.packageType || 'Reel').trim() || 'Reel';
		const packageStatus = normalize(body.packageStatus) || 'draft';
		const actor = pb.authStore.model?.id || pb.authStore.model?.email || 'system';

		if (action === 'create') {
			const title = `Phase 5 ${packageType} Package ${new Date().toISOString().slice(0, 10)}`;
			const record = await pb.collection('content_production').create({
				title,
				contentType: 'highlight',
				stage: packageStatus === 'published' ? 'published' : packageStatus === 'approved' ? 'approval' : 'brief',
				description: `${packageType} package created from the media dashboard`,
				requiresApproval: true,
				approvalStatus: packageStatus === 'approved' ? 'approved' : 'pending',
				approvedBy: packageStatus === 'approved' ? actor : null,
				approvedAt: packageStatus === 'approved' ? new Date().toISOString() : null,
				notes: 'Created from Phase 5 package manager',
				createdBy: actor,
			});

			return json({
				created: record,
				selectedPackage: record.title,
				packageStatus: normalize(record.stage) || 'brief',
			}, { status: 201 });
		}

		if (!id && action !== 'export') {
			return json({ message: 'id is required' }, { status: 400 });
		}

		const current = id ? await pb.collection('content_production').getOne(id).catch(() => null) : null;
		if (!current && action !== 'export') {
			return json({ message: 'Package not found' }, { status: 404 });
		}

		if (action === 'advance') {
			if (!current) {
				return json({ message: 'Package not found' }, { status: 404 });
			}
			const stage = nextStage(current.stage);
			const updated = await pb.collection('content_production').update(id, {
				stage,
				approvalStatus: stage === 'approval' ? 'pending' : current.approvalStatus || 'pending',
			});
			return json({ updated });
		}

		if (action === 'approve') {
			if (!current) {
				return json({ message: 'Package not found' }, { status: 404 });
			}
			const updated = await pb.collection('content_production').update(id, {
				approvalStatus: 'approved',
				approvedBy: actor,
				approvedAt: new Date().toISOString(),
				stage: current.stage === 'brief' || current.stage === 'shoot' ? 'edit' : current.stage,
			});
			return json({ updated });
		}

		if (action === 'publish') {
			if (!current) {
				return json({ message: 'Package not found' }, { status: 404 });
			}
			const updated = await pb.collection('content_production').update(id, {
				stage: 'published',
				approvalStatus: 'approved',
				approvedBy: current.approvedBy || actor,
				approvedAt: current.approvedAt || new Date().toISOString(),
			});
			return json({ updated });
		}

		const records = await pb.collection('content_production').getFullList({
			sort: '-created',
		}).catch(() => []);
		const highlightRecords = records.filter((record: any) => normalize(record.contentType) === 'highlight');
		const packages = buildPackages(highlightRecords);
		const title = packageTitle && packageTitle !== 'none' ? packageTitle : packages[0]?.title || 'Latest highlight package';
		const filteredRecords = packageTitle && packageTitle !== 'none'
			? highlightRecords.filter((record: any) => (record.title || '') === packageTitle)
			: highlightRecords;
		const items = filteredRecords.slice(0, 8).map((record: any, index: number) => buildItem(record, index + 1));

		return json({
			action,
			selectedPackage: title,
			packageStatus: normalize(filteredRecords[0]?.stage) || 'draft',
			packages,
			items,
			manifest: buildManifest(title, items),
		});
	} catch (error) {
		console.error('Error updating Phase 5 package:', error);
		return json({ message: 'Failed to update Phase 5 package', error: String(error) }, { status: 500 });
	}
};