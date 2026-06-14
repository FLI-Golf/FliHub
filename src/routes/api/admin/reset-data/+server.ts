import { json } from '@sveltejs/kit';
import { requireAdminNonProductionApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';
import type PocketBase from 'pocketbase';

export const POST: RequestHandler = async ({ request, locals, url }) => {
  const guard = await requireAdminNonProductionApi(locals, url);
  if (guard.error) return guard.error;
  const pb = guard.ctx.pb as PocketBase;

  try {
    const { deleteExpenses = false, deleteVendors = false, confirmation } = await request.json();

    // Require confirmation
    if (confirmation !== 'CONFIRM') {
      return json({ error: 'Confirmation required. Send confirmation: "CONFIRM"' }, { status: 400 });
    }

    const deleted: any = {};

    // Delete expenses
    if (deleteExpenses) {
      const expenses = await pb.collection('expenses').getFullList();
      for (const expense of expenses) {
        await pb.collection('expenses').delete(expense.id);
      }
      deleted.expenses = expenses.length;
    }

    // Delete vendors
    if (deleteVendors) {
      const vendors = await pb.collection('vendors').getFullList();
      for (const vendor of vendors) {
        await pb.collection('vendors').delete(vendor.id);
      }
      deleted.vendors = vendors.length;
    }

    return json({
      success: true,
      deleted
    });

  } catch (error: any) {
    console.error('Reset data error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};
