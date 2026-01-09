import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function checkSponsors() {
	await pb.admins.authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);

	console.log('📊 Sponsor Data:\n');

	const sponsors = await pb.collection('sponsors').getFullList();
	console.log(`Total sponsors: ${sponsors.length}\n`);

	sponsors.forEach((s: any) => {
		console.log(`${s.companyName}`);
		console.log(`  Tier: ${s.tier}`);
		console.log(`  Status: ${s.status}`);
		console.log(`  Type: ${s.type}`);
		console.log(`  Franchise Interest: ${s.franchiseInterest ? 'Yes' : 'No'}`);
		console.log(`  Annual Commitment: $${s.annualCommitment?.toLocaleString() || 0}`);
		console.log('');
	});

	const bridges = await pb.collection('sponsor_franchise_bridge').getFullList();
	console.log(`\n🌉 Conversion Bridges: ${bridges.length}\n`);

	bridges.forEach((b: any) => {
		console.log(`Bridge ID: ${b.id}`);
		console.log(`  Status: ${b.status}`);
		console.log(`  Sponsorship Value: $${b.sponsorshipValueToDate?.toLocaleString() || 0}`);
		console.log(`  Franchise Fee Discount: $${b.franchiseFeeDiscount?.toLocaleString() || 0}`);
		console.log(`  Net Franchise Fee: $${b.netFranchiseFee?.toLocaleString() || 0}`);
		console.log('');
	});
}

checkSponsors();
