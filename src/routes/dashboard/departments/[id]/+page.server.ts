import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { DepartmentRepo } from '$lib/infra/pocketbase/repositories/DepartmentRepo';
import { DepartmentController } from '$lib/domain/controllers/DepartmentController';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const controller = new DepartmentController(new DepartmentRepo(ctx.pb));
	const result = await controller.getDetail(params.id);

	if (result.isFailure) throw error(404, result.error);

	return { department: result.value };
};
