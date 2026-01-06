import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const data = await request.json();
		
		const department = await locals.pb.collection('departments_collection').create(data);
		
		return json(department, { status: 201 });
	} catch (error: any) {
		console.error('Error creating department:', error);
		return json(
			{ message: error?.message || 'Failed to create department' },
			{ status: error?.status || 500 }
		);
	}
};
