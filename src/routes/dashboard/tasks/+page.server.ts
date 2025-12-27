import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	console.log('Loading tasks page...');
	console.log('Auth state:', {
		isValid: pb.authStore.isValid,
		userId: pb.authStore.model?.id
	});

	try {
		// Fetch all tasks - use -id instead of -created since created field may not exist
		console.log('Fetching tasks from PocketBase...');
		const tasks = await pb.collection('tasks').getFullList({
			sort: '-id'
		});
		console.log(`Fetched ${tasks.length} tasks`);
		if (tasks.length > 0) {
			console.log('First task:', tasks[0]);
		}

		// Calculate task statistics
		const stats = {
			total: tasks.length,
			byStatus: {
				todo: tasks.filter(t => t.status === 'todo').length,
				in_progress: tasks.filter(t => t.status === 'in_progress').length,
				blocked: tasks.filter(t => t.status === 'blocked').length,
				completed: tasks.filter(t => t.status === 'completed').length,
				cancelled: tasks.filter(t => t.status === 'cancelled').length
			},
			byPriority: {
				low: tasks.filter(t => t.priority === 'low').length,
				medium: tasks.filter(t => t.priority === 'medium').length,
				high: tasks.filter(t => t.priority === 'high').length,
				urgent: tasks.filter(t => t.priority === 'urgent').length
			},
			completion: {
				completed: tasks.filter(t => t.status === 'completed').length,
				total: tasks.length,
				percentage: tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0
			}
		};

		// Get overdue tasks
		const now = new Date();
		const overdueTasks = tasks.filter(t => {
			if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled') return false;
			return new Date(t.dueDate) < now;
		});

		// Get upcoming tasks (due in next 7 days)
		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);
		const upcomingTasks = tasks.filter(t => {
			if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled') return false;
			const dueDate = new Date(t.dueDate);
			return dueDate >= now && dueDate <= nextWeek;
		});

		return {
			tasks,
			stats,
			subtaskStats: { total: 0, completed: 0 },
			alerts: {
				overdue: overdueTasks.length,
				upcoming: upcomingTasks.length,
				blocked: tasks.filter(t => t.status === 'blocked').length
			},
			overdueTasks: overdueTasks.slice(0, 5),
			upcomingTasks: upcomingTasks.slice(0, 5)
		};
	} catch (error) {
		console.error('Error loading tasks:', error);
		console.error('Error details:', JSON.stringify(error, null, 2));
		if (error && typeof error === 'object' && 'response' in error) {
			console.error('Response:', error.response);
		}
		return {
			tasks: [],
			stats: {
				total: 0,
				byStatus: { todo: 0, in_progress: 0, blocked: 0, completed: 0, cancelled: 0 },
				byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
				completion: { completed: 0, total: 0, percentage: 0 }
			},
			subtaskStats: { total: 0, completed: 0 },
			alerts: { overdue: 0, upcoming: 0, blocked: 0 },
			overdueTasks: [],
			upcomingTasks: [],
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
};
