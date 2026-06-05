import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function normalize(value: unknown): string {
	return String(value || '')
		.toLowerCase()
		.replace(/[^a-z0-9\s]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function normalizeTag(value: unknown): string {
	return String(value || '').trim().slice(0, 100);
}

export const POST: RequestHandler = async ({ locals, request }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const assetId = String(body?.assetId || '').trim();
		const summaryId = String(body?.summaryId || '').trim();
		const applySuggestedTags = body?.applySuggestedTags !== false;
		const applyDetections = body?.applyDetections !== false;

		if (!assetId) {
			return json({ message: 'assetId is required' }, { status: 400 });
		}

		const asset = await pb.collection('media_assets').getOne(assetId).catch(() => null);
		if (!asset) {
			return json({ message: 'Asset not found' }, { status: 404 });
		}

		let summary: any = null;
		if (summaryId) {
			summary = await pb.collection('media_ai_summaries').getOne(summaryId).catch(() => null);
		} else {
			summary = await pb.collection('media_ai_summaries').getFirstListItem(`asset = "${assetId}"`, {
				sort: '-created'
			}).catch(() => null);
		}

		if (summary && summary.asset !== assetId) {
			return json({ message: 'Summary does not belong to the provided asset' }, { status: 400 });
		}

		const existingTags = await pb.collection('media_asset_tags').getFullList({
			filter: `asset = "${assetId}"`,
			fields: 'id,tag'
		}).catch(() => []);
		const existingTagSet = new Set(existingTags.map((row: any) => normalize(row.tag)));

		let tagsAdded = 0;
		const suggestedTags = Array.isArray(summary?.suggested_tags_json)
			? summary.suggested_tags_json.map((item: any) => normalizeTag(item)).filter(Boolean)
			: [];

		if (applySuggestedTags) {
			for (const tag of suggestedTags) {
				const token = normalize(tag);
				if (!token || existingTagSet.has(token)) continue;
				await pb.collection('media_asset_tags').create({
					asset: assetId,
					tag,
					domain: 'general'
				});
				existingTagSet.add(token);
				tagsAdded += 1;
			}
		}

		let peopleAdded = 0;
		let sponsorsAdded = 0;
		if (applyDetections) {
			const detections = await pb.collection('media_ai_detections').getFullList({
				filter: `asset = "${assetId}"`,
				fields: 'id,label,detection_type,confidence',
				sort: '-confidence,-created'
			}).catch(() => []);

			const [talents, sponsors, existingPeopleRows, existingSponsorRows] = await Promise.all([
				pb.collection('talent').getFullList({ fields: 'id,name,fullName,firstName,lastName' }).catch(() => []),
				pb.collection('sponsors').getFullList({ fields: 'id,name' }).catch(() => []),
				pb.collection('media_asset_people').getFullList({ filter: `asset = "${assetId}"`, fields: 'id,person' }).catch(() => []),
				pb.collection('media_asset_sponsors').getFullList({ filter: `asset = "${assetId}"`, fields: 'id,sponsor' }).catch(() => [])
			]);

			const talentByName = new Map<string, any>();
			for (const row of talents as any[]) {
				const names = [row.fullName, row.name, `${row.firstName || ''} ${row.lastName || ''}`.trim()]
					.map((name) => normalize(name))
					.filter(Boolean);
				for (const name of names) {
					if (!talentByName.has(name)) talentByName.set(name, row);
				}
			}

			const sponsorByName = new Map<string, any>();
			for (const row of sponsors as any[]) {
				const key = normalize(row.name);
				if (key && !sponsorByName.has(key)) sponsorByName.set(key, row);
			}

			const existingPeople = new Set((existingPeopleRows as any[]).map((row: any) => row.person));
			const existingSponsors = new Set((existingSponsorRows as any[]).map((row: any) => row.sponsor));

			for (const detection of detections as any[]) {
				const label = normalize(detection.label);
				if (!label) continue;

				if (detection.detection_type === 'player') {
					const talent = talentByName.get(label);
					if (talent && !existingPeople.has(talent.id)) {
						await pb.collection('media_asset_people').create({
							asset: assetId,
							person: talent.id,
							role: 'player',
							is_primary: false
						});
						existingPeople.add(talent.id);
						peopleAdded += 1;
					}
				}

				if (detection.detection_type === 'sponsor_logo') {
					const sponsor = sponsorByName.get(label);
					if (sponsor && !existingSponsors.has(sponsor.id)) {
						await pb.collection('media_asset_sponsors').create({
							asset: assetId,
							sponsor: sponsor.id,
							visibility: 'clear',
							placement: 'ai_detection'
						});
						existingSponsors.add(sponsor.id);
						sponsorsAdded += 1;
					}
				}
			}
		}

		if (summary?.id) {
			await pb.collection('media_ai_summaries').update(summary.id, { approved: true });
		}

		return json({
			ok: true,
			assetId,
			summaryId: summary?.id || null,
			counts: {
				tagsAdded,
				peopleAdded,
				sponsorsAdded
			}
		});
	} catch (error) {
		console.error('Error approving Phase 7 AI suggestions:', error);
		return json({ message: 'Failed to approve Phase 7 suggestions', error: String(error) }, { status: 500 });
	}
};
