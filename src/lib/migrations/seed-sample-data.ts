import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seed sample data for all business/marketing collections
 */

const pb = new PocketBase(
	process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app/'
);

async function seedBrandPositioning() {
	console.log('\n📍 Seeding Brand Positioning...');
	
	const items = [
		{
			title: 'FLI Golf Mission Statement',
			description: 'To revolutionize disc golf by creating the most exciting and accessible professional league in the sport.',
			category: 'Mission',
			priority: 'High',
			status: 'Active'
		},
		{
			title: 'FLI Golf Vision',
			description: 'To become the premier disc golf league globally, known for innovation, player development, and fan engagement.',
			category: 'Vision',
			priority: 'High',
			status: 'Active'
		},
		{
			title: 'Core Values',
			description: 'Excellence, Innovation, Community, Integrity, and Fun',
			category: 'Values',
			priority: 'High',
			status: 'Active'
		},
		{
			title: 'Target Audience - Primary',
			description: 'Disc golf enthusiasts aged 18-45, active lifestyle seekers, and sports fans looking for new entertainment.',
			category: 'Target Audience',
			priority: 'High',
			status: 'Active'
		},
		{
			title: 'Unique Value Proposition',
			description: 'The only disc golf league combining professional competition with innovative fan experiences and player development programs.',
			category: 'Unique Value Proposition',
			priority: 'High',
			status: 'Active'
		}
	];
	
	let created = 0;
	for (const item of items) {
		try {
			await pb.collection('brand_positioning').create(item);
			console.log(`  ✅ Created: ${item.title}`);
			created++;
		} catch (error: any) {
			console.error(`  ❌ Failed: ${item.title} - ${error.message}`);
		}
	}
	
	return created;
}

async function seedBudgets() {
	console.log('\n💰 Seeding Budgets...');
	
	const currentYear = new Date().getFullYear();
	const items = [
		{
			departmentArea: 'Marketing and PR',
			fiscalYear: currentYear,
			quarter: 'Q1',
			allocatedAmount: 150000,
			spentAmount: 45000,
			remainingAmount: 105000,
			notes: 'Focus on digital marketing campaigns and social media presence'
		},
		{
			departmentArea: 'Operations',
			fiscalYear: currentYear,
			quarter: 'Q1',
			allocatedAmount: 200000,
			spentAmount: 78000,
			remainingAmount: 122000,
			notes: 'Tournament operations and venue management'
		},
		{
			departmentArea: 'Sales',
			fiscalYear: currentYear,
			quarter: 'Q1',
			allocatedAmount: 100000,
			spentAmount: 32000,
			remainingAmount: 68000,
			notes: 'Sponsorship acquisition and partnership development'
		},
		{
			departmentArea: 'Product Development',
			fiscalYear: currentYear,
			quarter: 'Q2',
			allocatedAmount: 120000,
			spentAmount: 0,
			remainingAmount: 120000,
			notes: 'New merchandise and fan experience initiatives'
		}
	];
	
	let created = 0;
	for (const item of items) {
		try {
			await pb.collection('budgets').create(item);
			console.log(`  ✅ Created: ${item.departmentArea} - ${item.quarter} ${item.fiscalYear}`);
			created++;
		} catch (error: any) {
			console.error(`  ❌ Failed: ${item.departmentArea} - ${error.message}`);
		}
	}
	
	return created;
}

