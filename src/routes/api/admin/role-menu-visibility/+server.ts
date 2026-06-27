import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import {
	ROLE_MENU_CONTROL_ITEMS,
	ROLE_MENU_CONTROL_ROLES,
} from '$lib/config/role-menu-controls';
import {
	getRoleMenuVisibility,
	saveRoleMenuVisibility,
} from '$lib/server/role-menu-visibility';

export const GET = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (ctx.role !== 'admin') return json({ message: 'Forbidden' }, { status: 403 });

	const visibility = await getRoleMenuVisibility();
	return json({ roles: ROLE_MENU_CONTROL_ROLES, items: ROLE_MENU_CONTROL_ITEMS, visibility });
};

export const POST = async ({ locals, request, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (ctx.role !== 'admin') return json({ message: 'Forbidden' }, { status: 403 });

	const payload = await request.json().catch(() => null) as { visibility?: unknown } | null;
	const visibility = await saveRoleMenuVisibility(payload?.visibility ?? null);

	return json({ roles: ROLE_MENU_CONTROL_ROLES, items: ROLE_MENU_CONTROL_ITEMS, visibility });
};
