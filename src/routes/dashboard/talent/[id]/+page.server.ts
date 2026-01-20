import type { PageServerLoad } from './$types';
import { TournamentResultRepo, ProPaymentRepo } from '$lib/infra/pocketbase/repositories';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const pb = locals.pb;
	const resultRepo = new TournamentResultRepo(pb);
	const paymentRepo = new ProPaymentRepo(pb);

	try {
		const pro = await pb.collection('talent').getOne(params.id, {
			expand: 'franchise'
		});

		const [results, payments, allTournaments] = await Promise.all([
			resultRepo.findByPro(params.id),
			paymentRepo.findByPro(params.id),
			pb.collection('tournaments').getFullList({ sort: '-season,-tournamentNumber' })
		]);

		// Calculate comprehensive stats
		const totalEarnings = results.items.reduce((sum, r) => sum + (r.proEarnings || 0), 0);
		const franchiseEarnings = results.items.reduce((sum, r) => sum + (r.franchiseEarnings || 0), 0);
		const tournamentsPlayed = results.items.length;
		
		const wins = results.items.filter(r => r.placement === 1).length;
		const secondPlace = results.items.filter(r => r.placement === 2).length;
		const thirdPlace = results.items.filter(r => r.placement === 3).length;
		const podiums = results.items.filter(r => r.placement <= 3).length;
		const topFives = results.items.filter(r => r.placement <= 5).length;
		const topTens = results.items.filter(r => r.placement <= 10).length;

		const avgPlacement = tournamentsPlayed > 0
			? results.items.reduce((sum, r) => sum + r.placement, 0) / tournamentsPlayed
			: 0;

		const bestPlacement = tournamentsPlayed > 0
			? Math.min(...results.items.map(r => r.placement))
			: null;

		// Group results by season
		const resultsBySeason = new Map<number, any[]>();
		for (const result of results.items) {
			const season = result.expand?.tournament?.season;
			if (season) {
				if (!resultsBySeason.has(season)) {
					resultsBySeason.set(season, []);
				}
				resultsBySeason.get(season)!.push(result);
			}
		}

		// Calculate season stats
		const seasonStats = Array.from(resultsBySeason.entries()).map(([season, seasonResults]) => {
			const earnings = seasonResults.reduce((sum, r) => sum + (r.proEarnings || 0), 0);
			const wins = seasonResults.filter(r => r.placement === 1).length;
			const podiums = seasonResults.filter(r => r.placement <= 3).length;
			const avgPlacement = seasonResults.reduce((sum, r) => sum + r.placement, 0) / seasonResults.length;

			return {
				season,
				tournaments: seasonResults.length,
				earnings,
				wins,
				podiums,
				avgPlacement
			};
		}).sort((a, b) => b.season - a.season);

		// Payment stats
		const totalPaid = payments.items
			.filter(p => p.status === 'paid')
			.reduce((sum, p) => sum + p.amount, 0);
		const totalPending = payments.items
			.filter(p => p.status === 'pending')
			.reduce((sum, p) => sum + p.amount, 0);

		// Division breakdown
		const mensResults = results.items.filter(r => r.division === 'mens');
		const womensResults = results.items.filter(r => r.division === 'womens');

		return {
			pro,
			results: results.items,
			payments: payments.items,
			tournaments: allTournaments,
			stats: {
				totalEarnings,
				franchiseEarnings,
				tournamentsPlayed,
				wins,
				secondPlace,
				thirdPlace,
				podiums,
				topFives,
				topTens,
				avgPlacement,
				bestPlacement,
				mensResults: mensResults.length,
				womensResults: womensResults.length
			},
			seasonStats,
			paymentStats: {
				totalPaid,
				totalPending,
				totalPayments: payments.items.length
			}
		};
	} catch (err) {
		console.error('Error loading pro:', err);
		throw error(404, 'Pro not found');
	}
};
