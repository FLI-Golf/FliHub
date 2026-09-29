import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import {
	applyReimbursementImport,
	previewReimbursementImport
} from '$lib/server/reimbursements/import';
import type { RequestHandler } from './$types';

// POST /api/import
// Body: { type: 'vendors' | 'sponsors' | 'pros', rows: Record<string, string>[] }
// Returns: { created, failed, errors[] } via streaming-friendly JSON

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (ctx.role !== 'admin' && ctx.role !== 'leader') {
		return json({ message: 'Administrator access is required for bulk imports' }, { status: 403 });
	}
	const pb = ctx.pb;
	const { type, rows, preview = false, overrideRowIndexes = [] } = await request.json() as {
		type: string;
		rows: Record<string, string>[];
		preview?: boolean;
		overrideRowIndexes?: number[];
	};

	if (!type || !rows?.length) {
		return json({ message: 'type and rows are required' }, { status: 400 });
	}

	if (type === 'reimbursements') {
		try {
			const importPreview = await previewReimbursementImport(pb, rows);
			if (preview) return json(importPreview);
			if (importPreview.summary.invalidRows > 0) {
				return json({ message: 'Resolve invalid rows before importing', ...importPreview }, { status: 400 });
			}
			return json(await applyReimbursementImport(pb, importPreview, overrideRowIndexes));
		} catch (error: any) {
			console.error('[import] reimbursement import failed:', error?.message ?? 'Unknown error');
			return json({ message: 'Reimbursement import failed' }, { status: 500 });
		}
	}

	let created = 0;
	let failed = 0;
	const errors: string[] = [];

	function formatCreateError(err: any): string {
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
