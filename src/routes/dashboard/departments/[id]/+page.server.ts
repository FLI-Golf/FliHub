import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { DepartmentRepo } from '$lib/infra/pocketbase/repositories/DepartmentRepo';
import { DepartmentController } from '$lib/domain/controllers/DepartmentController';

export const load: PageServerLoad = async ({ params }) => {
		const controller = new DepartmentController(new DepartmentRepo(pb));
	const result = await controller.getDetail(params.id);

	if (result.isFailure) throw error(404, result.error);

	return { department: result.value };
};
