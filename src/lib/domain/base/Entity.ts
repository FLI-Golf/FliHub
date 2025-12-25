/**
 * Base class for entities (has identity, mutable)
 */
export abstract class Entity<T> {
	protected readonly _id: string;
	protected props: T;
	protected readonly _createdAt: Date;
	protected _updatedAt: Date;

	constructor(props: T, id: string, createdAt?: Date, updatedAt?: Date) {
		this._id = id;
		this.props = props;
		this._createdAt = createdAt || new Date();
		this._updatedAt = updatedAt || new Date();
	}

	public get id(): string {
		return this._id;
	}

	public get createdAt(): Date {
		return this._createdAt;
	}

	public get updatedAt(): Date {
		return this._updatedAt;
	}

	protected touch(): void {
		this._updatedAt = new Date();
	}

	public equals(entity?: Entity<T>): boolean {
		if (entity === null || entity === undefined) {
			return false;
		}
		if (this === entity) {
			return true;
		}
		return this._id === entity._id;
	}

	/**
	 * Convert entity to PocketBase record format
	 */
	public abstract toRecord(): Record<string, any>;

	/**
	 * Validate entity state
	 */
	public abstract validate(): string[];
}
