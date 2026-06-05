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

export const mediaTagDomains: MediaOption[] = [
	{ value: 'general', label: 'General' },
	{ value: 'mood', label: 'Mood' },
	{ value: 'scene', label: 'Scene' },
	{ value: 'brand', label: 'Brand' },
	{ value: 'competition', label: 'Competition' },
	{ value: 'broadcast', label: 'Broadcast' },
	{ value: 'location', label: 'Location' },
	{ value: 'other', label: 'Other' }
];

export const mediaRoundTypes: MediaOption[] = [
	{ value: 'practice', label: 'Practice' },
	{ value: 'qualifier', label: 'Qualifier' },
	{ value: 'round_1', label: 'Round 1' },
	{ value: 'round_2', label: 'Round 2' },
	{ value: 'round_3', label: 'Round 3' },
	{ value: 'final_round', label: 'Final Round' },
	{ value: 'playoff', label: 'Playoff' },
	{ value: 'other', label: 'Other' }
];

export const mediaShotTypes: MediaOption[] = [
	{ value: 'drive', label: 'Drive' },
	{ value: 'approach', label: 'Approach' },
	{ value: 'chip', label: 'Chip' },
	{ value: 'putt', label: 'Putt' },
	{ value: 'bunker', label: 'Bunker' },
	{ value: 'penalty', label: 'Penalty' },
	{ value: 'other', label: 'Other' }
];

export const mediaMomentTypes: MediaOption[] = [
	{ value: 'crowd_reaction', label: 'Crowd Reaction' },
	{ value: 'interview_segment', label: 'Interview Segment' },
	{ value: 'award_ceremony', label: 'Award Ceremony' },
	{ value: 'vip_hospitality', label: 'VIP / Hospitality' },
	{ value: 'sponsor_activation', label: 'Sponsor Activation' },
	{ value: 'other', label: 'Other' }
];

export const sponsorDeliverableTypes: MediaOption[] = [
	{ value: 'logo_exposure', label: 'Logo Exposure' },
	{ value: 'highlight_clip', label: 'Highlight Clip' },
	{ value: 'recap_image', label: 'Recap Image' },
	{ value: 'interview_cut', label: 'Interview Cut' },
	{ value: 'social_post', label: 'Social Post' },
	{ value: 'broadcast_feature', label: 'Broadcast Feature' },
	{ value: 'hospitality_recap', label: 'Hospitality Recap' },
	{ value: 'other', label: 'Other' }
];

export const sponsorDeliverableStatuses: MediaOption[] = [
	{ value: 'pending', label: 'Pending' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'delivered', label: 'Delivered' },
	{ value: 'approved', label: 'Approved' },
	{ value: 'overdue', label: 'Overdue' },
	{ value: 'cancelled', label: 'Cancelled' }
];

export const sponsorRecapStatuses: MediaOption[] = [
	{ value: 'draft', label: 'Draft' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'ready', label: 'Ready' },
	{ value: 'sent', label: 'Sent' },
	{ value: 'approved', label: 'Approved' },
	{ value: 'archived', label: 'Archived' }
];

export const sponsorLogoVisibilityLevels: MediaOption[] = [
	{ value: 'background', label: 'Background' },
	{ value: 'partial', label: 'Partial' },
	{ value: 'clear', label: 'Clear' },
	{ value: 'hero', label: 'Hero' },
	{ value: 'verbal_mention', label: 'Verbal Mention' }
];

export const highlightPackageTypes: MediaOption[] = [
	{ value: 'reel', label: 'Reel' },
	{ value: 'event_recap', label: 'Event Recap' },
	{ value: 'player_package', label: 'Player Package' },
	{ value: 'sponsor_package', label: 'Sponsor Package' },
	{ value: 'social_export', label: 'Social Export' },
	{ value: 'other', label: 'Other' }
];

export const highlightPackageStatuses: MediaOption[] = [
	{ value: 'draft', label: 'Draft' },
	{ value: 'review', label: 'In Review' },
	{ value: 'approved', label: 'Approved' },
	{ value: 'published', label: 'Published' },
	{ value: 'archived', label: 'Archived' }
];

export const highlightExportTargets: MediaOption[] = [
	{ value: 'broadcast', label: 'Broadcast' },
	{ value: 'social', label: 'Social' },
	{ value: 'internal', label: 'Internal' },
	{ value: 'sponsor', label: 'Sponsor' },
	{ value: 'editorial', label: 'Editorial' },
	{ value: 'other', label: 'Other' }
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