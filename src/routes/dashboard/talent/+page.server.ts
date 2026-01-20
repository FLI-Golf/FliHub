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
	talentType: ('player' | 'broadcaster' | 'commentator' | 'analyst')[];
	// Player-specific fields
	worldRanking?: number;
	country?: string;
	nickname?: string;
	franchise?: { id: string; name: string } | null;
	// Stats (for players)
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
	const talentTypeFilter = url.searchParams.get('talentType');
	const searchQuery = url.searchParams.get('search');

	try {
		const tournamentRepo = new TournamentRepo(pb);
		const paymentRepo = new ProPaymentRepo(pb);

		// First, get franchises to build the talent-to-franchise mapping
		const franchises = await pb.collection('franchises').getFullList({ sort: 'name' });
		
		// Build a map of talent IDs to their franchise
		const talentToFranchise = new Map<string, any>();
		for (const franchise of franchises) {
			if (franchise.malePro) {
				talentToFranchise.set(franchise.malePro, franchise);
			}
			if (franchise.femalePro) {
				talentToFranchise.set(franchise.femalePro, franchise);
			}
		}

		// Build filter for talent collection
		const talentFilters: string[] = [];
		
		if (statusFilter) {
			talentFilters.push(`status = '${statusFilter}'`);
		}
		if (genderFilter) {
			talentFilters.push(`gender = '${genderFilter}'`);
		}
		if (talentTypeFilter) {
			talentFilters.push(`talentType ~ '${talentTypeFilter}'`);
		}
		if (searchQuery) {
			talentFilters.push(`(name ~ '${searchQuery}' || nickname ~ '${searchQuery}')`);
		}
		
		const talentFilter = talentFilters.length > 0 ? talentFilters.join(' && ') : '';

		// Fetch talent and broadcaster_profiles
		const [allTalentRecords, broadcasterProfiles, tournaments, pendingPayments, overduePayments, allResults] = await Promise.all([
			pb.collection('talent').getFullList({ 
				sort: 'name',
				filter: talentFilter
			}),
			pb.collection('broadcaster_profiles').getFullList({
				sort: 'name',
				filter: statusFilter ? `status = '${statusFilter}'` : ''
			}).catch(() => []), // May not exist yet
			tournamentRepo.findAll({ sort: '-season,-tournamentNumber', perPage: 100 }),
			paymentRepo.findPending(),
			paymentRepo.findOverdue(),
			pb.collection('tournament_results').getFullList({ 
				expand: 'tournament,pro'
			}).catch(() => [])
		]);

		// Filter talent by franchise if specified
		let talentRecords = allTalentRecords;
		if (franchiseFilter) {
			const selectedFranchise = franchises.find(f => f.id === franchiseFilter);
			if (selectedFranchise) {
				const franchiseTalentIds = new Set<string>();
				if (selectedFranchise.malePro) franchiseTalentIds.add(selectedFranchise.malePro);
				if (selectedFranchise.femalePro) franchiseTalentIds.add(selectedFranchise.femalePro);
				talentRecords = allTalentRecords.filter(t => franchiseTalentIds.has(t.id));
			}
		}

		// Calculate stats for each talent (players)
		const talentStats = new Map();
		for (const talent of talentRecords) {
			const talentResults = Array.isArray(allResults) 
				? allResults.filter(r => r.pro === talent.id)
				: [];
			const totalEarnings = talentResults.reduce((sum, r) => sum + (r.proEarnings || 0), 0);
			const tournamentsPlayed = talentResults.length;
			const wins = talentResults.filter(r => r.placement === 1).length;
			const podiums = talentResults.filter(r => r.placement <= 3).length;
			const topTens = talentResults.filter(r => r.placement <= 10).length;
			
			talentStats.set(talent.id, {
				totalEarnings,
				tournamentsPlayed,
				wins,
				podiums,
				topTens,
				avgPlacement: tournamentsPlayed > 0 
					? talentResults.reduce((sum, r) => sum + r.placement, 0) / tournamentsPlayed 
					: 0
			});
		}

		// Helper to build PocketBase file URL
		const getFileUrl = (collectionId: string, recordId: string, filename: string | undefined) => {
			if (!filename) return undefined;
			return `${pb.baseUrl}/api/files/${collectionId}/${recordId}/${filename}`;
		};

		// Transform talent records to unified format
		const talent: TalentRecord[] = talentRecords.map(record => {
			const franchise = talentToFranchise.get(record.id);
			const avatarUrl = record.avatar ? getFileUrl(record.collectionId, record.id, record.avatar) : undefined;
			return {
				id: record.id,
				name: record.name,
				email: undefined,
				phone: undefined,
				photo: record.photo,
				avatar: avatarUrl,
				status: record.status,
				gender: record.gender,
				talentType: record.talentType || ['player'],
				worldRanking: record.worldRanking,
				country: record.country,
				nickname: record.nickname,
				franchise: franchise ? { id: franchise.id, name: franchise.name } : null,
				totalEarnings: talentStats.get(record.id)?.totalEarnings || 0,
				tournamentsPlayed: talentStats.get(record.id)?.tournamentsPlayed || 0,
				wins: talentStats.get(record.id)?.wins || 0,
				originalRecord: record
			};
		});

		// Sort by name
		talent.sort((a, b) => a.name.localeCompare(b.name));

		// Calculate overall stats
		const players = talent.filter(t => t.talentType.includes('player'));
		const broadcasters = talent.filter(t => t.talentType.includes('broadcaster'));
		const commentators = talent.filter(t => t.talentType.includes('commentator'));
		const analysts = talent.filter(t => t.talentType.includes('analyst'));

		const totalEarnings = Array.from(talentStats.values()).reduce((sum, s) => sum + s.totalEarnings, 0);

		return {
			talent,
			talentStats: Object.fromEntries(talentStats),
			broadcasterProfiles, // Standalone broadcaster profiles (non-talent)
			tournaments: tournaments.items,
			pendingPayments: pendingPayments.items,
			overduePayments: overduePayments.items,
			franchises,
			filters: {
				status: statusFilter,
				gender: genderFilter,
				franchise: franchiseFilter,
				talentType: talentTypeFilter,
				search: searchQuery
			},
			overallStats: {
				totalTalent: talent.length,
				activeTalent: talent.filter(t => t.status === 'active').length,
				totalPlayers: players.length,
				totalBroadcasters: broadcasters.length,
				totalCommentators: commentators.length,
				totalAnalysts: analysts.length,
				totalBroadcasterProfiles: broadcasterProfiles.length,
				mensTalent: talent.filter(t => t.gender === 'male').length,
				womensTalent: talent.filter(t => t.gender === 'female').length,
				totalEarnings,
				activeTournaments: tournaments.items.filter(t => t.status === 'in_progress').length,
				upcomingTournaments: tournaments.items.filter(t => t.status === 'scheduled').length
			}
		};
	} catch (error) {
		console.error('Error loading talent management data:', error);
		return {
			talent: [],
			talentStats: {},
			broadcasterProfiles: [],
			tournaments: [],
			pendingPayments: [],
			overduePayments: [],
			franchises: [],
			filters: {},
			overallStats: {
				totalTalent: 0,
				activeTalent: 0,
				totalPlayers: 0,
				totalBroadcasters: 0,
				totalCommentators: 0,
				totalAnalysts: 0,
				totalBroadcasterProfiles: 0,
				mensTalent: 0,
				womensTalent: 0,
				totalEarnings: 0,
				activeTournaments: 0,
				upcomingTournaments: 0
			}
		};
	}
};
