import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-production-6ab5.up.railway.app');

// Authenticate as admin
await pb.admins.authWithPassword('ddinsmore8@gmail.com', 'MADcap(123)');

console.log('Seeding league data...');

// Create FLI Golf League
const league = await pb.collection('league').create({
  name: 'FLI Golf',
  slug: 'fli-golf',
  description: 'Professional disc golf league featuring 12 franchises competing across men\'s and women\'s divisions',
  tagline: 'The Future of Professional Disc Golf',
  status: 'active',
  foundedYear: 2024,
  
  // Financial projections
  projectedRevenue: 5000000,
  
  // Brand colors (placeholder - update with actual colors)
  primaryColor: '#000000',
  secondaryColor: '#FFFFFF',
  
  // Social media (placeholder)
  socialMedia: {
    twitter: '@FLIGolf',
    instagram: '@fligolf',
    facebook: 'FLIGolf',
    youtube: 'FLIGolf'
  },
  
  notes: 'Main league entity managing 12 franchises with men\'s and women\'s divisions'
});

console.log('✅ League created successfully!');
console.log(`League ID: ${league.id}`);
console.log(`Name: ${league.name}`);
console.log(`Slug: ${league.slug}`);
