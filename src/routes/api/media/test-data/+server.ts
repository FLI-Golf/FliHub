import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const TRANSCRIPT_TEST_SOURCES = new Set([
	'seed-engine',
	'smoke-rest',
	'process-endpoint-smoke',
	'one-shot',
]);

const TEST_TERMS = [
	'test',
	'seed',
	'smoke',
	'phase 5',
	'phase 6',
	'phase 7',
	'one-shot',
	'process-endpoint-smoke',
	'seed-engine',
	'created from phase 5 package manager',
];

function normalize(value: unknown): string {
	return String(value ?? '').trim().toLowerCase();
}

function includesTestTerm(value: unknown): boolean {
	const normalized = normalize(value);
	if (!normalized) return false;
	return TEST_TERMS.some((term) => normalized.includes(term));
}

function isTestTranscript(record: any): boolean {
	return (
		TRANSCRIPT_TEST_SOURCES.has(normalize(record.source)) ||
		includesTestTerm(record.title) ||
		includesTestTerm(record.summary) ||
		includesTestTerm(record.tags) ||
		includesTestTerm(record.reviewNotes)
	);
}

function isTestPackageRecord(record: any): boolean {
	if (normalize(record.contentType) !== 'highlight') return false;

	return (
		includesTestTerm(record.title) ||
		includesTestTerm(record.description) ||
		includesTestTerm(record.notes)
	);
}

async function deleteRecords(pb: any, collection: string, records: any[]) {
	const deletions = await Promise.allSettled(
		records.map((record) => pb.collection(collection).delete(record.id))
	);

	const deleted = deletions.filter((result) => result.status === 'fulfilled').length;
	const failed = deletions.length - deleted;

	return { deleted, failed };
}

export const DELETE: RequestHandler = async ({ locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const [transcripts, packages] = await Promise.all([
			pb.collection('media_ai_transcripts').getFullList({ sort: '-created' }).catch(() => []),
			pb.collection('content_production').getFullList({ sort: '-created' }).catch(() => []),
		]);

		const transcriptCandidates = (transcripts as any[]).filter(isTestTranscript);
		const packageCandidates = (packages as any[]).filter(isTestPackageRecord);

		const [transcriptResult, packageResult] = await Promise.all([
			deleteRecords(pb, 'media_ai_transcripts', transcriptCandidates),
			deleteRecords(pb, 'content_production', packageCandidates),
		]);

		return json({
			deletedTotal: transcriptResult.deleted + packageResult.deleted,
			failedTotal: transcriptResult.failed + packageResult.failed,
			transcripts: {
				candidates: transcriptCandidates.length,
				deleted: transcriptResult.deleted,
				failed: transcriptResult.failed,
			},
			packages: {
				candidates: packageCandidates.length,
				deleted: packageResult.deleted,
				failed: packageResult.failed,
			},
		});
	} catch (error) {
		console.error('Failed to clear media test data:', error);
		return json({ message: 'Failed to clear media test data', error: String(error) }, { status: 500 });
	}
};
