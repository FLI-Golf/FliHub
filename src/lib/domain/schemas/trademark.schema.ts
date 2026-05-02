import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

// USPTO filing pipeline stages
export const TrademarkStatusEnum = z.enum([
	'not_filed',      // Mark identified, not yet submitted to attorney
	'attorney_review',// Attorney reviewing mark for conflicts / clearance
	'filed',          // Application submitted to USPTO
	'published',      // Published for opposition (30-day window)
	'opposition',     // Third-party opposition filed
	'approved',       // Registration granted
	'rejected',       // USPTO refused registration
	'abandoned'       // Application abandoned
]);

// Type of mark being filed
export const MarkTypeEnum = z.enum([
	'word_mark',      // Name only (standard character)
	'design_mark',    // Logo / graphic element
	'composite_mark'  // Name + logo combined
]);

// International class most relevant to FLI Golf
export const TrademarkClassEnum = z.enum([
	'ic_028', // Sporting goods, games, toys
	'ic_041', // Entertainment, sports events, education
	'ic_025', // Clothing, footwear, headgear
	'ic_035', // Advertising, business management
	'ic_038', // Telecommunications / broadcasting
	'ic_009', // Software, digital goods
	'other'
]);

// Which logo variant this filing covers (mirrors franchises collection fields)
export const LogoVariantEnum = z.enum([
	'none',        // Word mark — no logo
	'logoFull',
	'logoMini',
	'logoHorizontal',
	'logoVertical',
	'logoMonochrome',
	'logoWordmark'
]);

// ── Labels ────────────────────────────────────────────────────────────────────

export const TRADEMARK_STATUS_LABELS: Record<string, string> = {
	not_filed:       'Not Filed',
	attorney_review: 'Attorney Review',
	filed:           'Filed',
	published:       'Published',
	opposition:      'Opposition',
	approved:        'Approved',
	rejected:        'Rejected',
	abandoned:       'Abandoned'
};

export const TRADEMARK_STATUS_COLORS: Record<string, string> = {
	not_filed:       'bg-slate-700/60 text-slate-300 border-slate-600',
	attorney_review: 'bg-blue-900/50 text-blue-300 border-blue-700',
	filed:           'bg-violet-900/50 text-violet-300 border-violet-700',
	published:       'bg-yellow-900/50 text-yellow-300 border-yellow-700',
	opposition:      'bg-orange-900/50 text-orange-300 border-orange-700',
	approved:        'bg-emerald-900/50 text-emerald-300 border-emerald-700',
	rejected:        'bg-red-900/50 text-red-400 border-red-800',
	abandoned:       'bg-slate-800/60 text-slate-500 border-slate-700'
};

export const MARK_TYPE_LABELS: Record<string, string> = {
	word_mark:      'Word Mark',
	design_mark:    'Design Mark',
	composite_mark: 'Composite Mark'
};

export const TRADEMARK_CLASS_LABELS: Record<string, string> = {
	ic_028: 'IC 028 — Sporting Goods',
	ic_041: 'IC 041 — Entertainment / Events',
	ic_025: 'IC 025 — Clothing / Apparel',
	ic_035: 'IC 035 — Advertising / Business',
	ic_038: 'IC 038 — Broadcasting',
	ic_009: 'IC 009 — Software / Digital',
	other:  'Other'
};

export const LOGO_VARIANT_LABELS: Record<string, string> = {
	none:           'N/A (Word Mark)',
	logoFull:       'Full Logo',
	logoMini:       'Mini Logo',
	logoHorizontal: 'Horizontal Logo',
	logoVertical:   'Vertical Logo',
	logoMonochrome: 'Monochrome Logo',
	logoWordmark:   'Wordmark Logo'
};

// Pipeline order for progress display (excludes terminal states)
export const TRADEMARK_PIPELINE: Array<z.infer<typeof TrademarkStatusEnum>> = [
	'not_filed',
	'attorney_review',
	'filed',
	'published',
	'approved'
];

// ── Zod schema ────────────────────────────────────────────────────────────────

export const TrademarkFilingSchema = z.object({
	id:               z.string().optional(),
	franchiseId:      z.string().min(1),          // relation → franchises
	markType:         MarkTypeEnum,
	logoVariant:      LogoVariantEnum.default('none'),
	trademarkClass:   TrademarkClassEnum.default('ic_041'),
	status:           TrademarkStatusEnum.default('not_filed'),
	usptoAppNumber:   z.string().max(50).optional(),  // e.g. 98/123456
	usptoSerialNumber:z.string().max(50).optional(),
	filedDate:        z.string().optional(),
	publishedDate:    z.string().optional(),
	approvedDate:     z.string().optional(),
	rejectedDate:     z.string().optional(),
	renewalDate:      z.string().optional(),
	attorneyNotes:    z.string().max(5000).optional(),
	internalNotes:    z.string().max(5000).optional(),
	oppositionDetail: z.string().max(2000).optional()
});

export type TrademarkStatus  = z.infer<typeof TrademarkStatusEnum>;
export type MarkType         = z.infer<typeof MarkTypeEnum>;
export type TrademarkFiling  = z.infer<typeof TrademarkFilingSchema>;
export type LogoVariant      = z.infer<typeof LogoVariantEnum>;
