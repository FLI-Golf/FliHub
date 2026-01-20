import { redirect } from '@sveltejs/kit';
import type { RoleProvider } from './RoleProvider';
import type { UserRole, Resource, Action, Scope } from './types';
import { DEFAULT_ROUTES } from './types';

/**
 * PermissionGuard - Route and resource protection utilities
 * 
 * Responsibilities:
 * - Guard routes based on roles
 * - Guard resources based on permissions
 * - Provide redirect logic based on roles
 */
export class PermissionGuard {
	constructor(private roleProvider: RoleProvider) {}

	/**
	 * Require user to have one of the specified roles
	 * Throws redirect if user doesn't have required role
	 */
	async requireRole(userId: string, ...roles: UserRole[]): Promise<void> {
		const userRole = await this.roleProvider.getUserRole(userId);

		if (!userRole || !roles.includes(userRole)) {
			const defaultRoute = userRole ? DEFAULT_ROUTES[userRole] : '/auth/login';
			throw redirect(303, defaultRoute);
		}
	}

	/**
	 * Require user to have permission for resource/action
	 * Throws redirect if user doesn't have permission
	 */
	async requirePermission(
		userId: string,
		resource: Resource,
		action: Action,
		scope: Scope = 'all'
	): Promise<void> {
		const hasPermission = await this.roleProvider.canAccess(userId, resource, action, scope);

		if (!hasPermission) {
			const userRole = await this.roleProvider.getUserRole(userId);
			const defaultRoute = userRole ? DEFAULT_ROUTES[userRole] : '/auth/login';
			throw redirect(303, defaultRoute);
		}
	}

	/**
	 * Check if user has role (returns boolean, doesn't throw)
	 */
	async checkRole(userId: string, ...roles: UserRole[]): Promise<boolean> {
		const userRole = await this.roleProvider.getUserRole(userId);
		return userRole !== null && roles.includes(userRole);
	}

	/**
	 * Check if user has permission (returns boolean, doesn't throw)
	 */
	async checkPermission(
		userId: string,
		resource: Resource,
		action: Action,
		scope: Scope = 'all'
	): Promise<boolean> {
		return await this.roleProvider.canAccess(userId, resource, action, scope);
	}

	/**
	 * Get default route for user's role
	 */
	async getDefaultRoute(userId: string): Promise<string> {
		const userRole = await this.roleProvider.getUserRole(userId);
		return userRole ? DEFAULT_ROUTES[userRole] : '/auth/login';
	}

	/**
	 * Get role-specific redirect based on user profile
	 * Handles special cases like vendor/pro/department assignments
	 */
	async getSmartRedirect(userId: string): Promise<string> {
		const profile = await this.roleProvider.getUserProfile(userId);
		if (!profile) return '/auth/login';

		const role = profile.role as UserRole;

		switch (role) {
			case 'vendor':
				if (!profile.vendorId) {
					return '/dashboard/vendors?setup=true';
				}
				return '/dashboard/vendors';

			case 'pro':
				if (!profile.proReference) {
					return '/dashboard/talent?setup=true';
				}
				return '/dashboard/talent';

			case 'leader':
				// Check if they're a department head
				const department = await this.roleProvider.getUserDepartment(profile.id);
				if (department) {
					return `/dashboard/department/${department.id}`;
				}
				return '/dashboard';

			case 'franchise_owner':
				return '/dashboard/franchise';

			case 'admin':
			default:
				return '/dashboard';
		}
	}

	/**
	 * Redirect user to appropriate dashboard based on role
	 */
	async redirectByRole(userId: string): Promise<never> {
		const route = await this.getSmartRedirect(userId);
		throw redirect(303, route);
	}

	/**
	 * Ensure user is authenticated
	 */
	requireAuth(isAuthenticated: boolean): void {
		if (!isAuthenticated) {
			throw redirect(303, '/auth/login');
		}
	}

	/**
	 * Block access for specific roles
	 */
	async blockRoles(userId: string, ...roles: UserRole[]): Promise<void> {
		const userRole = await this.roleProvider.getUserRole(userId);

		if (userRole && roles.includes(userRole)) {
			const defaultRoute = DEFAULT_ROUTES[userRole];
			throw redirect(303, defaultRoute);
		}
	}

	/**
	 * Require user to be a leader (admin or leader role)
	 */
	async requireLeader(userId: string): Promise<void> {
		const isLeader = await this.roleProvider.isLeader(userId);

		if (!isLeader) {
			const userRole = await this.roleProvider.getUserRole(userId);
			const defaultRoute = userRole ? DEFAULT_ROUTES[userRole] : '/auth/login';
			throw redirect(303, defaultRoute);
		}
	}

	/**
	 * Require user to be department head
	 */
	async requireDepartmentHead(userId: string): Promise<void> {
		const profile = await this.roleProvider.getUserProfile(userId);
		if (!profile) {
			throw redirect(303, '/auth/login');
		}

		const isDeptHead = await this.roleProvider.isDepartmentHead(profile.id);

		if (!isDeptHead) {
			const userRole = profile.role as UserRole;
			const defaultRoute = DEFAULT_ROUTES[userRole];
			throw redirect(303, defaultRoute);
		}
	}

	/**
	 * Require user to be vendor head
	 */
	async requireVendorHead(userId: string): Promise<void> {
		const profile = await this.roleProvider.getUserProfile(userId);
		if (!profile) {
			throw redirect(303, '/auth/login');
		}

		const isVendorHead = await this.roleProvider.isVendorHead(profile.id);

		if (!isVendorHead) {
			const userRole = profile.role as UserRole;
			const defaultRoute = DEFAULT_ROUTES[userRole];
			throw redirect(303, defaultRoute);
		}
	}
}
