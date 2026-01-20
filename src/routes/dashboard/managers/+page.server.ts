import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	try {
		// Get all managers (user_profiles with role='manager')
		const managers = await pb.collection('user_profiles').getFullList({
			filter: 'role = "manager"',
			sort: 'firstName,lastName'
		});

		// Get pro_access records to see which talent each manager manages
		const proAccessRecords = await pb.collection('pro_access').getFullList({
			filter: 'accessType = "manager" && isActive = true',
			expand: 'userProfile,pro'
		}).catch(() => []);

		// Get all talent for reference
		const allTalent = await pb.collection('talent').getFullList({
			sort: 'name'
		});

		// Build manager-to-talent mapping
		const managerTalentMap = new Map<string, any[]>();
		for (const access of proAccessRecords) {
			const managerId = access.userProfile;
			const talentRecord = allTalent.find(t => t.id === access.pro);
			if (talentRecord) {
				if (!managerTalentMap.has(managerId)) {
					managerTalentMap.set(managerId, []);
				}
				managerTalentMap.get(managerId)!.push(talentRecord);
			}
		}

		// Helper to build PocketBase file URL
		const getFileUrl = (collectionId: string, recordId: string, filename: string | undefined) => {
			if (!filename) return undefined;
			return `${pb.baseUrl}/api/files/${collectionId}/${recordId}/${filename}`;
		};

		// Transform managers with their managed talent
		const managersWithTalent = managers.map(manager => {
			const avatarUrl = manager.avatar ? getFileUrl(manager.collectionId, manager.id, manager.avatar) : undefined;
			const managedTalent = managerTalentMap.get(manager.id) || [];
			
			return {
				id: manager.id,
				name: `${manager.firstName} ${manager.lastName}`,
				firstName: manager.firstName,
				lastName: manager.lastName,
				email: manager.email,
				phone: manager.phone,
				organization: manager.organization,
				bio: manager.bio,
				avatar: avatarUrl,
				status: manager.status,
				managedTalent,
				managedTalentCount: managedTalent.length
			};
		});

		return {
			managers: managersWithTalent,
			allTalent,
			stats: {
				totalManagers: managers.length,
				activeManagers: managers.filter(m => m.status === 'active').length,
				totalManagedTalent: proAccessRecords.length,
				unassignedTalent: allTalent.filter(t => 
					!proAccessRecords.some(a => a.pro === t.id)
				).length
			}
		};
	} catch (error) {
		console.error('Error loading managers:', error);
		return {
			managers: [],
			allTalent: [],
			stats: {
				totalManagers: 0,
				activeManagers: 0,
				totalManagedTalent: 0,
				unassignedTalent: 0
			}
		};
	}
};
