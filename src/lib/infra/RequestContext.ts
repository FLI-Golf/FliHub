/**
 * RequestContext — per-request OOP wrapper for SvelteKit server loads.
 *
 * Solves three recurring problems across all dashboard +page.server.ts files:
 *
 *   1. Auth guard  — every route needs `if (!locals.pb.authStore.isValid) redirect`
 *   2. User identity — `locals.pb.authStore.model?.id` is the logged-in user;
 *                      the admin PB client's model is the admin account, not the user.
 *   3. Admin data access — `locals.pb` has user-role permissions; an admin-authed
 *                          client is needed to read any collection freely.
 *
 * Usage in a +page.server.ts:
 *
 *   export const load: PageServerLoad = async ({ locals, url }) => {
 *     const ctx = await RequestContext.from(locals, url);
 *     // ctx.pb      — admin-authenticated PocketBase (read anything)
 *     // ctx.userId  — logged-in user's PocketBase record ID
 *     // ctx.profile — user_profiles record (role, firstName, etc.)
 *     // ctx.role    — shorthand for ctx.profile?.role ?? 'leader'
 *     // ctx.requireRole('admin', 'sales') — throws redirect if role not allowed
 *   };
 */

import type PocketBase from 'pocketbase';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
const VENDOR_ROLE = env.VENDOR_ROLE ?? 'vendor';
import { getAdminPocketBase } from './pocketbase/pbClient';

export type UserRole = 'admin' | 'sales' | 'leader' | 'vendor' | 'pro' | 'franchise_owner' | 'broadcaster' | 'manager' | 'league_owner' | 'marketing' | 'marketing_lead';

export interface UserProfile {
	id: string;
	userId: string;
	role: UserRole;
	firstName?: string;
	lastName?: string;
	vendorId?: string;
	proReference?: string;
	talentReference?: string;
	[key: string]: unknown;
}

export class RequestContext {
	/** Admin-authenticated PocketBase — use for all collection reads */
	readonly pb: PocketBase;
	/** Logged-in user's PocketBase auth record ID */
	readonly userId: string;
	/** user_profiles record for the logged-in user */
	readonly profile: UserProfile | null;
	/** Current page URL */
	readonly url: URL;

	private constructor(
		pb: PocketBase,
		userId: string,
		profile: UserProfile | null,
		url: URL
	) {
		this.pb = pb;
		this.userId = userId;
		this.profile = profile;
		this.url = url;
	}

	get role(): UserRole {
		return (this.profile?.role as UserRole) ?? 'leader';
	}

	get isAdmin(): boolean {
		return this.role === 'admin';
	}

	/** True when the user is a vendor-portal-only account */
	get isVendor(): boolean {
		return this.role === (VENDOR_ROLE as UserRole);
	}

	get displayName(): string {
		if (this.profile?.firstName) {
			return `${this.profile.firstName} ${this.profile.lastName ?? ''}`.trim();
		}
		return this.userId;
	}

	/**
	 * Throws a 303 redirect if the current user's role is not in the allowed list.
	 * Vendor-role users are always redirected to /vendor/dashboard unless
	 * VENDOR_ROLE is explicitly included in the allowed list.
	 */
	requireRole(...allowed: UserRole[]): void {
		if (this.isVendor && !allowed.includes(VENDOR_ROLE as UserRole)) {
			throw redirect(303, '/vendor/dashboard');
		}
		if (!allowed.includes(this.role)) {
			throw redirect(303, '/dashboard');
		}
	}

	/**
	 * Factory — call at the top of every +page.server.ts load function.
	 *
	 * Automatically:
	 *   - Redirects unauthenticated requests to /auth/login
	 *   - Redirects vendor-role users to /vendor/dashboard (they have their own portal)
	 *
	 * For API route handlers use RequestContext.fromApi() instead — it throws
	 * JSON errors rather than redirects.
	 */
	static async from(
		locals: App.Locals,
		url?: URL
	): Promise<RequestContext> {
		const isValid = locals?.pb?.authStore?.isValid ?? false;
		const userId  = (locals?.pb?.authStore?.model?.id ?? '') as string;

		if (!isValid || !userId) {
			const returnTo = url ? `?redirect=${encodeURIComponent(url.pathname)}` : '';
			throw redirect(303, `/auth/login${returnTo}`);
		}

		const pb = await getAdminPocketBase();

		let profile: UserProfile | null = null;
		try {
			const records = await pb.collection('user_profiles').getFullList({
				filter: `userId = "${userId}"`,
				fields: 'id,userId,role,firstName,lastName,vendorId,proReference,talentReference'
			});
			profile = (records[0] as unknown as UserProfile) ?? null;
		} catch {
			// profile stays null
		}

		const ctx = new RequestContext(pb, userId, profile, url ?? new URL('http://localhost'));

		// Vendor-role users belong in the vendor portal — block all /dashboard access
		if (ctx.isVendor) {
			throw redirect(303, '/vendor/dashboard');
		}

		return ctx;
	}

	/**
	 * Factory for API route handlers (+server.ts).
	 * Returns null instead of throwing a redirect so callers can return JSON errors.
	 *
	 * Usage:
	 *   const ctx = await RequestContext.fromApi(locals);
	 *   if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	 */
	static async fromApi(
		locals: App.Locals,
		url?: URL
	): Promise<RequestContext | null> {
		const isValid = locals?.pb?.authStore?.isValid ?? false;
		const userId  = (locals?.pb?.authStore?.model?.id ?? '') as string;

		if (!isValid || !userId) return null;

		const pb = await getAdminPocketBase();

		let profile: UserProfile | null = null;
		try {
			const records = await pb.collection('user_profiles').getFullList({
				filter: `userId = "${userId}"`,
				fields: 'id,userId,role,firstName,lastName,vendorId,proReference,talentReference'
			});
			profile = (records[0] as unknown as UserProfile) ?? null;
		} catch {
			// profile stays null
		}

		return new RequestContext(pb, userId, profile, url ?? new URL('http://localhost'));
	}
}