async function seedBusinessObjectives() {
	console.log('\n🎯 Seeding Business Objectives...');
	
	const items = [
		{
			objective: 'Increase league revenue by 40% year-over-year',
			description: 'Focus on sponsorship deals, merchandise sales, and ticket revenue',
			category: 'Revenue Growth',
			targetDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
			status: 'In Progress',
			progress: 35,
			keyResults: '- Secure 5 major sponsors\n- Launch new merchandise line\n- Increase tournament attendance by 25%'
		},
		{
			objective: 'Expand to 3 new regional markets',
			description: 'Establish FLI Golf presence in Pacific Northwest, Southeast, and Midwest regions',
			category: 'Market Expansion',
			targetDate: new Date(new Date().getFullYear() + 1, 5, 30).toISOString().split('T')[0],
			status: 'On Track',
			progress: 20,
			keyResults: '- Identify venue partners in each region\n- Recruit local pros\n- Launch regional marketing campaigns'
		},
		{
			objective: 'Achieve 90% fan satisfaction rating',
			description: 'Improve fan experience through better venues, streaming, and engagement',
			category: 'Customer Satisfaction',
			targetDate: new Date(new Date().getFullYear(), 8, 30).toISOString().split('T')[0],
			status: 'On Track',
			progress: 75,
			keyResults: '- Implement fan feedback system\n- Upgrade streaming quality\n- Enhance venue amenities'
		},
		{
			objective: 'Launch FLI Golf mobile app',
			description: 'Develop and release mobile app for scores, schedules, and fan engagement',
			category: 'Innovation',
			targetDate: new Date(new Date().getFullYear(), 6, 15).toISOString().split('T')[0],
			status: 'In Progress',
			progress: 60,
			keyResults: '- Complete app development\n- Beta testing with 1000 users\n- App store launch'
		}
	];
	
	let created = 0;
	for (const item of items) {
		try {
			await pb.collection('business_objectives').create(item);
			console.log(`  ✅ Created: ${item.objective.substring(0, 50)}...`);
			created++;
		} catch (error: any) {
			console.error(`  ❌ Failed: ${item.objective.substring(0, 30)} - ${error.message}`);
		}
	}
	
	return created;
}

async function seedCampaigns() {
	console.log('\n📢 Seeding Campaigns...');
	
	const items = [
		{
			name: 'Spring Season Launch 2024',
			description: 'Major marketing push for the start of the spring tournament season',
			type: 'Marketing',
			startDate: new Date(new Date().getFullYear(), 2, 1).toISOString().split('T')[0],
			endDate: new Date(new Date().getFullYear(), 2, 31).toISOString().split('T')[0],
			budget: 50000,
			actualSpend: 48500,
			status: 'Completed',
			targetAudience: 'Disc golf fans, sports enthusiasts, ages 18-45',
			goals: 'Generate 100K impressions, drive 5K ticket sales, increase social media followers by 20%',
			metrics: 'Impressions: 125K, Tickets: 6.2K, Followers: +23%'
		},
		{
			name: 'Pro Player Spotlight Series',
			description: 'Weekly social media series featuring FLI Golf pros',
			type: 'Brand Awareness',
			startDate: new Date().toISOString().split('T')[0],
			endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
			budget: 15000,
			actualSpend: 8200,
			status: 'Active',
			targetAudience: 'Social media followers, disc golf community',
			goals: 'Increase engagement by 40%, grow follower base by 15K',
			metrics: 'Current engagement: +35%, New followers: 12K'
		},
		{
			name: 'Summer Championship Promotion',
			description: 'Multi-channel campaign for the summer championship event',
			type: 'Event',
			startDate: new Date(new Date().getFullYear(), 5, 1).toISOString().split('T')[0],
			endDate: new Date(new Date().getFullYear(), 6, 15).toISOString().split('T')[0],
			budget: 75000,
			actualSpend: 0,
			status: 'Planning',
			targetAudience: 'Disc golf fans nationwide, potential sponsors',
			goals: 'Sell out venue (5K capacity), secure 3 event sponsors, 200K+ livestream views',
			metrics: 'TBD'
		},
		{
			name: 'Merchandise Launch - Fall Collection',
			description: 'Launch new fall merchandise line with limited edition items',
			type: 'Product Launch',
			startDate: new Date(new Date().getFullYear(), 8, 1).toISOString().split('T')[0],
			endDate: new Date(new Date().getFullYear(), 9, 31).toISOString().split('T')[0],
			budget: 30000,
			actualSpend: 0,
			status: 'Planning',
			targetAudience: 'FLI Golf fans, merchandise collectors',
			goals: 'Generate $150K in merchandise sales, sell out limited editions',
			metrics: 'TBD'
		}
	];
	
	let created = 0;
	for (const item of items) {
		try {
			await pb.collection('campaigns').create(item);
			console.log(`  ✅ Created: ${item.name}`);
			created++;
		} catch (error: any) {
			console.error(`  ❌ Failed: ${item.name} - ${error.message}`);
		}
	}
	
	return created;
}

