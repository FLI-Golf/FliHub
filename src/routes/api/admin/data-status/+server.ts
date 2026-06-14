import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';
import type PocketBase from 'pocketbase';

export const GET: RequestHandler = async ({ locals, url }) => {
  const guard = await requireAdminApi(locals, url);
  if (guard.error) return guard.error;
  const pb = guard.ctx.pb as PocketBase;

  try {
    // Get counts for all collections
    const [departments, projects, tasks, expenses, vendors] = await Promise.all([
      pb.collection('departments').getList(1, 1),
      pb.collection('projects').getList(1, 1),
      pb.collection('tasks').getList(1, 1),
      pb.collection('expenses').getList(1, 1),
      pb.collection('vendors').getList(1, 1)
    ]);

    const counts = {
      departments: departments.totalItems,
      projects: projects.totalItems,
      tasks: tasks.totalItems,
      expenses: expenses.totalItems,
      vendors: vendors.totalItems
    };

    // Determine mode based on data
    let mode = 'blueprint';
    if (counts.expenses > 0 || counts.vendors > 0) {
      mode = 'testing';
    }

    return json({
      mode,
      counts,
      hasTestData: counts.expenses > 0 || counts.vendors > 0,
      hasBlueprint: counts.departments > 0 && counts.projects > 0 && counts.tasks > 0
    });

  } catch (error: any) {
    console.error('Data status error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};
