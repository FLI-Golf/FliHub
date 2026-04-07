import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { computeFundingModel } from '$lib/domain/schemas/funding-model.schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const pb = await getAdminPocketBase();

		const records = await pb
			.collection('fgl_funding_model')
			.getFullList({ sort: '-season' })
			.catch(() => []);

		const models = (records as any[]).map((r) => {
			const m = {
				id: r.id,
				season: r.season,
				label: r.label,
				tournament_ops_per_event: r.tournament_ops_per_event ?? 0,
				tournament_count: r.tournament_count ?? 0,
				player_purse: r.player_purse ?? 0,
				player_sponsorship_program: r.player_sponsorship_program ?? 0,
				overhead_marketing: r.overhead_marketing ?? 0,
				overhead_staff_payroll: r.overhead_staff_payroll ?? 0,
				overhead_tech_platform: r.overhead_tech_platform ?? 0,
				overhead_legal_admin: r.overhead_legal_admin ?? 0,
				rev_naming_rights: r.rev_naming_rights ?? 0,
				rev_league_partners: r.rev_league_partners ?? 0,
				rev_on_course_activation: r.rev_on_course_activation ?? 0,
				rev_fan_interaction: r.rev_fan_interaction ?? 0,
				rev_ticket_presales: r.rev_ticket_presales ?? 0,
				rev_merchandise: r.rev_merchandise ?? 0,
				rev_subscriptions_fantasy: r.rev_subscriptions_fantasy ?? 0,
				rev_licensing_advances: r.rev_licensing_advances ?? 0,
				capital_raise_1: r.capital_raise_1 ?? 0,
				capital_raise_2_equity: r.capital_raise_2_equity ?? 0,
				capital_raise_2_debt: r.capital_raise_2_debt ?? 0,
				notes: r.notes ?? ''
			};
			return { ...m, computed: computeFundingModel(m) };
		});

		return { models };
	} catch (err: any) {
		console.error('funding-model load error:', err?.message ?? err);
		return { models: [] };
	}
};