async function seedContinuousImprovements() {
	console.log('\n🔄 Seeding Continuous Improvements...');
	
	const items = [
		{
			title: 'Streamline Tournament Check-in Process',
			description: 'Current check-in takes 15-20 minutes per player, causing delays',
			category: 'Process Improvement',
			currentState: 'Manual paper-based check-in with multiple verification steps',
			proposedSolution: 'Implement QR code-based mobile check-in system',
			expectedBenefit: 'Reduce check-in time to 2-3 minutes, improve player experience, reduce staff workload',
			status: 'Approved',
			implementationDate: new Date(new Date().getFullYear(), 4, 15).toISOString().split('T')[0],
			priority: 'High'
		},
		{
			title: 'Upgrade Live Scoring System',
			description: 'Current scoring system has lag and occasional errors',
			category: 'Technology Upgrade',
			currentState: 'Legacy scoring software with manual data entry',
			proposedSolution: 'Migrate to cloud-based real-time scoring platform',
			expectedBenefit: 'Real-time scores, reduced errors, better fan experience',
			status: 'In Progress',
			implementationDate: new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0],
			priority: 'High'
		},
		{
			title: 'Reduce Merchandise Fulfillment Time',
			description: 'Average fulfillment time is 7-10 days, customers expect faster',
			category: 'Time Efficiency',
			currentState: 'Centralized warehouse with manual picking and packing',
			proposedSolution: 'Partner with regional fulfillment centers and automate order processing',
			expectedBenefit: 'Reduce fulfillment to 2-3 days, lower shipping costs, improve customer satisfaction',
			status: 'Under Review',
			priority: 'Medium'
		}
	];
	
	let created = 0;
	for (const item of items) {
		try {
			await pb.collection('continuous_improvements').create(item);
			console.log(`  ✅ Created: ${item.title}`);
			created++;
		} catch (error: any) {
			console.error(`  ❌ Failed: ${item.title} - ${error.message}`);
		}
	}
	
	return created;
}

async function seedDigitalMarketingStrategies() {
	console.log('\n📱 Seeding Digital Marketing Strategies...');
	
	const items = [
		{
			strategyName: 'Instagram Growth Campaign',
			description: 'Focused strategy to grow Instagram following and engagement',
			channel: 'Social Media',
			targetAudience: 'Ages 18-35, disc golf enthusiasts, outdoor sports fans',
			objectives: 'Grow followers to 50K, achieve 5% engagement rate, drive ticket sales',
			kpis: 'Follower growth rate, engagement rate, click-through rate, conversion rate',
			budget: 25000,
			status: 'Active',
			startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
			endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
		},
		{
			strategyName: 'Email Newsletter Program',
			description: 'Weekly newsletter with tournament updates, player stories, and exclusive content',
			channel: 'Email Marketing',
			targetAudience: 'Existing fans, newsletter subscribers',
			objectives: 'Maintain 25% open rate, 5% click rate, drive merchandise sales',
			kpis: 'Open rate, click rate, conversion rate, unsubscribe rate',
			budget: 8000,
			status: 'Active',
			startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
			endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
		},
		{
			strategyName: 'YouTube Content Series',
			description: 'Weekly video content including highlights, interviews, and behind-the-scenes',
			channel: 'Video Marketing',
			targetAudience: 'Disc golf fans, YouTube sports audience',
			objectives: 'Reach 100K subscribers, 1M monthly views, monetization',
			kpis: 'Subscriber count, view count, watch time, engagement rate',
			budget: 40000,
			status: 'Active',
			startDate: new Date(new Date().getFullYear(), 1, 1).toISOString().split('T')[0],
			endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
		},
		{
			strategyName: 'SEO Optimization Initiative',
			description: 'Improve organic search rankings for disc golf and tournament-related keywords',
			channel: 'SEO',
			targetAudience: 'People searching for disc golf content and tournaments',
			objectives: 'Rank top 3 for 20 target keywords, increase organic traffic by 150%',
			kpis: 'Keyword rankings, organic traffic, bounce rate, conversion rate',
			budget: 15000,
			status: 'Planning',
			startDate: new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0],
			endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
		}
	];
	
	let created = 0;
	for (const item of items) {
		try {
			await pb.collection('digital_marketing_strategies').create(item);
			console.log(`  ✅ Created: ${item.strategyName}`);
			created++;
		} catch (error: any) {
			console.error(`  ❌ Failed: ${item.strategyName} - ${error.message}`);
		}
	}
	
	return created;
}

