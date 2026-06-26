import { RequestContext } from '$lib/infra/RequestContext';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type ViewerType = 'pro' | 'manager';

const normalize = (value: unknown): string =>
	String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ');

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile } = ctx;
	const targetId = params.id;
	const userEmail = (locals.pb?.authStore?.model?.email ?? '') as string;

	const filterStatus = url.searchParams.get('status') ?? '';
	const filterSeason = url.searchParams.get('season') ?? '';

	let viewerType: ViewerType;
	let paymentFilters: string[] = [];
	let managerEmail = '';
	let resolvedProIdForView = '';
	let pageSubheading = '';

	if (ctx.role === 'manager') {
		if (!profile?.id) throw redirect(303, '/dashboard');
		if (targetId !== profile.id) throw redirect(303, `/dashboard/my-payments/${profile.id}`);

		viewerType = 'manager';
		managerEmail = userEmail;
		paymentFilters = [`managerEmail = '${userEmail}'`, `recipient = 'manager'`];
		pageSubheading = 'Manager earnings from FLI Golf tournaments';
	} else if (ctx.role === 'pro' || ctx.role === 'broadcaster') {
		let resolvedProId = ((profile as any)?.talentReference || '') as string;

		if (!resolvedProId && userEmail) {
			const talent = await pb.collection('talent').getFirstListItem(`email = "${userEmail}"`, { fields: 'id' }).catch(() => null);
			resolvedProId = (talent?.id ?? '') as string;
		}

		if (!resolvedProId) {
			const fullName = normalize(`${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`);
			if (fullName) {
				const talentRows = await pb.collection('talent').getFullList({ fields: 'id,name' }).catch(() => []);
				const exact = (talentRows as any[]).find((t: any) => normalize(t.name) === fullName);
				const startsWith = (talentRows as any[]).find((t: any) => normalize(t.name).startsWith(fullName));
				resolvedProId = (exact?.id || startsWith?.id || '') as string;
			}
		}

		if (!resolvedProId) {
			resolvedProId = targetId || profile?.id || '';
		}

		if (targetId !== resolvedProId) throw redirect(303, `/dashboard/my-payments/${resolvedProId}`);

		viewerType = 'pro';
		resolvedProIdForView = resolvedProId;
		paymentFilters = [`pro = '${resolvedProId}'`, `recipient = 'pro'`];
		pageSubheading = 'Your tournament payout history';
	} else if (ctx.role === 'admin') {
		const mode = url.searchParams.get('mode');
		if (mode === 'manager') {
			const profileRecord = await pb.collection('user_profiles').getOne(targetId, {
				fields: 'id,userId,firstName,lastName'
			}).catch(() => null);
			const userRecord = profileRecord?.userId
				? await pb.collection('users').getOne(profileRecord.userId, { fields: 'id,email' }).catch(() => null)
				: null;
			const adminSelectedEmail = (url.searchParams.get('email') ?? userRecord?.email ?? '') as string;

			viewerType = 'manager';
			managerEmail = adminSelectedEmail;
			paymentFilters = adminSelectedEmail ? [`managerEmail = '${adminSelectedEmail}'`, `recipient = 'manager'`] : [`id = ''`];
			pageSubheading = 'Manager earnings from FLI Golf tournaments';
		} else {
			viewerType = 'pro';
			paymentFilters = [`pro = '${targetId}'`, `recipient = 'pro'`];
			pageSubheading = 'Tournament payout history';
		}
	} else {
		throw redirect(303, '/dashboard');
	}

	if (filterStatus) paymentFilters.push(`status = '${filterStatus}'`);
	if (filterSeason) paymentFilters.push(`season = '${filterSeason}'`);

	try {
		const seasons = await pb.collection('seasons').getFullList({ sort: '-year' }).catch(() => []);
		let payments: any[] = [];

		try {
			payments = await pb.collection('pro_payments').getFullList({
				filter: paymentFilters.join(' && '),
				sort: '-created',
				expand: 'pro,tournament',
			});
		} catch {
			let all: any[] = await pb.collection('pro_payments').getFullList({
				sort: '-created',
				expand: 'pro,tournament',
			}).catch(() => []);

			if (!all.length) {
				all = await pb.collection('pro_payments').getFullList({
					expand: 'pro,tournament',
				}).catch(() => []);
			}

			if (!all.length) {
				all = await pb.collection('pro_payments').getFullList().catch(() => []);
			}

			all.sort((a: any, b: any) => String(b?.created ?? '').localeCompare(String(a?.created ?? '')));

			payments = (all as any[]).filter((p: any) => {
				if (viewerType === 'manager') {
					return p.recipient === 'manager' && p.managerEmail === managerEmail;
				}
				return p.recipient === 'pro' && p.pro === resolvedProIdForView;
			});

			if (filterStatus) {
				payments = payments.filter((p: any) => p.status === filterStatus);
			}
			if (filterSeason) {
				payments = payments.filter((p: any) => p.season === filterSeason);
			}
		}

		const ownerName = viewerType === 'manager'
			? (payments[0]?.managerName ?? '')
			: (payments[0]?.expand?.pro?.name ?? '');

		const summary = {
			totalEarned:  payments.reduce((s, p) => s + (p.amount ?? 0), 0),
			totalPending: payments
				.filter(p => p.status === 'pending' || p.status === 'processing')
				.reduce((s, p) => s + (p.amount ?? 0), 0),
			totalPaid:    payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount ?? 0), 0),
			paymentCount: payments.length,
		};

		return {
			viewerType,
			payments,
			summary,
			managerEmail,
			ownerName,
			pageSubheading,
			seasons,
			filterSeason,
			filterStatus,
		};
	} catch (err: any) {
		console.error('my-payments/[id] load error:', err?.message ?? err);
		return {
			viewerType,
			payments: [],
			summary: { totalEarned: 0, totalPending: 0, totalPaid: 0, paymentCount: 0 },
			managerEmail,
			ownerName: '',
			pageSubheading,
			seasons: [],
			filterSeason,
			filterStatus,
		};
	}
};