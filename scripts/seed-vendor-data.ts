import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function seedVendorData() {
	console.log('🌱 Seeding vendor data...\n');

	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);
		console.log('✓ Authenticated as admin\n');

		// Check if collection exists
		try {
			await pb.collection('vendors').getList(1, 1);
			console.log('✓ Vendors collection exists');
		} catch (err) {
			console.log('⚠️  Vendors collection does not exist - skipping vendor seeding');
			return;
		}

		// Seed Vendors
		console.log('\n📦 Seeding Vendors...');
		const vendors = [
			{
				name: 'Innova Discs',
				category: 'Equipment',
				status: 'active',
				contactName: 'Dave Dunipace',
				contactEmail: 'sales@innovadiscs.com',
				phone: '909-394-0060',
				address: '1200 W 5th St, Ontario, CA 91762',
				website: 'https://www.innovadiscs.com',
				paymentTerms: 'Net 30',
				notes: 'Primary disc supplier, excellent quality and service'
			},
			{
				name: 'Discraft',
				category: 'Equipment',
				status: 'active',
				contactName: 'Jim Kenner',
				contactEmail: 'info@discraft.com',
				phone: '734-482-5145',
				address: '1234 Disc Dr, Wixom, MI 48393',
				website: 'https://www.discraft.com',
				paymentTerms: 'Net 30',
				notes: 'Secondary disc supplier, great for special orders'
			},
			{
				name: 'Dynamic Discs',
				category: 'Equipment',
				status: 'active',
				contactName: 'Jeremy Rusco',
				contactEmail: 'sales@dynamicdiscs.com',
				phone: '785-865-8815',
				address: '3105 Haskell Ave, Emporia, KS 66801',
				website: 'https://www.dynamicdiscs.com',
				paymentTerms: 'Net 30',
				notes: 'Tournament supplies and player packs'
			},
			{
				name: 'MVP Disc Sports',
				category: 'Equipment',
				status: 'active',
				contactName: 'Brad Schick',
				contactEmail: 'info@mvpdiscsports.com',
				phone: '734-482-5145',
				address: '123 MVP Way, Marlette, MI 48453',
				website: 'https://www.mvpdiscsports.com',
				paymentTerms: 'Net 30',
				notes: 'Premium discs and accessories'
			},
			{
				name: 'UDisc',
				category: 'Technology',
				status: 'active',
				contactName: 'Matt Krueger',
				contactEmail: 'support@udisc.com',
				phone: '612-555-0100',
				address: '123 Tech Blvd, Minneapolis, MN 55401',
				website: 'https://www.udisc.com',
				paymentTerms: 'Net 15',
				notes: 'Scoring app and tournament management software'
			},
			{
				name: 'Jomez Productions',
				category: 'Media',
				status: 'active',
				contactName: 'Jonathan Gomez',
				contactEmail: 'contact@jomezpro.com',
				phone: '704-555-0200',
				address: '456 Media St, Charlotte, NC 28202',
				website: 'https://www.jomezpro.com',
				paymentTerms: 'Net 30',
				notes: 'Video production and tournament coverage'
			},
			{
				name: 'Disc Golf Network',
				category: 'Media',
				status: 'active',
				contactName: 'Terry Miller',
				contactEmail: 'info@discgolfnetwork.com',
				phone: '503-555-0300',
				address: '789 Stream Ave, Portland, OR 97201',
				website: 'https://www.discgolfnetwork.com',
				paymentTerms: 'Net 30',
				notes: 'Live streaming and media coverage'
			},
			{
				name: 'Tournament Central',
				category: 'Services',
				status: 'active',
				contactName: 'Mike Smith',
				contactEmail: 'info@tournamentcentral.com',
				phone: '512-555-0400',
				address: '321 Event Rd, Austin, TX 78701',
				website: 'https://www.tournamentcentral.com',
				paymentTerms: 'Net 15',
				notes: 'Tournament management and registration services'
			},
			{
				name: 'Ace Printing Co',
				category: 'Marketing',
				status: 'active',
				contactName: 'Sarah Johnson',
				contactEmail: 'orders@aceprinting.com',
				phone: '303-555-0500',
				address: '654 Print Ln, Denver, CO 80202',
				website: 'https://www.aceprinting.com',
				paymentTerms: 'Net 30',
				notes: 'Banners, posters, and promotional materials'
			},
			{
				name: 'Event Tents Plus',
				category: 'Equipment',
				status: 'active',
				contactName: 'Tom Anderson',
				contactEmail: 'sales@eventtentsplus.com',
				phone: '602-555-0600',
				address: '987 Tent Way, Phoenix, AZ 85001',
				website: 'https://www.eventtentsplus.com',
				paymentTerms: 'Net 30',
				notes: 'Tents, tables, and event equipment rental'
			},
			{
				name: 'Disc Golf Apparel Co',
				category: 'Merchandise',
				status: 'active',
				contactName: 'Lisa Chen',
				contactEmail: 'wholesale@dgapparel.com',
				phone: '206-555-0700',
				address: '147 Fashion St, Seattle, WA 98101',
				website: 'https://www.dgapparel.com',
				paymentTerms: 'Net 30',
				notes: 'Custom jerseys and team apparel'
			},
			{
				name: 'Trophy Masters',
				category: 'Awards',
				status: 'active',
				contactName: 'Robert Williams',
				contactEmail: 'orders@trophymasters.com',
				phone: '214-555-0800',
				address: '258 Award Ave, Dallas, TX 75201',
				website: 'https://www.trophymasters.com',
				paymentTerms: 'Net 30',
				notes: 'Trophies, medals, and awards'
			},
			{
				name: 'Disc Golf Course Design LLC',
				category: 'Services',
				status: 'inactive',
				contactName: 'John Houck',
				contactEmail: 'info@dgcoursedesign.com',
				phone: '828-555-0900',
				address: '369 Design Dr, Asheville, NC 28801',
				website: 'https://www.dgcoursedesign.com',
				paymentTerms: 'Net 30',
				notes: 'Course design and installation - project completed'
			},
			{
				name: 'Social Media Boost',
				category: 'Marketing',
				status: 'active',
				contactName: 'Emily Rodriguez',
				contactEmail: 'hello@socialmediaboost.com',
				phone: '415-555-1000',
				address: '741 Digital Blvd, San Francisco, CA 94102',
				website: 'https://www.socialmediaboost.com',
				paymentTerms: 'Net 15',
				notes: 'Social media management and advertising'
			},
			{
				name: 'Catering Excellence',
				category: 'Food & Beverage',
				status: 'active',
				contactName: 'Maria Garcia',
				contactEmail: 'events@cateringexcellence.com',
				phone: '702-555-1100',
				address: '852 Culinary Way, Las Vegas, NV 89101',
				website: 'https://www.cateringexcellence.com',
				paymentTerms: 'Net 15',
				notes: 'Tournament catering and concessions'
			}
		];

		const vendorIds: string[] = [];
		for (const vendor of vendors) {
			try {
				const record = await pb.collection('vendors').create(vendor);
				vendorIds.push(record.id);
				console.log(`  ✓ Created vendor: ${vendor.name} (${vendor.category})`);
			} catch (err: any) {
				console.log(`  ✗ Failed to create vendor ${vendor.name}:`, err.message);
			}
		}

		console.log('\n✅ Vendor data seeding completed!\n');
		console.log('Summary:');
		console.log(`  - ${vendors.length} vendors created`);
		console.log(`  - ${vendors.filter(v => v.status === 'active').length} active vendors`);
		console.log(`  - ${vendors.filter(v => v.status === 'inactive').length} inactive vendors`);
		console.log('\nVendors by Category:');
		const categories = vendors.reduce((acc, v) => {
			acc[v.category] = (acc[v.category] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		Object.entries(categories).forEach(([category, count]) => {
			console.log(`  - ${category}: ${count}`);
		});

	} catch (error: any) {
		console.error('❌ Error seeding vendor data:', error.message);
		process.exit(1);
	}
}

seedVendorData();
