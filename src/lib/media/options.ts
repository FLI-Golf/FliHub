export interface MediaOption {
	value: string;
	label: string;
}

export const mediaAssetTypes: MediaOption[] = [
	{ value: 'flyer', label: 'Flyer' },
	{ value: 'jersey', label: 'Jersey' },
	{ value: 'shoe', label: 'Shoe' },
	{ value: 'logo', label: 'Logo' },
	{ value: 'banner', label: 'Banner' },
	{ value: 'social', label: 'Social Media' },
	{ value: 'other', label: 'Other' }
];

export const mediaCategories: MediaOption[] = [
	{ value: 'graphic', label: 'Graphic' },
	{ value: 'photo', label: 'Photo' },
	{ value: 'video', label: 'Video' },
	{ value: 'audio', label: 'Audio' },
	{ value: 'document', label: 'Document' },
	{ value: 'broadcast_segment', label: 'Broadcast Segment' },
	{ value: 'social_clip', label: 'Social Clip' },
	{ value: 'interview', label: 'Interview' },
	{ value: 'highlight', label: 'Highlight' },
	{ value: 'sponsor_asset', label: 'Sponsor Asset' },
	{ value: 'archive_package', label: 'Archive Package' },
	{ value: 'other', label: 'Other' }
];

export const mediaSourceTypes: MediaOption[] = [
	{ value: 'broadcast_camera', label: 'Broadcast Camera' },
	{ value: 'drone', label: 'Drone' },
	{ value: 'mobile', label: 'Mobile Device' },
	{ value: 'photographer', label: 'Photographer' },
	{ value: 'livestream', label: 'Livestream Recording' },
	{ value: 'social_export', label: 'Social Export' },
	{ value: 'production_company', label: 'Production Company' },
	{ value: 'podcast', label: 'Podcast' },
	{ value: 'sponsor_submission', label: 'Sponsor Submission' },
	{ value: 'other', label: 'Other' }
];

export const mediaStatuses: MediaOption[] = [
	{ value: 'uploaded', label: 'Uploaded' },
	{ value: 'processing', label: 'Processing' },
	{ value: 'tagged', label: 'Tagged' },
	{ value: 'approved', label: 'Approved' },
	{ value: 'archived', label: 'Archived' },
	{ value: 'restricted', label: 'Restricted' }
];

export const mediaStorageTiers: MediaOption[] = [
	{ value: 'hot', label: 'Hot' },
	{ value: 'warm', label: 'Warm' },
	{ value: 'archive', label: 'Archive' }
];

export const mediaUsageScopes: MediaOption[] = [
	{ value: 'internal', label: 'Internal' },
	{ value: 'sponsor', label: 'Sponsor' },
	{ value: 'broadcast', label: 'Broadcast' },
	{ value: 'commercial', label: 'Commercial' },
	{ value: 'restricted', label: 'Restricted' }
];

export const mediaRightsStatuses: MediaOption[] = [
	{ value: 'owned', label: 'Owned' },
	{ value: 'shared', label: 'Shared Rights' },
	{ value: 'licensed_out', label: 'Licensed Out' },
	{ value: 'licensed_in', label: 'Licensed In' },
	{ value: 'talent_restricted', label: 'Talent Restricted' },
	{ value: 'expired', label: 'Expired' }
];

export function labelFor(options: MediaOption[], value: string | null | undefined): string {
	return options.find((option) => option.value === value)?.label ?? value ?? '';
}

export function isImageLikeAsset(asset: { file?: string; media_category?: string; asset_type?: string }): boolean {
	const extension = asset.file?.split('.').pop()?.toLowerCase() ?? '';
	if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif'].includes(extension)) return true;
	return ['graphic', 'photo', 'sponsor_asset'].includes(asset.media_category ?? '') ||
		['flyer', 'logo', 'banner', 'social', 'jersey', 'shoe'].includes(asset.asset_type ?? '');
}