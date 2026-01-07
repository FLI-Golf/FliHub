import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type PocketBase from 'pocketbase';

export const GET: RequestHandler = async ({ locals }) => {
  const pb = locals.pb as PocketBase;

  // Check if user is admin
  if (!pb.authStore.isValid) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

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
