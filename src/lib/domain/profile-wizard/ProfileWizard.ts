export type WizardFieldType = 'text' | 'textarea' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'hidden';

export type WizardFieldOption = {
	value: string;
	label: string;
};

export type WizardField = {
	key: string;
	label: string;
	type: WizardFieldType;
	placeholder?: string;
	helpText?: string;
	required?: boolean;
	readOnly?: boolean;
	rows?: number;
	min?: number;
	max?: number;
	step?: number;
	options?: WizardFieldOption[];
};

export type WizardStep = {
	id: string;
	title: string;
	description?: string;
	fields: WizardField[];
};

export type WizardHeader = {
	title: string;
	subtitle?: string;
};

export type WizardData = {
	role: string;
	profile: any;
	roleExtra: Record<string, any>;
	proTalent: any;
	proTalentMeta: {
		linked: boolean;
		matchedByEmail: boolean;
	};
};

export abstract class ProfileWizardAdapter {
	abstract readonly role: string;

	abstract getHeader(data: WizardData): WizardHeader;
	abstract getSteps(data: WizardData): WizardStep[];
	abstract getInitialValues(data: WizardData): Record<string, string>;

	validateStep(step: WizardStep, values: Record<string, string>): string | null {
		for (const field of step.fields) {
			if (!field.required || field.readOnly || field.type === 'hidden') continue;
			const value = (values[field.key] ?? '').trim();
			if (!value) return `${field.label} is required.`;
		}
		return null;
	}

	protected text(v: unknown): string {
		if (v === null || v === undefined) return '';
		return String(v);
	}
}

class GenericRoleProfileWizard extends ProfileWizardAdapter {
	readonly role: string;

	constructor(role: string) {
		super();
		this.role = role;
	}

	getHeader(data: WizardData): WizardHeader {
		return {
			title: 'My Profile',
			subtitle: `Complete your ${data.role.replace('_', ' ')} profile`,
		};
	}

