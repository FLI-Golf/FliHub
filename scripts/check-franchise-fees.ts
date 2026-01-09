import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function checkFees() {
	await pb.admins.authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);

	console.log('📊 Current Franchise Fees:\n');

	console.log('Territories:');
	const territories = await pb.collection('franchise_territories').getFullList();
	territories.forEach(t => {
		const price = t.price ? `$${t.price.toLocaleString()}` : 'not set';
		console.log(`  • ${t.name || 'Unnamed'}: ${price}`);
	});

	console.log('\nOpportunities:');
	const opportunities = await pb.collection('franchise_opportunities').getFullList();
	opportunities.forEach(o => {
		const value = o.dealValue ? `$${o.dealValue.toLocaleString()}` : 'not set';
		console.log(`  • ${o.opportunityName || 'Unnamed'}: ${value}`);
	});

	console.log('\nDeals:');
	const deals = await pb.collection('franchise_deals').getFullList();
	if (deals.length === 0) {
		console.log('  (No deals yet)');
	} else {
		deals.forEach(d => {
			const value = d.dealValue ? `$${d.dealValue.toLocaleString()}` : 'not set';
			console.log(`  • ${d.franchiseOwnerName || 'Unnamed'}: ${value}`);
		});
	}
}

checkFees();
