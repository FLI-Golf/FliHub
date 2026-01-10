import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function seedMarketingData() {
	console.log('🌱 Seeding marketing data...\n');

	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);
		console.log('✓ Authenticated as admin\n');

		// Check if collections exist
		try {
			await pb.collection('campaigns').getList(1, 1);
			console.log('✓ Campaigns collection exists');
		} catch (err) {
			console.log('⚠️  Campaigns collection does not exist - skipping marketing seeding');
			return;
		}

		// Seed Campaigns
		console.log('\n📢 Seeding Campaigns...');
		const campaigns = [
			{
				name: 'Spring Tournament Series 2026',
				type: 'Brand Awareness',
				status: 'Active',
				startDate: new Date('2026-03-01'),
				endDate: new Date('2026-05-31'),
				budget: 150000,
				actualSpend: 95000,
				description: 'Promote spring tournament series across all channels',
				targetAudience: 'Disc golf enthusiasts, ages 18-45',
				channels: ['Social Media', 'Email', 'Events']
			},
			{
				name: 'Pro Player Spotlight Campaign',
				type: 'Marketing',
				status: 'Active',
				startDate: new Date('2026-01-15'),
				endDate: new Date('2026-12-31'),
				budget: 80000,
				actualSpend: 12000,
				description: 'Monthly spotlight features on professional players',
				targetAudience: 'Fans and aspiring players',
				channels: ['Social Media', 'YouTube', 'Blog']
			},
			{
				name: 'Franchise Recruitment Drive',
				type: 'Lead Generation',
				status: 'Active',
				startDate: new Date('2026-02-01'),
				endDate: new Date('2026-06-30'),
				budget: 200000,
				actualSpend: 85000,
				description: 'Generate qualified franchise leads in target markets',
				targetAudience: 'Entrepreneurs, business owners',
				channels: ['Digital Ads', 'Webinars', 'Trade Shows']
			},
			{
				name: 'Summer League Launch',
				type: 'Product Launch',
				status: 'Planning',
				startDate: new Date('2026-06-01'),
				endDate: new Date('2026-08-31'),
				budget: 120000,
				actualSpend: 0,
				description: 'Launch new summer league format with enhanced features',
				targetAudience: 'Current and new players',
				channels: ['Email', 'Social Media', 'PR']
			},
			{
				name: 'Sponsor Appreciation Event',
				type: 'Customer Retention',
				status: 'Completed',
				startDate: new Date('2025-12-01'),
				endDate: new Date('2025-12-15'),
				budget: 50000,
				actualSpend: 48000,
				description: 'Year-end appreciation event for sponsors',
				targetAudience: 'Current sponsors',
				channels: ['Events', 'Direct Mail']
			},
			{
				name: 'Digital Marketing Overhaul',
				type: 'Marketing',
				status: 'Paused',
				startDate: new Date('2025-11-01'),
				endDate: new Date('2026-03-31'),
				budget: 75000,
				actualSpend: 35000,
				description: 'Redesign website and digital presence',
				targetAudience: 'All audiences',
				channels: ['Website', 'SEO', 'Content Marketing']
			},
			{
				name: 'Holiday Tournament Promotion',
				type: 'Sales',
				status: 'Completed',
				startDate: new Date('2025-11-15'),
				endDate: new Date('2025-12-31'),
				budget: 60000,
				actualSpend: 58000,
				description: 'Drive registrations for holiday tournaments',
				targetAudience: 'Players and families',
				channels: ['Email', 'Social Media', 'Paid Ads']
			},
			{
				name: 'Youth Development Program',
				type: 'Brand Awareness',
				status: 'Planning',
				startDate: new Date('2026-04-01'),
				endDate: new Date('2026-09-30'),
				budget: 90000,
				actualSpend: 0,
				description: 'Introduce disc golf to schools and youth organizations',
				targetAudience: 'Youth ages 10-18, parents, educators',
				channels: ['Schools', 'Community Events', 'Social Media']
			}
		];

		const campaignIds: string[] = [];
		for (const campaign of campaigns) {
			try {
				const record = await pb.collection('campaigns').create(campaign);
				campaignIds.push(record.id);
				console.log(`  ✓ Created campaign: ${campaign.name}`);
			} catch (err: any) {
				console.log(`  ✗ Failed to create campaign ${campaign.name}:`, err.message);
			}
		}

		// Seed Marketing Goals
		console.log('\n🎯 Seeding Marketing Goals...');
		const goals = [
			{
				name: 'Increase Social Media Followers by 25%',
				description: 'Grow Instagram and Facebook followers from 50K to 62.5K',
				targetDate: new Date('2026-06-30'),
				status: 'In Progress',
				category: 'Social Media',
				targetMetric: 62500,
				currentMetric: 54000
			},
			{
				name: 'Generate 100 Qualified Franchise Leads',
				description: 'Generate and qualify 100 franchise leads through campaigns',
				targetDate: new Date('2026-06-30'),
				status: 'In Progress',
				category: 'Lead Generation',
				targetMetric: 100,
				currentMetric: 45
			},
			{
				name: 'Achieve 15% Email Open Rate',
				description: 'Improve email marketing open rates to 15% or higher',
				targetDate: new Date('2026-03-31'),
				status: 'Completed',
				category: 'Email Marketing',
				targetMetric: 15,
				currentMetric: 16.2
			},
			{
				name: 'Launch New Website',
				description: 'Complete redesign and launch of main website',
				targetDate: new Date('2026-04-01'),
				status: 'In Progress',
				category: 'Digital',
				targetMetric: 1,
				currentMetric: 0.7
			},
			{
				name: 'Increase Tournament Registrations by 20%',
				description: 'Drive 20% more registrations compared to 2025',
				targetDate: new Date('2026-12-31'),
				status: 'In Progress',
				category: 'Sales',
				targetMetric: 12000,
				currentMetric: 8500
			},
			{
				name: 'Secure 5 Media Partnerships',
				description: 'Establish partnerships with disc golf media outlets',
				targetDate: new Date('2026-08-31'),
				status: 'Not Started',
				category: 'Partnerships',
				targetMetric: 5,
				currentMetric: 0
			},
			{
				name: 'Produce 50 Content Pieces',
				description: 'Create 50 blog posts, videos, and social content',
				targetDate: new Date('2026-12-31'),
				status: 'In Progress',
				category: 'Content',
				targetMetric: 50,
				currentMetric: 18
			},
			{
				name: 'Achieve 95% Sponsor Retention',
				description: 'Retain 95% of current sponsors for 2026',
				targetDate: new Date('2026-12-31'),
				status: 'Completed',
				category: 'Retention',
				targetMetric: 95,
				currentMetric: 96
			},
			{
				name: 'Increase Website Traffic by 40%',
				description: 'Grow monthly website visitors from 25K to 35K',
				targetDate: new Date('2026-09-30'),
				status: 'Not Started',
				category: 'Digital',
				targetMetric: 35000,
				currentMetric: 25000
			},
			{
				name: 'Launch Mobile App',
				description: 'Develop and launch FLI Golf mobile application',
				targetDate: new Date('2026-10-31'),
				status: 'Not Started',
				category: 'Product',
				targetMetric: 1,
				currentMetric: 0
			}
		];

		for (const goal of goals) {
			try {
				await pb.collection('marketing_goals').create(goal);
				console.log(`  ✓ Created goal: ${goal.name}`);
			} catch (err: any) {
				console.log(`  ✗ Failed to create goal ${goal.name}:`, err.message);
			}
		}

		console.log('\n✅ Marketing data seeding completed!\n');
		console.log('Summary:');
		console.log(`  - ${campaigns.length} campaigns created`);
		console.log(`  - ${campaigns.filter(c => c.status === 'Active').length} active campaigns`);
		console.log(`  - ${campaigns.filter(c => c.status === 'Completed').length} completed campaigns`);
		console.log(`  - Total budget: $${campaigns.reduce((sum, c) => sum + c.budget, 0).toLocaleString()}`);
		console.log(`  - Total spend: $${campaigns.reduce((sum, c) => sum + c.actualSpend, 0).toLocaleString()}`);
		console.log(`  - ${goals.length} marketing goals created`);
		console.log(`  - ${goals.filter(g => g.status === 'Completed').length} goals completed`);
		console.log(`  - ${goals.filter(g => g.status === 'In Progress').length} goals in progress`);

	} catch (error: any) {
		console.error('❌ Error seeding marketing data:', error.message);
		process.exit(1);
	}
}

seedMarketingData();
