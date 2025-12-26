import * as fs from 'fs';
import * as path from 'path';

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

console.log('📦 Preparing PocketBase import file...\n');

// Load collection definitions
const jsonPath = path.join(process.cwd(), 'json_data', 'pocketbase-import-no-relations.json');
const collectionDefs: CollectionDefinition[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log(`Found ${collectionDefs.length} collections:\n`);

collectionDefs.forEach((col, idx) => {
  const customFields = col.fields.filter(f => f.name !== 'id');
  console.log(`${idx + 1}. ${col.name}`);
  console.log(`   - Type: ${col.type}`);
  console.log(`   - Fields: ${customFields.length}`);
  console.log(`   - Field names: ${customFields.map(f => f.name).join(', ')}`);
  console.log('');
});

console.log('=' .repeat(60));
console.log('📋 IMPORT INSTRUCTIONS');
console.log('='.repeat(60));
console.log('');
console.log('1. Go to PocketBase Admin UI:');
console.log('   https://pocketbase-production-6ab5.up.railway.app/_/');
console.log('');
console.log('2. Navigate to Settings → Import collections');
console.log('');
console.log('3. IMPORTANT: Before importing, delete these empty collections:');
collectionDefs.forEach(col => {
  console.log(`   - ${col.name}`);
});
console.log('');
console.log('4. Upload this file:');
console.log(`   ${jsonPath}`);
console.log('');
console.log('5. Review the import preview and confirm');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('⚠️  Alternative: Manual Field Addition');
console.log('');
console.log('If import fails, you can add fields manually to each collection.');
console.log('See docs/MANUAL_COLLECTION_SETUP.md for detailed instructions.');
console.log('');

// Validate JSON structure
console.log('🔍 Validating JSON structure...\n');

let hasErrors = false;

collectionDefs.forEach(col => {
  const errors: string[] = [];
  
  if (!col.id) errors.push('Missing id');
  if (!col.name) errors.push('Missing name');
  if (!col.type) errors.push('Missing type');
  if (!col.fields || col.fields.length === 0) errors.push('No fields defined');
  
  // Check for system id field
  const idField = col.fields.find(f => f.name === 'id');
  if (!idField) {
    errors.push('Missing system id field');
  }
  
  // Check custom fields
  const customFields = col.fields.filter(f => f.name !== 'id');
  customFields.forEach(field => {
    if (!field.id) errors.push(`Field ${field.name} missing id`);
    if (!field.type) errors.push(`Field ${field.name} missing type`);
  });
  
  if (errors.length > 0) {
    console.log(`❌ ${col.name}:`);
    errors.forEach(err => console.log(`   - ${err}`));
    hasErrors = true;
  } else {
    console.log(`✅ ${col.name}: Valid (${customFields.length} custom fields)`);
  }
});

console.log('');

if (hasErrors) {
  console.log('❌ Validation failed! Fix errors before importing.');
  process.exit(1);
} else {
  console.log('✅ All collections are valid and ready for import!');
  console.log('');
  console.log(`📄 Import file: ${jsonPath}`);
}
