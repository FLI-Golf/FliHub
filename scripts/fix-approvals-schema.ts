import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function fixApprovalsSchema() {
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );

    console.log('🔧 Fixing approvals collection schema...\n');

    // Check if there are existing approvals
    const existingApprovals = await pb.collection('approvals').getFullList();
    console.log(`Found ${existingApprovals.length} existing approvals`);

    if (existingApprovals.length > 0) {
      console.log('⚠️  Warning: There are existing approvals.');
      console.log('   This migration will:');
      console.log('   1. Add new relation fields (projectId, expenseId, budgetId)');
      console.log('   2. Migrate data from entityType+entityId to proper relations');
      console.log('   3. Keep entityType and entityId for backward compatibility\n');
    }

    // Get the approvals collection
    const collection = await pb.collections.getOne('approvals');
    
    const schema = collection.fields || collection.schema || [];
    
    console.log('Current schema:');
    console.log(`  Fields: ${schema.map((f: any) => f.name).join(', ')}\n`);

    // Check if relation fields already exist
    const hasProjectId = schema.some((f: any) => f.name === 'projectId');
    const hasExpenseId = schema.some((f: any) => f.name === 'expenseId');
    const hasBudgetId = schema.some((f: any) => f.name === 'budgetId');

    if (hasProjectId && hasExpenseId && hasBudgetId) {
      console.log('✅ Relation fields already exist. No changes needed.');
      return;
    }

    // Get collection IDs
    console.log('Fetching collection IDs...');
    const projectsCollection = await pb.collections.getOne('projects');
    const expensesCollection = await pb.collections.getOne('expenses');
    
    console.log(`  Projects collection ID: ${projectsCollection.id}`);
    console.log(`  Expenses collection ID: ${expensesCollection.id}`);

    // Add new relation fields
    console.log('\nAdding relation fields...');
    
    const newSchema = [...schema];

    if (!hasProjectId) {
      newSchema.push({
        cascadeDelete: false,
        collectionId: projectsCollection.id,
        hidden: false,
        id: `projectId_${Date.now()}`,
        maxSelect: 1,
        minSelect: 0,
        name: 'projectId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      });
      console.log('  ✓ Added projectId relation');
    }

    if (!hasExpenseId) {
      newSchema.push({
        cascadeDelete: false,
        collectionId: expensesCollection.id,
        hidden: false,
        id: `expenseId_${Date.now() + 1}`,
        maxSelect: 1,
        minSelect: 0,
        name: 'expenseId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      });
      console.log('  ✓ Added expenseId relation');
    }

    // Try to get budgets collection, but don't fail if it doesn't exist
    let budgetsCollectionId = null;
    try {
      const budgetsCollection = await pb.collections.getOne('budgets');
      budgetsCollectionId = budgetsCollection.id;
      console.log(`  Budgets collection ID: ${budgetsCollectionId}`);
    } catch (err) {
      console.log('  ⚠️  Budgets collection does not exist, skipping budgetId field');
    }

    if (!hasBudgetId && budgetsCollectionId) {
      newSchema.push({
        cascadeDelete: false,
        collectionId: budgetsCollectionId,
        hidden: false,
        id: `budgetId_${Date.now() + 2}`,
        maxSelect: 1,
        minSelect: 0,
        name: 'budgetId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      });
      console.log('  ✓ Added budgetId relation');
    }

    // Update the collection
    await pb.collections.update(collection.id, {
      fields: newSchema
    });
    console.log('\n✅ Schema updated successfully!');

    // Migrate existing data
    if (existingApprovals.length > 0) {
      console.log('\n📦 Migrating existing approval data...');
      
      let migrated = 0;
      for (const approval of existingApprovals) {
        try {
          const updates: any = {};
          
          if (approval.entityType === 'project' && approval.entityId) {
            updates.projectId = approval.entityId;
          } else if (approval.entityType === 'expense' && approval.entityId) {
            updates.expenseId = approval.entityId;
          } else if (approval.entityType === 'budget' && approval.entityId) {
            updates.budgetId = approval.entityId;
          }

          if (Object.keys(updates).length > 0) {
            await pb.collection('approvals').update(approval.id, updates);
            migrated++;
          }
        } catch (err: any) {
          console.warn(`  ⚠️  Could not migrate approval ${approval.id}: ${err.message}`);
        }
      }
      
      console.log(`  ✓ Migrated ${migrated} approvals`);
    }

    console.log('\n✅ Approvals collection schema fixed!');
    console.log('\n📝 New structure:');
    console.log('   - projectId (relation to projects)');
    console.log('   - expenseId (relation to expenses)');
    console.log('   - budgetId (relation to budgets)');
    console.log('   - entityType & entityId (kept for backward compatibility)');
    console.log('\n💡 Going forward, use the relation fields instead of entityType+entityId');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
  }
}

fixApprovalsSchema();
