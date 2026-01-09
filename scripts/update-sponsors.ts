import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function updateSponsors() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');

		// Get all collections to find the correct IDs
		const collections = await pb.collections.getFullList();
		
		const sponsorsCollection = collections.find((c: any) => c.name === 'sponsors');
		const franchiseDealsCollection = collections.find((c: any) => c.name === 'franchise_deals');
		const userProfilesCollection = collections.find((c: any) => c.name === 'user_profiles');

		console.log('📋 Found Collections:');
		console.log(`   sponsors: ${sponsorsCollection?.id || 'NOT FOUND'}`);
		console.log(`   franchise_deals: ${franchiseDealsCollection?.id || 'NOT FOUND'}`);
		console.log(`   user_profiles: ${userProfilesCollection?.id || 'NOT FOUND'}\n`);

		if (!sponsorsCollection) {
			console.log('❌ sponsors collection not found.');
			process.exit(1);
		}

		console.log('📝 Updating sponsors collection with all fields...\n');

		const schema = [
			{
				name: 'companyName',
				type: 'text',
				required: true,
				options: { min: 1, max: 255 }
			},
			{
				name: 'type',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['casino', 'resort', 'hospitality', 'entertainment', 'corporate', 'other']
				}
			},
			{
				name: 'tier',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['tier_1', 'tier_2', 'tier_3', 'tier_4']
				}
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['prospect', 'negotiating', 'active', 'renewed', 'expired', 'converted_to_franchise', 'inactive']
				}
			},
			{
				name: 'primaryContactName',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'primaryContactEmail',
				type: 'email',
				required: false
			},
			{
				name: 'primaryContactPhone',
				type: 'text',
				required: false,
				options: { max: 50 }
			},
			{
				name: 'location',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'territory',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
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
				name: 'currentYear',
				type: 'number',
				required: false,
				options: { min: 2025, max: 2027 }
			},
			{
				name: 'annualCommitment',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'totalPaid',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'franchiseInterest',
				type: 'bool',
				required: false
			},
			{
				name: 'franchiseConversionDate',
				type: 'date',
				required: false
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			}
		];

		// Add relations only if collections exist
		if (franchiseDealsCollection) {
			schema.push({
				name: 'franchiseDealId',
				type: 'relation',
				required: false,
				options: {
					collectionId: franchiseDealsCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		if (userProfilesCollection) {
			schema.push({
				name: 'assignedTo',
				type: 'relation',
				required: false,
				options: {
					collectionId: userProfilesCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		await pb.collections.update(sponsorsCollection.id, {
			schema: schema
		});

		console.log('✅ Updated sponsors collection successfully!\n');
		console.log('📊 Summary:');
		console.log(`   Total fields: ${schema.length}`);
		console.log('\n📋 Fields added:');
		console.log('   • companyName (text, required)');
		console.log('   • type (select: casino, resort, hospitality, entertainment, corporate, other)');
		console.log('   • tier (select: tier_1, tier_2, tier_3, tier_4)');
		console.log('   • status (select: prospect, negotiating, active, renewed, expired, converted_to_franchise, inactive)');
		console.log('   • primaryContactName (text)');
		console.log('   • primaryContactEmail (email)');
		console.log('   • primaryContactPhone (text)');
		console.log('   • location (text)');
		console.log('   • territory (text)');
		console.log('   • contractStartDate (date)');
		console.log('   • contractEndDate (date)');
		console.log('   • currentYear (number, 2025-2027)');
		console.log('   • annualCommitment (number)');
		console.log('   • totalPaid (number)');
		console.log('   • franchiseInterest (bool)');
		console.log('   • franchiseConversionDate (date)');
		console.log('   • notes (editor)');
		if (franchiseDealsCollection) {
			console.log('   • franchiseDealId (relation to franchise_deals)');
		}
		if (userProfilesCollection) {
			console.log('   • assignedTo (relation to user_profiles)');
		}
		console.log('\n✅ sponsors collection is ready!');
		console.log('\n💰 Tier Pricing:');
		console.log('   Tier 1: $7M (2025), $5M (2026), $3M (2027) = $15M total');
		console.log('   Tier 2: $5M (2025), $7M (2026), $9M (2027) = $21M total');
		console.log('   Tier 3: $1M (2025), $1M (2026), $2M (2027) = $4M total');
		console.log('   Tier 4: $1M (2025), $1.5M (2026), $2M (2027) = $4.5M total');

	} catch (error: any) {
		console.error('❌ Error updating collection:', error);
		if (error.data) {
			console.error('Error details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

updateSponsors();
