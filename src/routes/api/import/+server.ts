import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

const VENDOR_TYPE_ALIASES: Record<string, string> = {
	service_provider: 'service_provider',
	service: 'service_provider',
	other: 'service_provider',
	venue: 'venue',
	product_supplier: 'product_supplier',
	supplier: 'product_supplier',
	equipment: 'product_supplier',
	beverage: 'beverage',
	technology: 'technology',
	gaming: 'gaming'
};

function normalizeVendorType(rawType: string | undefined): string {
	const normalized = (rawType || '').trim().toLowerCase();
	if (!normalized) return 'service_provider';
	return VENDOR_TYPE_ALIASES[normalized] || 'service_provider';
}

function pickField(row: Record<string, string>, ...keys: string[]): string {
	for (const key of keys) {
		const value = row[key];
		if (typeof value === 'string' && value.trim().length > 0) return value.trim();
	}
	return '';
}

// POST /api/import
// Body: { type: 'vendors' | 'sponsors' | 'pros', rows: Record<string, string>[] }
// Returns: { created, failed, errors[] } via streaming-friendly JSON

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const role = ctx.profile?.role;
	if (!['admin', 'leader', 'marketing', 'marketing_lead'].includes(role ?? '')) {
		return json({ message: 'Unauthorized' }, { status: 403 });
	}
	const pb = ctx.pb;
	const { type, rows } = await request.json() as { type: string; rows: Record<string, string>[] };

	if (!type || !rows?.length) {
		return json({ message: 'type and rows are required' }, { status: 400 });
	}

	let created = 0;
	let failed = 0;
	const errors: string[] = [];

	function formatCreateError(err: any): string {
		console.error('IMPORT CREATE ERROR', JSON.stringify(err, null, 2));

		const fieldIssues = err?.data?.data || err?.response?.data?.data || err?.response?.data;
		if (fieldIssues && typeof fieldIssues === 'object' && !Array.isArray(fieldIssues)) {
			const message = Object.entries(fieldIssues)
				.map(([field, issue]: any) => {
					if (issue?.message) return `${field}: ${issue.message}`;
					if (typeof issue === 'string') return `${field}: ${issue}`;
					return `${field}: ${JSON.stringify(issue)}`;
				})
				.join('; ');

			if (message) return message;
		}

		return err?.data?.message
			|| err?.response?.data?.message
			|| err?.response?.message
			|| err?.message
			|| 'Failed to create record.';
	}

	// Cache for grouping multi-item reimbursement rows into one claim per title+claimant
	const claimCache = new Map<string, string>();

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		try {
			if (type === 'vendors') {
				const normalizedVendorType = normalizeVendorType(row.type);
				await pb.collection('vendors').create({
					name:            pickField(row, 'name'),
					type:            normalizedVendorType,
					// Vendor collection uses snake_case contact fields; keep camelCase as accepted CSV aliases.
					contact_name:    pickField(row, 'contact_name', 'contactName'),
					contact_email:   pickField(row, 'contact_email', 'contactEmail').toLowerCase(),
					contact_phone:   pickField(row, 'contact_phone', 'contactPhone'),
					website:         pickField(row, 'website'),
					address:         pickField(row, 'address', 'location'),
					active:          (pickField(row, 'status').toLowerCase() || 'active') !== 'inactive',
					about:           pickField(row, 'about', 'notes')
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
				// Resolve claimant profile by email (reimbursement_claims.claimant -> user_profiles)
				const email = row.claimantEmail?.trim();
				if (!email) throw new Error('claimantEmail is required');

				let claimantId: string;
				try {
					const profile = await pb.collection('user_profiles').getFirstListItem(`email="${email}"`, { fields: 'id' });
					claimantId = profile.id;
				} catch {
					throw new Error(`No user profile found with email: ${email}`);
				}

				// Resolve optional vendor by name
				let vendorId: string | null = null;
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
				let departmentId: string | null = null;
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
					const claimPayload = {
						title:         claimTitle,
						claimant:      claimantId,
						status:        claimStatus,
						totalAmount:   itemAmount,
						notes:         row.claimNotes?.trim() || '',
						department:    departmentId,
						is_historical: isHistorical,
					};
					console.log('CREATE PAYLOAD', claimPayload);
					const claim = await pb.collection('reimbursement_claims').create(claimPayload);
					claimId = claim.id;
					claimCache.set(cacheKey, claimId);
				}

				// Create the line item
				const itemPayload = {
					claim:       claimId,
					description: row.itemDescription?.trim() || '',
					amount:      itemAmount,
					date:        row.itemDate?.trim() || null,
					category:    row.itemCategory?.trim() || 'other',
					vendor:      vendorName || '',
					vendorId:    vendorId,
					notes:       row.itemNotes?.trim() || ''
				};
				console.log('CREATE PAYLOAD', itemPayload);
				await pb.collection('reimbursement_items').create(itemPayload);
			} else {
				return json({ message: `Unknown import type: ${type}` }, { status: 400 });
			}
			created++;
		} catch (err: any) {
			failed++;
			errors.push(`Row ${i + 2}: ${formatCreateError(err)}`);
		}
	}

	return json({ created, failed, errors });
};
