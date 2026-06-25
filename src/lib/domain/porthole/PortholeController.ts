/**
 * PortholeController — governs routing, access guards, and navigation
 * decoration for each role's porthole.
 *
 * Usage (server-side):
 *   const ctrl = PortholeControllerFactory.for('pro');
 *   ctrl.getLandingUrl()          // → '/portal/dashboard'
 *   ctrl.decorateNav(items)       // adds { external: true } to off-portal links
 *   ctrl.canAccessAdminDashboard() // → false for pro, true for admin
 */

import { PortholeFactory, type PortalRole, type PortholeNavItem } from './RolePorthole';

const PORTAL_PREFIXES = ['/portal/', '/vendor/'];
const ADMIN_ROLES     = new Set<PortalRole>(['admin', 'league_owner']);

export type DecoratedNavItem = PortholeNavItem & { external: boolean };

export class PortholeController {
	private readonly role: PortalRole;

	constructor(role: string) {
		this.role = role as PortalRole;
	}

	// ── Access ───────────────────────────────────────────────────────────────

	/** Admin and league owners intentionally have full dashboard access. */
	canAccessAdminDashboard(): boolean {
		return ADMIN_ROLES.has(this.role);
	}

	/** Vendor role uses its own isolated portal, not /portal. */
	isVendorRole(): boolean {
		return this.role === 'vendor';
	}

	// ── Routing ──────────────────────────────────────────────────────────────

	/** URL the user should land on after successful login. */
	getLandingUrl(): string {
		if (this.isVendorRole()) return '/vendor/dashboard';
		return '/portal/dashboard';
	}

	/** Whether a given href stays within the porthole shell. */
	isPortalBound(href: string): boolean {
		return PORTAL_PREFIXES.some(prefix => href.startsWith(prefix));
	}

	// ── Navigation decoration ────────────────────────────────────────────────

	/**
	 * Takes raw nav items from the porthole config and marks each one as
	 * `external: true` when it would leave the portal layout (i.e. goes to
	 * `/dashboard/*` without the porthole wrapper).
	 *
	 * Admin-class roles are exempt — their external links are intentional.
	 */
	decorateNav(items: PortholeNavItem[]): DecoratedNavItem[] {
		return items.map(item => ({
			...item,
			external: !this.isPortalBound(item.href) && !this.canAccessAdminDashboard(),
		}));
	}

	// ── Guard ────────────────────────────────────────────────────────────────

	/** Returns a redirect URL if the user should not be on this path, null if OK. */
	guardPath(path: string): string | null {
		// Vendor should be in /vendor, not /portal
		if (this.isVendorRole() && path.startsWith('/portal/')) {
			return '/vendor/dashboard';
		}
		return null;
	}
}

// ── Factory ───────────────────────────────────────────────────────────────────

export class PortholeControllerFactory {
	private static cache = new Map<string, PortholeController>();

	static for(role: string): PortholeController {
		if (!this.cache.has(role)) {
			this.cache.set(role, new PortholeController(role));
		}
		return this.cache.get(role)!;
	}

	/** Convenience: get the landing URL for a role string. */
	static landingUrl(role: string): string {
		return this.for(role).getLandingUrl();
	}
}
