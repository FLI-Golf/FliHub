import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function hasOwn(data: Record<string, any>, key: string) {
	return Object.prototype.hasOwnProperty.call(data, key);
}

async function replaceRelationRows(
	pb: any,
	collection: string,
	assetId: string,
	rows: Array<Record<string, any>>
) {
	const existing = await pb.collection(collection).getFullList({
		filter: `asset = "${assetId}"`,
		fields: 'id'
	}).catch(() => []);

	for (const row of existing) {
		await pb.collection(collection).delete(row.id).catch(() => undefined);
	}

	for (const row of rows) {
		await pb.collection(collection).create({ asset: assetId, ...row });
	}
}

async function loadAssetTaxonomy(pb: any, assetId: string) {
	const [tags, people, teams, sponsors, events, markers] = await Promise.all([
		pb.collection('media_asset_tags').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_asset_people').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_asset_teams').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_asset_sponsors').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_asset_events').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_asset_markers').getFullList({ filter: `asset = "${assetId}"` }).catch(() => [])
	]);

	return {
		tags,
		people,
		teams,
		sponsors,
		event: events[0] || null,
		markers
	};
}

async function loadAssetLicensing(pb: any, assetId: string) {
	const [rightsProfiles, lineItems, usageLogs] = await Promise.all([
		pb.collection('media_rights_profiles').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_license_line_items').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_usage_logs').getFullList({ filter: `asset = "${assetId}"` }).catch(() => [])
	]);

	const dealIds = Array.from(new Set(lineItems.map((row: any) => row.deal).filter(Boolean)));
	const dealRows = await Promise.all(
		dealIds.map((id) => pb.collection('media_license_deals').getOne(id).catch(() => null))
	);
	const dealsById = new Map(dealRows.filter(Boolean).map((row: any) => [row.id, row]));

	return {
		rightsProfiles,
		lineItems: lineItems.map((row: any) => ({
			...row,
			dealRecord: row.deal ? dealsById.get(row.deal) || null : null
		})),
		usageLogs: usageLogs.map((row: any) => ({
			...row,
			dealRecord: row.deal ? dealsById.get(row.deal) || null : null
		}))
	};
}

function deriveDeliverableSlaStatus(row: any) {
	if (!row) return 'pending';
	if (row.status === 'approved' || row.status === 'delivered' || row.status === 'cancelled') {
		return row.status;
	}
	const due = row.due_date ? new Date(row.due_date).getTime() : NaN;
	if (!Number.isNaN(due) && due < Date.now()) {
		return 'overdue';
	}
	return row.status || 'pending';
}

