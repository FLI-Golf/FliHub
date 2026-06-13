import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole('admin', 'leader');

	const pb = await getAdminPocketBase();
	const accounts = await pb.collection('bank_accounts').getFullList({
		filter: 'status = "active" || status = ""',
		sort: 'sortOrder,code',
		fields: 'id,code,name,groupType,accountType,purpose,allocation,isRestricted,isInterestBearing,status'
	}).catch(() => []);

	const totalAllocation = (accounts as any[]).reduce((sum: number, account: any) => {
		const amount = typeof account.allocation === 'number' ? account.allocation : Number(account.allocation || 0);
		return sum + (Number.isFinite(amount) ? amount : 0);
	}, 0);

	return {
		accounts,
		totalAllocation,
	};
};

export const actions: Actions = {
	overrideAllocation: async ({ locals, url, request }) => {
		const ctx = await RequestContext.from(locals, url);
		ctx.requireRole('admin', 'leader');

		const form = await request.formData();
		const accountId = String(form.get('accountId') || '').trim();
		const newAllocationRaw = String(form.get('newAllocation') || '').trim();
		const confirmText = String(form.get('confirmText') || '').trim();
		const reason = String(form.get('reason') || '').trim();

		if (!accountId) {
			return fail(400, { error: 'Missing bank account id.' });
		}

		const newAllocation = Number(newAllocationRaw);
		if (!Number.isFinite(newAllocation) || newAllocation < 0) {
			return fail(400, { error: 'New allocation must be a valid number greater than or equal to 0.' });
		}

		if (confirmText !== 'OVERRIDE') {
			return fail(400, { error: 'Confirmation text must exactly match OVERRIDE.' });
		}

		if (reason.length < 8) {
			return fail(400, { error: 'Please provide a brief reason (at least 8 characters).' });
		}

		try {
			const pb = await getAdminPocketBase();
			const account = await pb.collection('bank_accounts').getOne(accountId, {
				fields: 'id,code,name,allocation,notes',
			});

			const currentAllocation = typeof account.allocation === 'number'
				? account.allocation
				: Number(account.allocation || 0);

			const actor = ctx.profile?.id || ctx.userId;
			const stamp = [
				`[ALLOCATION_OVERRIDE ${new Date().toISOString()}]`,
				`account=${account.code || account.id}`,
				`old=${Number.isFinite(currentAllocation) ? currentAllocation : 0}`,
				`new=${newAllocation}`,
				`by=${actor}`,
				`reason=${reason.replace(/\s+/g, ' ').trim()}`,
			].join(' ');

			const nextNotes = String(account.notes || '').trim();
			await pb.collection('bank_accounts').update(accountId, {
				allocation: newAllocation,
				notes: nextNotes ? `${nextNotes}\n${stamp}` : stamp,
			});

			return {
				success: true,
				message: `${account.code || 'Account'} allocation overridden to ${newAllocation.toLocaleString('en-US')}.`,
			};
		} catch (e: any) {
			return fail(500, { error: e?.response?.message || e?.message || 'Failed to override allocation.' });
		}
	},
};
