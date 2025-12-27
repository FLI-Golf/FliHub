import { z } from 'zod';

export const UserSchema = z.object({
	id: z.string().optional(),
	email: z.string().email('Valid email is required'),
	emailVisibility: z.boolean().default(false),
	verified: z.boolean().default(false),
	created: z.date().optional(),
	updated: z.date().optional()
});

export const UserRegistrationSchema = z.object({
	email: z.string().email('Valid email is required'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	passwordConfirm: z.string().min(8, 'Password confirmation is required')
}).refine((data) => data.password === data.passwordConfirm, {
	message: "Passwords don't match",
	path: ["passwordConfirm"]
});

export const UserLoginSchema = z.object({
	email: z.string().email('Valid email is required'),
	password: z.string().min(1, 'Password is required')
});

export type UserInput = z.infer<typeof UserSchema>;
export type UserRegistrationInput = z.infer<typeof UserRegistrationSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
