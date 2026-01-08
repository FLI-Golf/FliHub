import type PocketBase from 'pocketbase';
import type { UserRole, Permission, Resource, Action, Scope } from './types';
import { ROLE_PERMISSIONS } from './types';

/**
 * RoleProvider - Handles role queries and permission checks
 * 
 * Responsibilities:
 * - Query user roles and permissions
 * - Check if user has specific permissions
 * - Get users by role
 * - Get entity heads (department, vendor)
 */
export class RoleProvider {
	constructor(private pb: PocketBase) {}

	/**
	 * Get user's current role
	 */
	async getUserRole(userId: string): Promise<UserRole | null> {
		try {
			const profiles = await this.pb.collection('user_profiles').getFullList({
				filter: `userId = "${userId}"`
			});

			if (profiles.length === 0) {
				return null;
			}

			return profiles[0].role as UserRole;
		} catch (error) {
			console.error('Error getting user role:', error);
			return null;
		}
	}

	/**
	 * Get user's available roles
	 */
	async getAvailableRoles(userId: string): Promise<UserRole[]> {
		try {
			const profiles = await this.pb.collection('user_profiles').getFullList({
				filter: `userId = "${userId}"`
			});

			if (profiles.length === 0) {
				return [];
			}

			return profiles[0].availableRoles || [];
		} catch (error) {
			console.error('Error getting available roles:', error);
			return [];
		}
	}

	/**
	 * Get user's profile
	 */
	async getUserProfile(userId: string): Promise<any | null> {
		try {
			const profiles = await this.pb.collection('user_profiles').getFullList({
				filter: `userId = "${userId}"`
			});

			return profiles.length > 0 ? profiles[0] : null;
		} catch (error) {
			console.error('Error getting user profile:', error);
			return null;
		}
	}

	/**
	 * Check if user has a specific role
	 */
	async hasRole(userId: string, role: UserRole): Promise<boolean> {
		const userRole = await this.getUserRole(userId);
		return userRole === role;
	}

	/**
	 * Check if user can perform an action on a resource
	 */
	async canAccess(
		userId: string,
		resource: Resource,
		action: Action,
		scope: Scope = 'all'
	): Promise<boolean> {
		const role = await this.getUserRole(userId);
		if (!role) return false;

		const permissions = ROLE_PERMISSIONS[role];

		// Check for wildcard permission
		if (permissions.includes('*')) return true;

		// Check for resource wildcard
		if (permissions.includes(`${resource}:*`)) return true;

		// Check for specific permission
		const permissionString = `${resource}:${action}`;
		if (permissions.includes(permissionString)) return true;

		// Check for scoped permission
		const scopedPermission = `${resource}:${action}:${scope}`;
		if (permissions.includes(scopedPermission)) return true;

		return false;
	}

	/**
	 * Get all permissions for a user's role
	 */
	async getUserPermissions(userId: string): Promise<Permission[]> {
		const role = await this.getUserRole(userId);
		if (!role) return [];

		return ROLE_PERMISSIONS[role];
	}

	/**
	 * Get all users with a specific role
	 */
	async getUsersByRole(role: UserRole): Promise<any[]> {
		try {
			return await this.pb.collection('user_profiles').getFullList({
				filter: `role = "${role}"`
			});
		} catch (error) {
			console.error('Error getting users by role:', error);
			return [];
		}
	}

	/**
	 * Get department head user profile
	 */
	async getDepartmentHead(departmentId: string): Promise<any | null> {
		try {
			const department = await this.pb.collection('departments_collection').getOne(departmentId, {
				expand: 'headOfDepartment'
			});

			return department.expand?.headOfDepartment || null;
		} catch (error) {
			console.error('Error getting department head:', error);
			return null;
		}
	}

	/**
	 * Get vendor head user profile
	 */
	async getVendorHead(vendorId: string): Promise<any | null> {
		try {
			const vendor = await this.pb.collection('vendors').getOne(vendorId, {
				expand: 'headOfVendor'
			});

			return vendor.expand?.headOfVendor || null;
		} catch (error) {
			console.error('Error getting vendor head:', error);
			return null;
		}
	}

	/**
	 * Get user's linked pro profile
	 */
	async getLinkedPro(userId: string): Promise<any | null> {
		try {
			const profile = await this.getUserProfile(userId);
			if (!profile || !profile.proReference) return null;

			return await this.pb.collection('pros').getOne(profile.proReference);
		} catch (error) {
			console.error('Error getting linked pro:', error);
			return null;
		}
	}

	/**
	 * Get user's linked vendor
	 */
	async getLinkedVendor(userId: string): Promise<any | null> {
		try {
			const profile = await this.getUserProfile(userId);
			if (!profile || !profile.vendorId) return null;

			return await this.pb.collection('vendors').getOne(profile.vendorId);
		} catch (error) {
			console.error('Error getting linked vendor:', error);
			return null;
		}
	}

	/**
	 * Get user's department (if they are a department head)
	 */
	async getUserDepartment(userProfileId: string): Promise<any | null> {
		try {
			const departments = await this.pb.collection('departments_collection').getFullList({
				filter: `headOfDepartment = "${userProfileId}"`
			});

			return departments.length > 0 ? departments[0] : null;
		} catch (error) {
			console.error('Error getting user department:', error);
			return null;
		}
	}

	/**
	 * Get user's vendor (if they are a vendor head)
	 */
	async getUserVendor(userProfileId: string): Promise<any | null> {
		try {
			const vendors = await this.pb.collection('vendors').getFullList({
				filter: `headOfVendor = "${userProfileId}"`
			});

			return vendors.length > 0 ? vendors[0] : null;
		} catch (error) {
			console.error('Error getting user vendor:', error);
			return null;
		}
	}

	/**
	 * Check if user is a department head
	 */
	async isDepartmentHead(userProfileId: string): Promise<boolean> {
		const department = await this.getUserDepartment(userProfileId);
		return department !== null;
	}

	/**
	 * Check if user is a vendor head
	 */
	async isVendorHead(userProfileId: string): Promise<boolean> {
		const vendor = await this.getUserVendor(userProfileId);
		return vendor !== null;
	}

	/**
	 * Check if user has any leadership role
	 */
	async isLeader(userId: string): Promise<boolean> {
		const role = await this.getUserRole(userId);
		return role === 'leader' || role === 'admin';
	}
}
