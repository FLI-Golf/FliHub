import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile: userProfile } = ctx;

	// All event_talent records where bonus is eligible or earned
	const [bonusTalent, seasons] = await Promise.all([
		pb.collection('event_talent').getFullList({
			filter: 'bonusEligible = true || bonusEarned = true',
			expand: 'talent,event',
			sort: '-created'
		}).catch(() => []),
		pb.collection('seasons').getFullList({ sort: '-year', fields: 'id,name,year' }).catch(() => [])
	]);

	// Group by talent
	const byTalent = new Map<string, { talent: any; events: any[]; bonusEarned: boolean; bonusAmount: number }>();
	for (const et of bonusTalent as any[]) {
		const talentId = et.talent;
		const talentRecord = et.expand?.talent;
		if (!byTalent.has(talentId)) {
			byTalent.set(talentId, { talent: talentRecord, events: [], bonusEarned: false, bonusAmount: 0 });
		}
		const entry = byTalent.get(talentId)!;
		entry.events.push(et);
		if (et.bonusEarned) entry.bonusEarned = true;
	}

	// Get bonus payments for each eligible talent
	const bonusPayments = await pb.collection('event_payments').getFullList({
		filter: 'isBonus = true',
		expand: 'talent,event',
		sort: '-created'
	}).catch(() => []);

	return {
		userProfile,
		bonusTalent,
		byTalent: Array.from(byTalent.values()),
		bonusPayments,
		seasons
	};
};
