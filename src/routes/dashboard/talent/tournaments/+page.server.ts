import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';
import { TournamentRepo } from '$lib/infra/pocketbase/repositories';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;
		const tournamentRepo = new TournamentRepo(pb);

	const season = url.searchParams.get('season');
	const status = url.searchParams.get('status');

	try {
		let tournaments;
		if (season) {
			tournaments = await tournamentRepo.findBySeason(parseInt(season));
		} else if (status) {
			tournaments = await tournamentRepo.findAll({
				filter: `status = '${status}'`,
				sort: '-startDate'
			});
		} else {
			tournaments = await tournamentRepo.findAll({
				sort: '-season,-tournamentNumber',
				perPage: 100
			});
		}

		const seasons = await pb.collection('tournaments').getFullList({
			fields: 'season',
			sort: '-season'
		});
		const uniqueSeasons = [...new Set(seasons.map((t: any) => t.season))];

		return {
			tournaments: tournaments.items,
			seasons: uniqueSeasons,
			currentSeason: season ? parseInt(season) : null,
			currentStatus: status
		};
	} catch (error) {
		console.error('Error loading tournaments:', error);
		return {
			tournaments: [],
			seasons: [],
			currentSeason: null,
			currentStatus: null
		};
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();

		const data = {
			name: formData.get('name') as string,
			season: parseInt(formData.get('season') as string),
			tournamentNumber: formData.get('tournamentNumber')
				? parseInt(formData.get('tournamentNumber') as string)
				: undefined,
			startDate: formData.get('startDate') as string,
			endDate: formData.get('endDate') as string,
			location: formData.get('location') as string,
			venue: formData.get('venue') as string,
			prizePool: parseFloat(formData.get('prizePool') as string),
			status: (formData.get('status') as string) || 'scheduled',
			description: formData.get('description') as string,
			notes: formData.get('notes') as string
		};

		try {
			const tournament = await pb.collection('tournaments').create(data);
			return { success: true, tournament };
		} catch (error: any) {
			console.error('Error creating tournament:', error);
			return fail(400, { error: error.message });
		}
	},

	update: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		const data = {
			name: formData.get('name') as string,
			season: parseInt(formData.get('season') as string),
			tournamentNumber: formData.get('tournamentNumber')
				? parseInt(formData.get('tournamentNumber') as string)
				: undefined,
			startDate: formData.get('startDate') as string,
			endDate: formData.get('endDate') as string,
			location: formData.get('location') as string,
			venue: formData.get('venue') as string,
			prizePool: parseFloat(formData.get('prizePool') as string),
			status: formData.get('status') as string,
			description: formData.get('description') as string,
			notes: formData.get('notes') as string
		};

		try {
			const tournament = await pb.collection('tournaments').update(id, data);
			return { success: true, tournament };
		} catch (error: any) {
			console.error('Error updating tournament:', error);
			return fail(400, { error: error.message });
		}
	},

	delete: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		try {
			await pb.collection('tournaments').delete(id);
			return { success: true };
		} catch (error: any) {
			console.error('Error deleting tournament:', error);
			return fail(400, { error: error.message });
		}
	}
};
