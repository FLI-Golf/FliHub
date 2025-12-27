import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPocketBase } from '$lib/infra/pocketbase/pbClient';
import { TaskStatus } from '$lib/domain/modules/projects/Task';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { tasks } = await request.json();

		if (!tasks || !Array.isArray(tasks)) {
			return json({ error: 'Invalid request: tasks array is required' }, { status: 400 });
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
		
		// Verify tasks collection exists
		try {
			await pb.collection('tasks').getList(1, 1);
			console.log('✅ Tasks collection accessible');
		} catch (collectionError: any) {
			console.error('❌ Tasks collection not accessible:', collectionError);
			return json({
				error: 'Tasks collection not found or not accessible',
				details: 'Please import the collection schema from json_data/pocketbase-import-no-relations.json'
			}, { status: 500 });
		}

		let imported = 0;
		let skipped = 0;
		let duplicates = 0;
		const errors: string[] = [];

		for (const taskData of tasks) {
			try {
				// Skip invalid tasks
				if (!taskData.task || taskData.task.trim().length === 0) {
					skipped++;
					errors.push(`Empty task name`);
					continue;
				}

				// Convert date strings to Date objects for PocketBase
				const parseDate = (dateStr: string | undefined): string | undefined => {
					if (!dateStr) return undefined;
					try {
						const date = new Date(dateStr);
						return date.toISOString();
					} catch {
						return undefined;
					}
				};

				// Map status to match production PocketBase schema
				// Production uses: todo, in_progress, blocked, completed, cancelled
				const statusMap: Record<string, string> = {
					'Scheduled': 'todo',
					'In Progress': 'in_progress',
					'Completed': 'completed',
					'Cancelled': 'cancelled'
				};
				
				const mappedStatus = statusMap[taskData.status] || 'todo';

				// Map the CSV data to PocketBase collection format
				const pbData = {
					title: taskData.task, // PocketBase uses 'title' field
					subTasksChecklist: taskData.subTasksChecklist || '',
					managers: taskData.managers || '',
					track: taskData.track || '',
					strategicGoal: taskData.strategicGoal || '',
					departments: taskData.departments || '',
					quarters: taskData.quarters || '',
					startDate: parseDate(taskData.startDate),
					endDate: parseDate(taskData.endDate),
					budget: taskData.budget || 0,
					income: taskData.income || 0,
					status: mappedStatus
				};

				// Check if task already exists (by task name)
				try {
					const existingTasks = await pb.collection('tasks').getList(1, 1, {
						filter: `task = "${taskData.task.replace(/"/g, '\\"')}"`
					});

					if (existingTasks.items.length > 0) {
						duplicates++;
						continue;
					}
				} catch (checkError: any) {
					// Log but continue - collection might not exist yet
					console.error(`Error checking for duplicates:`, checkError);
				}

				// Create the task
				try {
					await pb.collection('tasks').create(pbData);
					imported++;
				} catch (createError: any) {
					const errorData = createError.data?.data || createError.data || {};
					const errorMsg = createError.data?.message || createError.message || 'Unknown error';
					const fieldErrors = Object.entries(errorData).map(([field, err]) => `${field}: ${JSON.stringify(err)}`).join(', ');
					const fullError = fieldErrors ? `${errorMsg} (${fieldErrors})` : errorMsg;
					console.error(`Error creating task "${taskData.task}":`, createError);
					errors.push(`${taskData.task}: ${fullError}`);
					skipped++;
				}
			} catch (error: any) {
				// Catch any unexpected errors in the loop
				console.error(`Unexpected error processing task:`, error);
				errors.push(`Unexpected error: ${error.message}`);
				skipped++;
			}
		}

		return json({
			success: true,
			imported,
			skipped,
			duplicates,
			total: tasks.length,
			errors: errors.length > 0 ? errors.slice(0, 10) : undefined
		});
	} catch (error: any) {
		console.error('Bulk import error:', error);
		return json(
			{
				error: 'Failed to import tasks',
				details: error.message
			},
			{ status: 500 }
		);
	}
};
