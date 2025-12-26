import PocketBase from 'pocketbase';
import * as fs from 'fs';
import * as path from 'path';

// Get credentials from command line args or environment
const pbUrl = process.argv[2] || process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app';
const adminEmail = process.argv[3] || process.env.POCKETBASE_ADMIN_EMAIL;
const adminPassword = process.argv[4] || process.env.POCKETBASE_ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error('❌ Missing credentials!');
  console.error('Usage: npx tsx scripts/migrate-collections.ts [url] [email] [password]');
  console.error('Or set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD environment variables');
  process.exit(1);
}

const pb = new PocketBase(pbUrl);

console.log(`🔗 Connecting to: ${pbUrl}`);
console.log(`👤 Using email: ${adminEmail}`);

interface FieldDefinition {
  id: string;
  name: string;
  type: string;
  required: boolean;
  presentable?: boolean;
  unique?: boolean;
  options: any;
  system?: boolean;
  hidden?: boolean;
  autogeneratePattern?: string;
  pattern?: string;
  primaryKey?: boolean;
  min?: number;
  max?: number;
}

interface CollectionDefinition {
  id: string;
  name: string;
  type: string;
  fields: FieldDefinition[];
  listRule: string;
  viewRule: string;
  createRule: string;
  updateRule: string;
  deleteRule: string;
  indexes: any[];
  system: boolean;
}

async function authenticate() {
  try {
    // Try admin authentication first
    const authData = await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Authenticated as admin');
    return authData;
  } catch (error: any) {
    console.error('❌ Admin authentication failed');
    console.error('   Error:', error.message);
    
    // Fallback to user authentication
    console.log('🔄 Trying user authentication...');
    try {
      const authData = await pb.collection('users').authWithPassword(adminEmail, adminPassword);
      console.log('✅ Authenticated as user');
      console.log('⚠️  Note: User accounts cannot manage collections. You need admin access.');
      return authData;
    } catch (userError: any) {
      console.error('❌ User authentication also failed');
      console.error('   Error:', userError.message);
      throw new Error('Authentication failed with both admin and user credentials');
    }
  }
}

async function getExistingCollections() {
  try {
    const collections = await pb.collections.getFullList();
    console.log(`📋 Found ${collections.length} existing collections`);
    return collections;
  } catch (error) {
    console.error('❌ Failed to fetch collections:', error);
    throw error;
  }
}

async function updateCollection(collectionDef: CollectionDefinition, existingCollection: any) {
  try {
    console.log(`\n🔄 Updating collection: ${collectionDef.name}`);
    
    // Filter out the system id field from our definition
    const customFields = collectionDef.fields.filter(f => f.name !== 'id');
    
    // Prepare the update payload
    const updateData = {
      name: collectionDef.name,
      type: collectionDef.type,
      schema: customFields.map(field => ({
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        presentable: field.presentable || false,
        unique: field.unique || false,
        options: field.options
      })),
      listRule: collectionDef.listRule,
      viewRule: collectionDef.viewRule,
      createRule: collectionDef.createRule,
      updateRule: collectionDef.updateRule,
      deleteRule: collectionDef.deleteRule,
      indexes: collectionDef.indexes
    };

    const updated = await pb.collections.update(existingCollection.id, updateData);
    console.log(`✅ Updated ${collectionDef.name} with ${customFields.length} fields`);
    return updated;
  } catch (error: any) {
    console.error(`❌ Failed to update ${collectionDef.name}:`, error.message);
    if (error.data) {
      console.error('Error details:', JSON.stringify(error.data, null, 2));
    }
    throw error;
  }
}

async function createCollection(collectionDef: CollectionDefinition) {
  try {
    console.log(`\n➕ Creating collection: ${collectionDef.name}`);
    
    // Filter out the system id field
    const customFields = collectionDef.fields.filter(f => f.name !== 'id');
    
    const createData = {
      name: collectionDef.name,
      type: collectionDef.type,
      schema: customFields.map(field => ({
        name: field.name,
        type: field.type,
        required: field.required,
        presentable: field.presentable || false,
        unique: field.unique || false,
        options: field.options
      })),
      listRule: collectionDef.listRule,
      viewRule: collectionDef.viewRule,
      createRule: collectionDef.createRule,
      updateRule: collectionDef.updateRule,
      deleteRule: collectionDef.deleteRule,
      indexes: collectionDef.indexes
    };

    const created = await pb.collections.create(createData);
    console.log(`✅ Created ${collectionDef.name} with ${customFields.length} fields`);
    return created;
  } catch (error: any) {
    console.error(`❌ Failed to create ${collectionDef.name}:`, error.message);
    if (error.data) {
      console.error('Error details:', JSON.stringify(error.data, null, 2));
    }
    throw error;
  }
}

async function migrate() {
  console.log('🚀 Starting collection migration...\n');

  // Load collection definitions
  const jsonPath = path.join(process.cwd(), 'json_data', 'pocketbase-import-no-relations.json');
  const collectionDefs: CollectionDefinition[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  
  console.log(`📦 Loaded ${collectionDefs.length} collection definitions`);

  // Authenticate
  await authenticate();

  // Get existing collections
  const existingCollections = await getExistingCollections();
  const existingMap = new Map(existingCollections.map(c => [c.name, c]));

  // Process each collection
  let updated = 0;
  let created = 0;
  let failed = 0;

  for (const collectionDef of collectionDefs) {
    try {
      const existing = existingMap.get(collectionDef.name);
      
      if (existing) {
        await updateCollection(collectionDef, existing);
        updated++;
      } else {
        await createCollection(collectionDef);
        created++;
      }
    } catch (error) {
      failed++;
      console.error(`\n⚠️  Skipping ${collectionDef.name} due to error\n`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ➕ Created: ${created}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️  Migration completed with errors');
    process.exit(1);
  }
}

// Run migration
migrate().catch(error => {
  console.error('\n💥 Migration failed:', error);
  process.exit(1);
});
