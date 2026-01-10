import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const POCKETBASE_URL = process.env.POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function createLeagueRecord() {
	console.log('🚀 Creating/Updating FLI Golf League record...\n');

	if (!POCKETBASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('❌ Missing environment variables');
		process.exit(1);
	}

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated as admin\n');

		// Fetch all data to calculate totals
		console.log('📊 Fetching data...');
		const [franchises, deals, opportunities, sponsors, expenses] = await Promise.all([
			pb.collection('franchises').getFullList(),
			pb.collection('franchise_deals').getFullList(),
			pb.collection('franchise_opportunities').getFullList(),
			pb.collection('sponsor_franchise_bridge').getFullList(),
			pb.collection('expenses').getFullList()
		]);

		console.log(`  Franchises: ${franchises.length}`);
		console.log(`  Deals: ${deals.length}`);
		console.log(`  Opportunities: ${opportunities.length}`);
		console.log(`  Sponsor Bridges: ${sponsors.length}`);
		console.log(`  Expenses: ${expenses.length}\n`);

		// Calculate totals
		const totalFranchises = franchises.length;
		const soldFranchises = franchises.filter((f: any) => f.status === 'sold' || f.status === 'active').length;
		const availableFranchises = franchises.filter((f: any) => f.status === 'available').length;

		const totalFranchiseValue = franchises.reduce((sum: number, f: any) => 
			sum + (f.netFranchiseValue || f.franchiseFee || 0), 0
		);

		const totalPaidToDate = franchises.reduce((sum: number, f: any) => 
			sum + (f.totalPaidToDate || 0), 0
		);

		const totalOutstanding = franchises.reduce((sum: number, f: any) => 
			sum + (f.outstandingBalance || 0), 0
		);

		const totalSponsorDiscounts = franchises.reduce((sum: number, f: any) => 
			sum + (f.sponsorshipDiscount || 0), 0
		);

		const sponsorConversions = franchises.filter((f: any) => f.sponsorBridgeId).length;

		const activeFranchiseDeals = deals.filter((d: any) => 
			d.status === 'active' || d.status === 'signed' || d.status === 'payment_in_progress'
		).length;

		const pipelineValue = opportunities.reduce((sum: number, o: any) => 
			sum + (o.dealValue || 0), 0
		);

		const franchiseSalesIncome = deals.reduce((sum: number, d: any) => 
			sum + (d.totalPaidToDate || d.paymentReceived || 0), 0
		);

		// Calculate sponsorship income
		const sponsorshipIncome = sponsors.reduce((sum: number, s: any) => 
			sum + (s.sponsorshipValueToDate || 0), 0
		);

		// Calculate total expenses
		const totalExpenses = expenses
			.filter((e: any) => e.status === 'paid' || e.status === 'approved')
			.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

		// Categorize expenses
		const expensesByCategory: Record<string, number> = {};
		expenses
			.filter((e: any) => e.status === 'paid' || e.status === 'approved')
			.forEach((expense: any) => {
				const category = getHighLevelCategory(expense.category || 'Other');
				expensesByCategory[category] = (expensesByCategory[category] || 0) + (expense.amount || 0);
			});

		// Calculate income breakdown
		const incomeBreakdown = {
			'Franchise Sales': franchiseSalesIncome,
			'Sponsorships': sponsorshipIncome,
			'Royalties': 0,
			'Merchandise': 0,
			'Media Rights': 0,
			'Ticket Sales': 0,
			'Other': 0
		};

		// Calculate totals
		const totalIncome = franchiseSalesIncome + sponsorshipIncome;
		const grossProfit = totalIncome - totalExpenses;
		const netProfit = grossProfit;
		const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

		// Financial metrics breakdown
		const financialMetrics = {
			franchiseMetrics: {
				total: totalFranchises,
				sold: soldFranchises,
				available: availableFranchises,
				reserved: franchises.filter((f: any) => f.status === 'reserved').length,
				inNegotiation: franchises.filter((f: any) => f.status === 'in_negotiation').length
			},
			revenueMetrics: {
				totalValue: totalFranchiseValue,
				totalPaid: totalPaidToDate,
				totalOutstanding: totalOutstanding,
				collectionRate: totalFranchiseValue > 0 ? (totalPaidToDate / totalFranchiseValue) * 100 : 0
			},
			dealMetrics: {
				totalDeals: deals.length,
				activeDeals: activeFranchiseDeals,
				pendingSignature: deals.filter((d: any) => d.status === 'pending_signature').length,
				paymentInProgress: deals.filter((d: any) => d.status === 'payment_in_progress').length,
				completed: deals.filter((d: any) => d.status === 'payment_completed').length
			},
			pipelineMetrics: {
				opportunities: opportunities.length,
				pipelineValue: pipelineValue,
				averageOpportunityValue: opportunities.length > 0 ? pipelineValue / opportunities.length : 0
			},
			sponsorMetrics: {
				totalDiscounts: totalSponsorDiscounts,
				conversions: sponsorConversions,
				averageDiscount: sponsorConversions > 0 ? totalSponsorDiscounts / sponsorConversions : 0
			},
			incomeBreakdown: incomeBreakdown,
			expenseBreakdown: expensesByCategory,
			profitLoss: {
				totalIncome,
				totalExpenses,
				grossProfit,
				netProfit,
				profitMargin
			}
		};

		// Helper function to categorize expenses
		function getHighLevelCategory(category: string): string {
			const mapping: Record<string, string> = {
				'Executive/Management Staff': 'Staff & Personnel',
				'Office Staff': 'Staff & Personnel',
				'Consultants': 'Professional Services',
				'Commisions': 'Sales & Marketing',
				'Marketing': 'Sales & Marketing',
				'Public relations': 'Sales & Marketing',
				'Legal': 'Professional Services',
				'Advertising': 'Sales & Marketing',
				'Tech/App Development': 'Technology',
				'Course Build/Materials': 'Operations',
				'Course Build/Tools': 'Operations',
				'Course Build/Miscellaneous': 'Operations',
				'Office/San Diego': 'Facilities',
				'Office/Scottsdale': 'Facilities',
				'Production Studio': 'Facilities',
				'Warehouse': 'Facilities',
				'Utilities': 'Facilities',
				'Internal Tech Budget': 'Technology',
				'Hardware': 'Technology',
				'Software': 'Technology',
				'Mobile Data': 'Technology',
				'Expenses/MPO (Male)': 'Events & Competition',
				'Expenses/FPO (Female)': 'Events & Competition',
				'Travel/Airefare': 'Travel',
				'Travel/Lodging': 'Travel',
				'Travel/Auto Rental': 'Travel',
				'Travel/Miscellaneous': 'Travel',
				'E-Commerce/Clothing': 'Merchandise',
				'E-Commerce/Accesories': 'Merchandise',
				'E-Commerce/Shoes': 'Merchandise',
				'E-Commerce/Bags': 'Merchandise',
				'Docunentary': 'Media & Production',
				'Office Upgrades': 'Facilities',
				'Arizona/Warehouse': 'Facilities',
				'League Insurance': 'Insurance & Risk',
				'Payroll Processing Fees': 'Staff & Personnel',
				'Employee Relocation': 'Staff & Personnel',
				'Employee Insurance': 'Insurance & Risk',
				'Reserves': 'Reserves'
			};
			return mapping[category] || 'Other';
		}

		const leagueData = {
			name: 'FLI Golf League',
			slug: 'fli-golf',
			description: 'Professional disc golf league featuring franchise teams competing globally',
			status: 'active',
			season: '2025',
			totalTeams: totalFranchises,
			totalFranchises: totalFranchises,
			soldFranchises: soldFranchises,
			availableFranchises: availableFranchises,
			totalFranchiseValue: totalFranchiseValue,
			totalRevenue: franchiseSalesIncome,
			totalPaidToDate: totalPaidToDate,
			totalOutstanding: totalOutstanding,
			totalSponsorDiscounts: totalSponsorDiscounts,
			sponsorConversions: sponsorConversions,
			activeFranchiseDeals: activeFranchiseDeals,
			pipelineValue: pipelineValue,
			
			// Income
			totalIncome: totalIncome,
			franchiseSalesIncome: franchiseSalesIncome,
			sponsorshipIncome: sponsorshipIncome,
			
			// Expenses
			totalExpenses: totalExpenses,
			expensesByCategory: expensesByCategory,
			
			// P&L
			grossProfit: grossProfit,
			netProfit: netProfit,
			profitMargin: profitMargin,
			
			financialMetrics: financialMetrics
		};

		// Check if league record exists
		const existingLeagues = await pb.collection('league').getFullList();

		let leagueRecord;
		if (existingLeagues.length > 0) {
			// Update existing
			leagueRecord = await pb.collection('league').update(existingLeagues[0].id, leagueData);
			console.log('✅ Updated existing league record');
		} else {
			// Create new
			leagueRecord = await pb.collection('league').create(leagueData);
			console.log('✅ Created new league record');
		}

		console.log('\n📈 League Financial Summary:');
		console.log(`   Total Franchises: ${totalFranchises}`);
		console.log(`   Sold: ${soldFranchises} | Available: ${availableFranchises}`);
		console.log(`   Total Franchise Value: $${totalFranchiseValue.toLocaleString()}`);
		console.log(`   Total Paid to Date: $${totalPaidToDate.toLocaleString()}`);
		console.log(`   Total Outstanding: $${totalOutstanding.toLocaleString()}`);
		console.log(`   Sponsor Discounts: $${totalSponsorDiscounts.toLocaleString()}`);
		console.log(`   Sponsor Conversions: ${sponsorConversions}`);
		console.log(`   Active Deals: ${activeFranchiseDeals}`);
		console.log(`   Pipeline Value: $${pipelineValue.toLocaleString()}`);
		console.log(`   Collection Rate: ${financialMetrics.revenueMetrics.collectionRate.toFixed(1)}%`);
		console.log('\n💰 Profit & Loss:');
		console.log(`   Total Income: $${totalIncome.toLocaleString()}`);
		console.log(`   Total Expenses: $${totalExpenses.toLocaleString()}`);
		console.log(`   Gross Profit: $${grossProfit.toLocaleString()}`);
		console.log(`   Net Profit: $${netProfit.toLocaleString()}`);
		console.log(`   Profit Margin: ${profitMargin.toFixed(1)}%`);

		console.log('\n✅ League record created/updated successfully!');
		console.log('League ID:', leagueRecord.id);
		
		process.exit(0);
	} catch (error: any) {
		console.error('❌ Failed to create league record:', error.message || error);
		if (error.response) {
			console.error('Response:', JSON.stringify(error.response, null, 2));
		}
		process.exit(1);
	}
}

createLeagueRecord();
