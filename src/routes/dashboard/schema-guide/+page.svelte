<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Table, Eye, FolderKanban } from 'lucide-svelte';
	
	let viewMode = $state<'table' | 'visual'>('table');
	let activeTab = $state<string>('financial');
	
	// Vendors system relationships
	const vendorsRelationships = [
		{
			collection: 'vendors',
			description: 'External service providers and suppliers with contact and relationship tracking',
			fields: [
				{ name: 'name', type: 'text', description: 'Vendor company name' },
				{ name: 'email', type: 'email', description: 'Primary contact email' },
				{ name: 'phone', type: 'text', description: 'Contact phone number' },
				{ name: 'type', type: 'text', description: 'Vendor classification/category' },
				{ name: 'status', type: 'select', description: 'Active, Inactive' },
				{ name: 'website', type: 'url', description: 'Vendor website' },
				{ name: 'address', type: 'text', description: 'Business address' },
				{ name: 'contactPerson', type: 'text', description: 'Primary contact name' },
				{ name: 'notes', type: 'text', description: 'Additional notes' },
				{ name: 'services', type: 'text', description: 'Services provided' }
			],
			relationships: [
				{ to: 'projects', type: 'many-to-many', description: 'Vendors work on multiple projects' },
				{ to: 'expenses', type: 'one-to-many', description: 'Vendors receive payments via expenses' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Managed by team member' }
			]
		}
	];
	
	// Pros system relationships
	const prosRelationships = [
		{
			collection: 'pros',
			description: 'Professional disc golf players with contracts, stats, and payment tracking',
			fields: [
				{ name: 'name', type: 'text', description: 'Player full name' },
				{ name: 'nickname', type: 'text', description: 'Player nickname' },
				{ name: 'worldRanking', type: 'number', description: 'Current PDGA world ranking' },
				{ name: 'gender', type: 'select', description: 'male, female, other' },
				{ name: 'status', type: 'select', description: 'active, inactive, retired' },
				{ name: 'country', type: 'text', description: 'Country of origin' },
				{ name: 'residence', type: 'text', description: 'Current residence' },
				{ name: 'dateOfBirth', type: 'date', description: 'Birth date' },
				{ name: 'height', type: 'text', description: 'Player height' },
				{ name: 'weight', type: 'text', description: 'Player weight' },
				{ name: 'yearTurnedPro', type: 'number', description: 'Year turned professional' },
				{ name: 'signedContract', type: 'file', description: 'Contract document' },
				{ name: 'bio', type: 'text', description: 'Player biography' },
				{ name: 'photo', type: 'file', description: 'Player photo' },
				{ name: 'primarySponsor', type: 'text', description: 'Main sponsor' },
				{ name: 'favoriteDisc', type: 'text', description: 'Favorite disc' },
				{ name: 'careerHighlights', type: 'text', description: 'Career achievements' },
				{ name: 'tournamentsPlayed', type: 'number', description: 'Total tournaments' }
			],
			relationships: [
				{ to: 'franchises', type: 'many-to-many', description: 'Plays for franchises' },
				{ to: 'pro_payments', type: 'one-to-many', description: 'Payment history' },
				{ to: 'league', type: 'many-to-one', description: 'Competes in league' },
				{ to: 'sponsors', type: 'many-to-many', description: 'Personal sponsors' },
				{ to: 'tournaments', type: 'many-to-many', description: 'Competes in tournaments' }
			]
		},
		{
			collection: 'pro_payments',
			description: 'Player compensation tracking including salary, bonuses, and prizes',
			fields: [
				{ name: 'proId', type: 'relation', relatesTo: 'pros', description: 'Player receiving payment' },
				{ name: 'amount', type: 'number', description: 'Payment amount' },
				{ name: 'paymentDate', type: 'date', description: 'Date paid' },
				{ name: 'paymentType', type: 'select', description: 'Salary, Bonus, Prize, Appearance Fee, Endorsement' },
				{ name: 'status', type: 'select', description: 'Pending, Paid, Cancelled' },
				{ name: 'fiscalYear', type: 'number', description: 'Fiscal year' },
				{ name: 'notes', type: 'text', description: 'Payment notes' },
				{ name: 'expenseId', type: 'relation', relatesTo: 'expenses', description: 'Linked expense record' }
			],
			relationships: [
				{ to: 'pros', type: 'many-to-one', description: 'Payment to player' },
				{ to: 'expenses', type: 'one-to-one', description: 'Tracked as expense' },
				{ to: 'franchises', type: 'many-to-one', description: 'Paid by franchise' }
			]
		}
	];
	
	// Franchises system relationships
	const franchisesRelationships = [
		{
			collection: 'franchises',
			description: 'Active league franchises with ownership, territory, and roster management',
			fields: [
				{ name: 'name', type: 'text', description: 'Franchise name' },
				{ name: 'territory', type: 'text', description: 'Geographic territory' },
				{ name: 'city', type: 'text', description: 'Home city' },
				{ name: 'state', type: 'text', description: 'Home state' },
				{ name: 'ownerId', type: 'relation', relatesTo: 'user_profiles', description: 'Franchise owner' },
				{ name: 'dealId', type: 'relation', relatesTo: 'franchise_deals', description: 'Source deal' },
				{ name: 'status', type: 'select', description: 'Active, Inactive, Pending, Suspended' },
				{ name: 'foundedDate', type: 'date', description: 'Franchise start date' },
				{ name: 'logo', type: 'file', description: 'Franchise logo' },
				{ name: 'primaryColor', type: 'text', description: 'Brand primary color' },
				{ name: 'secondaryColor', type: 'text', description: 'Brand secondary color' },
				{ name: 'homeVenue', type: 'text', description: 'Home venue name' },
				{ name: 'venueCapacity', type: 'number', description: 'Venue capacity' }
			],
			relationships: [
				{ to: 'league', type: 'many-to-one', description: 'Belongs to league' },
				{ to: 'franchise_deals', type: 'one-to-one', description: 'Created from deal' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Owned by franchise owner' },
				{ to: 'pros', type: 'many-to-many', description: 'Roster of players' },
				{ to: 'sponsors', type: 'many-to-many', description: 'Franchise sponsors' },
				{ to: 'tournaments', type: 'many-to-many', description: 'Competes in tournaments' }
			]
		},
		{
			collection: 'franchise_territories',
			description: 'Geographic territories available for franchise ownership',
			fields: [
				{ name: 'name', type: 'text', description: 'Territory name' },
				{ name: 'region', type: 'text', description: 'Geographic region' },
				{ name: 'status', type: 'select', description: 'Available, Reserved, Sold, Unavailable' },
				{ name: 'population', type: 'number', description: 'Territory population' },
				{ name: 'marketValue', type: 'number', description: 'Estimated market value' },
				{ name: 'franchiseId', type: 'relation', relatesTo: 'franchises', description: 'Assigned franchise' }
			],
			relationships: [
				{ to: 'franchises', type: 'one-to-one', description: 'Territory assigned to franchise' },
				{ to: 'franchise_opportunities', type: 'one-to-many', description: 'Opportunities for territory' }
			]
		},
		{
			collection: 'franchise_owners',
			description: 'Franchise owner profiles and contact information',
			fields: [
				{ name: 'name', type: 'text', description: 'Owner name' },
				{ name: 'email', type: 'email', description: 'Contact email' },
				{ name: 'phone', type: 'text', description: 'Contact phone' },
				{ name: 'userId', type: 'relation', relatesTo: 'user_profiles', description: 'User account' },
				{ name: 'franchiseId', type: 'relation', relatesTo: 'franchises', description: 'Owned franchise' },
				{ name: 'bio', type: 'text', description: 'Owner biography' },
				{ name: 'photo', type: 'file', description: 'Owner photo' }
			],
			relationships: [
				{ to: 'franchises', type: 'one-to-one', description: 'Owns franchise' },
				{ to: 'user_profiles', type: 'one-to-one', description: 'Linked user account' },
				{ to: 'franchise_deals', type: 'one-to-one', description: 'Purchase deal' }
			]
		}
	];
	
	// Sponsors system relationships
	const sponsorsRelationships = [
		{
			collection: 'sponsors',
			description: 'Corporate sponsors with tier-based commitments and franchise conversion tracking',
			fields: [
				{ name: 'companyName', type: 'text', description: 'Sponsor company name' },
				{ name: 'type', type: 'select', description: 'casino, resort, hospitality, entertainment, corporate, other' },
				{ name: 'tier', type: 'select', description: 'tier_1 (Premium) to tier_4 (Growth)' },
				{ name: 'status', type: 'select', description: 'prospect → negotiating → active → renewed → converted_to_franchise' },
				{ name: 'primaryContactName', type: 'text', description: 'Primary contact person' },
				{ name: 'primaryContactEmail', type: 'email', description: 'Contact email' },
				{ name: 'location', type: 'text', description: 'Sponsor location' },
				{ name: 'territory', type: 'text', description: 'Geographic territory' },
				{ name: 'contractStartDate', type: 'date', description: 'Contract start date' },
				{ name: 'contractEndDate', type: 'date', description: 'Contract end date' },
				{ name: 'currentYear', type: 'number', description: 'Current contract year (2026-2028)' },
				{ name: 'annualCommitment', type: 'number', description: 'Annual sponsorship value' },
				{ name: 'totalPaid', type: 'number', description: 'Total paid to date' },
				{ name: 'franchiseInterest', type: 'boolean', description: 'Interested in franchise conversion' },
				{ name: 'franchiseConversionDate', type: 'date', description: 'Date converted to franchise' },
				{ name: 'franchiseDealId', type: 'relation', relatesTo: 'franchise_deals', description: 'Link to franchise deal' },
				{ name: 'assignedTo', type: 'relation', relatesTo: 'user_profiles', description: 'Sales rep assigned' }
			],
			relationships: [
				{ to: 'franchise_deals', type: 'one-to-one', description: 'Can convert to franchise owner' },
				{ to: 'franchises', type: 'many-to-many', description: 'Sponsors franchises' },
				{ to: 'pros', type: 'many-to-many', description: 'Sponsors individual players' },
				{ to: 'league', type: 'many-to-one', description: 'League-level sponsorship' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Managed by sales rep' }
			]
		},
		{
			collection: 'sponsor_franchise_bridge',
			description: 'Links sponsors to franchises they support',
			fields: [
				{ name: 'sponsorId', type: 'relation', relatesTo: 'sponsors', description: 'Sponsor' },
				{ name: 'franchiseId', type: 'relation', relatesTo: 'franchises', description: 'Franchise' },
				{ name: 'sponsorshipLevel', type: 'select', description: 'Title, Primary, Secondary, Supporting' },
				{ name: 'annualAmount', type: 'number', description: 'Annual sponsorship amount' },
				{ name: 'startDate', type: 'date', description: 'Sponsorship start' },
				{ name: 'endDate', type: 'date', description: 'Sponsorship end' }
			],
			relationships: [
				{ to: 'sponsors', type: 'many-to-one', description: 'Bridge to sponsor' },
				{ to: 'franchises', type: 'many-to-one', description: 'Bridge to franchise' }
			]
		}
	];
	
	// League system relationships
	const leagueRelationships = [
		{
			collection: 'league',
			description: 'FLI Golf League configuration and settings',
			fields: [
				{ name: 'name', type: 'text', description: 'League name' },
				{ name: 'season', type: 'text', description: 'Current season' },
				{ name: 'startDate', type: 'date', description: 'Season start date' },
				{ name: 'endDate', type: 'date', description: 'Season end date' },
				{ name: 'status', type: 'select', description: 'Active, Upcoming, Completed' },
				{ name: 'totalPrizePool', type: 'number', description: 'Total prize money' }
			],
			relationships: [
				{ to: 'franchises', type: 'one-to-many', description: 'League contains franchises' },
				{ to: 'pros', type: 'one-to-many', description: 'League has professional players' },
				{ to: 'tournaments', type: 'one-to-many', description: 'League hosts tournaments' }
			]
		},
		{
			collection: 'franchises',
			description: 'League franchises with ownership and territory',
			fields: [
				{ name: 'name', type: 'text', description: 'Franchise name' },
				{ name: 'territory', type: 'text', description: 'Geographic territory' },
				{ name: 'ownerId', type: 'relation', relatesTo: 'user_profiles', description: 'Franchise owner' },
				{ name: 'dealId', type: 'relation', relatesTo: 'franchise_deals', description: 'Source deal' },
				{ name: 'status', type: 'select', description: 'Active, Inactive, Pending' },
				{ name: 'foundedDate', type: 'date', description: 'Franchise start date' },
				{ name: 'logo', type: 'file', description: 'Franchise logo' }
			],
			relationships: [
				{ to: 'league', type: 'many-to-one', description: 'Belongs to league' },
				{ to: 'franchise_deals', type: 'one-to-one', description: 'Created from deal' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Owned by franchise owner' },
				{ to: 'pros', type: 'many-to-many', description: 'Roster of players' },
				{ to: 'sponsors', type: 'many-to-many', description: 'Franchise sponsors' }
			]
		},
		{
			collection: 'pros',
			description: 'Professional disc golf players',
			fields: [
				{ name: 'name', type: 'text', description: 'Player name' },
				{ name: 'worldRanking', type: 'number', description: 'Current world ranking' },
				{ name: 'gender', type: 'select', description: 'male, female, other' },
				{ name: 'status', type: 'select', description: 'active, inactive, retired' },
				{ name: 'country', type: 'text', description: 'Country of origin' },
				{ name: 'signedContract', type: 'file', description: 'Contract document' },
				{ name: 'bio', type: 'text', description: 'Player biography' }
			],
			relationships: [
				{ to: 'franchises', type: 'many-to-many', description: 'Plays for franchises' },
				{ to: 'pro_payments', type: 'one-to-many', description: 'Payment history' },
				{ to: 'league', type: 'many-to-one', description: 'Competes in league' },
				{ to: 'sponsors', type: 'many-to-many', description: 'Personal sponsors' }
			]
		},
		{
			collection: 'sponsors',
			description: 'League and franchise sponsors with tier-based commitments',
			fields: [
				{ name: 'companyName', type: 'text', description: 'Sponsor company name' },
				{ name: 'tier', type: 'select', description: 'tier_1 (Premium) to tier_4 (Growth)' },
				{ name: 'status', type: 'select', description: 'prospect → negotiating → active → renewed' },
				{ name: 'annualCommitment', type: 'number', description: 'Annual sponsorship value' },
				{ name: 'totalPaid', type: 'number', description: 'Total paid to date' },
				{ name: 'contractStartDate', type: 'date', description: 'Contract start' },
				{ name: 'contractEndDate', type: 'date', description: 'Contract end' },
				{ name: 'franchiseInterest', type: 'boolean', description: 'Interested in franchise conversion' }
			],
			relationships: [
				{ to: 'franchises', type: 'many-to-many', description: 'Sponsors franchises' },
				{ to: 'pros', type: 'many-to-many', description: 'Sponsors individual players' },
				{ to: 'league', type: 'many-to-one', description: 'League-level sponsorship' },
				{ to: 'franchise_deals', type: 'one-to-one', description: 'Can convert to franchise owner' }
			]
		},
		{
			collection: 'pro_payments',
			description: 'Player compensation and payment tracking',
			fields: [
				{ name: 'proId', type: 'relation', relatesTo: 'pros', description: 'Player receiving payment' },
				{ name: 'amount', type: 'number', description: 'Payment amount' },
				{ name: 'paymentDate', type: 'date', description: 'Date paid' },
				{ name: 'paymentType', type: 'select', description: 'Salary, Bonus, Prize, Appearance Fee' },
				{ name: 'status', type: 'select', description: 'Pending, Paid, Cancelled' },
				{ name: 'notes', type: 'text', description: 'Payment notes' }
			],
			relationships: [
				{ to: 'pros', type: 'many-to-one', description: 'Payment to player' },
				{ to: 'expenses', type: 'one-to-one', description: 'Tracked as expense' }
			]
		},
		{
			collection: 'tournaments',
			description: 'League tournaments and events',
			fields: [
				{ name: 'name', type: 'text', description: 'Tournament name' },
				{ name: 'location', type: 'text', description: 'Event location' },
				{ name: 'startDate', type: 'date', description: 'Tournament start' },
				{ name: 'endDate', type: 'date', description: 'Tournament end' },
				{ name: 'prizePool', type: 'number', description: 'Total prize money' },
				{ name: 'status', type: 'select', description: 'Upcoming, In Progress, Completed' }
			],
			relationships: [
				{ to: 'league', type: 'many-to-one', description: 'Part of league season' },
				{ to: 'franchises', type: 'many-to-many', description: 'Franchises competing' },
				{ to: 'projects', type: 'one-to-one', description: 'Managed as project' }
			]
		}
	];
	
	// Sales system relationships
	const salesRelationships = [
		{
			collection: 'franchise_opportunities',
			description: 'Franchise sales leads and opportunities in the pipeline',
			fields: [
				{ name: 'companyName', type: 'text', description: 'Prospect company name' },
				{ name: 'contactName', type: 'text', description: 'Primary contact' },
				{ name: 'email', type: 'email', description: 'Contact email' },
				{ name: 'phone', type: 'text', description: 'Contact phone' },
				{ name: 'territory', type: 'text', description: 'Desired territory' },
				{ name: 'stage', type: 'select', description: 'Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost' },
				{ name: 'estimatedValue', type: 'number', description: 'Estimated deal value' },
				{ name: 'assignedTo', type: 'relation', relatesTo: 'user_profiles', description: 'Sales rep assigned' }
			],
			relationships: [
				{ to: 'franchise_deals', type: 'one-to-one', description: 'Converts to deal when closed' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Assigned to sales rep' },
				{ to: 'sponsors', type: 'one-to-one', description: 'May originate from sponsor relationship' }
			]
		},
		{
			collection: 'franchise_deals',
			description: 'Closed franchise sales with payment tracking',
			fields: [
				{ name: 'opportunityId', type: 'relation', relatesTo: 'franchise_opportunities', description: 'Source opportunity' },
				{ name: 'franchiseOwnerName', type: 'text', description: 'Owner name' },
				{ name: 'territory', type: 'text', description: 'Franchise territory' },
				{ name: 'totalFranchiseValue', type: 'number', description: 'Total value ($10M default)' },
				{ name: 'netFranchiseValue', type: 'number', description: 'After discounts' },
				{ name: 'totalPaidToDate', type: 'number', description: 'Total paid' },
				{ name: 'outstandingBalance', type: 'number', description: 'Remaining balance' },
				{ name: 'paymentMilestones', type: 'json', description: 'Payment schedule' },
				{ name: 'status', type: 'select', description: 'pending_signature → signed → payment_in_progress → active' },
				{ name: 'closedBy', type: 'relation', relatesTo: 'user_profiles', description: 'Sales rep who closed' }
			],
			relationships: [
				{ to: 'franchise_opportunities', type: 'one-to-one', description: 'Created from opportunity' },
				{ to: 'sponsors', type: 'one-to-one', description: 'May convert from sponsor' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Closed by sales rep' },
				{ to: 'franchises', type: 'one-to-one', description: 'Creates active franchise' }
			]
		},
		{
			collection: 'sponsors',
			description: 'Sponsor relationships with conversion tracking',
			fields: [
				{ name: 'companyName', type: 'text', description: 'Sponsor company' },
				{ name: 'tier', type: 'select', description: 'tier_1 to tier_4' },
				{ name: 'status', type: 'select', description: 'prospect → negotiating → active → converted_to_franchise' },
				{ name: 'annualCommitment', type: 'number', description: 'Annual sponsorship value' },
				{ name: 'totalPaid', type: 'number', description: 'Total paid to date' },
				{ name: 'franchiseInterest', type: 'boolean', description: 'Interested in franchise' },
				{ name: 'franchiseDealId', type: 'relation', relatesTo: 'franchise_deals', description: 'Converted deal' },
				{ name: 'assignedTo', type: 'relation', relatesTo: 'user_profiles', description: 'Sales rep' }
			],
			relationships: [
				{ to: 'franchise_deals', type: 'one-to-one', description: 'Can convert to franchise deal' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Managed by sales rep' }
			]
		},
		{
			collection: 'user_profiles',
			description: 'Sales team members and their performance',
			fields: [
				{ name: 'name', type: 'text', description: 'User name' },
				{ name: 'email', type: 'email', description: 'Email address' },
				{ name: 'role', type: 'select', description: 'admin, sales, leader, vendor, pro, franchise_owner' },
				{ name: 'department', type: 'relation', relatesTo: 'departments', description: 'Department' }
			],
			relationships: [
				{ to: 'franchise_opportunities', type: 'one-to-many', description: 'Manages opportunities' },
				{ to: 'franchise_deals', type: 'one-to-many', description: 'Closes deals' },
				{ to: 'sponsors', type: 'one-to-many', description: 'Manages sponsors' }
			]
		}
	];
	
	// Operations system relationships
	const operationsRelationships = [
		{
			collection: 'projects',
			description: 'Tournaments, events, activations, and campaigns with budget tracking',
			fields: [
				{ name: 'name', type: 'text', description: 'Project name' },
				{ name: 'type', type: 'select', description: 'Tournament, Activation, Event, Campaign' },
				{ name: 'status', type: 'select', description: 'Draft, Planned, In Progress, Completed, Cancelled' },
				{ name: 'startDate', type: 'date', description: 'Project start date' },
				{ name: 'endDate', type: 'date', description: 'Project end date' },
				{ name: 'allocatedBudget', type: 'number', description: 'Budget allocated' },
				{ name: 'actualExpenses', type: 'number', description: 'Actual spent' },
				{ name: 'departmentId', type: 'relation', relatesTo: 'departments', description: 'Owning department' },
				{ name: 'approvedBy', type: 'relation', relatesTo: 'users', description: 'Approver' }
			],
			relationships: [
				{ to: 'tasks', type: 'one-to-many', description: 'Projects contain multiple tasks' },
				{ to: 'expenses', type: 'one-to-many', description: 'Projects track expenses against budget' },
				{ to: 'vendors', type: 'many-to-many', description: 'Projects work with multiple vendors' },
				{ to: 'departments', type: 'many-to-one', description: 'Projects belong to departments' }
			]
		},
		{
			collection: 'tasks',
			description: 'Project tasks with status, priority, and time tracking',
			fields: [
				{ name: 'task', type: 'text', description: 'Task title' },
				{ name: 'status', type: 'select', description: 'In Progress, Scheduled, Completed, Cancelled' },
				{ name: 'managers', type: 'text', description: 'Assigned team members' },
				{ name: 'startDate', type: 'date', description: 'Start date' },
				{ name: 'endDate', type: 'date', description: 'Due date' },
				{ name: 'budget', type: 'number', description: 'Task budget' },
				{ name: 'departments', type: 'text', description: 'Related departments' },
				{ name: 'quarters', type: 'select', description: 'Q1, Q2, Q3, Q4' }
			],
			relationships: [
				{ to: 'projects', type: 'many-to-one', description: 'Tasks belong to projects' },
				{ to: 'user_profiles', type: 'many-to-many', description: 'Tasks assigned to team members' }
			]
		},
		{
			collection: 'vendors',
			description: 'Vendor contacts and relationships',
			fields: [
				{ name: 'name', type: 'text', description: 'Vendor name' },
				{ name: 'email', type: 'email', description: 'Contact email' },
				{ name: 'phone', type: 'text', description: 'Contact phone' },
				{ name: 'type', type: 'text', description: 'Vendor classification' },
				{ name: 'status', type: 'select', description: 'Active, Inactive' }
			],
			relationships: [
				{ to: 'projects', type: 'many-to-many', description: 'Vendors work on multiple projects' },
				{ to: 'expenses', type: 'one-to-many', description: 'Vendors receive payments via expenses' }
			]
		},
		{
			collection: 'departments',
			description: 'Organizational departments',
			fields: [
				{ name: 'name', type: 'text', description: 'Department name' },
				{ name: 'description', type: 'text', description: 'Department description' }
			],
			relationships: [
				{ to: 'projects', type: 'one-to-many', description: 'Departments own projects' },
				{ to: 'user_profiles', type: 'one-to-many', description: 'Departments have team members' },
				{ to: 'budgets', type: 'one-to-many', description: 'Departments have budget allocations' }
			]
		}
	];
	
	// Financial system relationships
	const financialRelationships = [
		{
			collection: 'expenses',
			description: 'Track all company expenses with approval workflow',
			fields: [
				{ name: 'amount', type: 'number', description: 'Expense amount' },
				{ name: 'category', type: 'select', description: '40+ expense categories' },
				{ name: 'status', type: 'select', description: 'draft → submitted → approved → paid' },
				{ name: 'projectId', type: 'relation', relatesTo: 'projects', description: 'Link to project' },
				{ name: 'vendor', type: 'relation', relatesTo: 'vendors', description: 'Vendor who provided service' },
				{ name: 'submittedBy', type: 'relation', relatesTo: 'users', description: 'User who submitted' },
				{ name: 'approvedBy', type: 'relation', relatesTo: 'users', description: 'User who approved' }
			],
			relationships: [
				{ to: 'projects', type: 'many-to-one', description: 'Expenses belong to projects for budget tracking' },
				{ to: 'vendors', type: 'many-to-one', description: 'Expenses can be linked to vendors' },
				{ to: 'users', type: 'many-to-one', description: 'Submitted and approved by users' }
			]
		},
		{
			collection: 'budgets',
			description: 'Department and project budget allocations',
			fields: [
				{ name: 'name', type: 'text', description: 'Budget name' },
				{ name: 'departmentArea', type: 'text', description: 'Department or area' },
				{ name: 'allocatedBudget', type: 'number', description: 'Total allocated' },
				{ name: 'spentBudget', type: 'number', description: 'Amount spent' },
				{ name: 'remainingBudget', type: 'number', description: 'Remaining balance' }
			],
			relationships: [
				{ to: 'expenses', type: 'one-to-many', description: 'Budget tracked via expenses' },
				{ to: 'projects', type: 'one-to-many', description: 'Projects consume budget' }
			]
		},
		{
			collection: 'sponsors',
			description: 'Sponsor relationships with tier-based pricing',
			fields: [
				{ name: 'companyName', type: 'text', description: 'Sponsor company name' },
				{ name: 'tier', type: 'select', description: 'tier_1 (Premium) to tier_4 (Growth)' },
				{ name: 'status', type: 'select', description: 'prospect → negotiating → active → renewed' },
				{ name: 'annualCommitment', type: 'number', description: 'Annual sponsorship value' },
				{ name: 'totalPaid', type: 'number', description: 'Total paid to date' },
				{ name: 'franchiseInterest', type: 'boolean', description: 'Interested in franchise conversion' },
				{ name: 'franchiseDealId', type: 'relation', relatesTo: 'franchise_deals', description: 'Link to franchise deal if converted' }
			],
			relationships: [
				{ to: 'franchise_deals', type: 'one-to-one', description: 'Sponsors can convert to franchise owners' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Assigned to sales rep' }
			]
		},
		{
			collection: 'franchise_deals',
			description: 'Franchise sales with payment milestones',
			fields: [
				{ name: 'franchiseOwnerName', type: 'text', description: 'Owner name' },
				{ name: 'territory', type: 'text', description: 'Franchise territory' },
				{ name: 'totalFranchiseValue', type: 'number', description: 'Total franchise value ($10M default)' },
				{ name: 'sponsorshipDiscount', type: 'number', description: 'Discount from prior sponsorship' },
				{ name: 'netFranchiseValue', type: 'number', description: 'After discounts' },
				{ name: 'totalPaidToDate', type: 'number', description: 'Total paid so far' },
				{ name: 'outstandingBalance', type: 'number', description: 'Remaining balance' },
				{ name: 'paymentMilestones', type: 'json', description: 'Array of payment milestones' },
				{ name: 'status', type: 'select', description: 'pending_signature → signed → payment_in_progress → active' }
			],
			relationships: [
				{ to: 'sponsors', type: 'one-to-one', description: 'Can be converted from sponsor' },
				{ to: 'franchise_opportunities', type: 'many-to-one', description: 'Created from opportunity' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Closed by sales rep' }
			]
		},
		{
			collection: 'pros',
			description: 'Professional players with contract and payment tracking',
			fields: [
				{ name: 'name', type: 'text', description: 'Player name' },
				{ name: 'status', type: 'select', description: 'active, inactive, retired' },
				{ name: 'gender', type: 'select', description: 'male, female, other' },
				{ name: 'worldRanking', type: 'number', description: 'Current world ranking' },
				{ name: 'signedContract', type: 'file', description: 'Contract document' }
			],
			relationships: [
				{ to: 'pro_payments', type: 'one-to-many', description: 'Payment history for pro' },
				{ to: 'expenses', type: 'one-to-many', description: 'Pro-related expenses (travel, etc.)' }
			]
		}
	];
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Schema Guide</h1>
			<p class="text-muted-foreground mt-2">
				Visual guide to FliHub's data architecture and key relationships
			</p>
		</div>
		<div class="flex gap-2">
			<Button 
				variant={viewMode === 'table' ? 'default' : 'outline'} 
				size="sm"
				onclick={() => viewMode = 'table'}
			>
				<Table class="size-4 mr-2" />
				Table View
			</Button>
			<Button 
				variant={viewMode === 'visual' ? 'default' : 'outline'} 
				size="sm"
				onclick={() => viewMode = 'visual'}
			>
				<Eye class="size-4 mr-2" />
				Visual View
			</Button>
		</div>
	</div>

	<!-- Folder-style Tabs -->
	<div class="flex flex-col gap-2 mb-6">
		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			<FolderKanban class="size-4" />
			<span>Schema Categories</span>
		</div>
		<div class="flex flex-wrap gap-1 border-b border-border">
			{#each [
				{ id: 'financial', label: 'Financial' },
				{ id: 'operations', label: 'Operations' },
				{ id: 'sales', label: 'Sales' },
				{ id: 'league', label: 'League' },
				{ id: 'sponsors', label: 'Sponsors' },
				{ id: 'franchises', label: 'Franchises' },
				{ id: 'pros', label: 'Pros' },
				{ id: 'vendors', label: 'Vendors' },
				{ id: 'overview', label: 'Overview' }
			] as tab}
				<button
					onclick={() => activeTab = tab.id}
					class="relative px-6 py-3 text-sm font-medium transition-all duration-200 {
						activeTab === tab.id
							? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-t-2 border-x border-blue-400 dark:border-blue-600 rounded-t-lg -mb-px z-10'
							: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-t-lg'
					}"
					style={activeTab === tab.id ? 'border-bottom: 2px solid hsl(var(--card))' : ''}
				>
					<span class="font-semibold">{tab.label}</span>
					{#if activeTab === tab.id}
						<div class="absolute inset-x-0 -bottom-px h-0.5 bg-card"></div>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Tab Content -->
	{#if activeTab === 'financial'}
		<div class="space-y-6">
			{#if viewMode === 'table'}
				<div class="grid gap-6">
					{#each financialRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
							<div class="flex items-center justify-between">
								<div>
									<h2 class="text-xl font-mono font-bold">{collection.collection}</h2>
									<p class="text-sm text-muted-foreground mt-1">{collection.description}</p>
								</div>
								<Badge variant="outline" class="font-mono text-xs">
									{collection.fields.length} fields
								</Badge>
							</div>
							<!-- Fields Section -->
							<div>
								<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
									Fields
								</h3>
								<div class="grid gap-2">
									{#each collection.fields as field}
										<div class="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
											<Badge variant="secondary" class="font-mono text-xs shrink-0">
												{field.type}
											</Badge>
											<div class="flex-1 min-w-0">
												<div class="font-mono text-sm font-medium">{field.name}</div>
												<div class="text-sm text-muted-foreground">{field.description}</div>
												{#if field.relatesTo}
													<div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
														→ relates to: <span class="font-mono">{field.relatesTo}</span>
													</div>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Relationships Section -->
							{#if collection.relationships && collection.relationships.length > 0}
								<div>
									<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
										Relationships
									</h3>
									<div class="grid gap-2">
										{#each collection.relationships as rel}
											<div class="flex items-start gap-3 p-3 rounded-lg border bg-blue-900 text-white">
												<Badge variant="default" class="text-xs shrink-0">
													{rel.type}
												</Badge>
												<div class="flex-1 min-w-0">
													<div class="font-mono text-sm font-medium text-white">
														{collection.collection} → {rel.to}
													</div>
													<div class="text-sm text-blue-100">{rel.description}</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</Card>
				{/each}
			</div>
			{:else}
				<!-- Visual View -->
				<div class="space-y-8">
					{#each financialRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div>
									<h2 class="text-xl font-mono font-bold mb-2">{collection.collection}</h2>
									<p class="text-sm text-muted-foreground">{collection.description}</p>
								</div>
								
								<!-- Visual Relationship Diagram -->
								<div class="relative p-8 bg-muted/30 rounded-lg">
									<!-- Central Collection Box -->
									<div class="flex justify-center mb-8">
										<div class="px-6 py-4 bg-blue-600 text-white rounded-lg border-2 border-blue-700 shadow-lg">
											<div class="font-mono font-bold text-lg">{collection.collection}</div>
											<div class="text-xs text-blue-100 mt-1">{collection.fields.length} fields</div>
										</div>
									</div>
									
									<!-- Relationships as Connected Boxes -->
									{#if collection.relationships && collection.relationships.length > 0}
										<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
											{#each collection.relationships as rel, idx}
												{@const bgColors = ['bg-blue-800', 'bg-blue-700', 'bg-blue-600', 'bg-blue-500', 'bg-blue-400']}
												{@const textColors = ['text-white', 'text-white', 'text-white', 'text-white', 'text-blue-900']}
												{@const descColors = ['text-blue-100', 'text-blue-100', 'text-blue-100', 'text-blue-100', 'text-blue-700']}
												{@const bgColor = bgColors[Math.min(idx, bgColors.length - 1)]}
												{@const textColor = textColors[Math.min(idx, textColors.length - 1)]}
												{@const descColor = descColors[Math.min(idx, descColors.length - 1)]}
												<div class="relative">
													<!-- Connection Line -->
													<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-0.5 h-8 bg-blue-400"></div>
													
													<!-- Related Collection Box with gradient background -->
													<div class="p-4 {bgColor} border-2 border-blue-900 rounded-lg shadow-lg">
														<div class="flex items-center gap-2 mb-2">
															<Badge variant="outline" class="text-xs bg-white/20 text-white border-white/30">
																{rel.type}
															</Badge>
														</div>
														<div class="font-mono font-bold {textColor}">{rel.to}</div>
														<div class="text-xs {descColor} mt-2">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}

			<!-- Financial Flow Diagram -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Financial Data Flow</h2>
						<p class="text-sm text-muted-foreground mt-1">How money flows through the system</p>
					</div>
					<div class="space-y-4 p-6 bg-muted/30 rounded-lg">
						<div class="flex items-center gap-4">
							<div class="flex-1 p-4 bg-background border-2 border-blue-500 rounded-lg text-center">
								<div class="font-mono font-bold">sponsors</div>
								<div class="text-xs text-muted-foreground mt-1">Revenue In</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-green-500 rounded-lg text-center">
								<div class="font-mono font-bold">budgets</div>
								<div class="text-xs text-muted-foreground mt-1">Allocation</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-purple-500 rounded-lg text-center">
								<div class="font-mono font-bold">expenses</div>
								<div class="text-xs text-muted-foreground mt-1">Money Out</div>
							</div>
						</div>
						
						<div class="flex items-center gap-4 mt-6">
							<div class="flex-1 p-4 bg-background border-2 border-orange-500 rounded-lg text-center">
								<div class="font-mono font-bold">franchise_deals</div>
								<div class="text-xs text-muted-foreground mt-1">Revenue In (Milestones)</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-pink-500 rounded-lg text-center">
								<div class="font-mono font-bold">pro_payments</div>
								<div class="text-xs text-muted-foreground mt-1">Player Compensation</div>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if activeTab === 'operations'}
		<div class="space-y-6">
			{#if viewMode === 'table'}
				<div class="grid gap-6">
					{#each operationsRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<div>
										<h2 class="text-xl font-mono font-bold">{collection.collection}</h2>
										<p class="text-sm text-muted-foreground mt-1">{collection.description}</p>
									</div>
									<Badge variant="outline" class="font-mono text-xs">
										{collection.fields.length} fields
									</Badge>
								</div>

								<!-- Fields Section -->
								<div>
									<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
										Fields
									</h3>
									<div class="grid gap-2">
										{#each collection.fields as field}
											<div class="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
												<Badge variant="secondary" class="font-mono text-xs shrink-0">
													{field.type}
												</Badge>
												<div class="flex-1 min-w-0">
													<div class="font-mono text-sm font-medium">{field.name}</div>
													<div class="text-sm text-muted-foreground">{field.description}</div>
													{#if field.relatesTo}
														<div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
															→ relates to: <span class="font-mono">{field.relatesTo}</span>
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Relationships Section -->
								{#if collection.relationships && collection.relationships.length > 0}
									<div>
										<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
											Relationships
										</h3>
										<div class="grid gap-2">
											{#each collection.relationships as rel}
												<div class="flex items-start gap-3 p-3 rounded-lg border bg-blue-900 text-white">
													<Badge variant="default" class="text-xs shrink-0">
														{rel.type}
													</Badge>
													<div class="flex-1 min-w-0">
														<div class="font-mono text-sm font-medium text-white">
															{collection.collection} → {rel.to}
														</div>
														<div class="text-sm text-blue-100">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</Card>
					{/each}
				</div>
			{:else}
				<!-- Visual View -->
				<div class="space-y-8">
					{#each operationsRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div>
									<h2 class="text-xl font-mono font-bold mb-2">{collection.collection}</h2>
									<p class="text-sm text-muted-foreground">{collection.description}</p>
								</div>
								
								<!-- Visual Relationship Diagram -->
								<div class="relative p-8 bg-muted/30 rounded-lg">
									<!-- Central Collection Box -->
									<div class="flex justify-center mb-8">
										<div class="px-6 py-4 bg-green-600 text-white rounded-lg border-2 border-green-700 shadow-lg">
											<div class="font-mono font-bold text-lg">{collection.collection}</div>
											<div class="text-xs text-green-100 mt-1">{collection.fields.length} fields</div>
										</div>
									</div>
									
									<!-- Relationships as Connected Boxes -->
									{#if collection.relationships && collection.relationships.length > 0}
										<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
											{#each collection.relationships as rel, idx}
												{@const bgColors = ['bg-green-800', 'bg-green-700', 'bg-green-600', 'bg-green-500', 'bg-green-400']}
												{@const textColors = ['text-white', 'text-white', 'text-white', 'text-white', 'text-green-900']}
												{@const descColors = ['text-green-100', 'text-green-100', 'text-green-100', 'text-green-100', 'text-green-700']}
												{@const bgColor = bgColors[Math.min(idx, bgColors.length - 1)]}
												{@const textColor = textColors[Math.min(idx, textColors.length - 1)]}
												{@const descColor = descColors[Math.min(idx, descColors.length - 1)]}
												<div class="relative">
													<!-- Connection Line -->
													<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-0.5 h-8 bg-green-400"></div>
													
													<!-- Related Collection Box with gradient background -->
													<div class="p-4 {bgColor} border-2 border-green-900 rounded-lg shadow-lg">
														<div class="flex items-center gap-2 mb-2">
															<Badge variant="outline" class="text-xs bg-white/20 text-white border-white/30">
																{rel.type}
															</Badge>
														</div>
														<div class="font-mono font-bold {textColor}">{rel.to}</div>
														<div class="text-xs {descColor} mt-2">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}

			<!-- Operations Flow Diagram -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Operations Data Flow</h2>
						<p class="text-sm text-muted-foreground mt-1">How work flows through the system</p>
					</div>
					<div class="space-y-4 p-6 bg-muted/30 rounded-lg">
						<div class="flex items-center gap-4">
							<div class="flex-1 p-4 bg-background border-2 border-green-500 rounded-lg text-center">
								<div class="font-mono font-bold">departments</div>
								<div class="text-xs text-muted-foreground mt-1">Organization</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-green-600 rounded-lg text-center">
								<div class="font-mono font-bold">projects</div>
								<div class="text-xs text-muted-foreground mt-1">Work Containers</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-green-700 rounded-lg text-center">
								<div class="font-mono font-bold">tasks</div>
								<div class="text-xs text-muted-foreground mt-1">Execution</div>
							</div>
						</div>
						
						<div class="flex items-center gap-4 mt-6 justify-center">
							<div class="flex-1 max-w-md p-4 bg-background border-2 border-amber-500 rounded-lg text-center">
								<div class="font-mono font-bold">vendors</div>
								<div class="text-xs text-muted-foreground mt-1">External Resources</div>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if activeTab === 'sales'}
		<div class="space-y-6">
			{#if viewMode === 'table'}
				<div class="grid gap-6">
					{#each salesRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<div>
										<h2 class="text-xl font-mono font-bold">{collection.collection}</h2>
										<p class="text-sm text-muted-foreground mt-1">{collection.description}</p>
									</div>
									<Badge variant="outline" class="font-mono text-xs">
										{collection.fields.length} fields
									</Badge>
								</div>

								<!-- Fields Section -->
								<div>
									<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
										Fields
									</h3>
									<div class="grid gap-2">
										{#each collection.fields as field}
											<div class="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
												<Badge variant="secondary" class="font-mono text-xs shrink-0">
													{field.type}
												</Badge>
												<div class="flex-1 min-w-0">
													<div class="font-mono text-sm font-medium">{field.name}</div>
													<div class="text-sm text-muted-foreground">{field.description}</div>
													{#if field.relatesTo}
														<div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
															→ relates to: <span class="font-mono">{field.relatesTo}</span>
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Relationships Section -->
								{#if collection.relationships && collection.relationships.length > 0}
									<div>
										<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
											Relationships
										</h3>
										<div class="grid gap-2">
											{#each collection.relationships as rel}
												<div class="flex items-start gap-3 p-3 rounded-lg border bg-blue-900 text-white">
													<Badge variant="default" class="text-xs shrink-0">
														{rel.type}
													</Badge>
													<div class="flex-1 min-w-0">
														<div class="font-mono text-sm font-medium text-white">
															{collection.collection} → {rel.to}
														</div>
														<div class="text-sm text-blue-100">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</Card>
					{/each}
				</div>
			{:else}
				<!-- Visual View -->
				<div class="space-y-8">
					{#each salesRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div>
									<h2 class="text-xl font-mono font-bold mb-2">{collection.collection}</h2>
									<p class="text-sm text-muted-foreground">{collection.description}</p>
								</div>
								
								<!-- Visual Relationship Diagram -->
								<div class="relative p-8 bg-muted/30 rounded-lg">
									<!-- Central Collection Box -->
									<div class="flex justify-center mb-8">
										<div class="px-6 py-4 bg-purple-600 text-white rounded-lg border-2 border-purple-700 shadow-lg">
											<div class="font-mono font-bold text-lg">{collection.collection}</div>
											<div class="text-xs text-purple-100 mt-1">{collection.fields.length} fields</div>
										</div>
									</div>
									
									<!-- Relationships as Connected Boxes -->
									{#if collection.relationships && collection.relationships.length > 0}
										<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
											{#each collection.relationships as rel, idx}
												{@const bgColors = ['bg-purple-800', 'bg-purple-700', 'bg-purple-600', 'bg-purple-500', 'bg-purple-400']}
												{@const textColors = ['text-white', 'text-white', 'text-white', 'text-white', 'text-purple-900']}
												{@const descColors = ['text-purple-100', 'text-purple-100', 'text-purple-100', 'text-purple-100', 'text-purple-700']}
												{@const bgColor = bgColors[Math.min(idx, bgColors.length - 1)]}
												{@const textColor = textColors[Math.min(idx, textColors.length - 1)]}
												{@const descColor = descColors[Math.min(idx, descColors.length - 1)]}
												<div class="relative">
													<!-- Connection Line -->
													<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-0.5 h-8 bg-purple-400"></div>
													
													<!-- Related Collection Box with gradient background -->
													<div class="p-4 {bgColor} border-2 border-purple-900 rounded-lg shadow-lg">
														<div class="flex items-center gap-2 mb-2">
															<Badge variant="outline" class="text-xs bg-white/20 text-white border-white/30">
																{rel.type}
															</Badge>
														</div>
														<div class="font-mono font-bold {textColor}">{rel.to}</div>
														<div class="text-xs {descColor} mt-2">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}

			<!-- Sales Flow Diagram -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Sales Pipeline Flow</h2>
						<p class="text-sm text-muted-foreground mt-1">How prospects convert to franchise owners</p>
					</div>
					<div class="space-y-4 p-6 bg-muted/30 rounded-lg">
						<div class="flex items-center gap-4">
							<div class="flex-1 p-4 bg-background border-2 border-purple-400 rounded-lg text-center">
								<div class="font-mono font-bold">sponsors</div>
								<div class="text-xs text-muted-foreground mt-1">Warm Leads</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-purple-500 rounded-lg text-center">
								<div class="font-mono font-bold">franchise_opportunities</div>
								<div class="text-xs text-muted-foreground mt-1">Pipeline</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-purple-600 rounded-lg text-center">
								<div class="font-mono font-bold">franchise_deals</div>
								<div class="text-xs text-muted-foreground mt-1">Closed Won</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-purple-700 rounded-lg text-center">
								<div class="font-mono font-bold">franchises</div>
								<div class="text-xs text-muted-foreground mt-1">Active</div>
							</div>
						</div>
						
						<div class="flex items-center gap-4 mt-6 justify-center">
							<div class="flex-1 max-w-md p-4 bg-background border-2 border-amber-500 rounded-lg text-center">
								<div class="font-mono font-bold">user_profiles (sales)</div>
								<div class="text-xs text-muted-foreground mt-1">Sales Team Management</div>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if activeTab === 'league'}
		<div class="space-y-6">
			{#if viewMode === 'table'}
				<div class="grid gap-6">
					{#each leagueRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<div>
										<h2 class="text-xl font-mono font-bold">{collection.collection}</h2>
										<p class="text-sm text-muted-foreground mt-1">{collection.description}</p>
									</div>
									<Badge variant="outline" class="font-mono text-xs">
										{collection.fields.length} fields
									</Badge>
								</div>

								<!-- Fields Section -->
								<div>
									<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
										Fields
									</h3>
									<div class="grid gap-2">
										{#each collection.fields as field}
											<div class="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
												<Badge variant="secondary" class="font-mono text-xs shrink-0">
													{field.type}
												</Badge>
												<div class="flex-1 min-w-0">
													<div class="font-mono text-sm font-medium">{field.name}</div>
													<div class="text-sm text-muted-foreground">{field.description}</div>
													{#if field.relatesTo}
														<div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
															→ relates to: <span class="font-mono">{field.relatesTo}</span>
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Relationships Section -->
								{#if collection.relationships && collection.relationships.length > 0}
									<div>
										<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
											Relationships
										</h3>
										<div class="grid gap-2">
											{#each collection.relationships as rel}
												<div class="flex items-start gap-3 p-3 rounded-lg border bg-blue-900 text-white">
													<Badge variant="default" class="text-xs shrink-0">
														{rel.type}
													</Badge>
													<div class="flex-1 min-w-0">
														<div class="font-mono text-sm font-medium text-white">
															{collection.collection} → {rel.to}
														</div>
														<div class="text-sm text-blue-100">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</Card>
					{/each}
				</div>
			{:else}
				<!-- Visual View -->
				<div class="space-y-8">
					{#each leagueRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div>
									<h2 class="text-xl font-mono font-bold mb-2">{collection.collection}</h2>
									<p class="text-sm text-muted-foreground">{collection.description}</p>
								</div>
								
								<!-- Visual Relationship Diagram -->
								<div class="relative p-8 bg-muted/30 rounded-lg">
									<!-- Central Collection Box -->
									<div class="flex justify-center mb-8">
										<div class="px-6 py-4 bg-orange-600 text-white rounded-lg border-2 border-orange-700 shadow-lg">
											<div class="font-mono font-bold text-lg">{collection.collection}</div>
											<div class="text-xs text-orange-100 mt-1">{collection.fields.length} fields</div>
										</div>
									</div>
									
									<!-- Relationships as Connected Boxes -->
									{#if collection.relationships && collection.relationships.length > 0}
										<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
											{#each collection.relationships as rel, idx}
												{@const bgColors = ['bg-orange-800', 'bg-orange-700', 'bg-orange-600', 'bg-orange-500', 'bg-orange-400']}
												{@const textColors = ['text-white', 'text-white', 'text-white', 'text-white', 'text-orange-900']}
												{@const descColors = ['text-orange-100', 'text-orange-100', 'text-orange-100', 'text-orange-100', 'text-orange-700']}
												{@const bgColor = bgColors[Math.min(idx, bgColors.length - 1)]}
												{@const textColor = textColors[Math.min(idx, textColors.length - 1)]}
												{@const descColor = descColors[Math.min(idx, descColors.length - 1)]}
												<div class="relative">
													<!-- Connection Line -->
													<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-0.5 h-8 bg-orange-400"></div>
													
													<!-- Related Collection Box with gradient background -->
													<div class="p-4 {bgColor} border-2 border-orange-900 rounded-lg shadow-lg">
														<div class="flex items-center gap-2 mb-2">
															<Badge variant="outline" class="text-xs bg-white/20 text-white border-white/30">
																{rel.type}
															</Badge>
														</div>
														<div class="font-mono font-bold {textColor}">{rel.to}</div>
														<div class="text-xs {descColor} mt-2">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}

			<!-- League Structure Diagram -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">League Structure</h2>
						<p class="text-sm text-muted-foreground mt-1">How the league is organized</p>
					</div>
					<div class="space-y-4 p-6 bg-muted/30 rounded-lg">
						<div class="flex items-center gap-4">
							<div class="flex-1 p-4 bg-background border-2 border-orange-600 rounded-lg text-center">
								<div class="font-mono font-bold">league</div>
								<div class="text-xs text-muted-foreground mt-1">Organization</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-orange-500 rounded-lg text-center">
								<div class="font-mono font-bold">franchises</div>
								<div class="text-xs text-muted-foreground mt-1">Teams</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-orange-400 rounded-lg text-center">
								<div class="font-mono font-bold">pros</div>
								<div class="text-xs text-muted-foreground mt-1">Players</div>
							</div>
						</div>
						
						<div class="flex items-center gap-4 mt-6">
							<div class="flex-1 p-4 bg-background border-2 border-amber-600 rounded-lg text-center">
								<div class="font-mono font-bold">tournaments</div>
								<div class="text-xs text-muted-foreground mt-1">Competition Events</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-amber-500 rounded-lg text-center">
								<div class="font-mono font-bold">pro_payments</div>
								<div class="text-xs text-muted-foreground mt-1">Player Compensation</div>
							</div>
						</div>
						
						<div class="flex items-center gap-4 mt-6 justify-center">
							<div class="flex-1 max-w-md p-4 bg-background border-2 border-pink-500 rounded-lg text-center">
								<div class="font-mono font-bold">sponsors</div>
								<div class="text-xs text-muted-foreground mt-1">Revenue & Brand Partners</div>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if activeTab === 'sponsors'}
		<div class="space-y-6">
			{#if viewMode === 'table'}
				<div class="grid gap-6">
					{#each sponsorsRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<div>
										<h2 class="text-xl font-mono font-bold">{collection.collection}</h2>
										<p class="text-sm text-muted-foreground mt-1">{collection.description}</p>
									</div>
									<Badge variant="outline" class="font-mono text-xs">
										{collection.fields.length} fields
									</Badge>
								</div>

								<!-- Fields Section -->
								<div>
									<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
										Fields
									</h3>
									<div class="grid gap-2">
										{#each collection.fields as field}
											<div class="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
												<Badge variant="secondary" class="font-mono text-xs shrink-0">
													{field.type}
												</Badge>
												<div class="flex-1 min-w-0">
													<div class="font-mono text-sm font-medium">{field.name}</div>
													<div class="text-sm text-muted-foreground">{field.description}</div>
													{#if field.relatesTo}
														<div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
															→ relates to: <span class="font-mono">{field.relatesTo}</span>
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Relationships Section -->
								{#if collection.relationships && collection.relationships.length > 0}
									<div>
										<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
											Relationships
										</h3>
										<div class="grid gap-2">
											{#each collection.relationships as rel}
												<div class="flex items-start gap-3 p-3 rounded-lg border bg-blue-900 text-white">
													<Badge variant="default" class="text-xs shrink-0">
														{rel.type}
													</Badge>
													<div class="flex-1 min-w-0">
														<div class="font-mono text-sm font-medium text-white">
															{collection.collection} → {rel.to}
														</div>
														<div class="text-sm text-blue-100">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</Card>
					{/each}
				</div>
			{:else}
				<!-- Visual View -->
				<div class="space-y-8">
					{#each sponsorsRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div>
									<h2 class="text-xl font-mono font-bold mb-2">{collection.collection}</h2>
									<p class="text-sm text-muted-foreground">{collection.description}</p>
								</div>
								
								<!-- Visual Relationship Diagram -->
								<div class="relative p-8 bg-muted/30 rounded-lg">
									<!-- Central Collection Box -->
									<div class="flex justify-center mb-8">
										<div class="px-6 py-4 bg-pink-600 text-white rounded-lg border-2 border-pink-700 shadow-lg">
											<div class="font-mono font-bold text-lg">{collection.collection}</div>
											<div class="text-xs text-pink-100 mt-1">{collection.fields.length} fields</div>
										</div>
									</div>
									
									<!-- Relationships as Connected Boxes -->
									{#if collection.relationships && collection.relationships.length > 0}
										<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
											{#each collection.relationships as rel, idx}
												{@const bgColors = ['bg-pink-800', 'bg-pink-700', 'bg-pink-600', 'bg-pink-500', 'bg-pink-400']}
												{@const textColors = ['text-white', 'text-white', 'text-white', 'text-white', 'text-pink-900']}
												{@const descColors = ['text-pink-100', 'text-pink-100', 'text-pink-100', 'text-pink-100', 'text-pink-700']}
												{@const bgColor = bgColors[Math.min(idx, bgColors.length - 1)]}
												{@const textColor = textColors[Math.min(idx, textColors.length - 1)]}
												{@const descColor = descColors[Math.min(idx, descColors.length - 1)]}
												<div class="relative">
													<!-- Connection Line -->
													<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-0.5 h-8 bg-pink-400"></div>
													
													<!-- Related Collection Box with gradient background -->
													<div class="p-4 {bgColor} border-2 border-pink-900 rounded-lg shadow-lg">
														<div class="flex items-center gap-2 mb-2">
															<Badge variant="outline" class="text-xs bg-white/20 text-white border-white/30">
																{rel.type}
															</Badge>
														</div>
														<div class="font-mono font-bold {textColor}">{rel.to}</div>
														<div class="text-xs {descColor} mt-2">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}

			<!-- Sponsor Tier Pricing -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Sponsor Tier Pricing Structure</h2>
						<p class="text-sm text-muted-foreground mt-1">3-year commitment pricing by tier</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div class="p-4 bg-gradient-to-b from-pink-600 to-pink-700 text-white rounded-lg border-2 border-pink-800 shadow-lg">
							<div class="font-bold text-lg mb-2">Tier 1 - Premium</div>
							<div class="space-y-1 text-sm">
								<div class="flex justify-between">
									<span>2026:</span>
									<span class="font-mono">$7M</span>
								</div>
								<div class="flex justify-between">
									<span>2027:</span>
									<span class="font-mono">$5M</span>
								</div>
								<div class="flex justify-between">
									<span>2028:</span>
									<span class="font-mono">$3M</span>
								</div>
								<div class="border-t border-pink-400 pt-1 mt-2 flex justify-between font-bold">
									<span>Total:</span>
									<span class="font-mono">$15M</span>
								</div>
							</div>
						</div>

						<div class="p-4 bg-gradient-to-b from-pink-500 to-pink-600 text-white rounded-lg border-2 border-pink-700 shadow-lg">
							<div class="font-bold text-lg mb-2">Tier 2 - Elite</div>
							<div class="space-y-1 text-sm">
								<div class="flex justify-between">
									<span>2026:</span>
									<span class="font-mono">$5M</span>
								</div>
								<div class="flex justify-between">
									<span>2027:</span>
									<span class="font-mono">$7M</span>
								</div>
								<div class="flex justify-between">
									<span>2028:</span>
									<span class="font-mono">$9M</span>
								</div>
								<div class="border-t border-pink-300 pt-1 mt-2 flex justify-between font-bold">
									<span>Total:</span>
									<span class="font-mono">$21M</span>
								</div>
							</div>
						</div>

						<div class="p-4 bg-gradient-to-b from-pink-400 to-pink-500 text-white rounded-lg border-2 border-pink-600 shadow-lg">
							<div class="font-bold text-lg mb-2">Tier 3 - Standard</div>
							<div class="space-y-1 text-sm">
								<div class="flex justify-between">
									<span>2026:</span>
									<span class="font-mono">$1M</span>
								</div>
								<div class="flex justify-between">
									<span>2027:</span>
									<span class="font-mono">$1M</span>
								</div>
								<div class="flex justify-between">
									<span>2028:</span>
									<span class="font-mono">$2M</span>
								</div>
								<div class="border-t border-pink-200 pt-1 mt-2 flex justify-between font-bold">
									<span>Total:</span>
									<span class="font-mono">$4M</span>
								</div>
							</div>
						</div>

						<div class="p-4 bg-gradient-to-b from-pink-300 to-pink-400 text-white rounded-lg border-2 border-pink-500 shadow-lg">
							<div class="font-bold text-lg mb-2">Tier 4 - Growth</div>
							<div class="space-y-1 text-sm">
								<div class="flex justify-between">
									<span>2026:</span>
									<span class="font-mono">$1M</span>
								</div>
								<div class="flex justify-between">
									<span>2027:</span>
									<span class="font-mono">$1.5M</span>
								</div>
								<div class="flex justify-between">
									<span>2028:</span>
									<span class="font-mono">$2M</span>
								</div>
								<div class="border-t border-pink-200 pt-1 mt-2 flex justify-between font-bold">
									<span>Total:</span>
									<span class="font-mono">$4.5M</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Card>

			<!-- Sponsor Journey -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Sponsor Journey</h2>
						<p class="text-sm text-muted-foreground mt-1">How sponsors progress through the system</p>
					</div>
					<div class="space-y-4 p-6 bg-muted/30 rounded-lg">
						<div class="flex items-center gap-4">
							<div class="flex-1 p-4 bg-background border-2 border-pink-300 rounded-lg text-center">
								<div class="font-mono font-bold">prospect</div>
								<div class="text-xs text-muted-foreground mt-1">Initial Contact</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-pink-400 rounded-lg text-center">
								<div class="font-mono font-bold">negotiating</div>
								<div class="text-xs text-muted-foreground mt-1">Terms Discussion</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-pink-500 rounded-lg text-center">
								<div class="font-mono font-bold">active</div>
								<div class="text-xs text-muted-foreground mt-1">Sponsoring</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-pink-600 rounded-lg text-center">
								<div class="font-mono font-bold">renewed</div>
								<div class="text-xs text-muted-foreground mt-1">Contract Extended</div>
							</div>
						</div>
						
						<div class="flex items-center gap-4 mt-6 justify-center">
							<div class="flex-1 max-w-md p-4 bg-background border-2 border-purple-600 rounded-lg text-center">
								<div class="font-mono font-bold">converted_to_franchise</div>
								<div class="text-xs text-muted-foreground mt-1">Becomes Franchise Owner</div>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if activeTab === 'franchises'}
		<div class="space-y-6">
			{#if viewMode === 'table'}
				<div class="grid gap-6">
					{#each franchisesRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<div>
										<h2 class="text-xl font-mono font-bold">{collection.collection}</h2>
										<p class="text-sm text-muted-foreground mt-1">{collection.description}</p>
									</div>
									<Badge variant="outline" class="font-mono text-xs">
										{collection.fields.length} fields
									</Badge>
								</div>

								<!-- Fields Section -->
								<div>
									<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
										Fields
									</h3>
									<div class="grid gap-2">
										{#each collection.fields as field}
											<div class="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
												<Badge variant="secondary" class="font-mono text-xs shrink-0">
													{field.type}
												</Badge>
												<div class="flex-1 min-w-0">
													<div class="font-mono text-sm font-medium">{field.name}</div>
													<div class="text-sm text-muted-foreground">{field.description}</div>
													{#if field.relatesTo}
														<div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
															→ relates to: <span class="font-mono">{field.relatesTo}</span>
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Relationships Section -->
								{#if collection.relationships && collection.relationships.length > 0}
									<div>
										<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
											Relationships
										</h3>
										<div class="grid gap-2">
											{#each collection.relationships as rel}
												<div class="flex items-start gap-3 p-3 rounded-lg border bg-blue-900 text-white">
													<Badge variant="default" class="text-xs shrink-0">
														{rel.type}
													</Badge>
													<div class="flex-1 min-w-0">
														<div class="font-mono text-sm font-medium text-white">
															{collection.collection} → {rel.to}
														</div>
														<div class="text-sm text-blue-100">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</Card>
					{/each}
				</div>
			{:else}
				<!-- Visual View -->
				<div class="space-y-8">
					{#each franchisesRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div>
									<h2 class="text-xl font-mono font-bold mb-2">{collection.collection}</h2>
									<p class="text-sm text-muted-foreground">{collection.description}</p>
								</div>
								
								<!-- Visual Relationship Diagram -->
								<div class="relative p-8 bg-muted/30 rounded-lg">
									<!-- Central Collection Box -->
									<div class="flex justify-center mb-8">
										<div class="px-6 py-4 bg-amber-600 text-white rounded-lg border-2 border-amber-700 shadow-lg">
											<div class="font-mono font-bold text-lg">{collection.collection}</div>
											<div class="text-xs text-amber-100 mt-1">{collection.fields.length} fields</div>
										</div>
									</div>
									
									<!-- Relationships as Connected Boxes -->
									{#if collection.relationships && collection.relationships.length > 0}
										<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
											{#each collection.relationships as rel, idx}
												{@const bgColors = ['bg-amber-800', 'bg-amber-700', 'bg-amber-600', 'bg-amber-500', 'bg-amber-400']}
												{@const textColors = ['text-white', 'text-white', 'text-white', 'text-white', 'text-amber-900']}
												{@const descColors = ['text-amber-100', 'text-amber-100', 'text-amber-100', 'text-amber-100', 'text-amber-700']}
												{@const bgColor = bgColors[Math.min(idx, bgColors.length - 1)]}
												{@const textColor = textColors[Math.min(idx, textColors.length - 1)]}
												{@const descColor = descColors[Math.min(idx, descColors.length - 1)]}
												<div class="relative">
													<!-- Connection Line -->
													<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-0.5 h-8 bg-amber-400"></div>
													
													<!-- Related Collection Box with gradient background -->
													<div class="p-4 {bgColor} border-2 border-amber-900 rounded-lg shadow-lg">
														<div class="flex items-center gap-2 mb-2">
															<Badge variant="outline" class="text-xs bg-white/20 text-white border-white/30">
																{rel.type}
															</Badge>
														</div>
														<div class="font-mono font-bold {textColor}">{rel.to}</div>
														<div class="text-xs {descColor} mt-2">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}

			<!-- Franchise Lifecycle -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Franchise Lifecycle</h2>
						<p class="text-sm text-muted-foreground mt-1">From opportunity to active franchise</p>
					</div>
					<div class="space-y-4 p-6 bg-muted/30 rounded-lg">
						<div class="flex items-center gap-4">
							<div class="flex-1 p-4 bg-background border-2 border-purple-400 rounded-lg text-center">
								<div class="font-mono font-bold">franchise_opportunities</div>
								<div class="text-xs text-muted-foreground mt-1">Sales Lead</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-purple-500 rounded-lg text-center">
								<div class="font-mono font-bold">franchise_deals</div>
								<div class="text-xs text-muted-foreground mt-1">Closed Sale</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-amber-500 rounded-lg text-center">
								<div class="font-mono font-bold">franchises</div>
								<div class="text-xs text-muted-foreground mt-1">Active Team</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-amber-600 rounded-lg text-center">
								<div class="font-mono font-bold">franchise_owners</div>
								<div class="text-xs text-muted-foreground mt-1">Owner Profile</div>
							</div>
						</div>
						
						<div class="flex items-center gap-4 mt-6">
							<div class="flex-1 p-4 bg-background border-2 border-amber-400 rounded-lg text-center">
								<div class="font-mono font-bold">franchise_territories</div>
								<div class="text-xs text-muted-foreground mt-1">Geographic Assignment</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-orange-500 rounded-lg text-center">
								<div class="font-mono font-bold">pros</div>
								<div class="text-xs text-muted-foreground mt-1">Player Roster</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-pink-500 rounded-lg text-center">
								<div class="font-mono font-bold">sponsors</div>
								<div class="text-xs text-muted-foreground mt-1">Team Sponsors</div>
							</div>
						</div>
					</div>
				</div>
			</Card>

			<!-- Franchise Status Types -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Franchise Status Types</h2>
						<p class="text-sm text-muted-foreground mt-1">Different states a franchise can be in</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div class="p-4 bg-gradient-to-b from-green-500 to-green-600 text-white rounded-lg border-2 border-green-700 shadow-lg">
							<div class="font-bold text-lg mb-2">Active</div>
							<p class="text-sm text-green-100">Franchise is operational and competing in the league</p>
						</div>

						<div class="p-4 bg-gradient-to-b from-amber-500 to-amber-600 text-white rounded-lg border-2 border-amber-700 shadow-lg">
							<div class="font-bold text-lg mb-2">Pending</div>
							<p class="text-sm text-amber-100">Deal closed, franchise being set up and onboarded</p>
						</div>

						<div class="p-4 bg-gradient-to-b from-orange-500 to-orange-600 text-white rounded-lg border-2 border-orange-700 shadow-lg">
							<div class="font-bold text-lg mb-2">Suspended</div>
							<p class="text-sm text-orange-100">Temporarily not competing, may return to active</p>
						</div>

						<div class="p-4 bg-gradient-to-b from-gray-500 to-gray-600 text-white rounded-lg border-2 border-gray-700 shadow-lg">
							<div class="font-bold text-lg mb-2">Inactive</div>
							<p class="text-sm text-gray-100">No longer operating, historical record only</p>
						</div>
					</div>
				</div>
			</Card>

			<!-- Franchise Components -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Franchise Components</h2>
						<p class="text-sm text-muted-foreground mt-1">What makes up a complete franchise</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Identity</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Name & Logo</li>
								<li>• Brand Colors</li>
								<li>• Territory</li>
								<li>• Home Venue</li>
							</ul>
						</div>

						<div class="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Ownership</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Franchise Owner</li>
								<li>• Purchase Deal</li>
								<li>• Payment Status</li>
								<li>• Founded Date</li>
							</ul>
						</div>

						<div class="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Operations</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Player Roster</li>
								<li>• Team Sponsors</li>
								<li>• Tournament Schedule</li>
								<li>• League Standing</li>
							</ul>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if activeTab === 'pros'}
		<div class="space-y-6">
			{#if viewMode === 'table'}
				<div class="grid gap-6">
					{#each prosRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<div>
										<h2 class="text-xl font-mono font-bold">{collection.collection}</h2>
										<p class="text-sm text-muted-foreground mt-1">{collection.description}</p>
									</div>
									<Badge variant="outline" class="font-mono text-xs">
										{collection.fields.length} fields
									</Badge>
								</div>

								<!-- Fields Section -->
								<div>
									<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
										Fields
									</h3>
									<div class="grid gap-2">
										{#each collection.fields as field}
											<div class="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
												<Badge variant="secondary" class="font-mono text-xs shrink-0">
													{field.type}
												</Badge>
												<div class="flex-1 min-w-0">
													<div class="font-mono text-sm font-medium">{field.name}</div>
													<div class="text-sm text-muted-foreground">{field.description}</div>
													{#if field.relatesTo}
														<div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
															→ relates to: <span class="font-mono">{field.relatesTo}</span>
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Relationships Section -->
								{#if collection.relationships && collection.relationships.length > 0}
									<div>
										<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
											Relationships
										</h3>
										<div class="grid gap-2">
											{#each collection.relationships as rel}
												<div class="flex items-start gap-3 p-3 rounded-lg border bg-blue-900 text-white">
													<Badge variant="default" class="text-xs shrink-0">
														{rel.type}
													</Badge>
													<div class="flex-1 min-w-0">
														<div class="font-mono text-sm font-medium text-white">
															{collection.collection} → {rel.to}
														</div>
														<div class="text-sm text-blue-100">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</Card>
					{/each}
				</div>
			{:else}
				<!-- Visual View -->
				<div class="space-y-8">
					{#each prosRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div>
									<h2 class="text-xl font-mono font-bold mb-2">{collection.collection}</h2>
									<p class="text-sm text-muted-foreground">{collection.description}</p>
								</div>
								
								<!-- Visual Relationship Diagram -->
								<div class="relative p-8 bg-muted/30 rounded-lg">
									<!-- Central Collection Box -->
									<div class="flex justify-center mb-8">
										<div class="px-6 py-4 bg-cyan-600 text-white rounded-lg border-2 border-cyan-700 shadow-lg">
											<div class="font-mono font-bold text-lg">{collection.collection}</div>
											<div class="text-xs text-cyan-100 mt-1">{collection.fields.length} fields</div>
										</div>
									</div>
									
									<!-- Relationships as Connected Boxes -->
									{#if collection.relationships && collection.relationships.length > 0}
										<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
											{#each collection.relationships as rel, idx}
												{@const bgColors = ['bg-cyan-800', 'bg-cyan-700', 'bg-cyan-600', 'bg-cyan-500', 'bg-cyan-400']}
												{@const textColors = ['text-white', 'text-white', 'text-white', 'text-white', 'text-cyan-900']}
												{@const descColors = ['text-cyan-100', 'text-cyan-100', 'text-cyan-100', 'text-cyan-100', 'text-cyan-700']}
												{@const bgColor = bgColors[Math.min(idx, bgColors.length - 1)]}
												{@const textColor = textColors[Math.min(idx, textColors.length - 1)]}
												{@const descColor = descColors[Math.min(idx, descColors.length - 1)]}
												<div class="relative">
													<!-- Connection Line -->
													<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-0.5 h-8 bg-cyan-400"></div>
													
													<!-- Related Collection Box with gradient background -->
													<div class="p-4 {bgColor} border-2 border-cyan-900 rounded-lg shadow-lg">
														<div class="flex items-center gap-2 mb-2">
															<Badge variant="outline" class="text-xs bg-white/20 text-white border-white/30">
																{rel.type}
															</Badge>
														</div>
														<div class="font-mono font-bold {textColor}">{rel.to}</div>
														<div class="text-xs {descColor} mt-2">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}

			<!-- Player Status Types -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Player Status Types</h2>
						<p class="text-sm text-muted-foreground mt-1">Different states a professional player can be in</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="p-4 bg-gradient-to-b from-green-500 to-green-600 text-white rounded-lg border-2 border-green-700 shadow-lg">
							<div class="font-bold text-lg mb-2">Active</div>
							<p class="text-sm text-green-100">Currently competing in tournaments and under contract</p>
						</div>

						<div class="p-4 bg-gradient-to-b from-amber-500 to-amber-600 text-white rounded-lg border-2 border-amber-700 shadow-lg">
							<div class="font-bold text-lg mb-2">Inactive</div>
							<p class="text-sm text-amber-100">Temporarily not competing, may return to active status</p>
						</div>

						<div class="p-4 bg-gradient-to-b from-gray-500 to-gray-600 text-white rounded-lg border-2 border-gray-700 shadow-lg">
							<div class="font-bold text-lg mb-2">Retired</div>
							<p class="text-sm text-gray-100">No longer competing professionally, historical record</p>
						</div>
					</div>
				</div>
			</Card>

			<!-- Payment Types -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Player Payment Types</h2>
						<p class="text-sm text-muted-foreground mt-1">Different types of compensation for professional players</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
						<div class="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Salary</div>
							<p class="text-sm text-gray-900">Regular contracted payment for being on roster</p>
						</div>

						<div class="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Bonus</div>
							<p class="text-sm text-gray-900">Performance-based additional compensation</p>
						</div>

						<div class="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Prize</div>
							<p class="text-sm text-gray-900">Tournament winnings and prize money</p>
						</div>

						<div class="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Appearance Fee</div>
							<p class="text-sm text-gray-900">Payment for attending specific events</p>
						</div>

						<div class="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Endorsement</div>
							<p class="text-sm text-gray-900">Sponsor and brand partnership payments</p>
						</div>
					</div>
				</div>
			</Card>

			<!-- Player Career Flow -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Player Career Flow</h2>
						<p class="text-sm text-muted-foreground mt-1">How players progress through the league system</p>
					</div>
					<div class="space-y-4 p-6 bg-muted/30 rounded-lg">
						<div class="flex items-center gap-4">
							<div class="flex-1 p-4 bg-background border-2 border-cyan-400 rounded-lg text-center">
								<div class="font-mono font-bold">pros</div>
								<div class="text-xs text-muted-foreground mt-1">Player Profile</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-amber-500 rounded-lg text-center">
								<div class="font-mono font-bold">franchises</div>
								<div class="text-xs text-muted-foreground mt-1">Team Assignment</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-orange-500 rounded-lg text-center">
								<div class="font-mono font-bold">tournaments</div>
								<div class="text-xs text-muted-foreground mt-1">Competition</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-cyan-600 rounded-lg text-center">
								<div class="font-mono font-bold">pro_payments</div>
								<div class="text-xs text-muted-foreground mt-1">Compensation</div>
							</div>
						</div>
						
						<div class="flex items-center gap-4 mt-6 justify-center">
							<div class="flex-1 max-w-md p-4 bg-background border-2 border-pink-500 rounded-lg text-center">
								<div class="font-mono font-bold">sponsors</div>
								<div class="text-xs text-muted-foreground mt-1">Personal Sponsorships</div>
							</div>
						</div>
					</div>
				</div>
			</Card>

			<!-- Player Profile Components -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Player Profile Components</h2>
						<p class="text-sm text-muted-foreground mt-1">What makes up a complete player profile</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div class="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Identity</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Name & Nickname</li>
								<li>• Photo</li>
								<li>• Country</li>
								<li>• Biography</li>
							</ul>
						</div>

						<div class="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Stats</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• World Ranking</li>
								<li>• Tournaments Played</li>
								<li>• Career Highlights</li>
								<li>• Year Turned Pro</li>
							</ul>
						</div>

						<div class="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Contract</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Signed Contract</li>
								<li>• Status</li>
								<li>• Franchise Assignment</li>
								<li>• Payment History</li>
							</ul>
						</div>

						<div class="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Personal</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Primary Sponsor</li>
								<li>• Favorite Disc</li>
								<li>• Height & Weight</li>
								<li>• Date of Birth</li>
							</ul>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if activeTab === 'vendors'}
		<div class="space-y-6">
			{#if viewMode === 'table'}
				<div class="grid gap-6">
					{#each vendorsRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<div>
										<h2 class="text-xl font-mono font-bold">{collection.collection}</h2>
										<p class="text-sm text-muted-foreground mt-1">{collection.description}</p>
									</div>
									<Badge variant="outline" class="font-mono text-xs">
										{collection.fields.length} fields
									</Badge>
								</div>

								<!-- Fields Section -->
								<div>
									<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
										Fields
									</h3>
									<div class="grid gap-2">
										{#each collection.fields as field}
											<div class="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
												<Badge variant="secondary" class="font-mono text-xs shrink-0">
													{field.type}
												</Badge>
												<div class="flex-1 min-w-0">
													<div class="font-mono text-sm font-medium">{field.name}</div>
													<div class="text-sm text-muted-foreground">{field.description}</div>
													{#if field.relatesTo}
														<div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
															→ relates to: <span class="font-mono">{field.relatesTo}</span>
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Relationships Section -->
								{#if collection.relationships && collection.relationships.length > 0}
									<div>
										<h3 class="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
											Relationships
										</h3>
										<div class="grid gap-2">
											{#each collection.relationships as rel}
												<div class="flex items-start gap-3 p-3 rounded-lg border bg-blue-900 text-white">
													<Badge variant="default" class="text-xs shrink-0">
														{rel.type}
													</Badge>
													<div class="flex-1 min-w-0">
														<div class="font-mono text-sm font-medium text-white">
															{collection.collection} → {rel.to}
														</div>
														<div class="text-sm text-blue-100">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</Card>
					{/each}
				</div>
			{:else}
				<!-- Visual View -->
				<div class="space-y-8">
					{#each vendorsRelationships as collection}
						<Card class="p-6">
							<div class="space-y-6">
								<div>
									<h2 class="text-xl font-mono font-bold mb-2">{collection.collection}</h2>
									<p class="text-sm text-muted-foreground">{collection.description}</p>
								</div>
								
								<!-- Visual Relationship Diagram -->
								<div class="relative p-8 bg-muted/30 rounded-lg">
									<!-- Central Collection Box -->
									<div class="flex justify-center mb-8">
										<div class="px-6 py-4 bg-indigo-600 text-white rounded-lg border-2 border-indigo-700 shadow-lg">
											<div class="font-mono font-bold text-lg">{collection.collection}</div>
											<div class="text-xs text-indigo-100 mt-1">{collection.fields.length} fields</div>
										</div>
									</div>
									
									<!-- Relationships as Connected Boxes -->
									{#if collection.relationships && collection.relationships.length > 0}
										<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
											{#each collection.relationships as rel, idx}
												{@const bgColors = ['bg-indigo-800', 'bg-indigo-700', 'bg-indigo-600', 'bg-indigo-500', 'bg-indigo-400']}
												{@const textColors = ['text-white', 'text-white', 'text-white', 'text-white', 'text-indigo-900']}
												{@const descColors = ['text-indigo-100', 'text-indigo-100', 'text-indigo-100', 'text-indigo-100', 'text-indigo-700']}
												{@const bgColor = bgColors[Math.min(idx, bgColors.length - 1)]}
												{@const textColor = textColors[Math.min(idx, textColors.length - 1)]}
												{@const descColor = descColors[Math.min(idx, descColors.length - 1)]}
												<div class="relative">
													<!-- Connection Line -->
													<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-0.5 h-8 bg-indigo-400"></div>
													
													<!-- Related Collection Box with gradient background -->
													<div class="p-4 {bgColor} border-2 border-indigo-900 rounded-lg shadow-lg">
														<div class="flex items-center gap-2 mb-2">
															<Badge variant="outline" class="text-xs bg-white/20 text-white border-white/30">
																{rel.type}
															</Badge>
														</div>
														<div class="font-mono font-bold {textColor}">{rel.to}</div>
														<div class="text-xs {descColor} mt-2">{rel.description}</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}

			<!-- Vendor Status Types -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Vendor Status Types</h2>
						<p class="text-sm text-muted-foreground mt-1">Different states a vendor relationship can be in</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="p-4 bg-gradient-to-b from-green-500 to-green-600 text-white rounded-lg border-2 border-green-700 shadow-lg">
							<div class="font-bold text-lg mb-2">Active</div>
							<p class="text-sm text-green-100">Currently providing services and available for new projects</p>
						</div>

						<div class="p-4 bg-gradient-to-b from-gray-500 to-gray-600 text-white rounded-lg border-2 border-gray-700 shadow-lg">
							<div class="font-bold text-lg mb-2">Inactive</div>
							<p class="text-sm text-gray-100">No longer working with, historical record maintained</p>
						</div>
					</div>
				</div>
			</Card>

			<!-- Vendor Workflow -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Vendor Workflow</h2>
						<p class="text-sm text-muted-foreground mt-1">How vendors interact with the system</p>
					</div>
					<div class="space-y-4 p-6 bg-muted/30 rounded-lg">
						<div class="flex items-center gap-4">
							<div class="flex-1 p-4 bg-background border-2 border-indigo-400 rounded-lg text-center">
								<div class="font-mono font-bold">vendors</div>
								<div class="text-xs text-muted-foreground mt-1">Vendor Profile</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-green-500 rounded-lg text-center">
								<div class="font-mono font-bold">projects</div>
								<div class="text-xs text-muted-foreground mt-1">Project Assignment</div>
							</div>
							<div class="text-2xl">→</div>
							<div class="flex-1 p-4 bg-background border-2 border-blue-500 rounded-lg text-center">
								<div class="font-mono font-bold">expenses</div>
								<div class="text-xs text-muted-foreground mt-1">Payment Processing</div>
							</div>
						</div>
						
						<div class="flex items-center gap-4 mt-6 justify-center">
							<div class="flex-1 max-w-md p-4 bg-background border-2 border-purple-500 rounded-lg text-center">
								<div class="font-mono font-bold">user_profiles</div>
								<div class="text-xs text-muted-foreground mt-1">Relationship Manager</div>
							</div>
						</div>
					</div>
				</div>
			</Card>

			<!-- Vendor Types -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Common Vendor Types</h2>
						<p class="text-sm text-muted-foreground mt-1">Categories of vendors in the system</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Services</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Marketing Agencies</li>
								<li>• PR Firms</li>
								<li>• Consultants</li>
								<li>• Legal Services</li>
							</ul>
						</div>

						<div class="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Suppliers</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Equipment Suppliers</li>
								<li>• Merchandise Vendors</li>
								<li>• Course Materials</li>
								<li>• Technology Providers</li>
							</ul>
						</div>

						<div class="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Venues</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Event Venues</li>
								<li>• Course Facilities</li>
								<li>• Production Studios</li>
								<li>• Office Spaces</li>
							</ul>
						</div>
					</div>
				</div>
			</Card>

			<!-- Vendor Profile Components -->
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Vendor Profile Components</h2>
						<p class="text-sm text-muted-foreground mt-1">What makes up a complete vendor profile</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Contact Info</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Company Name</li>
								<li>• Email & Phone</li>
								<li>• Website</li>
								<li>• Business Address</li>
							</ul>
						</div>

						<div class="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Relationship</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Vendor Type</li>
								<li>• Status</li>
								<li>• Services Provided</li>
								<li>• Relationship Manager</li>
							</ul>
						</div>

						<div class="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
							<div class="font-bold text-lg text-gray-900 mb-2">Activity</div>
							<ul class="text-sm space-y-1 text-gray-900">
								<li>• Projects Worked On</li>
								<li>• Payment History</li>
								<li>• Contact Person</li>
								<li>• Notes & Details</li>
							</ul>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if activeTab === 'overview'}
		<div class="space-y-6">
			<Card class="p-6">
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold">Complete System Overview</h2>
						<p class="text-sm text-muted-foreground mt-1">How all FliHub systems interconnect</p>
					</div>
					
					<!-- System Architecture Diagram -->
					<div class="p-8 bg-muted/30 rounded-lg">
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<!-- Financial System -->
							<div class="space-y-4">
								<div class="p-4 bg-blue-600 text-white rounded-lg border-2 border-blue-700 shadow-lg text-center">
									<div class="font-bold text-lg">Financial</div>
									<div class="text-xs text-blue-100 mt-1">Money Management</div>
								</div>
								<div class="space-y-2">
									<div class="p-3 bg-blue-800 text-white rounded border border-blue-900 text-sm">
										<div class="font-mono font-semibold">sponsors</div>
										<div class="text-xs text-blue-100">Revenue In</div>
									</div>
									<div class="p-3 bg-blue-700 text-white rounded border border-blue-900 text-sm">
										<div class="font-mono font-semibold">budgets</div>
										<div class="text-xs text-blue-100">Allocation</div>
									</div>
									<div class="p-3 bg-blue-600 text-white rounded border border-blue-900 text-sm">
										<div class="font-mono font-semibold">expenses</div>
										<div class="text-xs text-blue-100">Money Out</div>
									</div>
									<div class="p-3 bg-blue-500 text-white rounded border border-blue-900 text-sm">
										<div class="font-mono font-semibold">franchise_deals</div>
										<div class="text-xs text-blue-100">Payments</div>
									</div>
								</div>
							</div>

							<!-- Operations System -->
							<div class="space-y-4">
								<div class="p-4 bg-green-600 text-white rounded-lg border-2 border-green-700 shadow-lg text-center">
									<div class="font-bold text-lg">Operations</div>
									<div class="text-xs text-green-100 mt-1">Work Management</div>
								</div>
								<div class="space-y-2">
									<div class="p-3 bg-green-800 text-white rounded border border-green-900 text-sm">
										<div class="font-mono font-semibold">departments</div>
										<div class="text-xs text-green-100">Organization</div>
									</div>
									<div class="p-3 bg-green-700 text-white rounded border border-green-900 text-sm">
										<div class="font-mono font-semibold">projects</div>
										<div class="text-xs text-green-100">Initiatives</div>
									</div>
									<div class="p-3 bg-green-600 text-white rounded border border-green-900 text-sm">
										<div class="font-mono font-semibold">tasks</div>
										<div class="text-xs text-green-100">Execution</div>
									</div>
									<div class="p-3 bg-green-500 text-white rounded border border-green-900 text-sm">
										<div class="font-mono font-semibold">vendors</div>
										<div class="text-xs text-green-100">Partners</div>
									</div>
								</div>
							</div>

							<!-- Sales System -->
							<div class="space-y-4">
								<div class="p-4 bg-purple-600 text-white rounded-lg border-2 border-purple-700 shadow-lg text-center">
									<div class="font-bold text-lg">Sales</div>
									<div class="text-xs text-purple-100 mt-1">Revenue Generation</div>
								</div>
								<div class="space-y-2">
									<div class="p-3 bg-purple-800 text-white rounded border border-purple-900 text-sm">
										<div class="font-mono font-semibold">sponsors</div>
										<div class="text-xs text-purple-100">Warm Leads</div>
									</div>
									<div class="p-3 bg-purple-700 text-white rounded border border-purple-900 text-sm">
										<div class="font-mono font-semibold">franchise_opportunities</div>
										<div class="text-xs text-purple-100">Pipeline</div>
									</div>
									<div class="p-3 bg-purple-600 text-white rounded border border-purple-900 text-sm">
										<div class="font-mono font-semibold">franchise_deals</div>
										<div class="text-xs text-purple-100">Closed</div>
									</div>
									<div class="p-3 bg-purple-500 text-white rounded border border-purple-900 text-sm">
										<div class="font-mono font-semibold">user_profiles</div>
										<div class="text-xs text-purple-100">Sales Team</div>
									</div>
								</div>
							</div>

							<!-- League System -->
							<div class="space-y-4">
								<div class="p-4 bg-orange-600 text-white rounded-lg border-2 border-orange-700 shadow-lg text-center">
									<div class="font-bold text-lg">League</div>
									<div class="text-xs text-orange-100 mt-1">Competition</div>
								</div>
								<div class="space-y-2">
									<div class="p-3 bg-orange-800 text-white rounded border border-orange-900 text-sm">
										<div class="font-mono font-semibold">league</div>
										<div class="text-xs text-orange-100">Organization</div>
									</div>
									<div class="p-3 bg-orange-700 text-white rounded border border-orange-900 text-sm">
										<div class="font-mono font-semibold">franchises</div>
										<div class="text-xs text-orange-100">Teams</div>
									</div>
									<div class="p-3 bg-orange-600 text-white rounded border border-orange-900 text-sm">
										<div class="font-mono font-semibold">pros</div>
										<div class="text-xs text-orange-100">Players</div>
									</div>
									<div class="p-3 bg-orange-500 text-white rounded border border-orange-900 text-sm">
										<div class="font-mono font-semibold">tournaments</div>
										<div class="text-xs text-orange-100">Events</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Key Integration Points -->
					<div class="grid gap-4 mt-8">
						<h3 class="text-lg font-bold text-gray-900">Key Integration Points</h3>
						
						<div class="p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border">
							<div class="flex items-center gap-3">
								<div class="font-mono font-bold text-gray-900">sponsors</div>
								<span class="text-lg text-gray-900">↔</span>
								<div class="font-mono font-bold text-gray-900">franchise_deals</div>
							</div>
							<p class="text-sm text-gray-900 mt-2">Sponsors can convert to franchise owners, bridging Sales and Financial systems</p>
						</div>

						<div class="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border">
							<div class="flex items-center gap-3">
								<div class="font-mono font-bold text-gray-900">projects</div>
								<span class="text-lg text-gray-900">↔</span>
								<div class="font-mono font-bold text-gray-900">expenses</div>
							</div>
							<p class="text-sm text-gray-900 mt-2">Projects track expenses against budgets, connecting Operations and Financial</p>
						</div>

						<div class="p-4 bg-gradient-to-r from-orange-100 to-purple-100 rounded-lg border">
							<div class="flex items-center gap-3">
								<div class="font-mono font-bold text-gray-900">franchises</div>
								<span class="text-lg text-gray-900">↔</span>
								<div class="font-mono font-bold text-gray-900">franchise_deals</div>
							</div>
							<p class="text-sm text-gray-900 mt-2">Franchise deals create active franchises, linking Sales and League systems</p>
						</div>

						<div class="p-4 bg-gradient-to-r from-orange-100 to-blue-100 rounded-lg border">
							<div class="flex items-center gap-3">
								<div class="font-mono font-bold text-gray-900">pros</div>
								<span class="text-lg text-gray-900">↔</span>
								<div class="font-mono font-bold text-gray-900">pro_payments</div>
							</div>
							<p class="text-sm text-gray-900 mt-2">Player payments tracked as expenses, connecting League and Financial</p>
						</div>

						<div class="p-4 bg-gradient-to-r from-green-100 to-orange-100 rounded-lg border">
							<div class="flex items-center gap-3">
								<div class="font-mono font-bold text-gray-900">projects</div>
								<span class="text-lg text-gray-900">↔</span>
								<div class="font-mono font-bold text-gray-900">tournaments</div>
							</div>
							<p class="text-sm text-gray-900 mt-2">Tournaments managed as projects, linking League and Operations</p>
						</div>

						<div class="p-4 bg-gradient-to-r from-orange-100 to-pink-100 rounded-lg border">
							<div class="flex items-center gap-3">
								<div class="font-mono font-bold text-gray-900">franchises</div>
								<span class="text-lg text-gray-900">↔</span>
								<div class="font-mono font-bold text-gray-900">sponsors</div>
							</div>
							<p class="text-sm text-gray-900 mt-2">Sponsors support franchises and players, connecting League and Financial</p>
						</div>
					</div>

					<!-- System Statistics -->
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
						<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
							<div class="text-2xl font-bold text-gray-900">5</div>
							<div class="text-sm text-gray-900">Financial Collections</div>
						</div>
						<div class="p-4 bg-green-50 rounded-lg border border-green-200">
							<div class="text-2xl font-bold text-gray-900">4</div>
							<div class="text-sm text-gray-900">Operations Collections</div>
						</div>
						<div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
							<div class="text-2xl font-bold text-gray-900">4</div>
							<div class="text-sm text-gray-900">Sales Collections</div>
						</div>
						<div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
							<div class="text-2xl font-bold text-gray-900">6</div>
							<div class="text-sm text-gray-900">League Collections</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}
</div>
