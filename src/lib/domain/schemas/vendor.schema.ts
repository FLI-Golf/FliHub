import { z } from 'zod';

export const VendorSchema = z.object({
	id: z.string().optional(),
	active: z.boolean().default(true),
	name: z.string().optional(),
	contact_email: z.string().email().optional().or(z.literal('')),
	contact_phone: z.string().optional(),
	website: z.string().url().optional().or(z.literal('')),
	logo: z.string().optional(),
	image_extra: z.array(z.string()).optional(),
	about: z.string().optional(),
	open_invoices_total: z.number().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type VendorInput = z.infer<typeof VendorSchema>;