async function loadAssetSponsorFulfillment(pb: any, assetId: string) {
	const [deliverables, appearances] = await Promise.all([
		pb.collection('sponsor_media_deliverables').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('sponsor_media_appearances').getFullList({ filter: `asset = "${assetId}"` }).catch(() => [])
	]);

	const recapIds: string[] = Array.from(
		new Set(
			deliverables
				.map((row: any) => row.recap_package)
				.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
		)
	);
	const sponsorIds: string[] = Array.from(
		new Set(
			[
				...deliverables.map((row: any) => row.sponsor),
				...appearances.map((row: any) => row.sponsor)
			].filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
		)
	);

	const [recapRows, sponsorRows] = await Promise.all([
		Promise.all(recapIds.map((id: string) => pb.collection('sponsor_recap_packages').getOne(id).catch(() => null))),
		Promise.all(sponsorIds.map((id: string) => pb.collection('sponsors').getOne(id).catch(() => null)))
	]);

	const recapsById = new Map(recapRows.filter(Boolean).map((row: any) => [row.id, row]));
	const sponsorsById = new Map(sponsorRows.filter(Boolean).map((row: any) => [row.id, row]));

	const deliverableRows = deliverables.map((row: any) => ({
		...row,
		sla_status: deriveDeliverableSlaStatus(row),
		sponsorRecord: row.sponsor ? sponsorsById.get(row.sponsor) || null : null,
		recapPackageRecord: row.recap_package ? recapsById.get(row.recap_package) || null : null
	}));

	return {
		deliverables: deliverableRows,
		appearances: appearances.map((row: any) => ({
			...row,
			sponsorRecord: row.sponsor ? sponsorsById.get(row.sponsor) || null : null
		})),
		recapPackages: deliverableRows.map((row: any) => row.recapPackageRecord).filter(Boolean)
	};
}

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		const updatePayload: Record<string, any> = {};

		if (hasOwn(data, 'title')) updatePayload.title = data.title;
		if (hasOwn(data, 'asset_type')) updatePayload.asset_type = data.asset_type;
		if (hasOwn(data, 'media_category')) updatePayload.media_category = data.media_category || null;
		if (hasOwn(data, 'franchise')) updatePayload.franchise = data.franchise || null;
		if (hasOwn(data, 'project')) updatePayload.project = data.project || null;
		if (hasOwn(data, 'campaign')) updatePayload.campaign = data.campaign || null;
		if (hasOwn(data, 'season')) updatePayload.season = data.season || null;
		if (hasOwn(data, 'tournament')) updatePayload.tournament = data.tournament || null;
		if (hasOwn(data, 'special_event')) updatePayload.special_event = data.special_event || null;
		if (hasOwn(data, 'source_type')) updatePayload.source_type = data.source_type || null;
		if (hasOwn(data, 'capture_date')) updatePayload.capture_date = data.capture_date || null;
		if (hasOwn(data, 'duration_seconds')) updatePayload.duration_seconds = data.duration_seconds ? Number(data.duration_seconds) : null;
		if (hasOwn(data, 'file_size_bytes')) updatePayload.file_size_bytes = data.file_size_bytes ? Number(data.file_size_bytes) : null;
		if (hasOwn(data, 'resolution')) updatePayload.resolution = data.resolution || '';
		if (hasOwn(data, 'status')) updatePayload.status = data.status || null;
		if (hasOwn(data, 'storage_tier')) updatePayload.storage_tier = data.storage_tier || null;
		if (hasOwn(data, 'usage_scope')) updatePayload.usage_scope = data.usage_scope || null;
		if (hasOwn(data, 'rights_status')) updatePayload.rights_status = data.rights_status || null;
		if (hasOwn(data, 'tags')) updatePayload.tags = data.tags || '';
		if (hasOwn(data, 'notes')) updatePayload.notes = data.notes || '';

		const asset = Object.keys(updatePayload).length
			? await pb.collection('media_assets').update(params.id, updatePayload)
			: await pb.collection('media_assets').getOne(params.id);

		if (data.phase2Meta) {
			const phase2 = data.phase2Meta || {};

			const parsedTags = String(phase2.structured_tags || '')
				.split(',')
				.map((value: string) => value.trim())
				.filter(Boolean)
				.map((tag: string) => ({ tag, domain: phase2.tag_domain || 'general' }));

			const peopleRows = (phase2.people_ids || []).map((person: string) => ({
				person,
				role: 'player',
				is_primary: false
			}));

			const teamRows = (phase2.team_ids || []).map((team: string) => ({
				team,
				context: 'featured'
			}));

			const sponsorRows = (phase2.sponsor_ids || []).map((sponsor: string) => ({
				sponsor,
				visibility: 'clear'
			}));

			const eventRows = (phase2.round_type || phase2.shot_type || phase2.moment_type || phase2.hole_number)
				? [{
					season: phase2.season || asset.season || null,
					tournament: phase2.tournament || asset.tournament || null,
					special_event: phase2.special_event || asset.special_event || null,
					hole_number: phase2.hole_number ? Number(phase2.hole_number) : null,
					round_type: phase2.round_type || null,
					shot_type: phase2.shot_type || null,
					moment_type: phase2.moment_type || null
				}]
				: [];

			await replaceRelationRows(pb, 'media_asset_tags', params.id, parsedTags);
			await replaceRelationRows(pb, 'media_asset_people', params.id, peopleRows);
			await replaceRelationRows(pb, 'media_asset_teams', params.id, teamRows);
			await replaceRelationRows(pb, 'media_asset_sponsors', params.id, sponsorRows);
			await replaceRelationRows(pb, 'media_asset_events', params.id, eventRows);
		}

		if (data.phase3Meta) {
			const phase3 = data.phase3Meta || {};

			const rightsRows = (phase3.rights_owner || phase3.rights_contract_reference || phase3.rights_territory || phase3.rights_channel)
				? [{
					rights_owner: phase3.rights_owner || 'FLI Golf League',
					usage_type: phase3.rights_usage_type || null,
					territory: phase3.rights_territory || '',
					channel: phase3.rights_channel || '',
					exclusive: Boolean(phase3.rights_exclusive),
					start_date: phase3.rights_start_date || null,
					expiration_date: phase3.rights_expiration_date || null,
					restrictions: phase3.rights_restrictions || '',
					contract_reference: phase3.rights_contract_reference || '',
					status: phase3.rights_profile_status || 'active'
				}]
				: [];

			await replaceRelationRows(pb, 'media_rights_profiles', params.id, rightsRows);

			const existingLineItems = await pb.collection('media_license_line_items').getFullList({
				filter: `asset = "${params.id}"`,
				fields: 'id,deal'
			}).catch(() => []);

			const previousDealIds = Array.from(new Set(existingLineItems.map((row: any) => row.deal).filter(Boolean)));

			for (const row of existingLineItems) {
				await pb.collection('media_license_line_items').delete(row.id).catch(() => undefined);
			}

			for (const dealId of previousDealIds) {
				const stillUsed = await pb.collection('media_license_line_items').getFullList({
					filter: `deal = "${dealId}"`,
					fields: 'id'
				}).catch(() => []);
				if (!stillUsed.length) {
					await pb.collection('media_license_deals').delete(dealId).catch(() => undefined);
				}
			}

			const shouldCreateDeal = Boolean(
				phase3.deal_name ||
				phase3.deal_licensee ||
				phase3.deal_fee_amount ||
				phase3.line_item_fee_amount
			);

			if (shouldCreateDeal) {
				const deal = await pb.collection('media_license_deals').create({
					name: phase3.deal_name || `License Deal - ${asset.title}`,
					licensee: phase3.deal_licensee || 'TBD Licensee',
					usage_type: phase3.deal_usage_type || 'broadcast',
					territory: phase3.deal_territory || '',
					channel: phase3.deal_channel || '',
					exclusive: Boolean(phase3.deal_exclusive),
					start_date: phase3.deal_start_date || null,
					expiration_date: phase3.deal_expiration_date || null,
					fee_amount: phase3.deal_fee_amount ? Number(phase3.deal_fee_amount) : null,
					currency: phase3.deal_currency || 'USD',
					payment_status: phase3.deal_payment_status || 'draft',
					contract_reference: phase3.deal_contract_reference || '',
					notes: phase3.deal_notes || ''
				});

				await pb.collection('media_license_line_items').create({
					deal: deal.id,
					asset: params.id,
					usage_type: phase3.deal_usage_type || 'broadcast',
					fee_amount: phase3.line_item_fee_amount ? Number(phase3.line_item_fee_amount) : (phase3.deal_fee_amount ? Number(phase3.deal_fee_amount) : null),
					revenue_share_pct: phase3.line_item_revenue_share_pct ? Number(phase3.line_item_revenue_share_pct) : null,
					restrictions: phase3.line_item_restrictions || ''
				});
			}
		}

		if (data.phase4Meta) {
			const phase4 = data.phase4Meta || {};

			const existingDeliverables = await pb.collection('sponsor_media_deliverables').getFullList({
				filter: `asset = "${params.id}"`,
				fields: 'id,recap_package'
			}).catch(() => []);

			for (const row of existingDeliverables) {
				await pb.collection('sponsor_media_deliverables').delete(row.id).catch(() => undefined);
			}

			const existingAppearances = await pb.collection('sponsor_media_appearances').getFullList({
				filter: `asset = "${params.id}"`,
				fields: 'id'
			}).catch(() => []);

			for (const row of existingAppearances) {
				await pb.collection('sponsor_media_appearances').delete(row.id).catch(() => undefined);
			}

			const previousRecapIds = Array.from(new Set(existingDeliverables.map((row: any) => row.recap_package).filter(Boolean)));
			for (const recapId of previousRecapIds) {
				const rowsUsingRecap = await pb.collection('sponsor_media_deliverables').getFullList({
					filter: `recap_package = "${recapId}"`,
					fields: 'id'
				}).catch(() => []);
				if (!rowsUsingRecap.length) {
					await pb.collection('sponsor_recap_packages').delete(recapId).catch(() => undefined);
				}
			}

			const shouldCreateDeliverable = Boolean(
				phase4.sponsor ||
				phase4.deliverable_type ||
				phase4.obligation_reference ||
				phase4.recap_package_name ||
				phase4.appearance_logo_visibility ||
				phase4.appearance_placement
			);

			if (shouldCreateDeliverable && phase4.sponsor) {
				let recapId: string | null = null;
				const shouldCreateRecap = Boolean(
					phase4.recap_package_name ||
					phase4.recap_status ||
					phase4.recap_delivered_at ||
					phase4.recap_proof_url ||
					phase4.recap_notes
				);

				if (shouldCreateRecap) {
					const recap = await pb.collection('sponsor_recap_packages').create({
						sponsor: phase4.sponsor,
						package_name: phase4.recap_package_name || `Recap Package - ${asset.title}`,
						season: phase4.recap_season || asset.season || null,
						tournament: phase4.recap_tournament || asset.tournament || null,
						special_event: phase4.recap_special_event || asset.special_event || null,
						status: phase4.recap_status || 'draft',
						delivered_at: phase4.recap_delivered_at || null,
						proof_url: phase4.recap_proof_url || '',
						notes: phase4.recap_notes || ''
					});
					recapId = recap.id;
				}

				const deliverable = await pb.collection('sponsor_media_deliverables').create({
					sponsor: phase4.sponsor,
					asset: params.id,
					recap_package: recapId,
					deliverable_type: phase4.deliverable_type || 'other',
					obligation_reference: phase4.obligation_reference || '',
					status: phase4.deliverable_status || 'pending',
					due_date: phase4.deliverable_due_date || null,
					delivered_at: phase4.deliverable_delivered_at || null,
					visibility_score: phase4.deliverable_visibility_score ? Number(phase4.deliverable_visibility_score) : null,
					proof_note: phase4.deliverable_proof_note || ''
				});

				const shouldCreateAppearance = Boolean(
					phase4.appearance_logo_visibility ||
					phase4.appearance_placement ||
					phase4.appearance_timestamp_seconds ||
					phase4.appearance_screenshot_url ||
					phase4.appearance_notes ||
					phase4.appearance_verified
				);

				if (shouldCreateAppearance) {
					await pb.collection('sponsor_media_appearances').create({
						asset: params.id,
						sponsor: phase4.sponsor,
						deliverable: deliverable.id,
						logo_visibility: phase4.appearance_logo_visibility || 'clear',
						placement: phase4.appearance_placement || '',
						timestamp_seconds: phase4.appearance_timestamp_seconds ? Number(phase4.appearance_timestamp_seconds) : null,
						screenshot_url: phase4.appearance_screenshot_url || '',
						verified: Boolean(phase4.appearance_verified),
						notes: phase4.appearance_notes || ''
					});
				}
			}
		}

		const taxonomy = await loadAssetTaxonomy(pb, params.id);
		const licensing = await loadAssetLicensing(pb, params.id);
		const sponsorFulfillment = await loadAssetSponsorFulfillment(pb, params.id);

		return json({ ...asset, taxonomy, licensing, sponsorFulfillment });
	} catch (error) {
		console.error('Error updating media asset:', error);
		return json({ message: 'Failed to update media asset', error: String(error) }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		await pb.collection('media_assets').delete(params.id);
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting media asset:', error);
		return json({ message: 'Failed to delete media asset', error: String(error) }, { status: 500 });
	}
};
