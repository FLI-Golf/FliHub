import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const pb = locals.pb;

	try {
		const talent = await pb.collection('talent').getOne(params.id);
		
		// Get franchises for the dropdown
		const franchises = await pb.collection('franchises').getFullList({ sort: 'name' });

		// Build avatar URL if exists
		const avatarUrl = talent.avatar 
			? `${pb.baseUrl}/api/files/${talent.collectionId}/${talent.id}/${talent.avatar}`
			: null;

		return {
			talent,
			franchises,
			avatarUrl
		};
	} catch (err) {
		console.error('Error loading talent:', err);
		throw error(404, 'Talent not found');
	}
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const pb = locals.pb;
		const formData = await request.formData();

		try {
			// Extract form fields
			const data: Record<string, any> = {
				name: formData.get('name'),
				nickname: formData.get('nickname') || '',
				status: formData.get('status'),
				gender: formData.get('gender') || null,
				talentType: formData.getAll('talentType'),
				country: formData.get('country') || '',
				residence: formData.get('residence') || '',
				bio: formData.get('bio') || '',
				worldRanking: formData.get('worldRanking') ? Number(formData.get('worldRanking')) : null,
				dateOfBirth: formData.get('dateOfBirth') || null,
				height: formData.get('height') || '',
				weight: formData.get('weight') || '',
				yearTurnedPro: formData.get('yearTurnedPro') ? Number(formData.get('yearTurnedPro')) : null,
				
				// Sponsor info
				sponsoredBy: formData.get('sponsoredBy') || '',
				primarySponsor: formData.get('primarySponsor') || '',
				
				// Equipment
				favoriteDisc: formData.get('favoriteDisc') || '',
				signatureMove: formData.get('signatureMove') || '',
				
				// Career
				careerHighlights: formData.get('careerHighlights') || '',
				notableRecords: formData.get('notableRecords') || '',
				
				// Personal
				education: formData.get('education') || '',
				otherSports: formData.get('otherSports') || '',
				hobbies: formData.get('hobbies') || '',
				favoriteDestination: formData.get('favoriteDestination') || '',
				personalMotivation: formData.get('personalMotivation') || '',
				
				// Social
				website: formData.get('website') || '',
				tiktok: formData.get('tiktok') || '',
				twitch: formData.get('twitch') || '',
				
				// Travel
				primaryAirport: formData.get('primaryAirport') || '',
				secondaryAirport: formData.get('secondaryAirport') || '',
				frequentFlyerNumbers: formData.get('frequentFlyerNumbers') || '',
				
				// Health & Goals
				injuryHistory: formData.get('injuryHistory') || '',
				fitnessRegimen: formData.get('fitnessRegimen') || '',
				dietaryPreferences: formData.get('dietaryPreferences') || '',
				longTermGoals: formData.get('longTermGoals') || '',
				missionStatement: formData.get('missionStatement') || ''
			};

			// Handle avatar file upload
			const avatarFile = formData.get('avatar') as File;
			if (avatarFile && avatarFile.size > 0) {
				data.avatar = avatarFile;
			}

			// Validate required fields
			if (!data.name) {
				return fail(400, { error: 'Name is required' });
			}
			if (!data.status) {
				return fail(400, { error: 'Status is required' });
			}
			if (!data.talentType || data.talentType.length === 0) {
				return fail(400, { error: 'At least one talent type is required' });
			}

			await pb.collection('talent').update(params.id, data);

			throw redirect(303, `/dashboard/talent/${params.id}`);
		} catch (err: any) {
			if (err.status === 303) throw err; // Re-throw redirect
			console.error('Error updating talent:', err);
			return fail(500, { error: err.message || 'Failed to update talent' });
		}
	},

	delete: async ({ locals, params }) => {
		const pb = locals.pb;
		const talentId = params.id!;

		try {
			console.log('Deleting talent:', talentId);

			// Check for records that CANNOT be cascade deleted (important data)
			const blockingRecords: string[] = [];

			// Check tournament_results - these are important historical data
			try {
				const results = await pb.collection('tournament_results').getList(1, 1, {
					filter: `pro = "${talentId}"`
				});
				if (results.totalItems > 0) {
					blockingRecords.push(`${results.totalItems} tournament result(s)`);
				}
			} catch (e) { /* collection may not exist */ }

			// Check pro_payments - financial records should not be auto-deleted
			try {
				const payments = await pb.collection('pro_payments').getList(1, 1, {
					filter: `pro = "${talentId}"`
				});
				if (payments.totalItems > 0) {
					blockingRecords.push(`${payments.totalItems} payment record(s)`);
				}
			} catch (e) { /* collection may not exist */ }

			// Check franchises (malePro, femalePro) - need to unassign first
			try {
				const franchises = await pb.collection('franchises').getList(1, 1, {
					filter: `malePro = "${talentId}" || femalePro = "${talentId}"`
				});
				if (franchises.totalItems > 0) {
					blockingRecords.push(`${franchises.totalItems} franchise assignment(s)`);
				}
			} catch (e) { /* collection may not exist */ }

			// If there are blocking records, don't allow deletion
			if (blockingRecords.length > 0) {
				return fail(400, { 
					error: `Cannot delete this talent because they have important records: ${blockingRecords.join(', ')}. Please remove these references first or set the talent status to "inactive" instead.`
				});
			}

			// Delete related records that CAN be safely cascade deleted
			// Delete pro_access records (these are just permission mappings)
			try {
				const accessRecords = await pb.collection('pro_access').getFullList({
					filter: `pro = "${talentId}"`
				});
				for (const record of accessRecords) {
					await pb.collection('pro_access').delete(record.id);
					console.log(`Deleted pro_access record: ${record.id}`);
				}
			} catch (e) { 
				console.log('No pro_access records to delete or collection does not exist');
			}
			
			// Delete the talent record
			await pb.collection('talent').delete(talentId);

			console.log('Talent deleted successfully');
		} catch (err: any) {
			console.error('Error deleting talent:', err);
			
			// Check if it's a relation reference error
			if (err.message?.includes('relation reference')) {
				return fail(400, { 
					error: 'Cannot delete this talent because they are referenced by other records. Please remove all references first or set the talent status to "inactive" instead.'
				});
			}
			
			return fail(500, { error: err.message || 'Failed to delete talent' });
		}

		// Redirect after successful deletion (outside try-catch to avoid catching redirect)
		throw redirect(303, '/dashboard/talent');
	}
};
