import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const pageParam = Number(url.searchParams.get('page') ?? '1');
		const perPageParam = Number(url.searchParams.get('perPage') ?? '50');
		const sort = url.searchParams.get('sort') ?? 'name';
		const baseFilter = (url.searchParams.get('filter') ?? '').trim();
		const search = (url.searchParams.get('search') ?? '').trim();

		const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
		const perPage = Number.isFinite(perPageParam)
			? Math.min(200, Math.max(1, Math.floor(perPageParam)))
			: 50;

		const escapedSearch = search.replace(/"/g, '\\"');
		const searchFilter = escapedSearch
			? `(name ~ "${escapedSearch}" || code ~ "${escapedSearch}" || description ~ "${escapedSearch}")`
			: '';

		const filter = [baseFilter, searchFilter].filter(Boolean).join(' && ');

		const result = await locals.pb.collection('departments').getList(page, perPage, {
			sort,
			filter,
			expand: 'headOfDepartment'
		});

		return json(result);
	} catch (error: any) {
		console.error('Error listing departments:', error);
		return json(
			{ message: error?.message || 'Failed to list departments' },
			{ status: error?.status || 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const data = await request.json();

		const createData = { ...data };
		if (data.department_annual_budget !== undefined) {
			const budget = Number(data.department_annual_budget) || 0;
			createData.department_annual_budget = budget;
			createData.department_budget_mode = 'allocated';
			createData.department_budget_cap = budget;
		}

		let department;
		try {
			department = await locals.pb.collection('departments').create(createData);
		} catch (error: any) {
			if (
				data.department_annual_budget === undefined ||
				!String(error?.response?.message || error?.message || '').toLowerCase().includes('unknown')
			) {
				throw error;
			}

			const { department_budget_mode, department_budget_cap, ...fallbackData } = createData;
			department = await locals.pb.collection('departments').create(fallbackData);
		}
		
		return json(department, { status: 201 });
	} catch (error: any) {
		console.error('Error creating department:', error);
		return json(
			{ message: error?.message || 'Failed to create department' },
			{ status: error?.status || 500 }
		);
	}
};
