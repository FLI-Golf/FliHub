import { z } from 'zod';

export const LeagueSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'League name is required'),
	slug: z.string().min(1, 'Slug is required'),
	description: z.string().optional(),
	logo: z.string().optional(),
	status: z.enum(['active', 'inactive', 'upcoming', 'completed']).default('active'),
	season: z.string().optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	website: z.string().url().optional().or(z.literal('')),
	location: z.string().optional(),
	headquarters: z.string().optional(),
	founded: z.number().optional(),
	
	// Team/Player counts
	totalTeams: z.number().min(0).optional(),
	totalPlayers: z.number().min(0).optional(),
	
	// Franchise Financial Metrics
	totalFranchises: z.number().min(0).optional(),
	soldFranchises: z.number().min(0).optional(),
	availableFranchises: z.number().min(0).optional(),
	totalFranchiseValue: z.number().min(0).optional(),
	totalRevenue: z.number().min(0).optional(),
	totalPaidToDate: z.number().min(0).optional(),
	totalOutstanding: z.number().min(0).optional(),
	totalSponsorDiscounts: z.number().min(0).optional(),
	sponsorConversions: z.number().min(0).optional(),
	activeFranchiseDeals: z.number().min(0).optional(),
	pipelineValue: z.number().min(0).optional(),
	
	// Income Tracking
	totalIncome: z.number().min(0).optional(),
	franchiseSalesIncome: z.number().min(0).optional(),
	royaltyIncome: z.number().min(0).optional(),
	sponsorshipIncome: z.number().min(0).optional(),
	merchandiseIncome: z.number().min(0).optional(),
	mediaRightsIncome: z.number().min(0).optional(),
	ticketSalesIncome: z.number().min(0).optional(),
	otherIncome: z.number().min(0).optional(),
	
	// Expense Tracking
	totalExpenses: z.number().min(0).optional(),
	expensesByCategory: z.record(z.number()).optional(),
	
	// Profit & Loss
	grossProfit: z.number().optional(),
	netProfit: z.number().optional(),
	profitMargin: z.number().optional(),
	
	// Detailed metrics (JSON)
	financialMetrics: z.object({
		franchiseMetrics: z.object({
			total: z.number(),
			sold: z.number(),
			available: z.number(),
			reserved: z.number(),
			inNegotiation: z.number()
		}).optional(),
		revenueMetrics: z.object({
			totalValue: z.number(),
			totalPaid: z.number(),
			totalOutstanding: z.number(),
			collectionRate: z.number()
		}).optional(),
		dealMetrics: z.object({
			totalDeals: z.number(),
			activeDeals: z.number(),
			pendingSignature: z.number(),
			paymentInProgress: z.number(),
			completed: z.number()
		}).optional(),
		pipelineMetrics: z.object({
			opportunities: z.number(),
			pipelineValue: z.number(),
			averageOpportunityValue: z.number()
		}).optional(),
		sponsorMetrics: z.object({
			totalDiscounts: z.number(),
			conversions: z.number(),
			averageDiscount: z.number()
		}).optional(),
		incomeBreakdown: z.record(z.number()).optional(),
		expenseBreakdown: z.record(z.number()).optional(),
		profitLoss: z.object({
			totalIncome: z.number(),
			totalExpenses: z.number(),
			grossProfit: z.number(),
			netProfit: z.number(),
			profitMargin: z.number()
		}).optional()
	}).optional(),
	
	// Other fields
	prizePool: z.number().min(0).optional(),
	format: z.string().optional(),
	rules: z.string().optional(),
	contactEmail: z.string().email().optional().or(z.literal('')),
	contactPhone: z.string().optional(),
	socialMedia: z.record(z.string()).optional(),
	notes: z.string().optional(),
	leagueOwner: z.string().optional(),
	
	created: z.date().optional(),
	updated: z.date().optional()
});

export type LeagueInput = z.infer<typeof LeagueSchema>;

