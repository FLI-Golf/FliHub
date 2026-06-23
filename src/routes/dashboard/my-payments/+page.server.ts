import { RequestContext } from '$lib/infra/RequestContext';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const normalize = (value: unknown): string =>
	String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ');

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile } = ctx;
	const role = String(ctx.role ?? '');

	if (role === 'manager') {
		if (profile?.id) throw redirect(303, `/dashboard/my-payments/${profile.id}`);
		throw redirect(303, '/dashboard');
	}

	if (role === 'pro' || role === 'broadcaster') {
		let proReference = ((profile as any)?.proReference || (profile as any)?.talentReference || '') as string;
		if (!proReference) {
			const userEmail = (locals.pb?.authStore?.model?.email ?? '') as string;
			if (userEmail) {
				const talent = await pb.collection('talent').getFirstListItem(`email = "${userEmail}"`, { fields: 'id' }).catch(() => null);
				proReference = (talent?.id ?? '') as string;
			}
		}
		if (!proReference) {
			const fullName = normalize(`${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`);
			if (fullName) {
				const talentRows = await pb.collection('talent').getFullList({ fields: 'id,name' }).catch(() => []);
				const exact = (talentRows as any[]).find((t: any) => normalize(t.name) === fullName);
				const startsWith = (talentRows as any[]).find((t: any) => normalize(t.name).startsWith(fullName));
				proReference = (exact?.id || startsWith?.id || '') as string;
			}
		}
		if (proReference) throw redirect(303, `/dashboard/my-payments/${proReference}`);
		if (profile?.id) throw redirect(303, `/dashboard/my-payments/${profile.id}`);
		throw redirect(303, '/dashboard');
	}

	// Only managers (and admins previewing) can access this page
	if (role !== 'manager' && role !== 'admin') {
		throw redirect(303, '/dashboard');
	}

	// Identify the manager: use their user email to match managerEmail on payment records
	const userEmail = (locals.pb?.authStore?.model?.email ?? '') as string;

	// Admins can preview a specific manager's view via ?email=
	const targetEmail = role === 'admin'
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
