import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { RequestContext } from './RequestContext';

function isProductionEnv(): boolean {
	const value = String(env.NODE_ENV ?? '').toLowerCase();
	return value === 'production';
}

export async function requireAdminApi(locals: App.Locals, url?: URL) {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) {
		return { ctx: null, error: json({ message: 'Unauthorized' }, { status: 401 }) };
	}
	if (ctx.role !== 'admin') {
		return { ctx: null, error: json({ message: 'Admin access required' }, { status: 403 }) };
	}
	return { ctx, error: null };
}

export async function requireAdminNonProductionApi(locals: App.Locals, url?: URL) {
	const guard = await requireAdminApi(locals, url);
	if (guard.error) return guard;

	if (isProductionEnv()) {
		return {
			ctx: null,
			error: json({ message: 'This endpoint is disabled in production' }, { status: 403 })
		};
	}

	return guard;
}
