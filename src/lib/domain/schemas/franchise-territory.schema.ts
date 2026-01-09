import { z } from 'zod';

export const TerritoryStatusEnum = z.enum([
	'available',
	'reserved',
	'sold',
	'unavailable'
]);

export const FranchiseTerritorySchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Territory name is required').max(255),
	code: z.string().min(1).max(10).optional(), // e.g., "TX-DAL", "CA-LA"
	description: z.string().optional(),
	state: z.string().optional(),
	city: z.string().optional(),
	region: z.string().optional(),
	population: z.number().min(0).optional(),
	marketSize: z.string().optional(),
	status: TerritoryStatusEnum,
	price: z.number().min(0).default(10000000), // $10M default
	dealId: z.string().optional(), // Link to franchise_deal if sold
	reservedUntil: z.date().optional(),
	notes: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type FranchiseTerritoryInput = z.infer<typeof FranchiseTerritorySchema>;
export type TerritoryStatus = z.infer<typeof TerritoryStatusEnum>;