async function seedMarketingGoals() {
	console.log('\n🎯 Seeding Marketing Goals...');
	
	const items = [
		{
			goalName: 'Reach 100K Social Media Followers',
			description: 'Combined followers across all social media platforms',
			category: 'Brand Awareness',
			targetMetric: 'Total Followers',
			targetValue: 100000,
			currentValue: 67500,
			deadline: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
			status: 'On Track',
			priority: 'High'
		},
		{
			goalName: 'Generate 5,000 Qualified Leads',
			description: 'Email signups and contact form submissions from potential sponsors and partners',
			category: 'Lead Generation',
			targetMetric: 'Qualified Leads',
			targetValue: 5000,
			currentValue: 3200,
			deadline: new Date(new Date().getFullYear(), 8, 30).toISOString().split('T')[0],
			status: 'On Track',
			priority: 'High'
		},
		{
			goalName: 'Achieve 15% Email Open Rate',
			description: 'Maintain healthy email engagement across all campaigns',
			category: 'Engagement',
			targetMetric: 'Email Open Rate',
			targetValue: 15,
			currentValue: 12.5,
			deadline: new Date(new Date().getFullYear(), 5, 30).toISOString().split('T')[0],
			status: 'At Risk',
			priority: 'Medium'
		},
		{
			goalName: 'Increase Merchandise Revenue by 50%',
			description: 'Year-over-year merchandise sales growth',
			category: 'Revenue Growth',
			targetMetric: 'Merchandise Revenue',
			targetValue: 500000,
			currentValue: 285000,
			deadline: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
			status: 'In Progress',
			priority: 'High'
		}
	];
	
	let created = 0;
	for (const item of items) {
		try {
			await pb.collection('marketing_goals').create(item);
			console.log(`  ✅ Created: ${item.goalName}`);
			created++;
		} catch (error: any) {
			console.error(`  ❌ Failed: ${item.goalName} - ${error.message}`);
		}
	}
	
	return created;
}

