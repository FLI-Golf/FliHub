import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
const FRANCHISE_FEE = 10000000; // $10M

async function updateFranchiseFees() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin');
		console.log(`📊 Updating all franchise fees to ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(FRANCHISE_FEE)}\n`);

		// Update franchise territories
		try {
			const territories = await pb.collection('franchise_territories').getFullList();
			let updatedTerritories = 0;
			
			for (const territory of territories) {
				if (!territory.price || territory.price !== FRANCHISE_FEE) {
					await pb.collection('franchise_territories').update(territory.id, {
						price: FRANCHISE_FEE
					});
					const oldPrice = territory.price ? `$${territory.price.toLocaleString()}` : 'not set';
					console.log(`✅ Updated territory: ${territory.name} - ${oldPrice} → $${FRANCHISE_FEE.toLocaleString()}`);
					updatedTerritories++;
				}
			}
			
			if (updatedTerritories === 0) {
				console.log('✓ All territories already have correct price');
			} else {
				console.log(`✅ Updated ${updatedTerritories} territories\n`);
			}
		} catch (error: any) {
			console.log('⚠️  No territories found or error:', error.message);
		}

		// Update franchise opportunities
		try {
			const opportunities = await pb.collection('franchise_opportunities').getFullList();
			let updatedOpportunities = 0;
			
			for (const opportunity of opportunities) {
				if (!opportunity.dealValue || opportunity.dealValue !== FRANCHISE_FEE) {
					await pb.collection('franchise_opportunities').update(opportunity.id, {
						dealValue: FRANCHISE_FEE
					});
					const oldValue = opportunity.dealValue ? `$${opportunity.dealValue.toLocaleString()}` : 'not set';
					console.log(`✅ Updated opportunity: ${opportunity.opportunityName} - ${oldValue} → $${FRANCHISE_FEE.toLocaleString()}`);
					updatedOpportunities++;
				}
			}
			
			if (updatedOpportunities === 0) {
				console.log('✓ All opportunities already have correct deal value');
			} else {
				console.log(`✅ Updated ${updatedOpportunities} opportunities\n`);
			}
		} catch (error: any) {
			console.log('⚠️  No opportunities found or error:', error.message);
		}

		// Update franchise deals
		try {
			const deals = await pb.collection('franchise_deals').getFullList();
			let updatedDeals = 0;
			
			for (const deal of deals) {
				if (!deal.dealValue || deal.dealValue !== FRANCHISE_FEE) {
					await pb.collection('franchise_deals').update(deal.id, {
						dealValue: FRANCHISE_FEE
					});
					const oldValue = deal.dealValue ? `$${deal.dealValue.toLocaleString()}` : 'not set';
					console.log(`✅ Updated deal: ${deal.franchiseOwnerName} - ${oldValue} → $${FRANCHISE_FEE.toLocaleString()}`);
					updatedDeals++;
				}
			}
			
			if (updatedDeals === 0) {
				console.log('✓ All deals already have correct deal value');
			} else {
				console.log(`✅ Updated ${updatedDeals} deals\n`);
			}
		} catch (error: any) {
			console.log('⚠️  No deals found or error:', error.message);
		}

		console.log('\n✅ All franchise fees updated to $10,000,000!');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

updateFranchiseFees();
