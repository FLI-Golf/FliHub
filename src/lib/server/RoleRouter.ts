import type PocketBase from 'pocketbase';

type SessionUserLike = {
	id?: string;
	email?: string;
	username?: string;
};

type RouterUser = {
	id: string;
	email?: string;
	username?: string;
	name?: string;
};

type LogPayload = {
	sessionUser: SessionUserLike;
	role: string;
	limit?: number;
	truncateTo?: number;
};

export class RoleRouter {
	private readonly pb: PocketBase;

	constructor(pb: PocketBase) {
		this.pb = pb;
	}

	async fetchUsers(limit = 12): Promise<RouterUser[]> {
		const pageSize = Math.max(1, Math.min(50, limit));
		const list = await this.pb.collection('users').getList(1, pageSize, {
			fields: 'id,email,username,name',
			sort: '-created'
		}).catch(() => null);

		const items = (list?.items ?? []) as any[];
		return items.map((item) => ({
			id: String(item.id ?? ''),
			email: item.email ? String(item.email) : undefined,
			username: item.username ? String(item.username) : undefined,
			name: item.name ? String(item.name) : undefined,
		})).filter((u) => u.id);
	}

	truncateUsers(users: RouterUser[], truncateTo = 6): RouterUser[] {
		const max = Math.max(1, Math.min(20, truncateTo));
		return users.slice(0, max);
	}

	matchUser(sessionUser: SessionUserLike, users: RouterUser[]): string | null {
		const sessionId = String(sessionUser.id ?? '').trim();
		const sessionEmail = String(sessionUser.email ?? '').trim().toLowerCase();
		const sessionUsername = String(sessionUser.username ?? '').trim().toLowerCase();

		if (sessionId) {
			const byId = users.find((u) => u.id === sessionId);
			if (byId) return byId.id;
		}

		if (sessionEmail) {
			const byEmail = users.find((u) => String(u.email ?? '').toLowerCase() === sessionEmail);
			if (byEmail) return byEmail.id;
		}

		if (sessionUsername) {
			const byUsername = users.find((u) => String(u.username ?? '').toLowerCase() === sessionUsername);
			if (byUsername) return byUsername.id;
		}

		// Some roles may not be allowed to list every user row; keep a stable ID for debugging.
		if (sessionId) return sessionId;

		return null;
	}

	async logSessionRole(payload: LogPayload): Promise<string | null> {
		const users = await this.fetchUsers(payload.limit ?? 12);
		const truncatedUsers = this.truncateUsers(users, payload.truncateTo ?? 6);
		const matchedUserId = this.matchUser(payload.sessionUser, users);

		console.log('[RoleRouter]', {
			sessionUser: {
				id: payload.sessionUser.id ?? null,
				email: payload.sessionUser.email ?? null,
				username: payload.sessionUser.username ?? null,
			},
			role: payload.role,
			matchedUserId,
			truncatedUsers: truncatedUsers.map((u) => ({
				id: u.id,
				email: u.email ?? null,
				username: u.username ?? null,
				name: u.name ?? null,
			})),
		});

		return matchedUserId;
	}
}
