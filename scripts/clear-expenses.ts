import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function clearExpenses() {
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );

    console.log('🗑️  Clearing all expenses and vendors...\n');

    // Get all expenses
    const expenses = await pb.collection('expenses').getFullList();
    console.log(`Found ${expenses.length} expenses`);

    // Delete all expenses
    let expensesDeleted = 0;
    for (const expense of expenses) {
      try {
        await pb.collection('expenses').delete(expense.id);
        expensesDeleted++;
      } catch (err: any) {
        console.warn(`Could not delete expense ${expense.id}: ${err.message}`);
      }
    }
    console.log(`✅ Deleted ${expensesDeleted} expenses`);

    // Get all vendors
    const vendors = await pb.collection('vendors').getFullList();
    console.log(`\nFound ${vendors.length} vendors`);

    // Delete all vendors
    let vendorsDeleted = 0;
    for (const vendor of vendors) {
      try {
        await pb.collection('vendors').delete(vendor.id);
        vendorsDeleted++;
      } catch (err: any) {
        console.warn(`Could not delete vendor ${vendor.id}: ${err.message}`);
      }
    }
    console.log(`✅ Deleted ${vendorsDeleted} vendors`);

    console.log('\n✅ All expenses and vendors cleared!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

clearExpenses();
