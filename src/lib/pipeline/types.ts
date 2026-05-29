/**
 * Shared pipeline types.
 *
 * A "pipeline" is any ordered sequence of stages that a record moves through.
 * Each domain (sponsors, talent onboarding, content production, etc.) defines
 * its own PipelineConfig and passes it to the shared UI components.
 */

// ── Stage definition ──────────────────────────────────────────────────────────

export interface PipelineStageConfig<TStatus extends string = string> {
	/** Unique key that maps to the record's status field */
	key: TStatus;
	/** Human-readable column header */
	label: string;
	/** Tailwind classes for the column accent (header badge, border, etc.) */
	colorClass: string;
	/** Optional icon component (Lucide) */
	icon?: any;
	/** If true, this stage is a terminal/closed state (shown separately) */
	terminal?: boolean;
}

// ── Card item ─────────────────────────────────────────────────────────────────

export interface PipelineCardItem {
	id: string;
	/** The current stage key */
	status: string;
	/** Primary display text */
	title: string;
	/** Optional secondary line */
	subtitle?: string;
	/** Optional badge text + color class */
	badge?: { label: string; colorClass: string };
	/** Optional extra badges */
	tags?: Array<{ label: string; colorClass: string }>;
	/** Optional metadata line (date, amount, etc.) */
	meta?: string;
	/** URL to navigate to on click */
	href?: string;
	/** Any extra data the parent needs */
	raw?: any;
}

// ── Board config ──────────────────────────────────────────────────────────────

export interface PipelineBoardConfig<TStatus extends string = string> {
	/** Ordered list of active stages (left → right) */
	stages: PipelineStageConfig<TStatus>[];
	/** Optional terminal stages rendered in a separate "Closed" section */
	terminalStages?: PipelineStageConfig<TStatus>[];
	/** Column width class (default: w-56) */
	columnWidth?: string;
}

// ── Move event ────────────────────────────────────────────────────────────────

export interface PipelineMoveEvent<TStatus extends string = string> {
	item: PipelineCardItem;
	from: TStatus;
	to: TStatus;
}
