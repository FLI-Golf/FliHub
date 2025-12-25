import type PocketBase from 'pocketbase';
import type { RecordModel, ListResult } from 'pocketbase';

export interface QueryOptions {
	page?: number;
	perPage?: number;
	sort?: string;
	filter?: string;
	expand?: string;
}

/**
 * Base repository for PocketBase collections
 * Provides CRUD operations and keeps domain layer isolated from PocketBase
 */
export abstract class BaseRepo<T extends RecordModel> {
	protected pb: PocketBase;
	protected collectionName: string;

	constructor(pb: PocketBase, collectionName: string) {
		this.pb = pb;
		this.collectionName = collectionName;
	}

	async findById(id: string, expand?: string): Promise<T | null> {
		try {
			const record = await this.pb.collection(this.collectionName).getOne<T>(id, { expand });
			return record;
		} catch (error) {
			return null;
		}
	}

	async findAll(options: QueryOptions = {}): Promise<ListResult<T>> {
		const { page = 1, perPage = 50, sort, filter, expand } = options;
		return await this.pb.collection(this.collectionName).getList<T>(page, perPage, {
			sort,
			filter,
			expand
		});
	}

	async findOne(filter: string, expand?: string): Promise<T | null> {
		try {
			const result = await this.pb.collection(this.collectionName).getFirstListItem<T>(filter, {
				expand
			});
			return result;
		} catch (error) {
			return null;
		}
	}

	async create(data: Partial<T>): Promise<T> {
		return await this.pb.collection(this.collectionName).create<T>(data);
	}

	async update(id: string, data: Partial<T>): Promise<T> {
		return await this.pb.collection(this.collectionName).update<T>(id, data);
	}

	async delete(id: string): Promise<boolean> {
		try {
			await this.pb.collection(this.collectionName).delete(id);
			return true;
		} catch (error) {
			return false;
		}
	}

	async count(filter?: string): Promise<number> {
		const result = await this.pb.collection(this.collectionName).getList(1, 1, { filter });
		return result.totalItems;
	}
}
