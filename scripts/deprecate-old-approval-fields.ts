import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function deprecateOldFields() {
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );

    console.log('🔧 Deprecating old approval fields...\n');

    // Get the approvals collection
    const collection = await pb.collections.getOne('approvals');
    const fields = collection.fields || collection.schema || [];
    
    console.log('Current field requirements:');
    const entityTypeField = fields.find((f: any) => f.name === 'entityType');
    const entityIdField = fields.find((f: any) => f.name === 'entityId');
    
    console.log(`  entityType: required=${entityTypeField?.required}`);
    console.log(`  entityId: required=${entityIdField?.required}`);

    if (!entityTypeField?.required && !entityIdField?.required) {
      console.log('\n✅ Fields are already optional. No changes needed.');
      return;
    }

    // Update the fields to be optional
    console.log('\nMaking fields optional...');
    
    const updatedFields = fields.map((f: any) => {
      if (f.name === 'entityType' || f.name === 'entityId') {
        return {
          ...f,
          required: false
        };
      }
      return f;
    });

    await pb.collections.update(collection.id, {
      fields: updatedFields
    });

    console.log('✅ Fields updated successfully!\n');
    console.log('📝 Changes:');
    console.log('  entityType: required=false (deprecated)');
    console.log('  entityId: required=false (deprecated)');
    console.log('\n💡 Going forward:');
    console.log('  ✅ Use: projectId, expenseId, budgetId (relation fields)');
    console.log('  ⚠️  Avoid: entityType + entityId (deprecated)');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
  }
}

deprecateOldFields();
