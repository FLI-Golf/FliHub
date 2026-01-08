import type { ProInput, ProStatus } from '../schemas/pro.schema';

/**
 * Pro Entity - Represents a professional disc golf player
 */
export class Pro {
	id?: string;
	name: string;
	nickname?: string;
	worldRanking?: number;
	country?: string;
	residence?: string;
	bio?: string;
	photo?: string;
	sponsoredBy?: string;
	dateOfBirth?: Date;
	height?: string;
	weight?: string;
	yearTurnedPro?: number;
	primarySponsor?: string;
	favoriteDisc?: string;
	signatureMove?: string;
	careerHighlights?: string;
	tournamentsPlayed?: number;
	notableRecords?: string;
	education?: string;
	otherSports?: string;
	hobbies?: string;
	favoriteDestination?: string;
	personalMotivation?: string;
	website?: string;
	tiktok?: string;
	twitch?: string;
	videoHighlightsLinks?: string;
	injuryHistory?: string;
	fitnessRegimen?: string;
	dietaryPreferences?: string;
	longTermGoals?: string;
	missionStatement?: string;
	primaryAirport?: string;
	secondaryAirport?: string;
	frequentFlyerNumbers?: string;
	signedContract?: any;
	status: ProStatus;
	gender?: 'male' | 'female' | 'other';
	created?: Date;
	updated?: Date;

	constructor(data: ProInput) {
		this.id = data.id;
		this.name = data.name;
		this.nickname = data.nickname;
		this.worldRanking = data.worldRanking;
		this.country = data.country;
		this.residence = data.residence;
		this.bio = data.bio;
		this.photo = data.photo;
		this.sponsoredBy = data.sponsoredBy;
		this.dateOfBirth = data.dateOfBirth;
		this.height = data.height;
		this.weight = data.weight;
		this.yearTurnedPro = data.yearTurnedPro;
		this.primarySponsor = data.primarySponsor;
		this.favoriteDisc = data.favoriteDisc;
		this.signatureMove = data.signatureMove;
		this.careerHighlights = data.careerHighlights;
		this.tournamentsPlayed = data.tournamentsPlayed;
		this.notableRecords = data.notableRecords;
		this.education = data.education;
		this.otherSports = data.otherSports;
		this.hobbies = data.hobbies;
		this.favoriteDestination = data.favoriteDestination;
		this.personalMotivation = data.personalMotivation;
		this.website = data.website;
		this.tiktok = data.tiktok;
		this.twitch = data.twitch;
		this.videoHighlightsLinks = data.videoHighlightsLinks;
		this.injuryHistory = data.injuryHistory;
		this.fitnessRegimen = data.fitnessRegimen;
		this.dietaryPreferences = data.dietaryPreferences;
		this.longTermGoals = data.longTermGoals;
		this.missionStatement = data.missionStatement;
		this.primaryAirport = data.primaryAirport;
		this.secondaryAirport = data.secondaryAirport;
		this.frequentFlyerNumbers = data.frequentFlyerNumbers;
		this.signedContract = data.signedContract;
		this.status = data.status;
		this.gender = data.gender;
		this.created = data.created;
		this.updated = data.updated;
	}

	/**
	 * Create Pro instance from JSON data
	 */
	static fromJSON(data: any): Pro {
		return new Pro({
			...data,
			dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
			created: data.created ? new Date(data.created) : undefined,
			updated: data.updated ? new Date(data.updated) : undefined
		});
	}

	/**
	 * Convert Pro to JSON
	 */
	toJSON(): Record<string, any> {
		return {
			id: this.id,
			name: this.name,
			nickname: this.nickname,
			worldRanking: this.worldRanking,
			country: this.country,
			residence: this.residence,
			bio: this.bio,
			photo: this.photo,
			sponsoredBy: this.sponsoredBy,
			dateOfBirth: this.dateOfBirth?.toISOString(),
			height: this.height,
			weight: this.weight,
			yearTurnedPro: this.yearTurnedPro,
			primarySponsor: this.primarySponsor,
			favoriteDisc: this.favoriteDisc,
			signatureMove: this.signatureMove,
			careerHighlights: this.careerHighlights,
			tournamentsPlayed: this.tournamentsPlayed,
			notableRecords: this.notableRecords,
			education: this.education,
			otherSports: this.otherSports,
			hobbies: this.hobbies,
			favoriteDestination: this.favoriteDestination,
			personalMotivation: this.personalMotivation,
			website: this.website,
			tiktok: this.tiktok,
			twitch: this.twitch,
			videoHighlightsLinks: this.videoHighlightsLinks,
			injuryHistory: this.injuryHistory,
			fitnessRegimen: this.fitnessRegimen,
			dietaryPreferences: this.dietaryPreferences,
			longTermGoals: this.longTermGoals,
			missionStatement: this.missionStatement,
			primaryAirport: this.primaryAirport,
			secondaryAirport: this.secondaryAirport,
			frequentFlyerNumbers: this.frequentFlyerNumbers,
			signedContract: this.signedContract,
			status: this.status,
			gender: this.gender,
			created: this.created?.toISOString(),
			updated: this.updated?.toISOString()
		};
	}

	/**
	 * Get display name (nickname if available, otherwise name)
	 */
	getDisplayName(): string {
		return this.nickname || this.name;
	}

	/**
	 * Check if pro is active
	 */
	isActive(): boolean {
		return this.status === 'active';
	}

	/**
	 * Get age from date of birth
	 */
	getAge(): number | null {
		if (!this.dateOfBirth) return null;
		const today = new Date();
		const birthDate = new Date(this.dateOfBirth);
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	}

	/**
	 * Get years as professional
	 */
	getYearsAsPro(): number | null {
		if (!this.yearTurnedPro) return null;
		return new Date().getFullYear() - this.yearTurnedPro;
	}

	/**
	 * Check if pro has signed contract
	 */
	hasSignedContract(): boolean {
		return !!this.signedContract;
	}
}
