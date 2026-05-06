import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, request }) => {
	const pb = locals.pb;
	
	// Check if user is authenticated
	if (!pb.authStore.isValid || !pb.authStore.model?.id) {
		return json({ error: 'Unauthorized - Not logged in' }, { status: 403 });
	}

	// Fetch user profile
	try {
		const profiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${pb.authStore.model.id}"`
		});
		const userProfile = profiles[0];

		if (!userProfile) {
			return json({ error: 'User profile not found' }, { status: 403 });
		}

		// Get expense ID and update data from request
		const { expenseId, ...updateData } = await request.json();

		if (!expenseId) {
			return json({ error: 'expenseId is required' }, { status: 400 });
		}

		// Get current expense to check status change
		const currentExpense = await pb.collection('expenses').getOne(expenseId);

		// Update the expense
		const expense = await pb.collection('expenses').update(expenseId, updateData);

		console.log(`✅ Updated expense ${expense.id} with status: ${expense.status}`);

		// If status changed to "paid", update department actual expenses and work order
		if (currentExpense.status !== 'paid' && expense.status === 'paid') {
			try {
				// Resolve project via taskId → project → department
				let deptId: string | null = null;
				if (expense.taskId) {
					const task = await pb.collection('tasks').getOne(expense.taskId).catch(() => null) as any;
					const pid = task ? (typeof task.projectId === 'object' ? task.projectId?.id : task.projectId) : null;
					if (pid) {
						const project = await pb.collection('projects').getOne(pid).catch(() => null) as any;
						deptId = project?.department || null;
					}
				}
				if (deptId) {
					const dept = await pb.collection('departments').getOne(deptId).catch(() => null) as any;
					if (dept) {
						const currentActual = dept.department_actual_expenses || 0;
						await pb.collection('departments').update(deptId, {
							department_actual_expenses: currentActual + (expense.amount || 0),
						});
						console.log(`✅ Updated department ${deptId} actual expenses +${expense.amount}`);
					}
				}
				// Mark linked work order as paid
				const wos = await pb.collection('work_orders').getFullList({
					filter: `expenseId = "${expense.id}"`,
					fields: 'id'
				}).catch(() => []) as any[];
				for (const wo of wos) {
					await pb.collection('work_orders').update(wo.id, {
						status: 'paid',
						paidDate: new Date().toISOString(),
					}).catch(() => {});
				}
			} catch (paidError: any) {
				console.warn('Could not process paid side-effects:', paidError.message);
			}
		}

		// If status changed to "submitted", automatically create an approval request
		if (currentExpense.status !== 'submitted' && expense.status === 'submitted') {
			try {
				// Check if approval already exists
				const existingApprovals = await pb.collection('approvals').getFullList({
					filter: `entityType = "expense" && entityId = "${expense.id}" && status = "pending"`
				});

				if (existingApprovals.length === 0) {
					const approvalData = {
						entityType: 'expense',
						entityId: expense.id,
						status: 'pending',
						requestedBy: userProfile.id,
						requestedDate: new Date().toISOString(),
						amount: expense.amount || 0,
						comments: '<p>Expense submitted for approval.</p>'
					};

					const approval = await pb.collection('approvals').create(approvalData);
					console.log(`✅ Auto-created approval ${approval.id} for expense ${expense.id}`);

					return json({ 
						success: true, 
						message: 'Expense updated and submitted for approval',
						expense,
						approval
					});
				}
			} catch (approvalError: any) {
				console.warn(`⚠️  Could not create approval: ${approvalError.message}`);
				// Continue anyway - expense was updated
			}
		}

		return json({ 
			success: true, 
			message: 'Expense updated successfully',
			expense
		});
	} catch (error: any) {
		console.error('Error updating expense:', error);
		return json({ 
			error: 'Failed to update expense', 
			details: error.message 
		}, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const pb = locals.pb;
	
	// Check if user is authenticated
	if (!pb.authStore.isValid || !pb.authStore.model?.id) {
		return json({ error: 'Unauthorized - Not logged in' }, { status: 403 });
	}

	// Fetch user profile
	try {
		const profiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${pb.authStore.model.id}"`
		});
		const userProfile = profiles[0];

		if (!userProfile) {
			return json({ error: 'User profile not found' }, { status: 403 });
		}

		// Get expense data from request
		const expenseData = await request.json();

		// Create the expense
		const expense = await pb.collection('expenses').create(expenseData);

		console.log(`✅ Created expense ${expense.id} with status: ${expense.status}`);

		// If status is "submitted", automatically create an approval request
		if (expense.status === 'submitted') {
			try {
				const approvalData = {
					entityType: 'expense',
					entityId: expense.id,
					status: 'pending',
					requestedBy: userProfile.id,
					requestedDate: new Date().toISOString(),
					amount: expense.amount || 0,
					comments: '<p>Expense submitted for approval.</p>'
				};

				const approval = await pb.collection('approvals').create(approvalData);
				console.log(`✅ Auto-created approval ${approval.id} for expense ${expense.id}`);

				return json({ 
					success: true, 
					message: 'Expense created and submitted for approval',
					expense,
					approval
				});
			} catch (approvalError: any) {
				console.warn(`⚠️  Could not create approval: ${approvalError.message}`);
				// Continue anyway - expense was created
			}
		}

		return json({ 
			success: true, 
			message: 'Expense created successfully',
			expense
		});
	} catch (error: any) {
		console.error('Error creating expense:', error);
		return json({ 
			error: 'Failed to create expense', 
			details: error.message 
		}, { status: 500 });
	}
};
