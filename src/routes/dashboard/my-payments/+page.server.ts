import { RequestContext } from '$lib/infra/RequestContext';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile } = ctx;

	// Only managers (and admins previewing) can access this page
	if (ctx.role !== 'manager' && ctx.role !== 'admin') {
		throw redirect(303, '/dashboard');
	}

	// Identify the manager: use their user email to match managerEmail on payment records
	const userEmail = (locals.pb?.authStore?.model?.email ?? '') as string;

	// Admins can preview a specific manager's view via ?email=
	const targetEmail = ctx.role === 'admin'
		? (url.searchParams.get('email') ?? userEmail)
		: userEmail;

	if (!targetEmail) {
		return {
			payments: [],
			summary: { totalEarned: 0, totalPending: 0, totalPaid: 0, paymentCount: 0 },
			managerEmail: '',
			managerName: '',
			seasons: [],
			filterSeason: '',
			filterStatus: '',
		};
	}

	const filterStatus = url.searchParams.get('status') ?? '';
	const filterSeason = url.searchParams.get('season') ?? '';

	const filters: string[] = [`managerEmail = '${targetEmail}'`, `recipient = 'manager'`];
	if (filterStatus) filters.push(`status = '${filterStatus}'`);
	if (filterSeason) filters.push(`season = '${filterSeason}'`);

	try {
		const [payments, seasons] = await Promise.all([
			pb.collection('pro_payments').getFullList({
				filter: filters.join(' && '),
				sort: '-created',
				expand: 'pro,tournament',
			}),
			pb.collection('seasons').getFullList({ sort: '-year' }),
		]);

		const managerName = payments[0]?.managerName ?? '';

		const summary = {
			totalEarned:  payments.reduce((s, p) => s + (p.amount ?? 0), 0),
			totalPending: payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount ?? 0), 0),
			totalPaid:    payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount ?? 0), 0),
			paymentCount: payments.length,
		};

		return {
			payments,
			summary,
			managerEmail: targetEmail,
			managerName,
			seasons,
			filterSeason,
			filterStatus,
		};
	} catch (err: any) {
		console.error('my-payments load error:', err?.message ?? err);
		return {
			payments: [],
			summary: { totalEarned: 0, totalPending: 0, totalPaid: 0, paymentCount: 0 },
			managerEmail: targetEmail,
			managerName: '',
			seasons: [],
			filterSeason,
			filterStatus,
		};
	}
};
