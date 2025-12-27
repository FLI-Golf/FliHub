import { z } from 'zod';

export const ApprovalEntityTypeEnum = z.enum(['project', 'expense', 'budget']);

export const ApprovalStatusEnum = z.enum(['pending', 'approved', 'rejected', 'revision_requested']);

export const ApprovalSchema = z.object({
	id: z.string().optional(),
	entityType: ApprovalEntityTypeEnum,
	entityId: z.string().min(1, 'Entity ID is required').max(255),
	status: ApprovalStatusEnum,
	requestedBy: z.string().min(1, 'Requested by is required'),
	approver: z.string().optional(),
	requestedDate: z.date(),
	reviewedDate: z.date().optional(),
	comments: z.string().optional(),
	amount: z.number().nonnegative().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type ApprovalInput = z.infer<typeof ApprovalSchema>;
export type ApprovalEntityType = z.infer<typeof ApprovalEntityTypeEnum>;
export type ApprovalStatus = z.infer<typeof ApprovalStatusEnum>;
