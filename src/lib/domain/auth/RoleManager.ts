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
	 * Link a user profile to a pro
	 */
	async linkProProfile(userId: string, proId: string): Promise<void> {
		const profiles = await this.pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});

		if (profiles.length === 0) {
			throw new Error(`User profile not found for userId: ${userId}`);
		}

		const profile = profiles[0];
		await this.pb.collection('user_profiles').update(profile.id, {
			proReference: proId
		});

		// Ensure 'pro' is in available roles
		await this.addAvailableRole(userId, 'pro');
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
		await this.pb.collection('departments_collection').update(departmentId, {
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
		await this.pb.collection('departments_collection').update(departmentId, {
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
