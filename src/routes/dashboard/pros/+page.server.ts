import type { PageServerLoad } from './$types';
import { TournamentRepo, ProPaymentRepo } from '$lib/infra/pocketbase/repositories';

// Unified talent type for display
interface TalentRecord {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	photo?: string;
	avatar?: string;
	status: string;
	gender?: string;
	role: 'pro' | 'broadcaster' | 'manager';
	// Pro-specific fields
	worldRanking?: number;
	country?: string;
	nickname?: string;
	franchise?: { id: string; name: string } | null;
	// Stats (for pros)
	totalEarnings?: number;
	tournamentsPlayed?: number;
	wins?: number;
	// Original record for detail views
	originalRecord: any;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const pb = locals.pb;

	const statusFilter = url.searchParams.get('status');
	const genderFilter = url.searchParams.get('gender');
	const franchiseFilter = url.searchParams.get('franchise');
	const roleFilter = url.searchParams.get('role');
	const searchQuery = url.searchParams.get('search');

	try {
		const tournamentRepo = new TournamentRepo(pb);
		const paymentRepo = new ProPaymentRepo(pb);

		// First, get franchises to build the pro-to-franchise mapping
		const franchises = await pb.collection('franchises').getFullList({ sort: 'name' });
		
		// Build a map of pro IDs to their franchise
		const proToFranchise = new Map<string, any>();
		for (const franchise of franchises) {
			if (franchise.malePro) {
				proToFranchise.set(franchise.malePro, franchise);
			}
			if (franchise.femalePro) {
				proToFranchise.set(franchise.femalePro, franchise);
			}
		}

		// Build filter for pros (without franchise filter - we'll filter after)
		let proFilter = '';
		const proFilters = [];
		
		if (statusFilter) {
			proFilters.push(`status = '${statusFilter}'`);
		}
		if (genderFilter) {
			proFilters.push(`gender = '${genderFilter}'`);
		}
		if (searchQuery) {
			proFilters.push(`(name ~ '${searchQuery}' || nickname ~ '${searchQuery}')`);
		}
		
		if (proFilters.length > 0) {
			proFilter = proFilters.join(' && ');
		}

		// Build filter for user_profiles (broadcasters/managers)
		let profileFilter = '(role = "broadcaster" || role = "manager")';
		const profileFilters = [profileFilter];
		
		if (statusFilter) {
			profileFilters.push(`status = '${statusFilter}'`);
		}
		if (searchQuery) {
			profileFilters.push(`(firstName ~ '${searchQuery}' || lastName ~ '${searchQuery}' || email ~ '${searchQuery}')`);
		}
		
		const profileFilterStr = profileFilters.join(' && ');

		const [allPros, profiles, tournaments, pendingPayments, overduePayments, allResults] = await Promise.all([
			pb.collection('pros').getFullList({ 
				sort: 'name',
				filter: proFilter
			}),
			pb.collection('user_profiles').getFullList({
				sort: 'firstName,lastName',
				filter: profileFilterStr
			}),
			tournamentRepo.findAll({ sort: '-season,-tournamentNumber', perPage: 100 }),
			paymentRepo.findPending(),
			paymentRepo.findOverdue(),
			pb.collection('tournament_results').getFullList({ 
				expand: 'tournament,pro'
			}).catch(() => [])
		]);

		// Filter pros by franchise if specified
		let pros = allPros;
		if (franchiseFilter) {
			const selectedFranchise = franchises.find(f => f.id === franchiseFilter);
			if (selectedFranchise) {
				const franchiseProIds = new Set<string>();
				if (selectedFranchise.malePro) franchiseProIds.add(selectedFranchise.malePro);
				if (selectedFranchise.femalePro) franchiseProIds.add(selectedFranchise.femalePro);
				pros = allPros.filter(p => franchiseProIds.has(p.id));
			}
		}

		// Calculate stats for each pro
		const proStats = new Map();
		for (const pro of pros) {
			const proResults = Array.isArray(allResults) 
				? allResults.filter(r => r.pro === pro.id)
				: [];
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

		// Helper to build PocketBase file URL
		const getFileUrl = (collectionId: string, recordId: string, filename: string | undefined) => {
			if (!filename) return undefined;
			return `${pb.baseUrl}/api/files/${collectionId}/${recordId}/${filename}`;
		};

		// Transform pros to unified talent format
		const proTalent: TalentRecord[] = pros.map(pro => {
			const franchise = proToFranchise.get(pro.id);
			// Build avatar URL if it exists (avatar is a file field)
			const avatarUrl = pro.avatar ? getFileUrl(pro.collectionId, pro.id, pro.avatar) : undefined;
			return {
				id: pro.id,
				name: pro.name,
				email: undefined,
				phone: undefined,
				photo: pro.photo, // photo is a URL field, use as-is
				avatar: avatarUrl,
				status: pro.status,
				gender: pro.gender,
				role: 'pro' as const,
				worldRanking: pro.worldRanking,
				country: pro.country,
				nickname: pro.nickname,
				franchise: franchise ? { id: franchise.id, name: franchise.name } : null,
				totalEarnings: proStats.get(pro.id)?.totalEarnings || 0,
				tournamentsPlayed: proStats.get(pro.id)?.tournamentsPlayed || 0,
				wins: proStats.get(pro.id)?.wins || 0,
				originalRecord: pro
			};
		});

		// Transform broadcasters/managers to unified talent format
		const otherTalent: TalentRecord[] = profiles.map(profile => {
			const avatarUrl = profile.avatar ? getFileUrl(profile.collectionId, profile.id, profile.avatar) : undefined;
			return {
				id: profile.id,
				name: `${profile.firstName} ${profile.lastName}`,
				email: profile.email,
				phone: profile.phone,
				photo: undefined,
				avatar: avatarUrl,
				status: profile.status,
				gender: undefined,
				role: profile.role as 'broadcaster' | 'manager',
				franchise: null,
				originalRecord: profile
			};
		});

		// Combine and filter by role if specified
		let allTalent = [...proTalent, ...otherTalent];
		
		if (roleFilter) {
			allTalent = allTalent.filter(t => t.role === roleFilter);
		}

		// Sort by name
		allTalent.sort((a, b) => a.name.localeCompare(b.name));

		// Calculate overall stats (unfiltered counts)
		const allProTalent = proTalent;
		const allOtherTalent = otherTalent;
		const broadcasters = allOtherTalent.filter(t => t.role === 'broadcaster');
		const managers = allOtherTalent.filter(t => t.role === 'manager');

		const totalEarnings = Array.from(proStats.values()).reduce((sum, s) => sum + s.totalEarnings, 0);

		return {
			talent: allTalent,
			pros, // Keep for backward compatibility
			proStats: Object.fromEntries(proStats),
			tournaments: tournaments.items,
			pendingPayments: pendingPayments.items,
			overduePayments: overduePayments.items,
			franchises,
			filters: {
				status: statusFilter,
				gender: genderFilter,
				franchise: franchiseFilter,
				role: roleFilter,
				search: searchQuery
			},
			overallStats: {
				// New unified stats
				totalTalent: allProTalent.length + allOtherTalent.length,
				activeTalent: [...allProTalent, ...allOtherTalent].filter(t => t.status === 'active').length,
				totalPros: allProTalent.length,
				totalBroadcasters: broadcasters.length,
				totalManagers: managers.length,
				mensTalent: allProTalent.filter(p => p.gender === 'male').length,
				womensTalent: allProTalent.filter(p => p.gender === 'female').length,
				// Legacy stats
				activePros: allProTalent.filter(p => p.status === 'active').length,
				mensPros: allProTalent.filter(p => p.gender === 'male').length,
				womensPros: allProTalent.filter(p => p.gender === 'female').length,
				totalEarnings,
				activeTournaments: tournaments.items.filter(t => t.status === 'in_progress').length,
				upcomingTournaments: tournaments.items.filter(t => t.status === 'scheduled').length
			}
		};
	} catch (error) {
		console.error('Error loading talent management data:', error);
		return {
			talent: [],
			pros: [],
			proStats: {},
			tournaments: [],
			pendingPayments: [],
			overduePayments: [],
			franchises: [],
			filters: {},
			overallStats: {
				totalTalent: 0,
				activeTalent: 0,
				totalPros: 0,
				totalBroadcasters: 0,
				totalManagers: 0,
				mensTalent: 0,
				womensTalent: 0,
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
