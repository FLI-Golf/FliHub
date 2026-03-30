import { RequestContext } from '$lib/infra/RequestContext';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const franchises = await ctx.pb
		.collection('franchises')
		.getFullList({ sort: 'name', fields: 'id,name' })
		.catch(() => []);
	return { franchises };
};

export const actions: Actions = {
	default: async ({ locals, url, request }) => {
		const ctx = await RequestContext.from(locals, url);
		const data = await request.formData();

		const name = data.get('name')?.toString().trim();
		if (!name) return fail(400, { error: 'Name is required' });

		const talentType = data.getAll('talentType');
		if (!talentType.length) return fail(400, { error: 'At least one talent type is required' });

		try {
			const payload: Record<string, any> = {
				name,
				nickname:             data.get('nickname')             || '',
				status:               data.get('status')               || 'active',
				gender:               data.get('gender')               || '',
				talentType,
				country:              data.get('country')              || '',
				residence:            data.get('residence')            || '',
				bio:                  data.get('bio')                  || '',
				worldRanking:         data.get('worldRanking')         ? Number(data.get('worldRanking'))  : null,
				dateOfBirth:          data.get('dateOfBirth')          || null,
				height:               data.get('height')               || '',
				weight:               data.get('weight')               || '',
				yearTurnedPro:        data.get('yearTurnedPro')        ? Number(data.get('yearTurnedPro')) : null,
				sponsoredBy:          data.get('sponsoredBy')          || '',
				primarySponsor:       data.get('primarySponsor')       || '',
				favoriteDisc:         data.get('favoriteDisc')         || '',
				signatureMove:        data.get('signatureMove')        || '',
				careerHighlights:     data.get('careerHighlights')     || '',
				notableRecords:       data.get('notableRecords')       || '',
				education:            data.get('education')            || '',
				otherSports:          data.get('otherSports')          || '',
				hobbies:              data.get('hobbies')              || '',
				favoriteDestination:  data.get('favoriteDestination')  || '',
				personalMotivation:   data.get('personalMotivation')   || '',
				website:              data.get('website')              || '',
				tiktok:               data.get('tiktok')               || '',
				twitch:               data.get('twitch')               || '',
				primaryAirport:       data.get('primaryAirport')       || '',
				secondaryAirport:     data.get('secondaryAirport')     || '',
				frequentFlyerNumbers: data.get('frequentFlyerNumbers') || '',
				injuryHistory:        data.get('injuryHistory')        || '',
				fitnessRegimen:       data.get('fitnessRegimen')       || '',
				dietaryPreferences:   data.get('dietaryPreferences')   || '',
				longTermGoals:        data.get('longTermGoals')        || '',
				missionStatement:     data.get('missionStatement')     || ''
			};

			// Avatar file upload
			const avatarFile = data.get('avatar') as File;
			if (avatarFile && avatarFile.size > 0) {
				payload.avatar = avatarFile;
			}

			const record = await ctx.pb.collection('talent').create(payload);
			throw redirect(303, `/dashboard/talent/${record.id}`);
		} catch (err: any) {
			if (err?.status === 303) throw err;
			console.error('Error creating talent:', err);
			return fail(500, { error: err?.message ?? 'Failed to create talent' });
		}
	}
};
