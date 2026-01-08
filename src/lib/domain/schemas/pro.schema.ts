import { z } from 'zod';

export const ProStatusEnum = z.enum(['active', 'inactive', 'retired']);
export const ProGenderEnum = z.enum(['male', 'female', 'other']);

export const ProSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Name is required').max(255),
	nickname: z.string().max(100).optional(),
	worldRanking: z.number().min(0).optional(),
	country: z.string().max(100).optional(),
	residence: z.string().max(255).optional(),
	bio: z.string().optional(),
	photo: z.string().url().optional(),
	sponsoredBy: z.string().max(255).optional(),
	dateOfBirth: z.date().optional(),
	height: z.string().max(50).optional(),
	weight: z.string().max(50).optional(),
	yearTurnedPro: z.number().min(1900).max(2100).optional(),
	primarySponsor: z.string().max(255).optional(),
	favoriteDisc: z.string().max(255).optional(),
	signatureMove: z.string().max(500).optional(),
	careerHighlights: z.string().optional(),
	tournamentsPlayed: z.number().min(0).optional(),
	notableRecords: z.string().optional(),
	education: z.string().max(500).optional(),
	otherSports: z.string().max(500).optional(),
	hobbies: z.string().max(500).optional(),
	favoriteDestination: z.string().max(255).optional(),
	personalMotivation: z.string().optional(),
	website: z.string().url().optional(),
	tiktok: z.string().max(255).optional(),
	twitch: z.string().max(255).optional(),
	videoHighlightsLinks: z.string().optional(),
	injuryHistory: z.string().optional(),
	fitnessRegimen: z.string().optional(),
	dietaryPreferences: z.string().max(500).optional(),
	longTermGoals: z.string().optional(),
	missionStatement: z.string().optional(),
	primaryAirport: z.string().max(100).optional(),
	secondaryAirport: z.string().max(100).optional(),
	frequentFlyerNumbers: z.string().max(500).optional(),
	signedContract: z.any().optional(),
	status: ProStatusEnum,
	gender: ProGenderEnum.optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type ProInput = z.infer<typeof ProSchema>;
export type ProStatus = z.infer<typeof ProStatusEnum>;
export type ProGender = z.infer<typeof ProGenderEnum>;

export const STATUS_LABELS: Record<ProStatus, string> = {
	active: 'Active',
	inactive: 'Inactive',
	retired: 'Retired'
};