async function seedSwotAnalysis() {
	console.log('\n📊 Seeding SWOT Analysis...');
	
	const items = [
		{
			title: 'Strong Professional Player Roster',
			type: 'Strength',
			description: 'FLI Golf has secured contracts with 23 top-tier professional disc golfers',
			category: 'Human Resources',
			impact: 'High',
			actionItems: 'Continue recruiting top talent, develop player development programs',
			status: 'Monitoring'
		},
		{
			title: 'Innovative Fan Engagement Model',
			type: 'Strength',
			description: 'Unique approach to fan interaction through mobile app and social media',
			category: 'Technology',
			impact: 'High',
			actionItems: 'Expand digital features, gather user feedback, iterate on platform',
			status: 'In Progress'
		},
		{
			title: 'Limited Brand Recognition',
			type: 'Weakness',
			description: 'As a new league, FLI Golf lacks the brand awareness of established competitors',
			category: 'Brand',
			impact: 'High',
			actionItems: 'Increase marketing spend, partner with influencers, focus on content marketing',
			status: 'Action Planned'
		},
		{
			title: 'Dependency on Seasonal Revenue',
			type: 'Weakness',
			description: 'Revenue heavily concentrated in tournament season months',
			category: 'Financial',
			impact: 'Medium',
			actionItems: 'Develop off-season revenue streams, merchandise, content subscriptions',
			status: 'Under Review'
		},
		{
			title: 'Growing Disc Golf Market',
			type: 'Opportunity',
			description: 'Disc golf participation has grown 30% year-over-year',
			category: 'Market',
			impact: 'High',
			actionItems: 'Capitalize on growth with aggressive expansion, grassroots programs',
			status: 'In Progress'
		},
		{
			title: 'Streaming and Media Rights',
			type: 'Opportunity',
			description: 'Potential for lucrative streaming deals and media partnerships',
			category: 'Financial',
			impact: 'High',
			actionItems: 'Negotiate with streaming platforms, develop compelling content',
			status: 'Action Planned'
		},
		{
			title: 'Competition from Established Leagues',
			type: 'Threat',
			description: 'PDGA and other established organizations have market dominance',
			category: 'Competition',
			impact: 'High',
			actionItems: 'Differentiate through innovation, focus on unique value proposition',
			status: 'Monitoring'
		},
		{
			title: 'Economic Downturn Impact',
			type: 'Threat',
			description: 'Potential recession could reduce sponsorship and ticket sales',
			category: 'Financial',
			impact: 'Medium',
			actionItems: 'Diversify revenue streams, build cash reserves, flexible cost structure',
			status: 'Identified'
		}
	];
	
	let created = 0;
	for (const item of items) {
		try {
			await pb.collection('swot_analysis').create(item);
			console.log(`  ✅ Created: ${item.title}`);
			created++;
		} catch (error: any) {
			console.error(`  ❌ Failed: ${item.title} - ${error.message}`);
		}
	}
	
	return created;
}

async function main() {
	try {
		console.log('🌱 Starting sample data seeding...\n');
		console.log('🔐 Authenticating...');
		
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL || 'ddinsmore8@gmail.com',
			process.env.POCKETBASE_ADMIN_PASSWORD || 'MADcap(123)'
		);
		
		console.log('✅ Authenticated successfully\n');
		
		const results = {
			brandPositioning: await seedBrandPositioning(),
			budgets: await seedBudgets(),
			businessObjectives: await seedBusinessObjectives(),
			campaigns: await seedCampaigns(),
			continuousImprovements: await seedContinuousImprovements(),
			digitalMarketingStrategies: await seedDigitalMarketingStrategies(),
			marketingGoals: await seedMarketingGoals(),
			swotAnalysis: await seedSwotAnalysis()
		};
		
		console.log('\n\n📊 Seeding Summary:');
		console.log('═══════════════════════════════════════');
		console.log(`Brand Positioning:           ${results.brandPositioning} records`);
		console.log(`Budgets:                     ${results.budgets} records`);
		console.log(`Business Objectives:         ${results.businessObjectives} records`);
		console.log(`Campaigns:                   ${results.campaigns} records`);
		console.log(`Continuous Improvements:     ${results.continuousImprovements} records`);
		console.log(`Digital Marketing Strategies: ${results.digitalMarketingStrategies} records`);
		console.log(`Marketing Goals:             ${results.marketingGoals} records`);
		console.log(`SWOT Analysis:               ${results.swotAnalysis} records`);
		console.log('═══════════════════════════════════════');
		
		const total = Object.values(results).reduce((sum, count) => sum + count, 0);
		console.log(`\n✅ Total records created: ${total}`);
		console.log('\n🎉 Sample data seeding completed successfully!');
		
	} catch (error: any) {
		console.error('\n❌ Seeding failed:', error.message);
		if (error.data) {
			console.error('Details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { main as seedSampleData };
