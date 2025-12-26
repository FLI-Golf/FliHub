import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pocketbase-production-6ab5.up.railway.app/';
const POCKETBASE_ADMIN_EMAIL = 'ddinsmore8@gmail.com';
const POCKETBASE_ADMIN_PASSWORD = 'MADcap(123)';

const pb = new PocketBase(POCKETBASE_URL);

async function updateTasksSchema() {
	try {
		await pb.admins.authWithPassword(
			POCKETBASE_ADMIN_EMAIL,
			POCKETBASE_ADMIN_PASSWORD
		);
		console.log('✅ Authenticated as admin\n');

		// Get current tasks collection
		const collection = await pb.collections.getOne('tasks_collection');
		console.log('📋 Current tasks collection found\n');
		
		// Get existing schema or initialize empty array
		const existingSchema = collection.schema || collection.fields || [];
		console.log(`📊 Found ${existingSchema.length} existing fields\n`);

		// Add new fields to schema
		const newFields = [
			{
				id: 'fiscalYear_' + Date.now(),
				name: 'fiscalYear',
				type: 'number',
				required: true,
				min: 2024,
				max: 2030,
				system: false,
				hidden: false,
				presentable: false
			},
			{
				id: 'isForecast_' + Date.now(),
				name: 'isForecast',
				type: 'bool',
				required: true,
				system: false,
				hidden: false,
				presentable: false
			},
			{
				id: 'forecastConfidence_' + Date.now(),
				name: 'forecastConfidence',
				type: 'select',
				required: false,
				maxSelect: 1,
				values: ['Low', 'Medium', 'High'],
				system: false,
				hidden: false,
				presentable: false
			},
			{
				id: 'baselineTaskId_' + Date.now(),
				name: 'baselineTaskId',
				type: 'text',
				required: false,
				max: 255,
				system: false,
				hidden: false,
				presentable: false
			},
			{
				id: 'actualBudget_' + Date.now(),
				name: 'actualBudget',
				type: 'number',
				required: false,
				system: false,
				hidden: false,
				presentable: false
			},
			{
				id: 'actualIncome_' + Date.now(),
				name: 'actualIncome',
				type: 'number',
				required: false,
				system: false,
				hidden: false,
				presentable: false
			},
			{
				id: 'variance_' + Date.now(),
				name: 'variance',
				type: 'number',
				required: false,
				system: false,
				hidden: false,
				presentable: false
			},
			{
				id: 'completionPercentage_' + Date.now(),
				name: 'completionPercentage',
				type: 'number',
				required: false,
				min: 0,
				max: 100,
				system: false,
				hidden: false,
				presentable: false
			},
			{
				id: 'notes_' + Date.now(),
				name: 'notes',
				type: 'editor',
				required: false,
				convertURLs: false,
				maxSize: 0,
				system: false,
				hidden: false,
				presentable: false
			}
		];

		// Update track field to include Phase 3
		const trackField = existingSchema.find(f => f.name === 'track');
		if (trackField && trackField.type === 'select') {
			if (!trackField.values.includes('Phase 3')) {
				trackField.values.push('Phase 3');
				console.log('✅ Added "Phase 3" to track field values');
			}
		}

		// Combine existing fields with new fields
		const updatedSchema = [...existingSchema, ...newFields];

		// Update the collection
		await pb.collections.update('tasks_collection', {
			schema: updatedSchema
		});

		console.log('✅ Tasks collection schema updated successfully!\n');
		console.log('📊 Added 9 new fields:');
		console.log('   - fiscalYear (number, required)');
		console.log('   - isForecast (bool, required)');
		console.log('   - forecastConfidence (select: Low/Medium/High)');
		console.log('   - baselineTaskId (text)');
		console.log('   - actualBudget (number)');
		console.log('   - actualIncome (number)');
		console.log('   - variance (number)');
		console.log('   - completionPercentage (number, 0-100)');
		console.log('   - notes (editor)');
		console.log('\n✅ Updated track field to include "Phase 3"');

	} catch (error) {
		console.error('❌ Error:', error.message);
		if (error.response) {
			console.error('Response:', JSON.stringify(error.response, null, 2));
		}
	}
}

updateTasksSchema();
