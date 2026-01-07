import { z } from 'zod';

export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'blocked', 'completed', 'cancelled']);
export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const SubTaskSchema = z.object({
	text: z.string(),
	completed: z.boolean().default(false)
});

export const TaskSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, 'Task title is required').max(500),
	description: z.string().optional(),
	subTasksChecklist: z.array(SubTaskSchema).optional(),
	status: TaskStatusEnum,
	priority: TaskPriorityEnum.optional(),
	startDate: z.date().optional(),
	dueDate: z.date().optional(),
	completedDate: z.date().optional(),
	projectId: z.string().optional(),
	assignedTo: z.array(z.string()).optional(),
	createdBy: z.string().optional(),
	managerId: z.string().optional(),
	tags: z.string().optional(),
	estimatedHours: z.number().nonnegative().optional(),
	actualHours: z.number().nonnegative().optional(),
	task_budget: z.number().min(0).optional(),
	task_actual_cost: z.number().min(0).optional(),
	notes: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
}).refine(
	(data) => {
		if (data.startDate && data.dueDate) {
			return data.startDate <= data.dueDate;
		}
		return true;
	},
	{
		message: 'Start date must be before or equal to due date',
		path: ['dueDate']
	}
);

export type TaskInput = z.infer<typeof TaskSchema>;
export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;
export type SubTask = z.infer<typeof SubTaskSchema>;
