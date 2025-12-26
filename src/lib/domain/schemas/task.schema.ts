import { z } from 'zod';

export const TaskStatusEnum = z.enum(['In Progress', 'Scheduled', 'Completed', 'Cancelled']);
export const TaskTrackEnum = z.enum(['Phase 1', 'Phase 2', 'Overall', 'Other']);
export const StrategicGoalEnum = z.enum([
	'Company Growth',
	'Brand Awareness',
	'Revenue',
	'Increase Revenue',
	'Managerial Tasks',
	'App',
	'Legal Tasks'
]);
export const QuarterEnum = z.enum(['Q1', 'Q2', 'Q3', 'Q4']);

export const TaskSchema = z.object({
	id: z.string().uuid().optional(),
	task: z.string().min(1, 'Task name is required').max(500),
	subTasksChecklist: z.string().optional(),
	managers: z.string().optional(),
	track: TaskTrackEnum.optional(),
	strategicGoal: StrategicGoalEnum.optional(),
	departments: z.string().optional(),
	quarters: QuarterEnum.optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	budget: z.number().nonnegative().optional(),
	income: z.number().nonnegative().optional(),
	status: TaskStatusEnum,
	created: z.date().optional(),
	updated: z.date().optional()
}).refine(
	(data) => {
		if (data.startDate && data.endDate) {
			return data.startDate <= data.endDate;
		}
		return true;
	},
	{
		message: 'Start date must be before or equal to end date',
		path: ['endDate']
	}
);

export type TaskInput = z.infer<typeof TaskSchema>;
export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type TaskTrack = z.infer<typeof TaskTrackEnum>;
export type StrategicGoal = z.infer<typeof StrategicGoalEnum>;
export type Quarter = z.infer<typeof QuarterEnum>;
