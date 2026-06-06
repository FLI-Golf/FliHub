import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-production-6ab5.up.railway.app');

async function addMediaAiTranscripts() {
	try {
		await pb.admins.authWithPassword('ddinsmore8@gmail.com', 'MADcap(123)');
		console.log('✅ Connected to PocketBase\n');

		const existing = await pb.collections.getFullList();
		const mediaAiTranscripts = existing.find((collection) => collection.name === 'media_ai_transcripts');

		const schema = [
			{ name: 'title', type: 'text', required: true, presentable: false, options: { min: 1, max: 255, pattern: '' } },
			{ name: 'sourceAsset', type: 'relation', required: false, presentable: false, options: { collectionId: 'media_assets', maxSelect: 1, cascadeDelete: false } },
			{ name: 'transcriptType', type: 'select', required: true, presentable: false, options: { maxSelect: 1, values: ['metadata_suggestion', 'clip_summarization', 'transcript_extractions', 'scene_detection', 'logo_recognition', 'player_recognition'] } },
			{ name: 'status', type: 'select', required: true, presentable: false, options: { maxSelect: 1, values: ['pending', 'reviewed', 'approved', 'rejected'] } },
			{ name: 'transcriptText', type: 'editor', required: false, presentable: false, options: { convertUrls: false } },
			{ name: 'summary', type: 'editor', required: false, presentable: false, options: { convertUrls: false } },
			{ name: 'tags', type: 'text', required: false, presentable: false, options: { min: null, max: null, pattern: '' } },
			{ name: 'language', type: 'text', required: false, presentable: false, options: { min: null, max: null, pattern: '' } },
			{ name: 'durationSeconds', type: 'number', required: false, presentable: false, options: { min: 0, max: null, noDecimal: true } },
			{ name: 'speakerCount', type: 'number', required: false, presentable: false, options: { min: 0, max: null, noDecimal: true } },
			{ name: 'confidence', type: 'number', required: false, presentable: false, options: { min: 0, max: 1, noDecimal: false } },
			{ name: 'estimatedRevenue', type: 'number', required: false, presentable: false, options: { min: 0, max: null, noDecimal: false } },
			{ name: 'downloadCount', type: 'number', required: false, presentable: false, options: { min: 0, max: null, noDecimal: true } },
			{ name: 'requestCount', type: 'number', required: false, presentable: false, options: { min: 0, max: null, noDecimal: true } },
			{ name: 'approvedBy', type: 'text', required: false, presentable: false, options: { min: null, max: null, pattern: '' } },
			{ name: 'approvedAt', type: 'date', required: false, presentable: false, options: { min: '', max: '' } },
			{ name: 'reviewNotes', type: 'editor', required: false, presentable: false, options: { convertUrls: false } },
			{ name: 'createdBy', type: 'text', required: false, presentable: false, options: { min: null, max: null, pattern: '' } },
		];

		const collectionDefinition = {
			name: 'media_ai_transcripts',
			type: 'base',
			schema,
			indexes: [
				'CREATE INDEX idx_media_ai_transcripts_status ON media_ai_transcripts (status)',
				'CREATE INDEX idx_media_ai_transcripts_type ON media_ai_transcripts (transcriptType)',
				'CREATE INDEX idx_media_ai_transcripts_source_asset ON media_ai_transcripts (sourceAsset)'
			],
			listRule: '@request.auth.id != ""',
			viewRule: '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.id != ""',
			deleteRule: '@request.auth.id != ""'
		};

		if (mediaAiTranscripts) {
			await pb.collections.update(mediaAiTranscripts.id, collectionDefinition as any);
			console.log('✅ Updated media_ai_transcripts\n');
		} else {
			await pb.collections.create(collectionDefinition as any);
			console.log('✅ Created media_ai_transcripts\n');
		}
	} catch (error: any) {
		console.error('❌ Failed to add media_ai_transcripts:', error.message);
		if (error.data) console.error(JSON.stringify(error.data, null, 2));
	}
}

addMediaAiTranscripts();