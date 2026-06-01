import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// POST /api/import
// Body: { type: 'vendors' | 'sponsors' | 'pros', rows: Record<string, string>[] }
// Returns: { created, failed, errors[] } via streaming-friendly JSON

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const pb = ctx.pb;
	const { type, rows } = await request.json() as { type: string; rows: Record<string, string>[] };

	if (!type || !rows?.length) {
		return json({ message: 'type and rows are required' }, { status: 400 });
	}

	let created = 0;
	let failed = 0;
	const errors: string[] = [];

	// Cache for grouping multi-item reimbursement rows into one claim per title+claimant
	const claimCache = new Map<string, string>();

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		try {
			if (type === 'vendors') {
				await pb.collection('vendors').create({
					name:            row.name?.trim() || '',
					type:            row.type?.trim() || 'service_provider',
					contactName:     row.contactName?.trim() || '',
					contactEmail:    row.contactEmail?.trim() || '',
					contactPhone:    row.contactPhone?.trim() || '',
					website:         row.website?.trim() || '',
					location:        row.location?.trim() || '',
					status:          row.status?.trim() || 'active',
					notes:           row.notes?.trim() || ''
				});
			} else if (type === 'sponsors') {
				await pb.collection('sponsors').create({
					companyName:         row.companyName?.trim() || row.name?.trim() || '',
					type:                row.type?.trim() || 'corporate',
					tier:                row.tier?.trim() || 'tier_3',
					status:              row.status?.trim() || 'prospect',
					primaryContactName:  row.primaryContactName?.trim() || row.contactName?.trim() || '',
					primaryContactEmail: row.primaryContactEmail?.trim() || row.contactEmail?.trim() || '',
					primaryContactPhone: row.primaryContactPhone?.trim() || row.contactPhone?.trim() || '',
					location:            row.location?.trim() || '',
					territory:           row.territory?.trim() || '',
					annualCommitment:    row.annualCommitment ? Number(row.annualCommitment) : 0,
					totalPaid:           0,
					franchiseInterest:   row.franchiseInterest === 'true' || row.franchiseInterest === '1',
					notes:               row.notes?.trim() || ''
				});
			} else if (type === 'pros') {
				await pb.collection('talent').create({
					name:        row.name?.trim() || '',
					nickname:    row.nickname?.trim() || '',
					email:       row.email?.trim() || '',
					phone:       row.phone?.trim() || '',
					gender:      row.gender?.trim() || '',
					country:     row.country?.trim() || '',
					talentType:  row.talentType?.trim() || 'player',
					status:      row.status?.trim() || 'active',
					bio:         row.bio?.trim() || '',
					height:      row.height?.trim() || '',
					weight:      row.weight?.trim() || '',
					homeTown:    row.homeTown?.trim() || ''
				});
			} else if (type === 'territories') {
				await pb.collection('franchise_territories').create({
					name:        row.name?.trim() || '',
					code:        row.code?.trim() || '',
					state:       row.state?.trim() || '',
					city:        row.city?.trim() || '',
					region:      row.region?.trim() || '',
					population:  row.population  ? Number(row.population)  : null,
					marketSize:  row.marketSize?.trim() || '',
					status:      row.status?.trim() || 'available',
					price:       row.price       ? Number(row.price)       : null,
					description: row.description?.trim() || '',
					notes:       row.notes?.trim() || ''
				});
			} else if (type === 'reimbursements') {
				// Resolve claimant by email
				const email = row.claimantEmail?.trim();
				if (!email) throw new Error('claimantEmail is required');

				let claimantId: string;
				try {
					const user = await pb.collection('users').getFirstListItem(`email="${email}"`);
					claimantId = user.id;
				} catch {
					throw new Error(`No user found with email: ${email}`);
				}

				// Resolve optional vendor by name
				let vendorId: string | undefined;
				const vendorName = row.vendorName?.trim();
				if (vendorName) {
					try {
						const vendor = await pb.collection('vendors').getFirstListItem(`name="${vendorName}"`);
						vendorId = vendor.id;
					} catch {
						// Vendor not found — proceed without linking
					}
				}

				// Resolve optional department by name
				let departmentId: string | undefined;
				const deptName = row.departmentName?.trim();
				if (deptName) {
					try {
						const dept = await pb.collection('departments').getFirstListItem(`name="${deptName}"`);
						departmentId = dept.id;
					} catch {
						// Department not found — proceed without linking
					}
				}

				const isHistorical = row.isHistorical?.trim().toLowerCase() === 'true';
				const itemAmount   = row.itemAmount ? Number(row.itemAmount.replace(/[^0-9.]/g, '')) : 0;
				const claimTitle   = row.claimTitle?.trim() || '';
				const claimStatus  = row.claimStatus?.trim() || 'draft';

				// Group multi-item rows: reuse an existing claim created in this import
				// batch if claimTitle + claimantEmail match a previously created claim.
				const cacheKey = `${email}::${claimTitle}`;
				let claimId: string;

				if (claimCache.has(cacheKey)) {
					claimId = claimCache.get(cacheKey)!;
					// Update totalAmount on the existing claim
					const existing = await pb.collection('reimbursement_claims').getOne(claimId, { fields: 'id,totalAmount' });
					await pb.collection('reimbursement_claims').update(claimId, {
						totalAmount: (existing.totalAmount || 0) + itemAmount
					});
				} else {
					const claim = await pb.collection('reimbursement_claims').create({
						title:        claimTitle,
						claimant:     claimantId,
						status:       claimStatus,
						totalAmount:  itemAmount,
						notes:        row.claimNotes?.trim() || '',
						department:   departmentId ?? '',
						is_historical: isHistorical,
					});
					claimId = claim.id;
					claimCache.set(cacheKey, claimId);
				}

				// Create the line item
				await pb.collection('reimbursement_items').create({
					claim:       claimId,
					description: row.itemDescription?.trim() || '',
					amount:      itemAmount,
					date:        row.itemDate?.trim() || '',
					category:    row.itemCategory?.trim() || 'other',
					vendorId:    vendorId ?? '',
					notes:       row.itemNotes?.trim() || ''
				});
			} else {
				return json({ message: `Unknown import type: ${type}` }, { status: 400 });
			}
			created++;
		} catch (err: any) {
			failed++;
			const msg = err?.response?.message ?? err?.message ?? 'Unknown error';
			errors.push(`Row ${i + 2}: ${msg}`);
		}
	}

	return json({ created, failed, errors });
};
