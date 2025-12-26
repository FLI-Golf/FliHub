import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-production-6ab5.up.railway.app');

async function fixCollections() {
  try {
    await pb.admins.authWithPassword('ddinsmore8@gmail.com', 'MADcap(123)');
    console.log('✅ Connected to PocketBase\n');

    const collections = await pb.collections.getFullList();
    
    // Collections to delete and recreate
    const toFix = [
      'brand_positioning',
      'budgets',
      'business_objectives',
      'campaigns',
      'continuous_improvements',
      'digital_marketing_strategies',
      'marketing_goals',
      'swot_analysis',
      'kpis'
    ];

    // Delete empty collections
    for (const name of toFix) {
      const col = collections.find(c => c.name === name);
      if (col) {
        console.log(`🗑️  Deleting ${name}...`);
        await pb.collections.delete(col.id);
      }
    }

    console.log('\n✅ Deleted empty collections');
    console.log('\nNow run the migration script again to recreate them properly.');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

fixCollections();
