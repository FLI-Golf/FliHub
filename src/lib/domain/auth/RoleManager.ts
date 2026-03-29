import type PocketBase from 'pocketbase';
import type { UserRole } from './types';

/**
 * RoleManager - Handles role assignment and mutations
 * 
 * Responsibilities:
 * - Assign and update user roles
 * - Manage available roles for users
 * - Link users to specific entities (pros, vendors, departments)
 * - Handle role switching
 */
export class RoleManager {
	constructor(private pb: PocketBase) {}

	/**
	 * Assign a primary role to a user
	 */
	async assignRole(userId: string, role: UserRole): Promise<void> {
		const profiles = await this.pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});

		if (profiles.length === 0) {
			throw new Error(`User profile not found for userId: ${userId}`);
		}

		const profile = profiles[0];
		await this.pb.collection('user_profiles').update(profile.id, { role });
	}

	/**
	 * Add a role to user's available roles
	 */
	async addAvailableRole(userId: string, role: UserRole): Promise<void> {
		const profiles = await this.pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});

		if (profiles.length === 0) {
			throw new Error(`User profile not found for userId: ${userId}`);
		}

		const profile = profiles[0];
		const availableRoles = profile.availableRoles || [];

		if (!availableRoles.includes(role)) {
			availableRoles.push(role);
			await this.pb.collection('user_profiles').update(profile.id, {
				availableRoles
			});
		}
	}

	/**
	 * Remove a role from user's available roles
	 */
	async removeAvailableRole(userId: string, role: UserRole): Promise<void> {
		const profiles = await this.pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});

		if (profiles.length === 0) {
			throw new Error(`User profile not found for userId: ${userId}`);
		}

		const profile = profiles[0];
		const availableRoles = (profile.availableRoles || []).filter((r: string) => r !== role);

		await this.pb.collection('user_profiles').update(profile.id, {
			availableRoles
		});
	}

	/**
	 * Switch user's active role (must be in availableRoles)
	 */
	async switchRole(userId: string, newRole: UserRole): Promise<void> {
		const profiles = await this.pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});

		if (profiles.length === 0) {
			throw new Error(`User profile not found for userId: ${userId}`);
		}

		const profile = profiles[0];
		const availableRoles = profile.availableRoles || [];

		if (!availableRoles.includes(newRole)) {
			throw new Error(`Role ${newRole} is not available for this user`);
		}

		await this.pb.collection('user_profiles').update(profile.id, {
			role: newRole
		});
	}

	/**
	 * Grant a user access to a pro's information via the pro_access junction table
	 */
	async grantProAccess(
		userId: string,
		proId: string,
		accessType: 'self' | 'manager' | 'broadcaster' | 'agent',
		permissions: string[] = ['view_profile']
	): Promise<void> {
		const profiles = await this.pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});

		if (profiles.length === 0) {
			throw new Error(`User profile not found for userId: ${userId}`);
		}

		const profile = profiles[0];

		// Check if access already exists
		const existing = await this.pb.collection('pro_access').getFullList({
			filter: `userProfile = "${profile.id}" && pro = "${proId}"`
		});

		if (existing.length > 0) {
			// Update existing access
			await this.pb.collection('pro_access').update(existing[0].id, {
				accessType,
				permissions,
				isActive: true
			});
		} else {
			// Create new access
			await this.pb.collection('pro_access').create({
				userProfile: profile.id,
				pro: proId,
				accessType,
				permissions,
				isActive: true
			});
		}

		// Add appropriate role to available roles based on access type
		if (accessType === 'self') {
			await this.addAvailableRole(userId, 'pro');
		} else if (accessType === 'manager') {
			await this.addAvailableRole(userId, 'manager');
		} else if (accessType === 'broadcaster') {
			await this.addAvailableRole(userId, 'broadcaster');
		}
	}

	/**
	 * Revoke a user's access to a pro
	 */
	async revokeProAccess(userId: string, proId: string): Promise<void> {
		const profiles = await this.pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});

		if (profiles.length === 0) {
			throw new Error(`User profile not found for userId: ${userId}`);
		}

		const profile = profiles[0];

		const existing = await this.pb.collection('pro_access').getFullList({
			filter: `userProfile = "${profile.id}" && pro = "${proId}"`
		});

		if (existing.length > 0) {
			await this.pb.collection('pro_access').delete(existing[0].id);
		}
	}

	/**
	 * Get all pros a user has access to
	 */
	async getUserProAccess(userId: string): Promise<any[]> {
		const profiles = await this.pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});

		if (profiles.length === 0) {
			return [];
		}

		const profile = profiles[0];

		return await this.pb.collection('pro_access').getFullList({
			filter: `userProfile = "${profile.id}" && isActive = true`,
			expand: 'pro'
		});
	}

	/**
	 * Get all users who have access to a specific pro
	 */
	async getProAccessUsers(proId: string): Promise<any[]> {
		return await this.pb.collection('pro_access').getFullList({
			filter: `pro = "${proId}" && isActive = true`,
			expand: 'userProfile'
		});
	}

	/**
	 * Link a user profile to a vendor
	 */
	async linkVendorProfile(userId: string, vendorId: string): Promise<void> {
		const profiles = await this.pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});

		if (profiles.length === 0) {
			throw new Error(`User profile not found for userId: ${userId}`);
		}

		const profile = profiles[0];
		await this.pb.collection('user_profiles').update(profile.id, {
			vendorId: vendorId
		});

		// Ensure 'vendor' is in available roles
		await this.addAvailableRole(userId, 'vendor');
	}

	/**
	 * Set a user as head of a department
	 */
	async setDepartmentHead(departmentId: string, userProfileId: string): Promise<void> {
		await this.pb.collection('departments').update(departmentId, {
			headOfDepartment: userProfileId
		});

		// Get the user profile to find userId
		const profile = await this.pb.collection('user_profiles').getOne(userProfileId);

		// Ensure 'leader' is in available roles
		await this.addAvailableRole(profile.userId, 'leader');
	}

	/**
	 * Set a user as head of a vendor
	 */
	async setVendorHead(vendorId: string, userProfileId: string): Promise<void> {
		await this.pb.collection('vendors').update(vendorId, {
			headOfVendor: userProfileId
		});

		// Get the user profile to find userId
		const profile = await this.pb.collection('user_profiles').getOne(userProfileId);

		// Ensure 'vendor' is in available roles
		await this.addAvailableRole(profile.userId, 'vendor');
	}

	/**
	 * Remove user as head of department
	 */
	async removeDepartmentHead(departmentId: string): Promise<void> {
		await this.pb.collection('departments').update(departmentId, {
			headOfDepartment: null
		});
	}

	/**
	 * Remove user as head of vendor
	 */
	async removeVendorHead(vendorId: string): Promise<void> {
		await this.pb.collection('vendors').update(vendorId, {
			headOfVendor: null
		});
	}

	/**
	 * Unlink pro profile from user
	 */
	async unlinkProProfile(userId: string): Promise<void> {
		const profiles = await this.pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});

		if (profiles.length === 0) {
			throw new Error(`User profile not found for userId: ${userId}`);
		}

		const profile = profiles[0];
		await this.pb.collection('user_profiles').update(profile.id, {
			proReference: null
		});
	}

	/**
	 * Unlink vendor from user
	 */
	async unlinkVendorProfile(userId: string): Promise<void> {
		const profiles = await this.pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});

		if (profiles.length === 0) {
			throw new Error(`User profile not found for userId: ${userId}`);
		}

		const profile = profiles[0];
		await this.pb.collection('user_profiles').update(profile.id, {
			vendorId: null
		});
	}
}