	getSteps(data: WizardData): WizardStep[] {
		const roleSpecific: Record<string, WizardField[]> = {
			leader: [
				{ key: 'departmentName', label: 'Assigned Department', type: 'text', readOnly: true, helpText: 'Managed by admin.' },
			],
			vendor: [
				{ key: 'vendorName', label: 'Vendor Name', type: 'text', readOnly: true, helpText: 'Managed by admin.' },
			],
			broadcaster: [
				{ key: 'broadcasterReference', label: 'Broadcaster Reference', type: 'text', placeholder: 'Network or station reference' },
				{ key: 'organization', label: 'Organization', type: 'text', placeholder: 'Broadcast organization' },
			],
			franchise_owner: [
				{ key: 'organization', label: 'Franchise Organization', type: 'text', placeholder: 'Franchise name' },
			],
			sales: [
				{ key: 'organization', label: 'Sales Region / Team', type: 'text', placeholder: 'Region or business unit' },
			],
			manager: [
				{ key: 'organization', label: 'Agency / Organization', type: 'text', placeholder: 'Management organization' },
			],
			league_owner: [
				{ key: 'organization', label: 'League Organization', type: 'text', placeholder: 'League office name' },
			],
			marketing: [
				{ key: 'organization', label: 'Marketing Organization', type: 'text', placeholder: 'Department / agency' },
			],
			marketing_lead: [
				{ key: 'organization', label: 'Marketing Organization', type: 'text', placeholder: 'Department / agency' },
			],
		};

		return [
			{
				id: 'basic',
				title: 'Basic Information',
				description: 'Update your core profile details.',
				fields: [
					{ key: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'First name' },
					{ key: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Last name' },
					{ key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
					{ key: 'organization', label: 'Organization', type: 'text', placeholder: 'Organization' },
					{ key: 'bio', label: 'Bio', type: 'textarea', rows: 4, placeholder: 'Tell us about yourself' },
					...(roleSpecific[data.role] ?? []),
				],
			},
		];
	}

	getInitialValues(data: WizardData): Record<string, string> {
		const profile = data.profile ?? {};
		return {
			firstName: this.text(profile.firstName),
			lastName: this.text(profile.lastName),
			phone: this.text(profile.phone),
			organization: this.text(profile.organization),
			bio: this.text(profile.bio),
			departmentName: this.text(data.roleExtra?.departmentName),
			vendorName: this.text(data.roleExtra?.vendorName),
			broadcasterReference: this.text(profile.broadcasterReference || profile.expand?.broadcasterReference?.id),
		};
	}
}

class ProProfileWizard extends ProfileWizardAdapter {
	readonly role = 'pro';

	getHeader(): WizardHeader {
		return {
			title: 'Pro Profile Wizard',
			subtitle: 'Complete your player profile in guided steps.',
		};
	}

	getSteps(): WizardStep[] {
		return [
			{
				id: 'identity',
				title: 'Identity',
				description: 'Personal basics and public profile.',
				fields: [
					{ key: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'First name' },
					{ key: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Last name' },
					{ key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
					{ key: 'bio', label: 'Bio', type: 'textarea', rows: 4, placeholder: 'Short player bio' },
					{ key: 'talentId', label: 'Talent ID', type: 'hidden' },
					{ key: 'talentReference', label: 'Talent Reference', type: 'hidden' },
				],
			},
			{
				id: 'player-basics',
				title: 'Player Basics',
				description: 'Core player details and competitive info.',
				fields: [
					{ key: 'name', label: 'Display Name', type: 'text', required: true, placeholder: 'Full player name' },
					{ key: 'nickname', label: 'Nickname', type: 'text', placeholder: 'Nickname' },
					{
						key: 'talentStatus',
						label: 'Player Status',
						type: 'select',
						required: true,
						options: [
							{ value: 'active', label: 'Active' },
							{ value: 'primary_pro', label: 'Primary Pro' },
							{ value: 'reserve_pro', label: 'Reserve Pro' },
							{ value: 'inactive', label: 'Inactive' },
						],
					},
					{ key: 'country', label: 'Country', type: 'text', placeholder: 'Country' },
					{ key: 'residence', label: 'Residence', type: 'text', placeholder: 'City, State' },
					{ key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
					{ key: 'worldRanking', label: 'World Ranking', type: 'number', min: 1, step: 1 },
					{ key: 'yearTurnedPro', label: 'Year Turned Pro', type: 'number', min: 1970, step: 1 },
				],
			},
			{
				id: 'brand',
				title: 'Brand & Media',
				description: 'Sponsors and media footprint.',
				fields: [
					{ key: 'sponsoredBy', label: 'Sponsored By', type: 'text', placeholder: 'Main sponsors' },
					{ key: 'primarySponsor', label: 'Primary Sponsor', type: 'text', placeholder: 'Primary sponsor' },
					{ key: 'website', label: 'Website', type: 'text', placeholder: 'https://...' },
					{ key: 'tiktok', label: 'TikTok', type: 'text', placeholder: '@handle' },
					{ key: 'twitch', label: 'Twitch', type: 'text', placeholder: 'channel' },
					{ key: 'careerHighlights', label: 'Career Highlights', type: 'textarea', rows: 3, placeholder: 'Highlights' },
					{ key: 'notableRecords', label: 'Notable Records', type: 'textarea', rows: 3, placeholder: 'Records and milestones' },
				],
			},
			{
				id: 'ops',
				title: 'Operations',
				description: 'Manager and travel details.',
				fields: [
					{ key: 'managerName', label: 'Manager Name', type: 'text', placeholder: 'Manager full name' },
					{ key: 'managerEmail', label: 'Manager Email', type: 'email', placeholder: 'manager@agency.com' },
					{ key: 'managerCutPercentage', label: 'Manager Cut %', type: 'number', min: 0, max: 100, step: 0.1 },
					{ key: 'primaryAirport', label: 'Primary Airport', type: 'text', placeholder: 'Home airport code' },
					{ key: 'secondaryAirport', label: 'Secondary Airport', type: 'text', placeholder: 'Backup airport code' },
					{ key: 'frequentFlyerNumbers', label: 'Frequent Flyer Numbers', type: 'textarea', rows: 2, placeholder: 'Airline and number list' },
					{ key: 'longTermGoals', label: 'Long-term Goals', type: 'textarea', rows: 3, placeholder: 'Career goals' },
					{ key: 'missionStatement', label: 'Mission Statement', type: 'textarea', rows: 3, placeholder: 'Personal mission statement' },
				],
			},
		];
	}

	getInitialValues(data: WizardData): Record<string, string> {
		const profile = data.profile ?? {};
		const talent = data.proTalent ?? {};
		const linkedTalentId = String(talent.id || profile.talentReference || profile.expand?.talentReference?.id || '');

		return {
			firstName: this.text(profile.firstName),
			lastName: this.text(profile.lastName),
			phone: this.text(profile.phone),
			bio: this.text(profile.bio || talent.bio),
			talentId: linkedTalentId,
			talentReference: linkedTalentId,
			name: this.text(talent.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim()),
			nickname: this.text(talent.nickname),
			talentStatus: this.text(talent.status || 'active'),
			country: this.text(talent.country),
			residence: this.text(talent.residence),
			dateOfBirth: this.text(talent.dateOfBirth ? String(talent.dateOfBirth).split('T')[0] : ''),
			worldRanking: this.text(talent.worldRanking),
			yearTurnedPro: this.text(talent.yearTurnedPro),
			sponsoredBy: this.text(talent.sponsoredBy),
			primarySponsor: this.text(talent.primarySponsor),
			website: this.text(talent.website),
			tiktok: this.text(talent.tiktok),
			twitch: this.text(talent.twitch),
			careerHighlights: this.text(talent.careerHighlights),
			notableRecords: this.text(talent.notableRecords),
			managerName: this.text(talent.managerName),
			managerEmail: this.text(talent.managerEmail),
			managerCutPercentage: this.text(talent.managerCutPercentage ?? 0),
			primaryAirport: this.text(talent.primaryAirport),
			secondaryAirport: this.text(talent.secondaryAirport),
			frequentFlyerNumbers: this.text(talent.frequentFlyerNumbers),
			longTermGoals: this.text(talent.longTermGoals),
			missionStatement: this.text(talent.missionStatement),
		};
	}
}

export function getProfileWizard(role: string | null | undefined): ProfileWizardAdapter {
	if (role === 'pro') return new ProProfileWizard();
	return new GenericRoleProfileWizard(role ?? 'leader');
}
