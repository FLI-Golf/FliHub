import type { PageServerLoad } from './$types';
import { TournamentRepo, ProPaymentRepo, TournamentResultRepo } from '$lib/infra/pocketbase/repositories';

export const load: PageServerLoad = async ({ locals, url }) => {
	const pb = locals.pb;

	const statusFilter = url.searchParams.get('status');
	const genderFilter = url.searchParams.get('gender');
	const franchiseFilter = url.searchParams.get('franchise');
	const searchQuery = url.searchParams.get('search');

	try {
		const tournamentRepo = new TournamentRepo(pb);
		const paymentRepo = new ProPaymentRepo(pb);
		const resultRepo = new TournamentResultRepo(pb);

		// Build filter for pros
		let proFilter = '';
		const filters = [];
		
		if (statusFilter) {
			filters.push(`status = '${statusFilter}'`);
		}
		if (genderFilter) {
			filters.push(`gender = '${genderFilter}'`);
		}
		if (franchiseFilter) {
			filters.push(`franchise = '${franchiseFilter}'`);
		}
		if (searchQuery) {
			filters.push(`(name ~ '${searchQuery}' || nickname ~ '${searchQuery}')`);
		}
		
		if (filters.length > 0) {
			proFilter = filters.join(' && ');
		}

		const [pros, tournaments, pendingPayments, overduePayments, franchises, allResults] = await Promise.all([
			pb.collection('pros').getFullList({ 
				sort: 'name',
				filter: proFilter,
				expand: 'franchise'
			}),
			tournamentRepo.findAll({ sort: '-season,-tournamentNumber', perPage: 100 }),
			paymentRepo.findPending(),
			paymentRepo.findOverdue(),
			pb.collection('franchises').getFullList({ sort: 'name' }),
			pb.collection('tournament_results').getFullList({ 
				expand: 'tournament,pro'
			}).catch(() => ({ items: [] }))
		]);

		// Calculate stats for each pro
		const proStats = new Map();
		for (const pro of pros) {
			const proResults = allResults.filter(r => r.pro === pro.id);
			const totalEarnings = proResults.reduce((sum, r) => sum + (r.proEarnings || 0), 0);
			const tournamentsPlayed = proResults.length;
			const wins = proResults.filter(r => r.placement === 1).length;
			const podiums = proResults.filter(r => r.placement <= 3).length;
			const topTens = proResults.filter(r => r.placement <= 10).length;
			
			proStats.set(pro.id, {
				totalEarnings,
				tournamentsPlayed,
				wins,
				podiums,
				topTens,
				avgPlacement: tournamentsPlayed > 0 
					? proResults.reduce((sum, r) => sum + r.placement, 0) / tournamentsPlayed 
					: 0
			});
		}

		// Calculate overall stats
		const totalPros = pros.length;
		const activePros = pros.filter(p => p.status === 'active').length;
		const mensPros = pros.filter(p => p.gender === 'male').length;
		const womensPros = pros.filter(p => p.gender === 'female').length;
		const totalEarnings = Array.from(proStats.values()).reduce((sum, s) => sum + s.totalEarnings, 0);

		return {
			pros,
			proStats: Object.fromEntries(proStats),
			tournaments: tournaments.items,
			pendingPayments: pendingPayments.items,
			overduePayments: overduePayments.items,
			franchises,
			filters: {
				status: statusFilter,
				gender: genderFilter,
				franchise: franchiseFilter,
				search: searchQuery
			},
			overallStats: {
				totalPros,
				activePros,
				mensPros,
				womensPros,
				totalEarnings,
				activeTournaments: tournaments.items.filter(t => t.status === 'in_progress').length,
				upcomingTournaments: tournaments.items.filter(t => t.status === 'scheduled').length
			}
		};
	} catch (error) {
		console.error('Error loading pro management data:', error);
		return {
			pros: [],
			proStats: {},
			tournaments: [],
			pendingPayments: [],
			overduePayments: [],
			franchises: [],
			filters: {},
			overallStats: {
				totalPros: 0,
				activePros: 0,
				mensPros: 0,
				womensPros: 0,
				totalEarnings: 0,
				activeTournaments: 0,
				upcomingTournaments: 0
			}
		};
	}
};
