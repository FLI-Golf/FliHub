import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create franchises collection for FLI Golf franchise system
 * Designed for 3-year sales timeline with income tracking
 */
async function createFranchisesCollection() {
	let url = process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app';
	url = url.replace(/\/$/, '');
	
	const pb = new PocketBase(url);

	try {
		const email = process.env.POCKETBASE_ADMIN_EMAIL;
		const password = process.env.POCKETBASE_ADMIN_PASSWORD;
		
		if (!email || !password) {
			throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in .env file');
		}
		
		console.log(`🔐 Authenticating to ${url}...`);
		await pb.admins.authWithPassword(email, password);
		console.log('✅ Authenticated\n');

		// Check if collection already exists
		const collections = await pb.collections.getFullList();
		const existingFranchise = collections.find(c => c.name === 'franchises');
		
		if (existingFranchise) {
			console.log('⚠️  Franchises collection already exists!');
			console.log(`   ID: ${existingFranchise.id}`);
			return;
		}

		console.log('📋 Creating franchises collection...\n');

		const franchiseCollection = await pb.collections.create({
			name: 'franchises',
			type: 'base',
			listRule: '@request.auth.id != ""',
			viewRule: '@request.auth.id != ""',
			createRule: '@request.auth.role = "admin"',
			updateRule: '@request.auth.role = "admin"',
			deleteRule: '@request.auth.role = "admin"',
			fields: [
				// Basic Information
				{
					name: 'name',
					type: 'text',
					required: true,
					min: 1,
					max: 100,
					presentable: true
				},
				{
					name: 'slug',
					type: 'text',
					required: true,
					min: 1,
					max: 50,
					pattern: '^[a-z0-9-]+$'
				},
				{
					name: 'tagline',
					type: 'text',
					required: false,
					max: 200
				},
				{
					name: 'description',
					type: 'editor',
					required: false,
					maxSize: 0
				},
				
				// Branding
				{
					name: 'logo',
					type: 'file',
					required: false,
					maxSelect: 1,
					maxSize: 5242880, // 5MB
					mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
				},
				{
					name: 'primaryColor',
					type: 'text',
					required: false,
					max: 7,
					pattern: '^#[0-9A-Fa-f]{6}$'
				},
				{
					name: 'secondaryColor',
					type: 'text',
					required: false,
					max: 7,
					pattern: '^#[0-9A-Fa-f]{6}$'
				},
				
				// Team Roster (Relations to pros)
				{
					name: 'malePro',
					type: 'relation',
					required: false,
					collectionId: 'pbc_292221920', // pros collection
					maxSelect: 1,
					cascadeDelete: false
				},
				{
					name: 'femalePro',
					type: 'relation',
					required: false,
					collectionId: 'pbc_292221920', // pros collection
					maxSelect: 1,
					cascadeDelete: false
				},
				{
					name: 'additionalPros',
					type: 'relation',
					required: false,
					collectionId: 'pbc_292221920', // pros collection
					maxSelect: 10,
					cascadeDelete: false
				},
				
				// Sales & Financial Information
				{
					name: 'status',
					type: 'select',
					required: true,
					maxSelect: 1,
					values: [
						'available',
						'reserved',
						'in_negotiation',
						'sold',
						'active',
						'suspended',
						'terminated'
					]
				},
				{
					name: 'franchiseFee',
					type: 'number',
					required: false,
					min: 0
				},
				{
					name: 'royaltyPercentage',
					type: 'number',
					required: false,
					min: 0,
					max: 100
				},
				{
					name: 'marketingFeePercentage',
					type: 'number',
					required: false,
					min: 0,
					max: 100
				},
				{
					name: 'estimatedRevenue',
					type: 'number',
					required: false,
					min: 0
				},
				{
					name: 'targetSaleDate',
					type: 'date',
					required: false
				},
				
				// Territory & Market
				{
					name: 'territory',
					type: 'text',
					required: false,
					max: 200
				},
				{
					name: 'primaryMarket',
					type: 'text',
					required: false,
					max: 100
				},
				{
					name: 'targetDemographic',
					type: 'text',
					required: false,
					max: 500
				},
				
				// Franchisee Information
				{
					name: 'franchiseeId',
					type: 'relation',
					required: false,
					collectionId: '_pb_users_auth_', // users collection
					maxSelect: 1,
					cascadeDelete: false
				},
				{
					name: 'franchiseeName',
					type: 'text',
					required: false,
					max: 200
				},
				{
					name: 'franchiseeEmail',
					type: 'email',
					required: false
				},
				{
					name: 'franchiseePhone',
					type: 'text',
					required: false,
					max: 20
				},
				{
					name: 'franchiseeCompany',
					type: 'text',
					required: false,
					max: 200
				},
				
				// Contract & Legal
				{
					name: 'contractStartDate',
					type: 'date',
					required: false
				},
				{
					name: 'contractEndDate',
					type: 'date',
					required: false
				},
				{
					name: 'contractTerm',
					type: 'number',
					required: false,
					min: 1,
					max: 50
				},
				{
					name: 'contractDocuments',
					type: 'file',
					required: false,
					maxSelect: 10,
					maxSize: 10485760, // 10MB
					mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
				},
				
				// Performance & Metrics
				{
					name: 'performanceScore',
					type: 'number',
					required: false,
					min: 0,
					max: 100
				},
				{
					name: 'fanEngagement',
					type: 'number',
					required: false,
					min: 0
				},
				{
					name: 'socialMediaFollowers',
					type: 'number',
					required: false,
					min: 0
				},
				{
					name: 'merchandiseSales',
					type: 'number',
					required: false,
					min: 0
				},
				
				// Marketing & Content
				{
					name: 'website',
					type: 'url',
					required: false
				},
				{
					name: 'socialMediaLinks',
					type: 'json',
					required: false
				},
				{
					name: 'marketingMaterials',
					type: 'file',
					required: false,
					maxSelect: 20,
					maxSize: 10485760, // 10MB
					mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
				},
				
				// Operations
				{
					name: 'launchDate',
					type: 'date',
					required: false
				},
				{
					name: 'homeVenue',
					type: 'text',
					required: false,
					max: 200
				},
				{
					name: 'trainingFacility',
					type: 'text',
					required: false,
					max: 200
				},
				
				// Notes & Internal
				{
					name: 'internalNotes',
					type: 'editor',
					required: false,
					maxSize: 0
				},
				{
					name: 'salesNotes',
					type: 'editor',
					required: false,
					maxSize: 0
				},
				{
					name: 'priority',
					type: 'number',
					required: false,
					min: 1,
					max: 100
				}
			]
		});

		console.log('✅ Franchises collection created successfully!\n');
		console.log('Collection Details:');
		console.log(`   ID: ${franchiseCollection.id}`);
		console.log(`   Name: ${franchiseCollection.name}`);
		console.log(`   Fields: ${franchiseCollection.fields?.length || 0}`);
		console.log('\nKey Features:');
		console.log('   ✓ Basic info (name, slug, tagline, description)');
		console.log('   ✓ Branding (logo, colors)');
		console.log('   ✓ Team roster (male pro, female pro, additional pros)');
		console.log('   ✓ Sales & financial tracking');
		console.log('   ✓ Territory & market information');
		console.log('   ✓ Franchisee details');
		console.log('   ✓ Contract management');
		console.log('   ✓ Performance metrics');
		console.log('   ✓ Marketing & content');
		console.log('   ✓ Operations data');
		
	} catch (error: any) {
		console.error('❌ Failed to create franchises collection:', error.message);
		if (error.data) {
			console.error('   Details:', JSON.stringify(error.data, null, 2));
		}
		throw error;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	createFranchisesCollection().catch(() => process.exit(1));
}

export { createFranchisesCollection };
