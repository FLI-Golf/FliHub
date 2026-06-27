import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	ROLE_MENU_CONTROL_ITEMS,
	ROLE_MENU_CONTROL_ROLES,
	createDefaultRoleMenuVisibility,
	type RoleMenuControlRole,
	type RoleMenuVisibility,
} from '$lib/config/role-menu-controls';

const STORE_PATH = path.join(process.cwd(), 'json_data', 'role-menu-visibility.json');

function asObject(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
	return value as Record<string, unknown>;
}

export function normalizeRoleMenuVisibility(input: unknown): RoleMenuVisibility {
	const defaults = createDefaultRoleMenuVisibility();
	const root = asObject(input);

	for (const item of ROLE_MENU_CONTROL_ITEMS) {
		const row = asObject(root[item.url]);
		for (const role of ROLE_MENU_CONTROL_ROLES) {
			const candidate = row[role];
			if (typeof candidate === 'boolean') {
				defaults[item.url][role] = candidate;
			}
		}
	}

	return defaults;
}

export async function getRoleMenuVisibility(): Promise<RoleMenuVisibility> {
	try {
		const raw = await readFile(STORE_PATH, 'utf8');
		return normalizeRoleMenuVisibility(JSON.parse(raw));
	} catch {
		return createDefaultRoleMenuVisibility();
	}
}

export async function saveRoleMenuVisibility(input: unknown): Promise<RoleMenuVisibility> {
	const normalized = normalizeRoleMenuVisibility(input);
	await mkdir(path.dirname(STORE_PATH), { recursive: true });
	await writeFile(STORE_PATH, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
	return normalized;
}

export function canRoleViewControlledMenu(
	role: string,
	url: string,
	visibility: RoleMenuVisibility,
): boolean | undefined {
	if (role === 'admin') return true;

	const matchedUrl = Object.keys(visibility)
		.filter((candidate) => url === candidate || url.startsWith(`${candidate}/`))
		.sort((a, b) => b.length - a.length)[0];

	const row = matchedUrl ? visibility[matchedUrl] : undefined;
	if (!row) return undefined;

	if (!ROLE_MENU_CONTROL_ROLES.includes(role as RoleMenuControlRole)) return false;
	return Boolean(row[role as RoleMenuControlRole]);
}
