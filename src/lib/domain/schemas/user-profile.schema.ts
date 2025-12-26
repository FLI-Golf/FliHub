import { z } from 'zod';

export const UserRoleEnum = z.enum(['leader', 'admin', 'vendor', 'pro', 'franchise_owner']);
export const UserStatusEnum = z.enum(['active', 'inactive', 'pending']);

export const UserProfileSchema = z.object({
	id: z.string().optional(),
	userId: z.string().min(1, 'User ID is required'),
	role: UserRoleEnum,
	firstName: z.string().min(1, 'First name is required').max(255),
	lastName: z.string().min(1, 'Last name is required').max(255),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	organization: z.string().optional(),
	bio: z.string().optional(),
	avatar: z.string().url().optional(),
	status: UserStatusEnum,
	created: z.date().optional(),
	updated: z.date().optional()
});

export type UserProfileInput = z.infer<typeof UserProfileSchema>;
export type UserRole = z.infer<typeof UserRoleEnum>;
export type UserStatus = z.infer<typeof UserStatusEnum>;

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
	leader: 'Full access to all features and settings',
	admin: 'Manage users, projects, and business operations',
	vendor: 'Access to vendor-specific features and contracts',
	pro: 'Professional player access to tournaments and events',
	franchise_owner: 'Manage franchise locations and operations'
};

export const ROLE_LABELS: Record<UserRole, string> = {
	leader: 'Leader',
	admin: 'Administrator',
	vendor: 'Vendor',
	pro: 'Professional',
	franchise_owner: 'Franchise Owner'
};