// Helper function to calculate league totals from franchises and deals
export function calculateLeagueTotals(
	franchises: any[],
	deals: any[],
	opportunities: any[],
	expenses: any[] = [],
	sponsors: any[] = []
) {
	const totalFranchises = franchises.length;
	const soldFranchises = franchises.filter(f => f.status === 'sold' || f.status === 'active').length;
	const availableFranchises = franchises.filter(f => f.status === 'available').length;
	
	const totalFranchiseValue = franchises.reduce((sum, f) => 
		sum + (f.netFranchiseValue || f.franchiseFee || 0), 0
	);
	
	const totalPaidToDate = franchises.reduce((sum, f) => 
		sum + (f.totalPaidToDate || 0), 0
	);
	
	const totalOutstanding = franchises.reduce((sum, f) => 
		sum + (f.outstandingBalance || 0), 0
	);
	
	const totalSponsorDiscounts = franchises.reduce((sum, f) => 
		sum + (f.sponsorshipDiscount || 0), 0
	);
	
	const sponsorConversions = franchises.filter(f => f.sponsorBridgeId).length;
	
	const activeFranchiseDeals = deals.filter(d => 
		d.status === 'active' || d.status === 'signed' || d.status === 'payment_in_progress'
	).length;
	
	const pipelineValue = opportunities.reduce((sum, o) => 
		sum + (o.dealValue || 0), 0
	);
	
	const franchiseSalesIncome = deals.reduce((sum, d) => 
		sum + (d.totalPaidToDate || d.paymentReceived || 0), 0
	);
	
	// Calculate sponsorship income
	const sponsorshipIncome = sponsors.reduce((sum, s) => 
		sum + (s.sponsorshipValueToDate || 0), 0
	);
	
	// Calculate total expenses
	const totalExpenses = expenses
		.filter(e => e.status === 'paid' || e.status === 'approved')
		.reduce((sum, e) => sum + (e.amount || 0), 0);
	
	// Calculate income
	const totalIncome = franchiseSalesIncome + sponsorshipIncome;
	
	// Calculate P&L
	const grossProfit = totalIncome - totalExpenses;
	const netProfit = grossProfit; // Can add other adjustments later
	const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
	
	return {
		totalFranchises,
		soldFranchises,
		availableFranchises,
		totalFranchiseValue,
		totalRevenue: franchiseSalesIncome,
		totalPaidToDate,
		totalOutstanding,
		totalSponsorDiscounts,
		sponsorConversions,
		activeFranchiseDeals,
		pipelineValue,
		collectionRate: totalFranchiseValue > 0 ? (totalPaidToDate / totalFranchiseValue) * 100 : 0,
		
		// Income
		totalIncome,
		franchiseSalesIncome,
		sponsorshipIncome,
		
		// Expenses
		totalExpenses,
		
		// P&L
		grossProfit,
		netProfit,
		profitMargin
	};
}

// Helper to calculate income breakdown
export function calculateIncomeBreakdown(
	deals: any[],
	sponsors: any[]
): Record<string, number> {
	return {
		'Franchise Sales': deals.reduce((sum, d) => 
			sum + (d.totalPaidToDate || d.paymentReceived || 0), 0
		),
		'Sponsorships': sponsors.reduce((sum, s) => 
			sum + (s.sponsorshipValueToDate || 0), 0
		),
		'Royalties': 0, // To be implemented
		'Merchandise': 0, // To be implemented
		'Media Rights': 0, // To be implemented
		'Ticket Sales': 0, // To be implemented
		'Other': 0 // To be implemented
	};
}

// Helper to calculate expense breakdown by high-level category
export function calculateExpenseBreakdown(expenses: any[]): Record<string, number> {
	const breakdown: Record<string, number> = {};
	
	expenses
		.filter(e => e.status === 'paid' || e.status === 'approved')
		.forEach(expense => {
			const category = expense.category || 'Other';
			// Map to high-level category (you'll need to import the mapping)
			const highLevelCat = getHighLevelCategoryForExpense(category);
			breakdown[highLevelCat] = (breakdown[highLevelCat] || 0) + (expense.amount || 0);
		});
	
	return breakdown;
}

// Helper function to map expense category to high-level category
function getHighLevelCategoryForExpense(category: string): string {
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
