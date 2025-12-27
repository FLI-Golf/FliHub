import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPocketBase } from '$lib/infra/pocketbase/pbClient';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { partners } = await request.json();

		if (!partners || !Array.isArray(partners)) {
			return json({ error: 'Invalid request: partners array is required' }, { status: 400 });
		}

		const pb = getPocketBase();
		
		// Authenticate as admin
		try {
			const adminEmail = env.POCKETBASE_ADMIN_EMAIL;
			const adminPassword = env.POCKETBASE_ADMIN_PASSWORD;
			
			if (!adminEmail || !adminPassword) {
				return json({ 
					error: 'PocketBase admin credentials not configured',
					details: 'Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD in .env'
				}, { status: 500 });
			}
			
			await pb.admins.authWithPassword(adminEmail, adminPassword);
			console.log('✅ PocketBase authentication successful');
		} catch (authError: any) {
			console.error('❌ PocketBase authentication failed:', authError);
			return json({ 
				error: 'Failed to authenticate with PocketBase',
				details: authError.data?.message || authError.message
			}, { status: 500 });
		}
		
		// Verify broadcast_partners collection exists
		try {
			await pb.collection('broadcast_partners').getList(1, 1);
			console.log('✅ Broadcast partners collection accessible');
		} catch (collectionError: any) {
			console.error('❌ Broadcast partners collection not accessible:', collectionError);
			return json({
				error: 'Broadcast partners collection not found or not accessible',
				details: 'Please import the collection schema from json_data/pocketbase-import-no-relations.json'
			}, { status: 500 });
		}

		let imported = 0;
		let skipped = 0;
		let duplicates = 0;
		const errors: string[] = [];

		for (const partnerData of partners) {
			try {
				// Skip invalid partners
				if (!partnerData.point || partnerData.point.trim().length === 0) {
					skipped++;
					errors.push(`Empty point field`);
					continue;
				}

				// Type values from PocketBase schema (exact match required)
				// Valid values: "Key Point", "Supporting Point", "Risk", "Opportunity"
				const validTypes = ['Key Point', 'Supporting Point', 'Risk', 'Opportunity'];
				const mappedType = validTypes.includes(partnerData.type) ? partnerData.type : 'Key Point';

				// Map the CSV data to PocketBase collection format
				const pbData = {
					name: partnerData.point, // Use point as name
					point: partnerData.point,
					details: partnerData.details || '',
					type: mappedType,
					category: partnerData.category,
					importanceLevel: partnerData.importanceLevel,
					tags: partnerData.tags || '',
					additionalNotes: partnerData.additionalNotes || '',
					status: 'active' // Add default status
				};

				// Check if partner already exists (by point)
				try {
					const existingPartners = await pb.collection('broadcast_partners').getList(1, 1, {
						filter: `point = "${partnerData.point.replace(/"/g, '\\"')}"`
					});

					if (existingPartners.items.length > 0) {
						duplicates++;
						continue;
					}
				} catch (checkError: any) {
					// Log but continue - collection might not exist yet
					console.error(`Error checking for duplicates:`, checkError);
				}

				// Create the broadcast partner
				try {
					await pb.collection('broadcast_partners').create(pbData);
					imported++;
				} catch (createError: any) {
					const errorData = createError.data?.data || createError.data || {};
					const errorMsg = createError.data?.message || createError.message || 'Unknown error';
					const fieldErrors = Object.entries(errorData).map(([field, err]) => `${field}: ${JSON.stringify(err)}`).join(', ');
					const fullError = fieldErrors ? `${errorMsg} (${fieldErrors})` : errorMsg;
					console.error(`Error creating broadcast partner "${partnerData.point}":`, createError);
					errors.push(`${partnerData.point}: ${fullError}`);
					skipped++;
				}
			} catch (error: any) {
				// Catch any unexpected errors in the loop
				console.error(`Unexpected error processing broadcast partner:`, error);
				errors.push(`Unexpected error: ${error.message}`);
				skipped++;
			}
		}

		return json({
			success: true,
			imported,
			skipped,
			duplicates,
			total: partners.length,
			errors: errors.length > 0 ? errors.slice(0, 10) : undefined
		});
	} catch (error: any) {
		console.error('Bulk import error:', error);
		return json(
			{
				error: 'Failed to import broadcast partners',
				details: error.message
			},
			{ status: 500 }
		);
	}
};
