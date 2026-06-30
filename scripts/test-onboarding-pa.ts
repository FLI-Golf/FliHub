import PocketBase from 'pocketbase';

const PB_URL = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || '';
const TARGET_EMAIL = (process.env.ONBOARDING_TEST_EMAIL || 'paige@fligolf.com').toLowerCase();

const REQUIRED_DOC_TYPES = [
	'player_information_packet',
	'player_opportunity_packet',
	'integrity_substance_policy',
	'legal_documents',
	'player_contract'
] as const;

const SEED_STAGE_PAYLOADS: Record<string, Record<string, any>> = {
	invited: {
		pipelineStage: 'invited',
		welcomeSeen: false,
		documentsInitialed: false,
		contractSigned: false,
		profileCompleted: false,
		completedAt: null,
	},
	documents_sent: {
		pipelineStage: 'documents_sent',
		welcomeSeen: true,
		documentsInitialed: false,
		contractSigned: false,
		profileCompleted: false,
		completedAt: null,
	},
	documents_signed: {
		pipelineStage: 'documents_signed',
		welcomeSeen: true,
		documentsInitialed: true,
		contractSigned: true,
		profileCompleted: false,
		completedAt: null,
	},
	profile_complete: {
		pipelineStage: 'profile_complete',
		welcomeSeen: true,
		documentsInitialed: true,
		contractSigned: true,
		profileCompleted: true,
		completedAt: null,
	},
	approved: {
		pipelineStage: 'approved',
		welcomeSeen: true,
		documentsInitialed: true,
		contractSigned: true,
		profileCompleted: true,
	},
};

function getArg(name: string): string | undefined {
	const found = process.argv.find((arg) => arg.startsWith(`--${name}=`));
	if (!found) return undefined;
	return found.slice(name.length + 3);
}

function usageAndExit(): never {
	console.log('Usage:');
	console.log('  tsx scripts/test-onboarding-pa.ts stage --stage=documents_sent [--email=paige@fligolf.com]');
	console.log('  tsx scripts/test-onboarding-pa.ts complete [--email=paige@fligolf.com]');
	console.log('  tsx scripts/test-onboarding-pa.ts reset [--email=paige@fligolf.com]');
	process.exit(1);
}

async function resolveTargetUser(pb: PocketBase, email: string): Promise<{ id: string; email: string }> {
	const users = await pb.collection('users').getFullList({
		filter: `email = "${email}"`,
		fields: 'id,email'
	});
	const target = users[0] as any;
	if (!target?.id) {
		throw new Error(`No user found for email: ${email}`);
	}
	return { id: target.id, email: String(target.email ?? email) };
}

async function upsertOnboardingStatus(pb: PocketBase, userId: string, patch: Record<string, any>): Promise<void> {
	const existing = await pb.collection('onboarding_status').getFullList({
		filter: `userId = "${userId}"`
	}).catch(() => []);

	const now = new Date().toISOString();
	const payload = { ...patch, userId, updatedAt: now };
	if (patch.pipelineStage === 'approved' && !payload.completedAt) {
		payload.completedAt = now;
	}

	if (existing.length > 0) {
		await pb.collection('onboarding_status').update((existing[0] as any).id, payload);
		return;
	}

	await pb.collection('onboarding_status').create({
		userId,
		welcomeSeen: false,
		documentsInitialed: false,
		contractSigned: false,
		profileCompleted: false,
		...payload,
	});
}

async function seedRequiredDocuments(pb: PocketBase, userId: string): Promise<void> {
	const existing = await pb.collection('document_signatures').getFullList({
		filter: `userId = "${userId}"`
	}).catch(() => []);
	const byType = new Map(existing.map((doc: any) => [String(doc.documentType ?? ''), doc]));
	const now = new Date().toISOString();

	for (const documentType of REQUIRED_DOC_TYPES) {
		const payload = {
			userId,
			documentType,
			initials: 'PA',
			signatureDataUrl: '',
			agreed: true,
			signedAt: now,
		};

		const current = byType.get(documentType);
		if (current?.id) {
			await pb.collection('document_signatures').update(current.id, payload);
		} else {
			await pb.collection('document_signatures').create(payload);
		}
	}
}

