import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import PocketBase from 'pocketbase';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('=== Marketing Goals Debug ===');
	
	// Create a fresh PocketBase instance with admin auth for this request
	const pb = new PocketBase(env.POCKETBASE_URL);
	
	try {
		// Authenticate as admin to bypass collection rules
		await pb.admins.authWithPassword(
			env.POCKETBASE_ADMIN_EMAIL!,
			env.POCKETBASE_ADMIN_PASSWORD!
		);
		console.log('1. Admin auth successful');
	} catch (err: any) {
		console.error('1. Admin auth failed:', err.message);
	}

	// Fetch marketing goals
	let marketingGoals: any[] = [];
	try {
		console.log('2. Fetching marketing_goals collection...');
		console.log('   Auth token:', pb.authStore.token?.substring(0, 20) + '...');
		console.log('   Auth valid:', pb.authStore.isValid);
		console.log('   Auth isAdmin:', pb.authStore.isAdmin);
		
		marketingGoals = await pb.collection('marketing_goals').getFullList({
			sort: 'goalName'
		});
		console.log('3. Fetched records:', marketingGoals.length);
	} catch (err: any) {
		console.error('3. ERROR fetching marketing goals:', err.message);
		console.error('   Full error:', JSON.stringify(err, null, 2));
		console.error('   Response:', err.response);
		console.error('   Status:', err.status);
	}

	// Calculate stats based on actual schema
	// Status values: "Not Started", "In Progress", "Completed", "On Hold"
	const stats = {
		total: marketingGoals.length,
		byStatus: {
			notStarted: marketingGoals.filter(g => g.status === 'Not Started').length,
			inProgress: marketingGoals.filter(g => g.status === 'In Progress').length,
			completed: marketingGoals.filter(g => g.status === 'Completed').length,
			onHold: marketingGoals.filter(g => g.status === 'On Hold').length
		},
		byCategory: {} as Record<string, number>,
		byPriority: {
			high: marketingGoals.filter(g => g.priority === 'High').length,
			medium: marketingGoals.filter(g => g.priority === 'Medium').length,
			low: marketingGoals.filter(g => g.priority === 'Low').length
		}
	};

	// Count by category
	marketingGoals.forEach(goal => {
		if (goal.category) {
			stats.byCategory[goal.category] = (stats.byCategory[goal.category] || 0) + 1;
		}
	});

	console.log('4. Stats:', JSON.stringify(stats, null, 2));
	console.log('=== End Debug ===');

	return {
		marketingGoals,
		stats
	};
};