async function upsertFakePlayerProfile(pb: PocketBase, userId: string, email: string): Promise<void> {
	const existing = await pb.collection('player_profiles').getFullList({
		filter: `userId = "${userId}"`
	}).catch(() => []);
	const now = new Date().toISOString();

	const payload = {
		userId,
		fullName: 'Paige Testuser',
		dateOfBirth: '1997-04-18',
		nationality: 'USA',
		countryOfResidence: 'United States',
		primaryLanguages: 'English',
		phone: '(555) 867-5309',
		email,
		mailingAddress: '123 Fairway Drive, Austin, TX 78701',
		emergencyContactName: 'Jordan Testuser',
		emergencyContactRelationship: 'Sibling',
		emergencyContactPhone: '(555) 200-3000',
		emergencyContactEmail: 'jordan.test@example.com',
		worldRanking: 88,
		yearsCompeting: 9,
		majorTournamentWins: '3',
		notableAchievements: '2x regional champion; top-10 national finish',
		otherLeagues: 'State Tour, Charity Open',
		playingStyle: 'Controlled power with aggressive putting',
		strongestSkills: 'Approach shots, pressure putts',
		knownInjuries: 'None',
		broadcastNickname: 'Paige Powerline',
		instagram: '@paigeplays',
		twitter: '@paigeplays',
		youtube: 'youtube.com/@paigeplays',
		otherSocialMedia: 'tiktok.com/@paigeplays',
		personalWebsite: 'https://paigeplays.example.com',
		mediaFeatures: 'Regional sports podcast guest',
		comfortableWithInterviews: true,
		openToBehindScenes: true,
		currentSponsorships: 'Demo sponsor account',
		openToNewSponsors: true,
		wantsLeagueSponsorHelp: true,
		personalBrandingGoals: 'Grow fanbase and secure equipment sponsors',
		hasAgent: true,
		repName: 'Alex Carter',
		repAgency: 'Summit Sports Mgmt',
		repPosition: 'Agent',
		repPhone: '(555) 410-2200',
		repEmail: 'alex.carter@example.com',
		participatedInBetting: false,
		understandsIntegrityPolicy: true,
		priorIntegrityViolations: false,
		integrityViolationDetails: null,
		excitementAboutLeague: 'Excited for team format and fan growth',
		careerGoals: 'Win a major and mentor younger players',
		additionalInfo: 'Auto-seeded onboarding profile for QA testing',
		status: 'submitted',
		submittedAt: now,
	};

	if (existing.length > 0) {
		await pb.collection('player_profiles').update((existing[0] as any).id, payload);
		return;
	}

	await pb.collection('player_profiles').create(payload);
}

async function resetOnboardingData(pb: PocketBase, userId: string): Promise<void> {
	const [statusRows, documentRows, profileRows] = await Promise.all([
		pb.collection('onboarding_status').getFullList({ filter: `userId = "${userId}"` }).catch(() => []),
		pb.collection('document_signatures').getFullList({ filter: `userId = "${userId}"` }).catch(() => []),
		pb.collection('player_profiles').getFullList({ filter: `userId = "${userId}"` }).catch(() => []),
	]);

	for (const row of documentRows as any[]) {
		await pb.collection('document_signatures').delete(row.id).catch(() => {});
	}
	for (const row of profileRows as any[]) {
		await pb.collection('player_profiles').delete(row.id).catch(() => {});
	}
	for (const row of statusRows as any[]) {
		await pb.collection('onboarding_status').delete(row.id).catch(() => {});
	}
}

async function main(): Promise<void> {
	const mode = (process.argv[2] || '').toLowerCase();
	if (!['stage', 'complete', 'reset'].includes(mode)) usageAndExit();

	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		throw new Error('Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD');
	}

	const targetEmail = (getArg('email') || TARGET_EMAIL).toLowerCase();
	const stage = (getArg('stage') || 'documents_sent').toLowerCase();

	const pb = new PocketBase(PB_URL);
	await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

	const target = await resolveTargetUser(pb, targetEmail);

	if (mode === 'stage') {
		const payload = SEED_STAGE_PAYLOADS[stage];
		if (!payload) {
			throw new Error(`Unknown stage: ${stage}`);
		}
		await upsertOnboardingStatus(pb, target.id, payload);
		console.log(`[ok] Seeded stage "${stage}" for ${target.email}`);
		return;
	}

	if (mode === 'complete') {
		await seedRequiredDocuments(pb, target.id);
		await upsertFakePlayerProfile(pb, target.id, target.email);
		await upsertOnboardingStatus(pb, target.id, {
			...SEED_STAGE_PAYLOADS.approved,
			adminNotes: 'Auto-completed via scripts/test-onboarding-pa.ts',
		});
		console.log(`[ok] Completed onboarding for ${target.email}`);
		return;
	}

	await resetOnboardingData(pb, target.id);
	console.log(`[ok] Reset onboarding data for ${target.email}`);
}

main().catch((err) => {
	console.error('[error]', err?.message || err);
	process.exit(1);
});
