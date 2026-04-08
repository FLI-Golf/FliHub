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
			description: 'External companies and service providers that FLI Golf engages across events, technology, facilities, and merchandise. A vendor can be linked to multiple projects simultaneously and referenced on individual expense records, enabling spend-by-vendor reporting across the entire org. The active flag controls whether the vendor appears in project assignment dropdowns — inactive vendors are hidden from new assignments but their historical expense records are fully preserved. open_invoices_total tracks outstanding amounts owed across all active projects and updates as expenses are created and paid.',
			fields: [
				{ name: 'name', type: 'text', description: 'Vendor company name as it appears on invoices and contracts.' },
				{ name: 'type', type: 'select', description: 'Classification: venue (event spaces and courses), product_supplier (equipment and merchandise), beverage (food and drink partners), technology (software, hardware, streaming), gaming (disc golf gaming and simulation), service_provider (general services — legal, logistics, staffing).' },
				{ name: 'active', type: 'boolean', description: 'Whether this vendor is currently engaged. Inactive vendors are hidden from project assignment dropdowns but their historical expense records are preserved.' },
				{ name: 'contact_email', type: 'email', description: 'Primary contact email for invoices and communications.' },
				{ name: 'contact_phone', type: 'text', description: 'Primary contact phone number.' },
				{ name: 'website', type: 'url', description: 'Vendor website. Displayed on the vendor detail card.' },
				{ name: 'about', type: 'text', description: 'Description of the vendor\'s services and the relationship with FLI Golf. Used on the vendor card and for internal reference.' },
				{ name: 'open_invoices_total', type: 'number', description: 'Running total of outstanding invoice amounts across all active projects. Updated as expenses linked to this vendor are created and paid.' },
				{ name: 'logo', type: 'file', description: 'Vendor logo displayed on the vendor card and project vendor list.' },
				{ name: 'image_extra', type: 'file', description: 'Additional images — venue photos, product shots, or marketing materials. Supports multiple files.' }
			],
			relationships: [
				{ to: 'projects', type: 'many-to-many', description: 'Projects this vendor is engaged on — a vendor can work across multiple projects simultaneously' },
				{ to: 'expenses', type: 'one-to-many', description: 'Expense records where this vendor is the payee — used for spend-by-vendor reporting' }
			]
		}
	];
	
	// Pros system relationships
	const prosRelationships = [
		{
			collection: 'talent',
			description: 'Every person contracted to FLI Golf — players, broadcasters, commentators, and analysts — is a talent record. The talentType field determines how the record is used: players appear in tournament_results and earn placement-based prize money; non-player talent (broadcasters, commentators, analysts) are paid via pro_payments but do not appear in standings. A talent record can hold multiple types (e.g. a player who also does commentary). When userId is set, the talent can log in and view their own profile, schedule, and payment history.',
			fields: [
				{ name: 'name', type: 'text', description: 'Full legal name used on contracts and payment records.' },
				{ name: 'nickname', type: 'text', description: 'On-air or fan-facing name used in broadcasts and standings.' },
				{ name: 'talentType', type: 'select', description: 'player, broadcaster, commentator, analyst. Determines which dashboard views apply and whether the talent appears in tournament results and standings.' },
				{ name: 'status', type: 'select', description: 'active (under contract and competing), inactive (contract lapsed), retired (permanently done).' },
				{ name: 'gender', type: 'select', description: 'male, female, other. Determines which division the player competes in (mens or womens) and which half of the tournament purse they draw from.' },
				{ name: 'worldRanking', type: 'number', description: 'Current world ranking. Used for seeding, marketing, and the talent list sort order.' },
				{ name: 'country', type: 'text', description: 'Country of origin. Used for broadcast graphics and international marketing.' },
				{ name: 'residence', type: 'text', description: 'Current city and state of residence.' },
				{ name: 'dateOfBirth', type: 'date', description: 'Birth date. Used for age display on player cards.' },
				{ name: 'height', type: 'text', description: 'Player height (e.g. "6\'2\""). Displayed on the talent detail page.' },
				{ name: 'weight', type: 'text', description: 'Player weight. Displayed on the talent detail page.' },
				{ name: 'yearTurnedPro', type: 'number', description: 'Year the talent turned professional. Provides career narrative context.' },
				{ name: 'primarySponsor', type: 'text', description: 'Name of the talent\'s primary personal sponsor outside of FLI Golf team sponsors.' },
				{ name: 'sponsoredBy', type: 'text', description: 'Additional sponsor names or sponsorship details.' },
				{ name: 'favoriteDisc', type: 'text', description: 'Talent\'s preferred disc. Used on player cards and fan-facing profiles.' },
				{ name: 'signatureMove', type: 'text', description: 'The talent\'s signature throw or technique. Used in broadcast storytelling.' },
				{ name: 'careerHighlights', type: 'text', description: 'Notable career achievements, titles, and records. Displayed on the talent detail page.' },
				{ name: 'notableRecords', type: 'text', description: 'Specific records held by the talent (e.g. course records, distance records).' },
				{ name: 'tournamentsPlayed', type: 'number', description: 'Total career tournaments played. Used for sorting and display on the talent list.' },
				{ name: 'bio', type: 'text', description: 'Rich biography for public-facing profiles and broadcast use.' },
				{ name: 'photo', type: 'file', description: 'Headshot used in the app, broadcast lower-thirds, and player cards.' },
				{ name: 'signedContract', type: 'file', description: 'Uploaded contract PDF(s). Multiple files supported.' },
				{ name: 'primaryAirport', type: 'text', description: 'Home airport code (e.g. "AUS"). Used for travel logistics and booking.' },
				{ name: 'secondaryAirport', type: 'text', description: 'Secondary airport if the talent splits time between locations.' },
				{ name: 'frequentFlyerNumbers', type: 'text', description: 'Airline loyalty numbers for travel booking.' },
				{ name: 'website', type: 'url', description: 'Talent\'s personal or professional website.' },
				{ name: 'tiktok', type: 'text', description: 'TikTok handle. Used for social media cross-promotion.' },
				{ name: 'twitch', type: 'text', description: 'Twitch handle. Used for streaming and broadcast partnerships.' },
				{ name: 'videoHighlightsLinks', type: 'text', description: 'Links to highlight reels or notable tournament footage.' },
				{ name: 'injuryHistory', type: 'text', description: 'Known injury history. Used for medical and travel planning.' },
				{ name: 'fitnessRegimen', type: 'text', description: 'Training and fitness routine. Used for broadcast storytelling.' },
				{ name: 'longTermGoals', type: 'text', description: 'Career and personal goals. Used in player profiles and marketing.' },
				{ name: 'missionStatement', type: 'text', description: 'Personal mission statement. Used on public-facing profiles.' },
				{ name: 'userId', type: 'relation', relatesTo: 'user_profiles', description: 'Optional link to a user account. When set, the talent can log in and view their own profile, schedule, and payment history.' }
			],
			relationships: [
				{ to: 'franchises', type: 'many-to-many', description: 'The team(s) this talent is rostered on — determines which franchise is credited for their tournament results' },
				{ to: 'pro_payments', type: 'one-to-many', description: 'All salary, bonus, prize, and appearance fee payment records — their sum is the talent\'s total season earnings' },
				{ to: 'tournament_results', type: 'one-to-many', description: 'Placement records from each tournament — placement drives the earnings calculation' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Optional user account for self-service access to profile and payment history' }
			]
		},
		{
			collection: 'tournament_results',
			description: 'One record per talent per tournament division. Created when an admin enters results after a tournament completes. The placement field is the single most important value — it drives the entire earnings calculation. Placement 1 earns 30% of the division purse, placement 2 earns 20%, and placements 4–20 follow an exponential decay curve (×0.85 per place). Every placement from 1–20 receives a cheque. The division field (mens or womens) determines which half of the tournament prize pool the result draws from. When a result is saved, a pro_payments record is automatically created for the talent.',
			fields: [
				{ name: 'tournament', type: 'relation', relatesTo: 'tournaments', description: 'The tournament this result belongs to.' },
				{ name: 'pro', type: 'relation', relatesTo: 'talent', description: 'The talent who achieved this placement.' },
				{ name: 'franchise', type: 'relation', relatesTo: 'franchises', description: 'The franchise this talent was rostered on at the time. Used for team standings and franchise payout attribution.' },
				{ name: 'division', type: 'select', description: 'mens or womens. Determines which half of the tournament prize pool this result draws from (50/50 split).' },
				{ name: 'placement', type: 'number', description: 'Finishing position (1–20). The single field that drives all earnings. Placement 1 = 30% of division purse, placement 2 = 20%, placements 4–20 decay at ×0.85 per place.' },
				{ name: 'earnings', type: 'number', description: 'Prize money for this placement. Calculated as: division purse × placement percentage. Do not edit manually — recalculate via PayoutCalculator.' },
				{ name: 'score', type: 'text', description: 'Final cumulative score (e.g. "-15"). Displayed on standings and broadcast graphics.' },
				{ name: 'rounds', type: 'number', description: 'Number of rounds completed. Typically 3 for a standard FLI Golf tournament.' }
			],
			relationships: [
				{ to: 'tournaments', type: 'many-to-one', description: 'The tournament this result is for' },
				{ to: 'talent', type: 'many-to-one', description: 'The talent who achieved this placement' },
				{ to: 'franchises', type: 'many-to-one', description: 'The franchise credited for this result in team standings' },
				{ to: 'pro_payments', type: 'one-to-one', description: 'The prize payment record auto-created when this result is saved' }
			]
		},
		{
			collection: 'pro_payments',
			description: 'Every dollar paid to a talent is recorded here. Prize payments are created automatically when tournament results are entered — the placement on tournament_results drives the earnings calculation and a pro_payment is generated for each placed talent. Salary, bonus, and appearance fee payments are created manually by admins. The sum of all paid records for a talent in a fiscal year represents their total earnings from FLI Golf for that season.',
			fields: [
				{ name: 'proId', type: 'relation', relatesTo: 'talent', description: 'The talent receiving this payment.' },
				{ name: 'amount', type: 'number', description: 'Dollar amount of this payment.' },
				{ name: 'paymentDate', type: 'date', description: 'Date the payment was made or is scheduled to be sent.' },
				{ name: 'paymentType', type: 'select', description: 'Prize (auto-generated from tournament placement), Salary (contracted base pay), Bonus (performance or signing), Appearance Fee (non-tournament events).' },
				{ name: 'status', type: 'select', description: 'pending (approved but not yet sent), paid (confirmed transferred), cancelled (voided).' },
				{ name: 'fiscalYear', type: 'number', description: 'Fiscal year this payment belongs to. Used for year-end earnings summaries and tax reporting.' },
				{ name: 'notes', type: 'text', description: 'Reference number, tournament name, or any context for this specific payment.' }
			],
			relationships: [
				{ to: 'talent', type: 'many-to-one', description: 'Payment belongs to this talent — all paid records sum to their total season earnings' },
				{ to: 'tournament_results', type: 'one-to-one', description: 'For prize payments, links back to the placement record that triggered the payment' },
				{ to: 'franchises', type: 'many-to-one', description: 'Prize payments are credited to the franchise the talent was rostered on at the time' }
			]
		}
	];
	
	// Franchises system relationships
	const franchisesRelationships = [
		{
			collection: 'franchises',
			description: 'The operational record of an active FLI Golf team. A franchise is created automatically when a franchise_deal reaches "active" status — the deal is the source of truth for the purchase, and the franchise is the entity used for rosters, tournament results, payouts, and standings. Each franchise owns a geographic territory, fields both a men\'s and women\'s roster from the talent pool, and has a full brand identity stored as separate logo file variants. The franchise detail page renders a gradient header using primaryColor and secondaryColor, and the logo gallery displays all six logo variants used across broadcast, print, and digital.',
			fields: [
				{ name: 'name', type: 'text', description: 'Team name as displayed publicly (e.g. "Austin Aces"). Used in standings, broadcast graphics, and the app.' },
				{ name: 'territory', type: 'text', description: 'The geographic market this franchise represents (e.g. "Austin, TX"). Should match the corresponding franchise_territories record.' },
				{ name: 'city', type: 'text', description: 'Home city. Used for display and geographic filtering.' },
				{ name: 'state', type: 'text', description: 'Home state. Used alongside city for location display.' },
				{ name: 'status', type: 'select', description: 'Operational status: active (competing in the current season), inactive (suspended or sold), pending (deal signed but onboarding not complete), suspended (temporarily removed from competition).' },
				{ name: 'foundedDate', type: 'date', description: 'Date the franchise was officially activated. Usually the contractSignedDate from the source franchise_deal.' },
				{ name: 'ownerId', type: 'relation', relatesTo: 'user_profiles', description: 'The franchise owner\'s user profile. Gives them access to their team dashboard, roster, and payout records.' },
				{ name: 'dealId', type: 'relation', relatesTo: 'franchise_deals', description: 'The franchise_deals record this team was created from. Links back to the full purchase history, payment milestones, and commission records.' },
				{ name: 'primaryColor', type: 'text', description: 'Brand primary color as a hex value (e.g. "#3B82F6"). Used to render the franchise header gradient and color-coded standings.' },
				{ name: 'secondaryColor', type: 'text', description: 'Brand secondary color as a hex value. Combined with primaryColor to generate the header gradient on the franchise detail page.' },
				{ name: 'homeVenue', type: 'text', description: 'Name of the franchise\'s home venue (e.g. "Austin Disc Golf Complex"). Displayed on the team card and tournament schedule.' },
				{ name: 'venueCapacity', type: 'number', description: 'Seating or attendance capacity of the home venue. Used for event planning and broadcast production estimates.' },
				{ name: 'logoFull', type: 'file', description: 'Full primary logo. The main brand mark used on the franchise detail page, printed materials, and large digital placements. Supports multiple files.' },
				{ name: 'logoMini', type: 'file', description: 'Icon or badge version of the logo. Used in the franchise list cards, standings tables, and anywhere a small square format is needed.' },
				{ name: 'logoHorizontal', type: 'file', description: 'Wide horizontal layout logo. Used in broadcast lower-thirds, website headers, and sponsor decks.' },
				{ name: 'logoVertical', type: 'file', description: 'Stacked vertical layout logo. Used on posters, banners, and portrait-format placements.' },
				{ name: 'logoMonochrome', type: 'file', description: 'Single-color version of the logo. Used on merchandise, embroidery, and placements where full color is not available.' },
				{ name: 'logoWordmark', type: 'file', description: 'Text-only wordmark logo. Used in contexts where the icon alone would not be recognizable, such as co-branding with sponsors.' }
			],
			relationships: [
				{ to: 'league', type: 'many-to-one', description: 'Competes in a specific season\'s league' },
				{ to: 'franchise_deals', type: 'one-to-one', description: 'The deal this franchise was created from — source of purchase history and payment milestones' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'The franchise owner who manages the team and has access to the owner dashboard' },
				{ to: 'talent', type: 'many-to-many', description: 'Roster of pros (men\'s and women\'s divisions) competing for this franchise' },
				{ to: 'sponsors', type: 'many-to-many', description: 'Sponsors backing this team via sponsor_franchise_bridge — each pairing has its own level and amount' },
				{ to: 'tournament_results', type: 'one-to-many', description: 'All placement results for pros rostered on this franchise — used for standings and payout attribution' }
			]
		},
		{
			collection: 'franchise_territories',
			description: 'The geographic markets available for franchise ownership. Each territory represents a city or metro area that FLI Golf has identified as a viable market. Status controls availability: available territories are shown to prospects in the sales pipeline, reserved territories are held for a specific prospect until reservedUntil expires, sold territories are linked to an active franchise_deal, and unavailable territories are off the market entirely. The price field defaults to $10M and can be adjusted per territory based on market size. When a territory is sold, dealId links it to the franchise_deal so the full purchase chain is traceable: territory → deal → franchise.',
			fields: [
				{ name: 'name', type: 'text', description: 'Territory display name (e.g. "Dallas, TX" or "Los Angeles Metro"). Required.' },
				{ name: 'code', type: 'text', description: 'Short territory code used in reports and deal numbers (e.g. "TX-DAL", "CA-LA"). Max 10 characters.' },
				{ name: 'description', type: 'text', description: 'Market overview — why this territory is attractive, key demographics, or competitive landscape notes.' },
				{ name: 'city', type: 'text', description: 'Primary city for this territory.' },
				{ name: 'state', type: 'text', description: 'State the territory is in.' },
				{ name: 'region', type: 'text', description: 'Broader geographic region (e.g. "Southwest", "Southeast", "Pacific"). Used for regional grouping in the territory map.' },
				{ name: 'population', type: 'number', description: 'Population of the territory\'s metro area. A key factor in pricing and market attractiveness scoring.' },
				{ name: 'marketSize', type: 'text', description: 'Qualitative market size descriptor (e.g. "Large", "Mid-Market"). Used alongside population for prospect-facing territory comparisons.' },
				{ name: 'status', type: 'select', description: 'Availability: available (open for purchase), reserved (held for a specific prospect until reservedUntil), sold (linked to an active deal), unavailable (off market).' },
				{ name: 'price', type: 'number', description: 'Franchise purchase price for this territory. Defaults to $10,000,000. Can be adjusted per market — high-demand markets may be priced higher.' },
				{ name: 'dealId', type: 'relation', relatesTo: 'franchise_deals', description: 'Links to the franchise_deal when status is "sold". Completes the chain: territory → deal → franchise.' },
				{ name: 'reservedUntil', type: 'date', description: 'Expiry date for a reservation. When this date passes and no deal is signed, status automatically reverts to "available".' },
				{ name: 'notes', type: 'text', description: 'Internal notes on the territory — prospect history, market research, or reasons for unavailability.' }
			],
			relationships: [
				{ to: 'franchises', type: 'one-to-one', description: 'The active franchise operating in this territory once the deal is complete' },
				{ to: 'franchise_deals', type: 'one-to-one', description: 'The deal that purchased this territory — links the sale back to the territory record' },
				{ to: 'franchise_opportunities', type: 'one-to-many', description: 'Sales opportunities where prospects have expressed interest in this territory' }
			]
		},
		{
			collection: 'franchise_owners',
			description: 'A dedicated profile for franchise owners, separate from their user_profile. While user_profiles handle authentication and role-based access, franchise_owners holds the owner-specific context: which franchise they own, their public bio, and their photo for use on the franchise detail page and broadcast graphics. The userId field links to their user_profile (which carries the franchise_owner role), and franchiseId links to the franchise they operate. This separation means an owner\'s public-facing profile can be updated independently of their login credentials.',
			fields: [
				{ name: 'name', type: 'text', description: 'Owner\'s full name as displayed publicly on the franchise page and in broadcast graphics.' },
				{ name: 'email', type: 'email', description: 'Owner\'s contact email. Used for operational communications and contract delivery.' },
				{ name: 'phone', type: 'text', description: 'Owner\'s contact phone number.' },
				{ name: 'bio', type: 'text', description: 'Owner biography for public-facing profiles — background, business experience, and connection to disc golf.' },
				{ name: 'photo', type: 'file', description: 'Owner headshot used on the franchise detail page and in broadcast lower-thirds.' },
				{ name: 'userId', type: 'relation', relatesTo: 'user_profiles', description: 'Links to the owner\'s user_profile (role: franchise_owner). Grants access to the owner dashboard, roster management, and payout records.' },
				{ name: 'franchiseId', type: 'relation', relatesTo: 'franchises', description: 'The franchise this owner operates. One owner per franchise.' }
			],
			relationships: [
				{ to: 'franchises', type: 'one-to-one', description: 'The franchise this owner operates' },
				{ to: 'user_profiles', type: 'one-to-one', description: 'The owner\'s login account and role assignment' },
				{ to: 'franchise_deals', type: 'one-to-one', description: 'The purchase deal — links back to payment history and commission records' }
			]
		}
	];
	
	// Sponsors system relationships
	const sponsorsRelationships = [
		{
			collection: 'sponsors',
			description: 'A sponsor is a company or brand that pays FLI Golf for visibility, association, or activation rights. Sponsors can exist at the league level (visible across all broadcasts and events), at the franchise level (tied to a specific team), or at the individual pro level (personal endorsements). Every sponsor moves through a lifecycle: prospect → active → and optionally converted_to_franchise if they decide to buy a team.',
			fields: [
				{ name: 'companyName', type: 'text', description: 'Legal or trading name of the sponsoring company. Used on contracts, invoices, and public-facing materials.' },
				{ name: 'type', type: 'select', description: 'Industry category: corporate, local, media, equipment, apparel, technology, food_beverage, financial, healthcare, other. Helps segment the sponsor portfolio and identify gaps.' },
				{ name: 'tier', type: 'select', description: 'Sponsorship tier determines visibility and benefits. title = naming rights (e.g. "FLI Golf presented by X"). platinum = premium placement. gold / silver / bronze = standard tiers. community = local/grassroots.' },
				{ name: 'status', type: 'select', description: 'Lifecycle stage: prospect (in conversation), active (contract signed and paying), inactive (lapsed or paused), cancelled (terminated early).' },
				{ name: 'primaryContactName', type: 'text', description: 'Name of the main decision-maker or account manager at the sponsor company.' },
				{ name: 'primaryContactEmail', type: 'email', description: 'Direct email for the primary contact. Used for contract delivery and renewal outreach.' },
				{ name: 'location', type: 'text', description: 'City and state of the sponsor\'s headquarters or relevant office.' },
				{ name: 'territory', type: 'text', description: 'Geographic market the sponsor is associated with (e.g. "Southeast", "Texas"). Used to match sponsors to franchise territories.' },
				{ name: 'contractStartDate', type: 'date', description: 'First day the sponsorship agreement is in effect.' },
				{ name: 'contractEndDate', type: 'date', description: 'Last day of the current contract term. Triggers renewal workflow when approaching.' },
				{ name: 'annualCommitment', type: 'number', description: 'Total dollar value the sponsor has committed to pay per contract year. This is the target — not what has been collected.' },
				{ name: 'totalPaid', type: 'number', description: 'Running total of payments received from this sponsor. Balance due = annualCommitment − totalPaid.' },
				{ name: 'franchiseInterest', type: 'boolean', description: 'Flag set when a sponsor has expressed interest in buying a franchise. Triggers the conversion pipeline and links to a franchise_deal.' },
				{ name: 'franchiseConversionDate', type: 'date', description: 'Date the sponsor officially converted to a franchise owner. Populated automatically when franchiseDealId is set.' },
				{ name: 'franchiseDealId', type: 'relation', relatesTo: 'franchise_deals', description: 'Links to the franchise_deals record created when this sponsor converted. Once set, the sponsor is tracked as a franchise owner.' },
				{ name: 'assignedTo', type: 'relation', relatesTo: 'user_profiles', description: 'The sales rep or account manager responsible for this sponsor relationship.' },
				{ name: 'notes', type: 'text', description: 'Free-form notes on the relationship, negotiation history, or activation preferences.' }
			],
			relationships: [
				{ to: 'franchise_deals', type: 'one-to-one', description: 'When franchiseInterest is true and a deal is created, this links the sponsor to their franchise purchase' },
				{ to: 'sponsor_franchise_bridge', type: 'one-to-many', description: 'Each franchise the sponsor is actively supporting gets a bridge record with its own level and amount' },
				{ to: 'sponsor_payments', type: 'one-to-many', description: 'Individual payment records tracking each instalment against the annual commitment' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Assigned sales rep who owns the relationship' }
			]
		},
		{
			collection: 'sponsor_franchise_bridge',
			description: 'A sponsor can support multiple franchises, and a franchise can have multiple sponsors. This bridge table holds the specific terms for each sponsor ↔ franchise pairing — level, dollar amount, and contract dates — independently of the top-level sponsor record. For example, a gold-tier league sponsor might also be the title sponsor of one specific franchise at a higher rate.',
			fields: [
				{ name: 'sponsorId', type: 'relation', relatesTo: 'sponsors', description: 'The sponsor company in this pairing.' },
				{ name: 'franchiseId', type: 'relation', relatesTo: 'franchises', description: 'The franchise being sponsored in this pairing.' },
				{ name: 'sponsorshipLevel', type: 'select', description: 'Level of sponsorship for this specific franchise: Title (naming rights for the team), Primary (jersey/helmet), Secondary, Supporting (digital/social only).' },
				{ name: 'annualAmount', type: 'number', description: 'Dollar value of this specific franchise sponsorship per year. May differ from the sponsor\'s league-level commitment.' },
				{ name: 'dealValue', type: 'number', description: 'Total contract value across all years for this pairing.' },
				{ name: 'startDate', type: 'date', description: 'When this franchise sponsorship begins.' },
				{ name: 'endDate', type: 'date', description: 'When this franchise sponsorship expires.' },
				{ name: 'status', type: 'select', description: 'active, pending, expired, cancelled.' }
			],
			relationships: [
				{ to: 'sponsors', type: 'many-to-one', description: 'The sponsor in this pairing' },
				{ to: 'franchises', type: 'many-to-one', description: 'The franchise in this pairing' }
			]
		},
		{
			collection: 'sponsor_payments',
			description: 'Tracks individual payment instalments from a sponsor against their annual commitment. A sponsor with a $120,000 annual commitment might pay in quarterly instalments of $30,000 each — each instalment is a separate record here. The sum of all paid records should equal totalPaid on the parent sponsor record.',
			fields: [
				{ name: 'sponsorId', type: 'relation', relatesTo: 'sponsors', description: 'The sponsor making the payment.' },
				{ name: 'amount', type: 'number', description: 'Dollar amount of this specific payment.' },
				{ name: 'paymentDate', type: 'date', description: 'Date the payment was received or is due.' },
				{ name: 'paymentType', type: 'select', description: 'Type of payment: instalment, upfront, renewal, bonus.' },
				{ name: 'status', type: 'select', description: 'pending (due but not yet received) or paid (confirmed received).' },
				{ name: 'notes', type: 'text', description: 'Reference number, wire details, or any payment-specific notes.' }
			],
			relationships: [
				{ to: 'sponsors', type: 'many-to-one', description: 'Payment belongs to a sponsor' }
			]
		}
	];
	
	// League system relationships
	const leagueRelationships = [
		{
			collection: 'league',
			description: 'The top-level configuration record for FLI Golf. There is one league record per season. It holds the season year, date range, prize budget, and status. Everything else — franchises, pros, tournaments — hangs off the league. Changing totalPrizePool here is the only number you need to touch to rescale all tournament purses for the season.',
			fields: [
				{ name: 'name', type: 'text', description: 'Display name of the league, e.g. "FLI Golf 2027".' },
				{ name: 'season', type: 'text', description: 'Season year identifier (e.g. "2027"). Used to group tournaments and filter views across the app.' },
				{ name: 'startDate', type: 'date', description: 'First day of the season. Used for scheduling and display.' },
				{ name: 'endDate', type: 'date', description: 'Last day of the season. Triggers end-of-season payout summaries.' },
				{ name: 'status', type: 'select', description: 'upcoming (pre-season), active (season in progress), completed (all tournaments done).' },
				{ name: 'totalPrizePool', type: 'number', description: 'Total prize budget for the season (e.g. $4,000,000 for 2027). PayoutCalculator distributes this across all 6 tournaments automatically using arithmetic progression.' }
			],
			relationships: [
				{ to: 'franchises', type: 'one-to-many', description: 'All franchises competing this season' },
				{ to: 'talent', type: 'one-to-many', description: 'All pros registered for this season' },
				{ to: 'tournaments', type: 'one-to-many', description: 'The 6 tournaments that make up the season' }
			]
		},
		{
			collection: 'franchises',
			description: 'A franchise is a team in the league. It is created when a franchise_deal reaches "active" status — the deal record is the source of truth for the purchase, and the franchise record is the operational entity used for rosters, payouts, and standings. Each franchise owns a geographic territory and fields both a men\'s and women\'s roster.',
			fields: [
				{ name: 'name', type: 'text', description: 'Team name as displayed publicly (e.g. "Austin Aces").' },
				{ name: 'territory', type: 'text', description: 'The geographic market this franchise represents (e.g. "Austin, TX"). Must match a franchise_territories record.' },
				{ name: 'ownerId', type: 'relation', relatesTo: 'user_profiles', description: 'The franchise owner\'s user profile. Gives them access to their team dashboard and payout records.' },
				{ name: 'dealId', type: 'relation', relatesTo: 'franchise_deals', description: 'The franchise_deals record this team was created from. Links back to the full purchase history and payment milestones.' },
				{ name: 'status', type: 'select', description: 'active (competing), inactive (suspended or sold), pending (deal signed but onboarding not complete).' },
				{ name: 'foundedDate', type: 'date', description: 'Date the franchise was officially activated. Usually the contractSignedDate from the deal.' },
				{ name: 'logo', type: 'file', description: 'Team logo used in broadcasts, the app, and printed materials.' }
			],
			relationships: [
				{ to: 'league', type: 'many-to-one', description: 'Competes in a specific season' },
				{ to: 'franchise_deals', type: 'one-to-one', description: 'Created from this deal' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Owned and managed by this user' },
				{ to: 'talent', type: 'many-to-many', description: 'Roster of pros (men\'s and women\'s divisions)' },
				{ to: 'sponsors', type: 'many-to-many', description: 'Sponsors backing this team via sponsor_franchise_bridge' },
				{ to: 'tournament_results', type: 'one-to-many', description: 'All placement results for pros on this team' }
			]
		},
		{
			collection: 'talent',
			description: 'A talent record represents any person contracted to FLI Golf — players, broadcasters, commentators, or analysts. Players compete in tournaments and earn placement-based prize money. Non-player talent are paid via pro_payments but do not appear in tournament_results. Each talent record can be linked to a user account so the pro can log in and view their own earnings and schedule.',
			fields: [
				{ name: 'name', type: 'text', description: 'Full legal name used on contracts and payment records.' },
				{ name: 'nickname', type: 'text', description: 'On-air or fan-facing name used in broadcasts and standings.' },
				{ name: 'talentType', type: 'select', description: 'player, broadcaster, commentator, analyst. A person can hold multiple types (e.g. a player who also does commentary).' },
				{ name: 'status', type: 'select', description: 'active (under contract), inactive (contract lapsed), retired (permanently done).' },
				{ name: 'gender', type: 'select', description: 'male, female, other. Determines which division the player competes in and which purse they draw from.' },
				{ name: 'worldRanking', type: 'number', description: 'Current world ranking. Used for seeding and marketing.' },
				{ name: 'country', type: 'text', description: 'Country of origin. Used for broadcast graphics and international marketing.' },
				{ name: 'yearTurnedPro', type: 'number', description: 'Year the talent turned professional. Context for career narrative.' },
				{ name: 'primarySponsor', type: 'text', description: 'Name of the talent\'s primary personal sponsor outside of FLI Golf team sponsors.' },
				{ name: 'avatar', type: 'file', description: 'Headshot used in the app, broadcast lower-thirds, and player cards.' },
				{ name: 'signedContracts', type: 'file', description: 'Uploaded contract PDFs. Multiple files supported.' },
				{ name: 'userId', type: 'relation', relatesTo: 'user_profiles', description: 'Optional link to a user account. When set, the talent can log in and view their own profile, schedule, and payment history.' },
				{ name: 'bio', type: 'editor', description: 'Rich-text biography for public-facing profiles and broadcast use.' },
				{ name: 'primaryAirport', type: 'text', description: 'Home airport code (e.g. "AUS"). Used for travel logistics and booking.' },
				{ name: 'frequentFlyerNumbers', type: 'text', description: 'Airline loyalty numbers for travel booking.' }
			],
			relationships: [
				{ to: 'franchises', type: 'many-to-many', description: 'The team(s) this talent is rostered on' },
				{ to: 'pro_payments', type: 'one-to-many', description: 'All salary, bonus, and prize payment records' },
				{ to: 'tournament_results', type: 'one-to-many', description: 'Placement records from each tournament entered' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Optional user account for self-service access' }
			]
		},
		{
			collection: 'pro_payments',
			description: 'Every dollar paid to a talent is recorded here — prize money, salary, appearance fees, and bonuses. Prize payments are created automatically when tournament results are entered. Other payment types are created manually by admins. The sum of all paid records for a talent represents their total earnings from FLI Golf.',
			fields: [
				{ name: 'proId', type: 'relation', relatesTo: 'talent', description: 'The talent receiving this payment.' },
				{ name: 'amount', type: 'number', description: 'Dollar amount of this payment.' },
				{ name: 'paymentDate', type: 'date', description: 'Date the payment was made or is scheduled.' },
				{ name: 'paymentType', type: 'select', description: 'Prize (from tournament placement), Salary (contracted base pay), Bonus (performance or signing), Appearance Fee (non-tournament events).' },
				{ name: 'status', type: 'select', description: 'pending (approved but not yet sent), paid (confirmed transferred), cancelled (voided).' },
				{ name: 'notes', type: 'text', description: 'Reference number, tournament name, or any context for this specific payment.' }
			],
			relationships: [
				{ to: 'talent', type: 'many-to-one', description: 'Payment belongs to this talent' },
				{ to: 'tournament_results', type: 'one-to-one', description: 'For prize payments, links back to the placement record that generated it' }
			]
		},
		{
			collection: 'tournaments',
			description: 'A tournament is one of the 6 competition events in a season. The prize pool is never entered manually — it is computed from the season totalPrizePool using arithmetic progression (later tournaments are worth more). The full purse is split 50/50 between Men\'s and Women\'s divisions, then distributed across 20 placements using a top-heavy decay curve.',
			fields: [
				{ name: 'name', type: 'text', description: 'Tournament name (e.g. "FLI Golf Season Opener").' },
				{ name: 'season', type: 'number', description: 'Season year this tournament belongs to (e.g. 2027). Groups tournaments for filtering and budget calculations.' },
				{ name: 'tournamentNumber', type: 'number', description: 'Position in the season schedule (1 = first, 6 = last/championship). Higher number = larger prize pool.' },
				{ name: 'location', type: 'text', description: 'City and state where the tournament is held.' },
				{ name: 'venue', type: 'text', description: 'Specific venue name (e.g. "Austin Disc Golf Complex").' },
				{ name: 'startDate', type: 'date', description: 'First day of competition.' },
				{ name: 'endDate', type: 'date', description: 'Last day of competition.' },
				{ name: 'prizePool', type: 'number', description: 'Total prize money for this tournament. Derived from the season budget — do not edit manually. See PayoutCalculator.ts → SeasonConfig.' },
				{ name: 'status', type: 'select', description: 'scheduled (upcoming), in_progress (currently running), completed (results entered), cancelled.' }
			],
			relationships: [
				{ to: 'league', type: 'many-to-one', description: 'Part of this season\'s league' },
				{ to: 'tournament_results', type: 'one-to-many', description: 'One result record per pro per division' },
				{ to: 'franchises', type: 'many-to-many', description: 'Franchises whose pros competed' }
			]
		},
		{
			collection: 'tournament_results',
			description: 'One record per pro per tournament division. Created when an admin enters results after a tournament completes. The placement field drives the earnings calculation — placement 1 earns 30% of the division purse, placement 2 earns 20%, and so on down to placement 20 via exponential decay. Every placement from 1–20 receives a cheque.',
			fields: [
				{ name: 'tournament', type: 'relation', relatesTo: 'tournaments', description: 'The tournament this result is for.' },
				{ name: 'pro', type: 'relation', relatesTo: 'talent', description: 'The pro who achieved this placement.' },
				{ name: 'franchise', type: 'relation', relatesTo: 'franchises', description: 'The franchise this pro was rostered on at the time of the tournament.' },
				{ name: 'division', type: 'select', description: 'mens or womens. Determines which half of the prize pool this result draws from.' },
				{ name: 'placement', type: 'number', description: 'Finishing position (1–20). The single most important field — all earnings are derived from this.' },
				{ name: 'earnings', type: 'number', description: 'Pro\'s prize money for this placement. Calculated as: division purse × placement percentage.' },
				{ name: 'score', type: 'text', description: 'Final cumulative score (e.g. "-15"). Displayed on standings and broadcast graphics.' },
				{ name: 'rounds', type: 'number', description: 'Number of rounds completed. Typically 3 for a standard FLI Golf tournament.' }
			],
			relationships: [
				{ to: 'tournaments', type: 'many-to-one', description: 'Result belongs to this tournament' },
				{ to: 'talent', type: 'many-to-one', description: 'Result belongs to this pro' },
				{ to: 'franchises', type: 'many-to-one', description: 'Result is credited to this franchise for standings' }
			]
		}
	];
	// Sales system relationships
	const salesRelationships = [
		{
			collection: 'franchise_leads',
			description: 'The top of the sales funnel. A lead is any individual who has expressed interest in owning a franchise — whether they came in through the website, a referral, an event, cold outreach, or a partner channel. Leads are qualified before becoming opportunities: a qualified lead has confirmed financial capacity (netWorth, liquidCapital) and a target territory. Existing sponsors who express franchise interest are flagged with isExistingSponsor and linked to their sponsor record, giving the sales rep full context on the relationship before the first call. When a lead is ready to advance, it converts to a franchise_opportunity and status moves to "converted".',
			fields: [
				{ name: 'firstName', type: 'text', description: 'Lead\'s first name. Required.' },
				{ name: 'lastName', type: 'text', description: 'Lead\'s last name. Required.' },
				{ name: 'email', type: 'email', description: 'Primary contact email. Required and must be valid.' },
				{ name: 'phone', type: 'text', description: 'Contact phone number.' },
				{ name: 'company', type: 'text', description: 'Company or organization the lead is associated with.' },
				{ name: 'location', type: 'text', description: 'City and state where the lead is based.' },
				{ name: 'territory', type: 'text', description: 'The franchise territory the lead is interested in. Used to check availability against franchise_territories.' },
				{ name: 'source', type: 'select', description: 'How the lead came in: website, referral, event, cold_outreach, partner, social_media, other. Used to measure channel effectiveness.' },
				{ name: 'status', type: 'select', description: 'Funnel stage: new (just entered) → contacted (outreach made) → qualified (financial and territory check passed) → converted (advanced to opportunity) → unqualified (does not meet criteria) → lost (no longer interested).' },
				{ name: 'netWorth', type: 'number', description: 'Self-reported net worth. Used during qualification to assess financial capacity for a $10M franchise purchase.' },
				{ name: 'liquidCapital', type: 'number', description: 'Self-reported liquid capital available. A key qualification gate — franchise ownership typically requires significant liquid capital for the initial payment.' },
				{ name: 'experienceLevel', type: 'select', description: 'Business ownership experience: none, some, extensive. Informs how much onboarding support the prospect will need.' },
				{ name: 'isExistingSponsor', type: 'boolean', description: 'True when the lead is already a sponsor. When set, sponsorId links to their sponsor record so the sales rep can see the full relationship history.' },
				{ name: 'sponsorId', type: 'relation', relatesTo: 'sponsors', description: 'Links to the sponsor record when isExistingSponsor is true. Gives the sales rep visibility into the sponsor\'s tier, payment history, and annualCommitment.' },
				{ name: 'sponsorBridgeId', type: 'relation', relatesTo: 'sponsor_franchise_bridge', description: 'Links to the specific franchise sponsorship record if the lead is sponsoring a particular team.' },
				{ name: 'assignedTo', type: 'relation', relatesTo: 'user_profiles', description: 'The sales rep responsible for this lead. Receives follow-up reminders and owns the qualification conversation.' },
				{ name: 'qualifiedDate', type: 'date', description: 'Date the lead was marked qualified. Populated automatically when status moves to "qualified".' },
				{ name: 'notes', type: 'text', description: 'Free-form notes on the lead — conversation history, objections, or context for the next follow-up.' }
			],
			relationships: [
				{ to: 'franchise_opportunities', type: 'one-to-one', description: 'When a lead is qualified and ready to advance, a franchise_opportunity is created and linked here' },
				{ to: 'sponsors', type: 'many-to-one', description: 'For existing sponsors converting to franchise owners, links to their sponsor record' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'The sales rep assigned to qualify and advance this lead' }
			]
		},
		{
			collection: 'franchise_opportunities',
			description: 'A qualified lead that has entered the active sales pipeline. The opportunity tracks the deal through 8 stages from discovery to close. Each stage has associated activities: discovery (initial call), qualification (financial and territory check), proposal (deck and term sheet sent), negotiation (back-and-forth on price and terms), due_diligence (legal and financial review), contract (agreement being drafted), closed_won (deal signed — triggers franchise_deal creation), closed_lost (deal fell through — reason captured in notes). The probability field gives the sales team a weighted pipeline view. proposalSentDate, lastContactDate, and nextFollowUpDate drive the CRM activity feed.',
			fields: [
				{ name: 'opportunityName', type: 'text', description: 'Display name for this opportunity (e.g. "Austin Aces — John Smith"). Required.' },
				{ name: 'leadId', type: 'relation', relatesTo: 'franchise_leads', description: 'The lead this opportunity was created from. Preserves the full qualification history.' },
				{ name: 'stage', type: 'select', description: '8-stage pipeline: discovery → qualification → proposal → negotiation → due_diligence → contract → closed_won → closed_lost. Moving to closed_won triggers franchise_deal creation.' },
				{ name: 'dealValue', type: 'number', description: 'Expected deal value. Defaults to $10,000,000 (standard franchise price). Adjusted during negotiation to reflect any sponsorship discounts or negotiated terms.' },
				{ name: 'probability', type: 'number', description: 'Estimated probability of closing (0–100%). Used to calculate weighted pipeline value across all open opportunities.' },
				{ name: 'territory', type: 'text', description: 'The franchise territory being negotiated. Must be available in franchise_territories.' },
				{ name: 'expectedCloseDate', type: 'date', description: 'Projected date the deal will reach closed_won. Used for pipeline forecasting and revenue planning.' },
				{ name: 'proposalSentDate', type: 'date', description: 'Date the formal proposal or term sheet was sent to the prospect.' },
				{ name: 'lastContactDate', type: 'date', description: 'Date of the most recent meaningful contact with the prospect. Drives overdue follow-up alerts.' },
				{ name: 'nextFollowUpDate', type: 'date', description: 'Scheduled date for the next outreach. Sales reps see overdue follow-ups highlighted in their pipeline view.' },
				{ name: 'assignedTo', type: 'relation', relatesTo: 'user_profiles', description: 'The sales rep who owns this opportunity and is responsible for advancing it to close.' },
				{ name: 'projectId', type: 'relation', relatesTo: 'projects', description: 'Optional link to a sales project if this opportunity is part of a broader campaign or territory push.' },
				{ name: 'notes', type: 'text', description: 'Running notes on the negotiation — objections raised, concessions made, and next steps agreed.' }
			],
			relationships: [
				{ to: 'franchise_leads', type: 'many-to-one', description: 'The qualified lead this opportunity was created from' },
				{ to: 'franchise_deals', type: 'one-to-one', description: 'Created automatically when stage moves to closed_won' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'The sales rep who owns this opportunity' }
			]
		},
		{
			collection: 'franchise_deals',
			description: 'The financial and legal record of a closed franchise sale. Created automatically when a franchise_opportunity reaches closed_won. The deal captures the full financial structure: gross value ($10M default), any sponsorship discount earned from prior sponsor payments, the resulting net value, and a staged payment schedule of up to 5 milestones. Each milestone has its own amountDue, dueDate, amountPaid, paidDate, and status (pending → partial → paid → overdue). outstandingBalance = netFranchiseValue − totalPaidToDate and reaches zero when fully paid. When all milestones are paid and status reaches "active", the franchise record is created and the owner gets dashboard access. Commission tracking (commissionAmount, commissionPaid) is also managed here.',
			fields: [
				{ name: 'opportunityId', type: 'relation', relatesTo: 'franchise_opportunities', description: 'The opportunity this deal was created from. Preserves the full sales history.' },
				{ name: 'dealNumber', type: 'text', description: 'Auto-generated unique deal identifier (e.g. "FLI-2027-001"). Used on contracts and invoices.' },
				{ name: 'franchiseOwnerName', type: 'text', description: 'Legal name of the franchise owner as it appears on the contract.' },
				{ name: 'territory', type: 'text', description: 'The geographic market being purchased. Must match a franchise_territories record.' },
				{ name: 'totalFranchiseValue', type: 'number', description: 'Gross value of the franchise before any discounts. Default is $10,000,000.' },
				{ name: 'sponsorshipDiscount', type: 'number', description: 'Dollar discount applied because the buyer was a prior sponsor. Reduces the net purchase price — a key incentive for sponsors to convert.' },
				{ name: 'negotiatedValue', type: 'number', description: 'Final negotiated price if it differs from the standard formula. Overrides the calculated net value when set.' },
				{ name: 'netFranchiseValue', type: 'number', description: 'The actual amount owed: totalFranchiseValue − sponsorshipDiscount (or negotiatedValue if set). All payment milestones sum to this number.' },
				{ name: 'initialPayment', type: 'number', description: 'Down payment collected at signing. Counts toward totalPaidToDate.' },
				{ name: 'totalPaidToDate', type: 'number', description: 'Running sum of all payments received. Updated each time a milestone is marked paid.' },
				{ name: 'outstandingBalance', type: 'number', description: 'Remaining amount owed: netFranchiseValue − totalPaidToDate. Reaches zero when the deal is fully paid.' },
				{ name: 'paymentMilestones', type: 'json', description: 'Array of up to 5 milestone objects, each with: milestoneNumber, description, amountDue, dueDate, amountPaid, paidDate, status (pending/partial/paid/overdue), notes.' },
				{ name: 'contractSignedDate', type: 'date', description: 'Date the franchise agreement was executed. Triggers the onboarding workflow.' },
				{ name: 'status', type: 'select', description: 'Deal lifecycle: pending_signature → signed → payment_pending → payment_in_progress → payment_completed → onboarding → active → cancelled / defaulted.' },
				{ name: 'closedBy', type: 'relation', relatesTo: 'user_profiles', description: 'The sales rep who closed the deal. Used for commission calculation and performance reporting.' },
				{ name: 'commissionAmount', type: 'number', description: 'Dollar amount of the sales commission for this deal.' },
				{ name: 'commissionPaid', type: 'boolean', description: 'Whether the sales rep\'s commission has been paid out.' },
				{ name: 'sponsorBridgeId', type: 'text', description: 'Links to the sponsor record if this buyer converted from a sponsorship relationship.' },
				{ name: 'notes', type: 'text', description: 'Deal notes, negotiation history, or special terms not captured in other fields.' }
			],
			relationships: [
				{ to: 'franchise_opportunities', type: 'many-to-one', description: 'Created from a closed_won opportunity — full sales history is preserved' },
				{ to: 'sponsors', type: 'one-to-one', description: 'When a sponsor converts to a franchise owner, their sponsor record links here' },
				{ to: 'franchises', type: 'one-to-one', description: 'When the deal reaches "active", a franchise record is created and linked back' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'The sales rep who closed the deal, tracked for commission and performance' }
			]
		},
		{
			collection: 'user_profiles',
			description: 'Every person with access to FliHub has a user_profile. In the Sales context, the relevant roles are: sales (manages leads, opportunities, and sponsors), leader (full access including deal approval and commission review), and admin (system-level access). A sales rep\'s profile is the foreign key on franchise_leads.assignedTo, franchise_opportunities.assignedTo, franchise_deals.closedBy, and sponsors.assignedTo — so pulling all records where assignedTo = a rep\'s id gives a complete view of their pipeline and closed revenue.',
			fields: [
				{ name: 'firstName', type: 'text', description: 'First name. Required.' },
				{ name: 'lastName', type: 'text', description: 'Last name. Required.' },
				{ name: 'email', type: 'email', description: 'Login email and primary contact address.' },
				{ name: 'phone', type: 'text', description: 'Contact phone number.' },
				{ name: 'role', type: 'select', description: 'Determines access level: leader (full access), admin (system management), sales (pipeline and sponsor management), franchise_owner (own franchise only), pro (player access), vendor (vendor portal), broadcaster (media access), manager (pro management).' },
				{ name: 'status', type: 'select', description: 'active (can log in), inactive (access revoked), pending (invited but not yet accepted).' },
				{ name: 'organization', type: 'text', description: 'Company or organization the user is affiliated with.' },
				{ name: 'bio', type: 'text', description: 'Short biography shown on the user\'s profile card.' },
				{ name: 'avatar', type: 'url', description: 'Profile photo URL. Displayed on the user card and in assignment dropdowns.' },
				{ name: 'userId', type: 'relation', relatesTo: 'users', description: 'Links to the PocketBase auth record. The user_profile is the application-level record; the users collection handles authentication.' }
			],
			relationships: [
				{ to: 'franchise_leads', type: 'one-to-many', description: 'Leads assigned to this sales rep for qualification' },
				{ to: 'franchise_opportunities', type: 'one-to-many', description: 'Opportunities this rep owns in the pipeline' },
				{ to: 'franchise_deals', type: 'one-to-many', description: 'Deals closed by this rep — source of commission and revenue attribution' },
				{ to: 'sponsors', type: 'one-to-many', description: 'Sponsor accounts this rep manages' }
			]
		}
	];
	
	// Operations system relationships
	const operationsRelationships = [
		{
			collection: 'departments',
			description: 'The top-level organizational unit. Every project belongs to a department, and every department has its own budget envelope. The budget system supports three modes: auto (budget is the sum of all child project budgets), annual_cap (a hard ceiling — spend cannot exceed this), and allocated (a fixed amount set manually). department_actual_expenses is updated in real time as expenses are approved. The department detail page shows a three-layer budget bar: actual spent, forecasted remaining, and unallocated headroom.',
			fields: [
				{ name: 'name', type: 'text', description: 'Department display name (e.g. "Marketing", "Operations", "Technology").' },
				{ name: 'code', type: 'text', description: 'Short identifier used in reports and budget exports (e.g. "MKT", "OPS"). Max 10 characters.' },
				{ name: 'description', type: 'text', description: 'What this department is responsible for. Shown on the department detail page.' },
				{ name: 'department_annual_budget', type: 'number', description: 'The total budget envelope for this department for the fiscal year. In auto mode this is derived from project budgets; in annual_cap or allocated mode it is set directly.' },
				{ name: 'department_actual_expenses', type: 'number', description: 'Running total of all approved and paid expenses charged to projects in this department. Updated automatically — do not edit manually.' },
				{ name: 'department_manual_budget_override', type: 'number', description: 'Overrides the calculated budget when set. Used when the department needs a budget that differs from the sum of its projects.' },
				{ name: 'department_budget_mode', type: 'select', description: 'Controls how the budget is calculated: auto (sum of project budgets), annual_cap (hard ceiling), allocated (fixed manual amount).' },
				{ name: 'department_budget_cap', type: 'number', description: 'Maximum spend allowed in annual_cap mode. Expenses that would push actual spend past this cap are flagged.' },
				{ name: 'status', type: 'select', description: 'active (operating normally) or inactive (archived — projects still visible but no new spend allowed).' },
				{ name: 'headOfDepartment', type: 'relation', relatesTo: 'user_profiles', description: 'The user profile of the department head. Shown on the department card and used for approval routing.' }
			],
			relationships: [
				{ to: 'projects', type: 'one-to-many', description: 'All projects owned by this department — their budgets roll up to the department total' },
				{ to: 'user_profiles', type: 'many-to-many', description: 'Team members assigned to this department' },
				{ to: 'budgets', type: 'one-to-many', description: 'Quarterly and annual budget allocation records for this department' }
			]
		},
		{
			collection: 'projects',
			description: 'The primary unit of work in Operations. A project can be a tournament, an activation (sponsor event or fan experience), a general event, or a marketing campaign. Each project has its own budget tracked through three numbers: project_budget (the approved envelope), project_forecasted_expenses (what is expected to be spent based on tasks and pending expenses), and project_actual_expenses (what has actually been paid). The gap between forecasted and actual is the uncommitted forecast — visible as the purple segment on the department budget bar. Budget mode controls whether the project budget is fixed, capped, or auto-derived from tasks.',
			fields: [
				{ name: 'name', type: 'text', description: 'Project name as it appears in dashboards and reports.' },
				{ name: 'description', type: 'text', description: 'What the project is and what it is meant to achieve.' },
				{ name: 'type', type: 'select', description: 'tournament, activation, event, or campaign. Determines which dashboard views and filters apply.' },
				{ name: 'status', type: 'select', description: 'Lifecycle: draft → planned → in_progress → completed → cancelled. Only in_progress and planned projects count toward forecasted spend.' },
				{ name: 'startDate', type: 'date', description: 'First day of the project. Used for phase filtering (Phase 1: Jan–Sep 2026, Phase 2: Oct 2026–Mar 2027, Phase 3: Apr–Dec 2027).' },
				{ name: 'endDate', type: 'date', description: 'Last day of the project. Must be on or after startDate.' },
				{ name: 'fiscalYear', type: 'text', description: 'Fiscal year this project belongs to (e.g. "2026"). Used to group projects in budget reports.' },
				{ name: 'project_budget', type: 'number', description: 'Approved budget for this project. In auto mode, derived from the sum of task budgets. In fixed or capped mode, set directly.' },
				{ name: 'project_forecasted_expenses', type: 'number', description: 'Expected total spend based on task estimates and pending expenses. Shown as the purple segment on the budget bar — the gap between actual and forecasted.' },
				{ name: 'project_actual_expenses', type: 'number', description: 'Sum of all approved and paid expenses linked to this project. Updated automatically as expenses move to approved or paid status.' },
				{ name: 'project_budget_mode', type: 'select', description: 'auto (budget = sum of task budgets), fixed (manually set, no cap enforcement), hybrid (auto-calculated with manual override), capped (auto-calculated but cannot exceed project_budget_cap).' },
				{ name: 'project_budget_buffer', type: 'number', description: 'Optional contingency amount added on top of the calculated budget. Useful for projects with uncertain scope.' },
				{ name: 'project_budget_cap', type: 'number', description: 'Hard ceiling in capped mode. Expenses that would push actual spend past this value are flagged for review.' },
				{ name: 'project_manual_budget_override', type: 'number', description: 'Overrides the auto-calculated budget when set. Used when the project needs a budget that differs from the sum of its tasks.' },
				{ name: 'department', type: 'relation', relatesTo: 'departments', description: 'The department that owns this project. The project budget rolls up to the department total.' },
				{ name: 'vendors', type: 'relation', relatesTo: 'vendors', description: 'Vendors engaged on this project. Multiple vendors can be linked; each can also be referenced on individual expense records.' },
				{ name: 'approvedBy', type: 'relation', relatesTo: 'user_profiles', description: 'The user who approved this project and its budget. Required before status can move past planned.' },
				{ name: 'notes', type: 'text', description: 'Free-form notes — scope changes, decisions, or context not captured elsewhere.' }
			],
			relationships: [
				{ to: 'tasks', type: 'one-to-many', description: 'Tasks that make up the project work — their budgets and hours roll up to project totals' },
				{ to: 'expenses', type: 'one-to-many', description: 'Expenses charged to this project — their approved amounts update project_actual_expenses' },
				{ to: 'vendors', type: 'many-to-many', description: 'Vendors engaged on this project' },
				{ to: 'departments', type: 'many-to-one', description: 'The department this project belongs to — project budget rolls up to department total' }
			]
		},
		{
			collection: 'tasks',
			description: 'The atomic unit of work within a project. Tasks have their own budget (task_budget) and actual cost (task_actual_cost) so project managers can track spend at the line-item level. Each task supports a subTasksChecklist — a JSON array of checkbox items for granular progress tracking without creating separate records. Time tracking fields (estimatedHours, actualHours) feed into resource planning. Priority (low → medium → high → urgent) and status (todo → in_progress → blocked → completed → cancelled) drive the task board views.',
			fields: [
				{ name: 'title', type: 'text', description: 'Task title — what needs to be done. Required.' },
				{ name: 'description', type: 'text', description: 'Detailed description of the task, acceptance criteria, or context.' },
				{ name: 'status', type: 'select', description: 'todo (not started), in_progress (actively being worked), blocked (waiting on a dependency), completed (done), cancelled (will not be done).' },
				{ name: 'priority', type: 'select', description: 'low, medium, high, or urgent. Urgent tasks surface at the top of the task board and trigger notifications.' },
				{ name: 'startDate', type: 'date', description: 'When work on this task begins.' },
				{ name: 'dueDate', type: 'date', description: 'Deadline for this task. Must be on or after startDate. Overdue tasks are highlighted in the UI.' },
				{ name: 'completedDate', type: 'date', description: 'Date the task was actually completed. Populated when status moves to completed.' },
				{ name: 'estimatedHours', type: 'number', description: 'Planned effort in hours. Used for resource planning and project timeline estimates.' },
				{ name: 'actualHours', type: 'number', description: 'Actual hours logged. Compared against estimatedHours to surface over/under estimates.' },
				{ name: 'task_budget', type: 'number', description: 'Budget allocated to this task. In project auto mode, task budgets sum to the project budget.' },
				{ name: 'task_actual_cost', type: 'number', description: 'Actual cost incurred for this task. Updated as expenses linked to the parent project are approved.' },
				{ name: 'subTasksChecklist', type: 'json', description: 'Array of checklist items: [{ text: string, completed: boolean }]. Allows granular progress tracking within a single task without creating child records.' },
				{ name: 'projectId', type: 'relation', relatesTo: 'projects', description: 'The project this task belongs to.' },
				{ name: 'assignedTo', type: 'relation', relatesTo: 'user_profiles', description: 'One or more team members responsible for completing this task.' },
				{ name: 'managerId', type: 'relation', relatesTo: 'user_profiles', description: 'The manager overseeing this task. Receives notifications on status changes and overdue alerts.' },
				{ name: 'createdBy', type: 'relation', relatesTo: 'user_profiles', description: 'The user who created this task.' },
				{ name: 'tags', type: 'text', description: 'Comma-separated tags for filtering and grouping tasks across projects.' },
				{ name: 'notes', type: 'text', description: 'Additional context, blockers, or decisions relevant to this task.' }
			],
			relationships: [
				{ to: 'projects', type: 'many-to-one', description: 'Task belongs to this project — task budget rolls up to project_budget in auto mode' },
				{ to: 'user_profiles', type: 'many-to-many', description: 'Team members assigned to this task' }
			]
		},
		{
			collection: 'vendors',
			description: 'External companies and service providers that FLI Golf works with. A vendor can be a venue, a product supplier, a beverage partner, a technology provider, a gaming company, or a general service provider. Vendors are linked to projects (many-to-many) and to individual expense records so spend-by-vendor reporting is possible. The open_invoices_total field tracks outstanding amounts owed to the vendor across all active invoices.',
			fields: [
				{ name: 'name', type: 'text', description: 'Vendor company name as it appears on invoices and contracts.' },
				{ name: 'type', type: 'select', description: 'Classification: venue, product_supplier, beverage, technology, gaming, service_provider. Used to filter and segment the vendor list.' },
				{ name: 'active', type: 'boolean', description: 'Whether this vendor is currently engaged. Inactive vendors are hidden from project assignment dropdowns but their historical expense records are preserved.' },
				{ name: 'contact_email', type: 'email', description: 'Primary contact email for invoices and communications.' },
				{ name: 'contact_phone', type: 'text', description: 'Primary contact phone number.' },
				{ name: 'website', type: 'url', description: 'Vendor website. Used on the vendor detail card.' },
				{ name: 'about', type: 'text', description: 'Description of the vendor\'s services and the relationship with FLI Golf.' },
				{ name: 'open_invoices_total', type: 'number', description: 'Running total of outstanding invoice amounts across all active projects. Updated as expenses linked to this vendor are created and paid.' },
				{ name: 'logo', type: 'file', description: 'Vendor logo displayed on the vendor card and project vendor list.' },
				{ name: 'image_extra', type: 'file', description: 'Additional images — venue photos, product shots, or marketing materials. Supports multiple files.' }
			],
			relationships: [
				{ to: 'projects', type: 'many-to-many', description: 'Projects this vendor is engaged on — a vendor can work across multiple projects simultaneously' },
				{ to: 'expenses', type: 'one-to-many', description: 'Expense records where this vendor is the payee — used for spend-by-vendor reporting' }
			]
		}
	];
	
	// Financial system relationships
	const financialRelationships = [
		{
			collection: 'expenses',
			description: 'Every dollar leaving FLI Golf is recorded here. An expense starts as a draft, gets submitted for review, approved by a manager, and finally marked paid once the payment clears. The category field maps to one of 40 granular line items (e.g. "Travel/Airfare", "Expenses/MPO (Male)", "League Insurance") which roll up into 10 high-level reporting buckets — Staff & Personnel, Technology, Facilities, Travel, Events & Competition, etc. Attaching a projectId ties the spend to a specific project budget so you can see actual vs. allocated in real time.',
			fields: [
				{ name: 'description', type: 'text', description: 'What the expense is for. Required. Used on approval requests and financial reports.' },
				{ name: 'amount', type: 'number', description: 'Dollar amount of the expense. Must be 0 or greater.' },
				{ name: 'category', type: 'select', description: '40 granular categories covering Staff, Marketing, Legal, Tech, Facilities, Travel, E-Commerce, Media, Insurance, and Reserves. Each maps to a high-level reporting bucket for dashboards.' },
				{ name: 'status', type: 'select', description: 'Approval lifecycle: draft (not yet submitted) → submitted (awaiting review) → approved (cleared for payment) → paid (payment confirmed). Rejected expenses return to draft.' },
				{ name: 'date', type: 'date', description: 'Date the expense was incurred (not necessarily when it was submitted or paid).' },
				{ name: 'paymentMethod', type: 'select', description: 'How the expense was paid: credit_card, debit_card, cash, check, wire_transfer, other.' },
				{ name: 'paidDate', type: 'date', description: 'Date the payment was actually sent. Populated when status moves to paid.' },
				{ name: 'receipt', type: 'file', description: 'Uploaded receipt files. Supports up to 99 attachments per expense for multi-page receipts.' },
				{ name: 'projectId', type: 'relation', relatesTo: 'projects', description: 'Links this expense to a project budget. When set, the project\'s actualExpenses total updates automatically.' },
				{ name: 'vendor', type: 'relation', relatesTo: 'vendors', description: 'The vendor who provided the service or goods. Optional — not all expenses have a vendor (e.g. payroll).' },
				{ name: 'submittedBy', type: 'relation', relatesTo: 'users', description: 'The team member who submitted the expense for approval.' },
				{ name: 'approvedBy', type: 'relation', relatesTo: 'users', description: 'The manager who approved the expense. Populated when status moves to approved.' },
				{ name: 'reimbursementTo', type: 'text', description: 'Name of the person to reimburse if this was a personal out-of-pocket expense.' },
				{ name: 'notes', type: 'text', description: 'Free-form notes — reference numbers, context, or any detail not captured by other fields.' }
			],
			relationships: [
				{ to: 'projects', type: 'many-to-one', description: 'Expense is charged against a project\'s allocated budget' },
				{ to: 'vendors', type: 'many-to-one', description: 'Expense is attributed to a vendor for spend-by-vendor reporting' },
				{ to: 'users', type: 'many-to-one', description: 'Submitted by one user, approved by another — both tracked separately' }
			]
		},
		{
			collection: 'budgets',
			description: 'Budget allocations by department area and fiscal period. Each record represents a single department\'s spending envelope for a given fiscal year and optional quarter. The allocatedAmount is set during planning; spentAmount is updated as approved expenses are logged; remainingAmount = allocatedAmount − spentAmount. Budgets are the control layer — expenses are the actuals. Together they power the budget vs. actual view across the org.',
			fields: [
				{ name: 'departmentArea', type: 'text', description: 'The department or cost center this budget covers (e.g. "Marketing", "Operations", "Technology"). Must match the high-level expense category groupings for accurate roll-up.' },
				{ name: 'fiscalYear', type: 'number', description: 'The fiscal year this budget applies to (e.g. 2027). Used to group and compare budgets year-over-year.' },
				{ name: 'quarter', type: 'select', description: 'Optional quarterly breakdown: Q1, Q2, Q3, Q4. When set, this record covers only that quarter\'s allocation within the fiscal year.' },
				{ name: 'allocatedAmount', type: 'number', description: 'Total dollars approved for this department/period. Set during the planning cycle and should not change mid-period without a formal amendment.' },
				{ name: 'spentAmount', type: 'number', description: 'Running total of approved and paid expenses charged to this department. Updated as expenses move to approved or paid status.' },
				{ name: 'remainingAmount', type: 'number', description: 'Computed: allocatedAmount − spentAmount. Negative values indicate overspend and trigger alerts.' },
				{ name: 'notes', type: 'text', description: 'Planning notes, assumptions, or amendment history for this budget record.' }
			],
			relationships: [
				{ to: 'expenses', type: 'one-to-many', description: 'Expenses in the matching category roll up to this budget for actuals tracking' },
				{ to: 'projects', type: 'one-to-many', description: 'Projects draw from department budgets; project allocatedBudget must stay within the department total' }
			]
		},
		{
			collection: 'franchise_deals',
			description: 'The financial record of a franchise purchase. A deal is created when a franchise_opportunity reaches "Closed Won" and captures the full financial structure of the transaction: the gross franchise value ($10M default), any sponsorship discount earned from prior sponsor payments, the resulting net value, and a staged payment schedule of up to 5 milestones. Each milestone tracks its own amountDue, dueDate, amountPaid, and status (pending → partial → paid → overdue). The deal\'s outstandingBalance = netFranchiseValue − totalPaidToDate. When all milestones are paid and status reaches "active", the franchise record is created and the owner gets dashboard access.',
			fields: [
				{ name: 'opportunityId', type: 'relation', relatesTo: 'franchise_opportunities', description: 'The sales opportunity this deal was created from. Preserves the full lead history.' },
				{ name: 'dealNumber', type: 'text', description: 'Auto-generated unique deal identifier (e.g. "FLI-2027-001"). Used on contracts and invoices.' },
				{ name: 'franchiseOwnerName', type: 'text', description: 'Legal name of the franchise owner as it appears on the contract.' },
				{ name: 'territory', type: 'text', description: 'The geographic market being purchased (e.g. "Austin, TX"). Must match a franchise_territories record.' },
				{ name: 'totalFranchiseValue', type: 'number', description: 'Gross value of the franchise before any discounts. Default is $10,000,000.' },
				{ name: 'sponsorshipDiscount', type: 'number', description: 'Dollar discount applied because the buyer was a prior sponsor. Reduces the net purchase price.' },
				{ name: 'negotiatedValue', type: 'number', description: 'Final negotiated price if it differs from the standard formula. Overrides the calculated net value when set.' },
				{ name: 'netFranchiseValue', type: 'number', description: 'The actual amount the buyer owes: totalFranchiseValue − sponsorshipDiscount (or negotiatedValue if set). This is the number all payment milestones sum to.' },
				{ name: 'initialPayment', type: 'number', description: 'Down payment collected at signing. Counts toward totalPaidToDate.' },
				{ name: 'totalPaidToDate', type: 'number', description: 'Running sum of all payments received across all milestones. Updated each time a milestone is marked paid.' },
				{ name: 'outstandingBalance', type: 'number', description: 'Remaining amount owed: netFranchiseValue − totalPaidToDate. Reaches zero when the deal is fully paid.' },
				{ name: 'paymentMilestones', type: 'json', description: 'Array of up to 5 milestone objects. Each has: milestoneNumber, description, amountDue, dueDate, amountPaid, paidDate, status (pending/partial/paid/overdue), notes.' },
				{ name: 'contractSignedDate', type: 'date', description: 'Date the franchise agreement was executed. Triggers the onboarding workflow.' },
				{ name: 'status', type: 'select', description: 'Deal lifecycle: pending_signature → signed → payment_pending → payment_in_progress → payment_completed → onboarding → active → cancelled / defaulted.' },
				{ name: 'closedBy', type: 'relation', relatesTo: 'user_profiles', description: 'The sales rep who closed the deal. Used for commission calculation.' },
				{ name: 'commissionPaid', type: 'boolean', description: 'Whether the sales rep\'s commission has been paid out for this deal.' },
				{ name: 'commissionAmount', type: 'number', description: 'Dollar amount of the sales commission for this deal.' },
				{ name: 'sponsorBridgeId', type: 'text', description: 'Links to the sponsor record if this buyer converted from a sponsorship relationship.' },
				{ name: 'notes', type: 'text', description: 'Deal notes, negotiation history, or special terms.' }
			],
			relationships: [
				{ to: 'franchise_opportunities', type: 'many-to-one', description: 'Created from a closed-won opportunity — preserves the full sales history' },
				{ to: 'sponsors', type: 'one-to-one', description: 'When a sponsor converts to a franchise owner, their sponsor record links here' },
				{ to: 'franchises', type: 'one-to-one', description: 'When the deal reaches "active", a franchise record is created and linked back' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'The sales rep who closed the deal, tracked for commission and performance reporting' }
			]
		},
		{
			collection: 'sponsors',
			description: 'Sponsors are the primary recurring revenue source outside of franchise fees. Each sponsor record tracks the full financial relationship: what they committed to pay (annualCommitment), what has actually been received (totalPaid), and the gap between the two. Individual payments are recorded in sponsor_payments as separate instalment records — the sum of all paid instalments should equal totalPaid on the parent record. When a sponsor expresses interest in buying a franchise, franchiseInterest is flagged and a franchise_deal is created; the franchiseDealId field links the two records permanently.',
			fields: [
				{ name: 'companyName', type: 'text', description: 'Legal or trading name of the sponsoring company. Used on contracts, invoices, and public-facing materials.' },
				{ name: 'tier', type: 'select', description: 'Sponsorship tier: title (naming rights), platinum (premium placement), gold / silver / bronze (standard tiers), community (local/grassroots). Determines visibility, benefits, and pricing.' },
				{ name: 'status', type: 'select', description: 'Lifecycle: prospect (in conversation) → active (contract signed and paying) → inactive (lapsed or paused) → cancelled (terminated early).' },
				{ name: 'annualCommitment', type: 'number', description: 'Total dollar value the sponsor has committed to pay per contract year. This is the target — not what has been collected. Balance due = annualCommitment − totalPaid.' },
				{ name: 'totalPaid', type: 'number', description: 'Running total of all payments received from this sponsor across all instalments. Should match the sum of paid sponsor_payments records.' },
				{ name: 'contractStartDate', type: 'date', description: 'First day the sponsorship agreement is in effect.' },
				{ name: 'contractEndDate', type: 'date', description: 'Last day of the current contract term. Approaching this date triggers the renewal workflow.' },
				{ name: 'franchiseInterest', type: 'boolean', description: 'Set to true when the sponsor expresses interest in buying a franchise. Triggers the conversion pipeline.' },
				{ name: 'franchiseConversionDate', type: 'date', description: 'Date the sponsor officially converted to a franchise owner. Populated when franchiseDealId is set.' },
				{ name: 'franchiseDealId', type: 'relation', relatesTo: 'franchise_deals', description: 'Links to the franchise_deals record created when this sponsor converted. Once set, the sponsor is also tracked as a franchise owner.' },
				{ name: 'assignedTo', type: 'relation', relatesTo: 'user_profiles', description: 'The account manager responsible for this sponsor relationship and renewal.' }
			],
			relationships: [
				{ to: 'sponsor_payments', type: 'one-to-many', description: 'Individual payment instalments — each instalment is a separate record; their sum equals totalPaid' },
				{ to: 'sponsor_franchise_bridge', type: 'one-to-many', description: 'Each franchise this sponsor is backing gets its own bridge record with independent level and amount' },
				{ to: 'franchise_deals', type: 'one-to-one', description: 'When franchiseInterest is true and a deal is created, this links the sponsor to their franchise purchase' },
				{ to: 'user_profiles', type: 'many-to-one', description: 'Assigned account manager who owns the relationship and renewal' }
			]
		},
		{
			collection: 'pro_payments',
			description: 'Every dollar paid to a talent (player, broadcaster, commentator, or analyst) is recorded here. Prize payments are created automatically when tournament results are entered — the placement field on tournament_results drives the earnings calculation, and a pro_payment record is generated for each placed pro. Salary, bonus, and appearance fee payments are created manually by admins. The sum of all paid records for a talent represents their total earnings from FLI Golf for the season.',
			fields: [
				{ name: 'proId', type: 'relation', relatesTo: 'talent', description: 'The talent receiving this payment. Links to the talent collection (players, broadcasters, etc.).' },
				{ name: 'amount', type: 'number', description: 'Dollar amount of this specific payment.' },
				{ name: 'paymentDate', type: 'date', description: 'Date the payment was made or is scheduled to be sent.' },
				{ name: 'paymentType', type: 'select', description: 'Prize (from tournament placement — auto-generated), Salary (contracted base pay), Bonus (performance or signing), Appearance Fee (non-tournament events).' },
				{ name: 'status', type: 'select', description: 'pending (approved but not yet sent), paid (confirmed transferred), cancelled (voided).' },
				{ name: 'fiscalYear', type: 'number', description: 'Fiscal year this payment belongs to. Used for year-end earnings summaries and tax reporting.' },
				{ name: 'notes', type: 'text', description: 'Reference number, tournament name, or any context for this specific payment.' }
			],
			relationships: [
				{ to: 'talent', type: 'many-to-one', description: 'Payment belongs to this talent — all payments for a talent sum to their total season earnings' },
				{ to: 'tournament_results', type: 'one-to-one', description: 'For prize payments, links back to the placement record that triggered the payment' },
				{ to: 'franchises', type: 'many-to-one', description: 'Prize payments are credited to the franchise the talent was rostered on at the time' }
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
				{ id: 'prize-money', label: 'Prize Money' },
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

			<!-- Overview -->
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold">Financial System Overview</h2>
						<p class="text-sm text-muted-foreground mt-1">
							How revenue flows in, gets allocated to budgets, and is spent through expenses and talent payments.
						</p>
					</div>
					<div class="p-4 bg-green-950/40 border border-green-700/50 rounded-lg text-sm text-green-200">
						FLI Golf has two revenue streams: <code class="font-mono bg-black/30 px-1 rounded">sponsors</code> (recurring annual commitments paid in instalments) and <code class="font-mono bg-black/30 px-1 rounded">franchise_deals</code> (one-time purchase revenue collected across up to 5 milestones). Revenue is allocated into department envelopes via <code class="font-mono bg-black/30 px-1 rounded">budgets</code>, then drawn down by <code class="font-mono bg-black/30 px-1 rounded">expenses</code> (operational spend) and <code class="font-mono bg-black/30 px-1 rounded">pro_payments</code> (talent compensation). Every approved expense reduces the linked budget's <code class="font-mono bg-black/30 px-1 rounded">remainingAmount</code> in real time.
					</div>
				</div>
			</Card>

			<!-- Expense lifecycle -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-6">Expense Lifecycle</h2>
				<div class="space-y-4">
					<!-- Status flow -->
					<div>
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Approval Flow</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'draft', color: 'bg-slate-700/50 border-slate-600 text-slate-200', note: 'Being prepared' },
								{ label: '→', color: '', note: '' },
								{ label: 'submitted', color: 'bg-amber-900/40 border-amber-700/50 text-amber-200', note: 'Awaiting review' },
								{ label: '→', color: '', note: '' },
								{ label: 'approved', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200', note: 'Budget reserved' },
								{ label: '→', color: '', note: '' },
								{ label: 'paid', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'Payment sent' },
								{ label: '→', color: '', note: '' },
								{ label: 'rejected', color: 'bg-red-900/40 border-red-700/50 text-red-200', note: 'Declined' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground text-center">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Budget impact -->
					<div class="border-t border-border pt-4">
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Budget Impact</h3>
						<div class="flex flex-wrap gap-3">
							<div class="flex flex-col items-center gap-1">
								<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-amber-900/40 border-amber-700/50 text-amber-200">submitted</div>
								<div class="text-[10px] text-muted-foreground text-center">No budget impact yet.<br/>Pending review.</div>
							</div>
							<div class="flex items-center text-slate-500 text-lg font-light">→</div>
							<div class="flex flex-col items-center gap-1">
								<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-blue-900/40 border-blue-700/50 text-blue-200">approved</div>
								<div class="text-[10px] text-muted-foreground text-center">spentAmount increases.<br/>remainingAmount decreases.</div>
							</div>
							<div class="flex items-center text-slate-500 text-lg font-light">→</div>
							<div class="flex flex-col items-center gap-1">
								<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-emerald-900/40 border-emerald-700/50 text-emerald-200">paid</div>
								<div class="text-[10px] text-muted-foreground text-center">Payment method recorded.<br/>paidDate set.</div>
							</div>
						</div>
					</div>
				</div>
			</Card>

			<!-- Expense categories -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">Expense Categories</h2>
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{#each [
						{ cat: 'staff_salaries', color: 'bg-blue-900/40 border-blue-600/50 text-blue-200', desc: 'Full-time and part-time employee compensation.' },
						{ cat: 'contractor_fees', color: 'bg-blue-800/40 border-blue-500/50 text-blue-200', desc: 'Payments to freelancers and independent contractors.' },
						{ cat: 'travel_flights', color: 'bg-sky-900/40 border-sky-600/50 text-sky-200', desc: 'Airfare for staff and talent travel.' },
						{ cat: 'travel_accommodation', color: 'bg-sky-800/40 border-sky-500/50 text-sky-200', desc: 'Hotels and lodging for events and trips.' },
						{ cat: 'travel_ground', color: 'bg-sky-700/40 border-sky-400/50 text-sky-200', desc: 'Car rentals, rideshare, and ground transport.' },
						{ cat: 'travel_meals', color: 'bg-sky-600/40 border-sky-300/50 text-sky-100', desc: 'Meals and per diems during travel.' },
						{ cat: 'venue_rental', color: 'bg-orange-900/40 border-orange-600/50 text-orange-200', desc: 'Course and facility rental fees for events.' },
						{ cat: 'equipment_purchase', color: 'bg-amber-900/40 border-amber-600/50 text-amber-200', desc: 'One-time equipment and hardware purchases.' },
						{ cat: 'equipment_rental', color: 'bg-amber-800/40 border-amber-500/50 text-amber-200', desc: 'Short-term equipment and gear rentals.' },
						{ cat: 'marketing_digital', color: 'bg-violet-900/40 border-violet-600/50 text-violet-200', desc: 'Digital ads, social media, and online campaigns.' },
						{ cat: 'marketing_print', color: 'bg-violet-800/40 border-violet-500/50 text-violet-200', desc: 'Printed materials, signage, and physical collateral.' },
						{ cat: 'marketing_events', color: 'bg-violet-700/40 border-violet-400/50 text-violet-200', desc: 'Activations, experiential marketing, and event promos.' },
						{ cat: 'technology_software', color: 'bg-cyan-900/40 border-cyan-600/50 text-cyan-200', desc: 'SaaS subscriptions and software licences.' },
						{ cat: 'technology_hardware', color: 'bg-cyan-800/40 border-cyan-500/50 text-cyan-200', desc: 'Computers, cameras, and physical tech assets.' },
						{ cat: 'technology_services', color: 'bg-cyan-700/40 border-cyan-400/50 text-cyan-200', desc: 'Cloud hosting, APIs, and managed tech services.' },
						{ cat: 'prize_money', color: 'bg-yellow-900/40 border-yellow-600/50 text-yellow-200', desc: 'Tournament prize payouts to players.' },
						{ cat: 'player_appearance', color: 'bg-yellow-800/40 border-yellow-500/50 text-yellow-200', desc: 'Appearance fees paid to pros for events.' },
						{ cat: 'player_travel', color: 'bg-yellow-700/40 border-yellow-400/50 text-yellow-200', desc: 'Travel expenses covered for talent.' },
						{ cat: 'event_production', color: 'bg-rose-900/40 border-rose-600/50 text-rose-200', desc: 'Staging, AV, streaming, and production costs.' },
						{ cat: 'event_catering', color: 'bg-rose-800/40 border-rose-500/50 text-rose-200', desc: 'Food and beverage for events and hospitality.' },
						{ cat: 'legal_fees', color: 'bg-slate-700/50 border-slate-500 text-slate-200', desc: 'Legal counsel, contracts, and compliance.' },
						{ cat: 'insurance', color: 'bg-slate-600/50 border-slate-400 text-slate-200', desc: 'Event, liability, and business insurance.' },
						{ cat: 'office_supplies', color: 'bg-slate-500/50 border-slate-300 text-slate-100', desc: 'General office consumables and supplies.' },
						{ cat: 'other', color: 'bg-slate-800/50 border-slate-600 text-slate-300', desc: 'Anything not covered by a specific category.' }
					] as item}
						<div class="p-3 rounded-lg border {item.color}">
							<div class="font-mono font-bold text-xs mb-1">{item.cat}</div>
							<div class="text-[11px] opacity-80 leading-snug">{item.desc}</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Collections map -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">How Financial Collections Connect</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">expenses → budgets</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Each expense references a budget. Approval triggers spentAmount to increase and remainingAmount to decrease on the linked budget record.</div>
							<div class="pt-1 text-green-300">Prevents overspend by making budget headroom visible before approval.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">expenses → vendors</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Optional vendor reference on each expense identifies the payee. Querying expenses by vendor gives a full spend history.</div>
							<div class="pt-1 text-orange-300">Vendor's open_invoices_total decreases as linked expenses reach paid status.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">pro_payments → talent</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Each pro_payment record links to a talent record. Sum of all paid records = that pro's total season earnings.</div>
							<div class="pt-1 text-pink-300">prize_money type records are auto-generated from tournament_results placements.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">franchise_deals → budgets</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Franchise purchase revenue flows into the budget pool. outstandingBalance = netFranchiseValue − totalPaidToDate.</div>
							<div class="pt-1 text-amber-300">Up to 5 payment milestones track instalment collection.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">sponsors → budgets</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Annual sponsor commitments paid via sponsor_payments. annualCommitment sets the target; totalPaid tracks receipts.</div>
							<div class="pt-1 text-blue-300">Balance due = annualCommitment − totalPaid across all payment records.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">budgets → departments</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Each budget belongs to a department and a fiscal year (with optional quarter). Enables per-department spend tracking.</div>
							<div class="pt-1 text-violet-300">QuarterEnum: Q1 | Q2 | Q3 | Q4 for quarterly budget periods.</div>
						</div>
					</div>
				</div>
			</Card>

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
						<p class="text-sm text-muted-foreground mt-1">Two revenue streams feed the budget pool; two expense streams draw from it.</p>
					</div>
					<div class="space-y-6 p-6 bg-muted/30 rounded-lg">
						<!-- Revenue In row -->
						<div>
							<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Revenue In</p>
							<div class="flex items-stretch gap-4">
								<div class="flex-1 p-4 bg-background border-2 border-blue-500 rounded-lg">
									<div class="font-mono font-bold">sponsors</div>
									<div class="text-xs text-muted-foreground mt-1">Annual commitments paid in instalments via <span class="font-mono">sponsor_payments</span>. annualCommitment sets the target; totalPaid tracks receipts. Balance due = annualCommitment − totalPaid.</div>
								</div>
								<div class="flex items-center text-2xl text-muted-foreground">+</div>
								<div class="flex-1 p-4 bg-background border-2 border-orange-500 rounded-lg">
									<div class="font-mono font-bold">franchise_deals</div>
									<div class="text-xs text-muted-foreground mt-1">One-time franchise purchase revenue collected across up to 5 payment milestones. outstandingBalance = netFranchiseValue − totalPaidToDate and reaches zero when fully paid.</div>
								</div>
								<div class="flex items-center text-2xl text-muted-foreground">→</div>
								<div class="flex-1 p-4 bg-background border-2 border-green-500 rounded-lg">
									<div class="font-mono font-bold">budgets</div>
									<div class="text-xs text-muted-foreground mt-1">Revenue is allocated into department envelopes by fiscal year and optional quarter. allocatedAmount is the ceiling; spentAmount tracks actuals; remainingAmount = allocated − spent.</div>
								</div>
							</div>
						</div>

						<!-- Divider -->
						<div class="flex items-center gap-3">
							<div class="flex-1 h-px bg-border"></div>
							<span class="text-xs text-muted-foreground uppercase tracking-wide">Spend</span>
							<div class="flex-1 h-px bg-border"></div>
						</div>

						<!-- Spend Out row -->
						<div>
							<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Spend Out</p>
							<div class="flex items-stretch gap-4">
								<div class="flex-1 p-4 bg-background border-2 border-purple-500 rounded-lg">
									<div class="font-mono font-bold">expenses</div>
									<div class="text-xs text-muted-foreground mt-1">All operational spend — staff, travel, facilities, tech, events. Follows draft → submitted → approved → paid. Each approved expense reduces the linked budget's remainingAmount.</div>
								</div>
								<div class="flex items-center text-2xl text-muted-foreground">+</div>
								<div class="flex-1 p-4 bg-background border-2 border-pink-500 rounded-lg">
									<div class="font-mono font-bold">pro_payments</div>
									<div class="text-xs text-muted-foreground mt-1">Talent compensation — prize money (auto-generated from tournament_results placements), salary, bonuses, and appearance fees. Sum of all paid records = talent's total season earnings.</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	{#if activeTab === 'operations'}
		<div class="space-y-6">

			<!-- Overview -->
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold">Operations System Overview</h2>
						<p class="text-sm text-muted-foreground mt-1">
							How work is organized from department down to individual tasks, and how spend is tracked at every level.
						</p>
					</div>
					<div class="p-4 bg-emerald-950/40 border border-emerald-700/50 rounded-lg text-sm text-emerald-200">
						Operations is a four-layer hierarchy: <code class="font-mono bg-black/30 px-1 rounded">departments</code> own <code class="font-mono bg-black/30 px-1 rounded">projects</code>, projects contain <code class="font-mono bg-black/30 px-1 rounded">tasks</code>, and <code class="font-mono bg-black/30 px-1 rounded">vendors</code> are engaged across projects. Budget tracking runs at every layer — department annual budget → project budget → task budget — and actual spend flows upward automatically as <code class="font-mono bg-black/30 px-1 rounded">expenses</code> are approved. The three-number pattern (<code class="font-mono bg-black/30 px-1 rounded">budget</code> / <code class="font-mono bg-black/30 px-1 rounded">forecasted</code> / <code class="font-mono bg-black/30 px-1 rounded">actual</code>) appears at both the department and project level, powering the budget bar visualisation.
					</div>
				</div>
			</Card>

			<!-- Project lifecycle -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-6">Project & Task Lifecycle</h2>
				<div class="space-y-4">
					<!-- Project status flow -->
					<div>
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Project Status Flow</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'draft', color: 'bg-slate-700/50 border-slate-600 text-slate-200', note: 'Being scoped' },
								{ label: '→', color: '', note: '' },
								{ label: 'planned', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200', note: 'Budget approved' },
								{ label: '→', color: '', note: '' },
								{ label: 'in_progress', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'Actively running' },
								{ label: '→', color: '', note: '' },
								{ label: 'completed', color: 'bg-green-900/40 border-green-700/50 text-green-200', note: 'Delivered' },
								{ label: '|', color: '', note: '' },
								{ label: 'cancelled', color: 'bg-red-900/40 border-red-700/50 text-red-200', note: 'Abandoned' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground text-center">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Task status flow -->
					<div class="border-t border-border pt-4">
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Task Status Flow</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'todo', color: 'bg-slate-700/50 border-slate-600 text-slate-200', note: 'Not started' },
								{ label: '→', color: '', note: '' },
								{ label: 'in_progress', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200', note: 'Being worked' },
								{ label: '→', color: '', note: '' },
								{ label: 'blocked', color: 'bg-amber-900/40 border-amber-700/50 text-amber-200', note: 'Waiting on dependency' },
								{ label: '→', color: '', note: '' },
								{ label: 'completed', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'Done' },
								{ label: '|', color: '', note: '' },
								{ label: 'cancelled', color: 'bg-red-900/40 border-red-700/50 text-red-200', note: 'Will not be done' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground text-center">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Task priority -->
					<div class="border-t border-border pt-4">
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Task Priority</h3>
						<div class="flex flex-wrap gap-3">
							{#each [
								{ label: 'low', color: 'bg-slate-700/50 border-slate-600 text-slate-300', note: 'No urgency' },
								{ label: 'medium', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200', note: 'Normal queue' },
								{ label: 'high', color: 'bg-amber-900/40 border-amber-700/50 text-amber-200', note: 'Elevated attention' },
								{ label: 'urgent', color: 'bg-red-900/40 border-red-700/50 text-red-200', note: 'Surfaces to top of board, triggers notifications' }
							] as p}
								<div class="flex flex-col items-center gap-1">
									<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono {p.color}">{p.label}</div>
									<div class="text-[10px] text-muted-foreground text-center">{p.note}</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</Card>

			<!-- Project types -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">Project Types</h2>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
					{#each [
						{ type: 'tournament', color: 'bg-blue-900/40 border-blue-600/50 text-blue-200', desc: 'Competitive disc golf events. Linked to tournament_results and pro_payments for prize payout tracking.' },
						{ type: 'activation', color: 'bg-violet-900/40 border-violet-600/50 text-violet-200', desc: 'Sponsor events, fan experiences, and brand activations. Often tied to a specific sponsor.' },
						{ type: 'event', color: 'bg-emerald-900/40 border-emerald-600/50 text-emerald-200', desc: 'General events — clinics, meetups, community days — that do not fit tournament or activation.' },
						{ type: 'campaign', color: 'bg-amber-900/40 border-amber-600/50 text-amber-200', desc: 'Marketing campaigns — digital, print, or media — tracked as a project with their own budget.' }
					] as pt}
						<div class="p-3 rounded-lg border {pt.color}">
							<div class="font-mono font-bold text-sm mb-1">{pt.type}</div>
							<div class="text-[11px] opacity-80 leading-snug">{pt.desc}</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Budget modes -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">Budget Modes</h2>
				<p class="text-sm text-muted-foreground mb-4">Both departments and projects support multiple budget calculation modes. The mode controls how the budget number is derived and whether overspend is enforced.</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Project Budget Modes</h3>
						<div class="space-y-2">
							{#each [
								{ mode: 'auto', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', desc: 'Budget = sum of all task budgets. Updates automatically as tasks are added or changed.' },
								{ mode: 'fixed', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200', desc: 'Manually set budget. No cap enforcement — overspend is flagged but not blocked.' },
								{ mode: 'hybrid', color: 'bg-violet-900/40 border-violet-700/50 text-violet-200', desc: 'Auto-calculated from tasks but can be overridden with project_manual_budget_override.' },
								{ mode: 'capped', color: 'bg-amber-900/40 border-amber-700/50 text-amber-200', desc: 'Auto-calculated but cannot exceed project_budget_cap. Expenses past the cap are flagged for review.' }
							] as bm}
								<div class="flex items-start gap-3 p-3 rounded-lg border {bm.color}">
									<div class="font-mono font-bold text-xs shrink-0 pt-0.5">{bm.mode}</div>
									<div class="text-xs opacity-80">{bm.desc}</div>
								</div>
							{/each}
						</div>
					</div>
					<div>
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Department Budget Modes</h3>
						<div class="space-y-2">
							{#each [
								{ mode: 'auto', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', desc: 'Budget = sum of all child project budgets. Reflects the bottom-up plan.' },
								{ mode: 'annual_cap', color: 'bg-red-900/40 border-red-700/50 text-red-200', desc: 'Hard ceiling set by finance. Expenses that push actual spend past this cap are flagged.' },
								{ mode: 'allocated', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200', desc: 'Fixed amount set manually during the planning cycle. Does not change with project additions.' }
							] as bm}
								<div class="flex items-start gap-3 p-3 rounded-lg border {bm.color}">
									<div class="font-mono font-bold text-xs shrink-0 pt-0.5">{bm.mode}</div>
									<div class="text-xs opacity-80">{bm.desc}</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</Card>

			<!-- Collections map -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">How Operations Collections Connect</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">departments → projects</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One-to-many. Every project belongs to exactly one department. Project budgets roll up to the department's annual budget total.</div>
							<div class="pt-1 text-emerald-300">department_actual_expenses updates in real time as project expenses are approved.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">projects → tasks</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One-to-many. Tasks are the atomic unit of work within a project. In auto budget mode, task_budget values sum to the project budget.</div>
							<div class="pt-1 text-blue-300">subTasksChecklist on each task allows granular progress tracking without creating child records.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">projects → vendors</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Many-to-many. A project can engage multiple vendors; a vendor can work across multiple projects simultaneously.</div>
							<div class="pt-1 text-orange-300">Set via the vendors[] array on the project record.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">projects → expenses</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One-to-many. Expenses are charged to a project via projectId. Approval updates project_actual_expenses automatically.</div>
							<div class="pt-1 text-violet-300">project_forecasted_expenses tracks expected spend from pending tasks and submitted expenses.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">departments → budgets</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One-to-many. Each budget record is a department's spending envelope for a fiscal year and optional quarter.</div>
							<div class="pt-1 text-amber-300">remainingAmount = allocatedAmount − spentAmount. Negative values trigger overspend alerts.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">departments → user_profiles</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>headOfDepartment links to a user profile for approval routing and display on the department card.</div>
							<div class="pt-1 text-cyan-300">Team members are also linked many-to-many for department membership.</div>
						</div>
					</div>
				</div>
			</Card>

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

			<!-- Overview -->
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold">Sales System Overview</h2>
						<p class="text-sm text-muted-foreground mt-1">
							How franchise prospects move from first contact to a signed deal and an active franchise.
						</p>
					</div>
					<div class="p-4 bg-amber-950/40 border border-amber-700/50 rounded-lg text-sm text-amber-200">
						The Sales pipeline is a three-stage funnel: <code class="font-mono bg-black/30 px-1 rounded">franchise_leads</code> captures every inbound prospect and qualifies them on financial capacity and territory fit. Qualified leads convert to <code class="font-mono bg-black/30 px-1 rounded">franchise_opportunities</code>, which track the active deal through 8 pipeline stages. When an opportunity reaches <code class="font-mono bg-black/30 px-1 rounded">closed_won</code>, a <code class="font-mono bg-black/30 px-1 rounded">franchise_deal</code> is created automatically to manage the financial transaction — up to 5 payment milestones, sponsorship discounts, and commission tracking. Existing sponsors who express franchise interest are flagged and linked, giving reps full relationship context before the first call.
					</div>
				</div>
			</Card>

			<!-- Full funnel flow -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-6">Full Sales Funnel</h2>
				<div class="space-y-6">

					<!-- Lead status flow -->
					<div>
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lead Status</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'new', color: 'bg-slate-700/50 border-slate-600 text-slate-200', note: 'Just entered' },
								{ label: '→', color: '', note: '' },
								{ label: 'contacted', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200', note: 'Outreach made' },
								{ label: '→', color: '', note: '' },
								{ label: 'qualified', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'Financial & territory check passed' },
								{ label: '→', color: '', note: '' },
								{ label: 'converted', color: 'bg-violet-900/40 border-violet-700/50 text-violet-200', note: 'Opportunity created' },
								{ label: '|', color: '', note: '' },
								{ label: 'unqualified', color: 'bg-amber-900/40 border-amber-700/50 text-amber-200', note: 'Does not meet criteria' },
								{ label: '|', color: '', note: '' },
								{ label: 'lost', color: 'bg-red-900/40 border-red-700/50 text-red-200', note: 'No longer interested' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground text-center">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Opportunity stage flow -->
					<div class="border-t border-border pt-4">
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Opportunity Pipeline Stages</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'discovery', color: 'bg-slate-700/50 border-slate-600 text-slate-200', note: 'Initial call' },
								{ label: '→', color: '', note: '' },
								{ label: 'qualification', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200', note: 'Financial & territory check' },
								{ label: '→', color: '', note: '' },
								{ label: 'proposal', color: 'bg-cyan-900/40 border-cyan-700/50 text-cyan-200', note: 'Deck & term sheet sent' },
								{ label: '→', color: '', note: '' },
								{ label: 'negotiation', color: 'bg-amber-900/40 border-amber-700/50 text-amber-200', note: 'Price & terms' },
								{ label: '→', color: '', note: '' },
								{ label: 'due_diligence', color: 'bg-orange-900/40 border-orange-700/50 text-orange-200', note: 'Legal & financial review' },
								{ label: '→', color: '', note: '' },
								{ label: 'contract', color: 'bg-violet-900/40 border-violet-700/50 text-violet-200', note: 'Agreement drafted' },
								{ label: '→', color: '', note: '' },
								{ label: 'closed_won', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'Deal created' },
								{ label: '|', color: '', note: '' },
								{ label: 'closed_lost', color: 'bg-red-900/40 border-red-700/50 text-red-200', note: 'Fell through' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground text-center">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Deal status flow -->
					<div class="border-t border-border pt-4">
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Deal Status (after closed_won)</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'pending_signature', color: 'bg-slate-700/50 border-slate-600 text-slate-200', note: 'Awaiting contract sign' },
								{ label: '→', color: '', note: '' },
								{ label: 'signed', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200', note: 'Contract executed' },
								{ label: '→', color: '', note: '' },
								{ label: 'payment_pending', color: 'bg-amber-900/40 border-amber-700/50 text-amber-200', note: 'Awaiting first payment' },
								{ label: '→', color: '', note: '' },
								{ label: 'payment_in_progress', color: 'bg-orange-900/40 border-orange-700/50 text-orange-200', note: 'Milestones being collected' },
								{ label: '→', color: '', note: '' },
								{ label: 'payment_completed', color: 'bg-cyan-900/40 border-cyan-700/50 text-cyan-200', note: 'Fully paid' },
								{ label: '→', color: '', note: '' },
								{ label: 'onboarding', color: 'bg-violet-900/40 border-violet-700/50 text-violet-200', note: 'Franchise being set up' },
								{ label: '→', color: '', note: '' },
								{ label: 'active', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'Franchise record created' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground text-center">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</Card>

			<!-- Lead sources -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">Lead Sources</h2>
				<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
					{#each [
						{ source: 'website', color: 'bg-blue-900/40 border-blue-600/50 text-blue-200', desc: 'Inbound via the FLI Golf website contact or interest form.' },
						{ source: 'referral', color: 'bg-emerald-900/40 border-emerald-600/50 text-emerald-200', desc: 'Referred by an existing owner, sponsor, or partner.' },
						{ source: 'event', color: 'bg-violet-900/40 border-violet-600/50 text-violet-200', desc: 'Met at a tournament, activation, or industry event.' },
						{ source: 'cold_outreach', color: 'bg-amber-900/40 border-amber-600/50 text-amber-200', desc: 'Proactively contacted by the sales team.' },
						{ source: 'partner', color: 'bg-orange-900/40 border-orange-600/50 text-orange-200', desc: 'Introduced through a strategic partner or channel.' },
						{ source: 'social_media', color: 'bg-pink-900/40 border-pink-600/50 text-pink-200', desc: 'Came in through social media engagement or DMs.' },
						{ source: 'other', color: 'bg-slate-700/50 border-slate-500 text-slate-200', desc: 'Any channel not covered by the above.' }
					] as ls}
						<div class="p-3 rounded-lg border {ls.color}">
							<div class="font-mono font-bold text-xs mb-1">{ls.source}</div>
							<div class="text-[11px] opacity-80 leading-snug">{ls.desc}</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Collections map -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">How Sales Collections Connect</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">franchise_leads → franchise_opportunities</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One-to-one. When a lead is qualified and ready to advance, a franchise_opportunity is created and linked. Lead status moves to <code class="font-mono bg-black/20 px-0.5 rounded">converted</code>.</div>
							<div class="pt-1 text-amber-300">The full qualification history (netWorth, liquidCapital, territory) is preserved on the lead record.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">franchise_opportunities → franchise_deals</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One-to-one. Moving an opportunity to <code class="font-mono bg-black/20 px-0.5 rounded">closed_won</code> automatically creates a franchise_deal with the negotiated value and payment structure.</div>
							<div class="pt-1 text-emerald-300">The opportunity's probability and dealValue feed directly into the deal's financial fields.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">franchise_deals → franchises</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One-to-one. When a deal reaches <code class="font-mono bg-black/20 px-0.5 rounded">active</code> status (all milestones paid, onboarding complete), a franchise record is created and linked back.</div>
							<div class="pt-1 text-violet-300">This is the moment a prospect becomes an owner with dashboard access.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">franchise_leads → sponsors</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Many-to-one. When <code class="font-mono bg-black/20 px-0.5 rounded">isExistingSponsor</code> is true, sponsorId links to the sponsor record so reps see the full relationship history before the first call.</div>
							<div class="pt-1 text-blue-300">Prior sponsor payments can earn a sponsorshipDiscount on the franchise purchase price.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">user_profiles → pipeline</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Sales reps are the foreign key on leads (assignedTo), opportunities (assignedTo), and deals (closedBy). Querying all three by rep ID gives a complete pipeline and revenue view.</div>
							<div class="pt-1 text-pink-300">commissionAmount and commissionPaid on the deal record track rep earnings per closed deal.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">paymentMilestones (on deal)</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Up to 5 milestone objects stored as JSON on the deal record. Each has amountDue, dueDate, amountPaid, paidDate, and status (pending / partial / paid / overdue).</div>
							<div class="pt-1 text-amber-300">outstandingBalance = netFranchiseValue − totalPaidToDate. Reaches zero when fully paid.</div>
						</div>
					</div>
				</div>
			</Card>

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

			<!-- Overview -->
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold">League System Overview</h2>
						<p class="text-sm text-muted-foreground mt-1">
							How the league, franchises, talent, tournaments, and payments all connect.
						</p>
					</div>
					<div class="p-4 bg-violet-950/40 border border-violet-700/50 rounded-lg text-sm text-violet-200">
						The league is the root of all competition data. One season = one league record. Everything else — franchises, rosters, tournaments, results, and payments — is a child of that record. The prize budget lives on the league and flows down automatically; you never set prize money on individual tournaments.
					</div>
				</div>
			</Card>

			<!-- Entity hierarchy -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-6">Entity Hierarchy</h2>
				<div class="space-y-3">
					{#each [
						{ label: 'league',              dot: 'bg-violet-400', color: 'bg-violet-900/40 border-violet-700/50 text-violet-200',   indent: 0, note: '1 record per season. Holds totalPrizePool.' },
						{ label: 'franchises',          dot: 'bg-emerald-400', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', indent: 1, note: 'Up to 6 teams per season. Each owns a territory.' },
						{ label: 'talent',              dot: 'bg-cyan-400',    color: 'bg-cyan-900/40 border-cyan-700/50 text-cyan-200',          indent: 2, note: 'Players, broadcasters, commentators, analysts.' },
						{ label: 'tournaments',         dot: 'bg-amber-400',   color: 'bg-amber-900/40 border-amber-700/50 text-amber-200',       indent: 1, note: '6 per season. Prize pool auto-calculated.' },
						{ label: 'tournament_results',  dot: 'bg-orange-400',  color: 'bg-orange-900/40 border-orange-700/50 text-orange-200',    indent: 2, note: '1 per pro per division. Placement drives earnings.' },
						{ label: 'pro_payments',        dot: 'bg-pink-400',    color: 'bg-pink-900/40 border-pink-700/50 text-pink-200',          indent: 2, note: 'Every dollar paid to talent — prize, salary, bonus.' }
					] as row}
						<div class="flex items-start gap-3" style="padding-left: {row.indent * 2}rem">
							<div class="w-2 h-2 rounded-full mt-2 shrink-0 {row.dot}"></div>
							<div class="flex-1 p-3 rounded-lg border {row.color}">
								<div class="font-mono font-bold text-sm">{row.label}</div>
								<div class="text-xs opacity-80 mt-0.5">{row.note}</div>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Season → Tournament prize flow -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">Season → Tournament Prize Flow</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-semibold text-slate-100 mb-2">1. Set the season budget</div>
						<div class="text-slate-400">Set <code class="font-mono text-violet-300">totalPrizePool</code> on the league record (e.g. $4,000,000). That's the only number you touch.</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-semibold text-slate-100 mb-2">2. Automatic distribution</div>
						<div class="text-slate-400"><code class="font-mono text-amber-300">calculateSeasonPurses()</code> splits the budget across 6 tournaments using arithmetic progression. T#6 is worth the most.</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-semibold text-slate-100 mb-2">3. Per-division payouts</div>
						<div class="text-slate-400">Each tournament purse is split 50/50 between Men's and Women's. <code class="font-mono text-cyan-300">calculatePlacementPayouts()</code> assigns amounts to placements 1–20.</div>
					</div>
				</div>
			</Card>

			<!-- Talent types -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">Talent Types</h2>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
					{#each [
						{ type: 'player', color: 'bg-cyan-900/40 border-cyan-700/50 text-cyan-200', desc: 'Competes in tournaments. Earns prize money based on placement. Rostered to a franchise.' },
						{ type: 'broadcaster', color: 'bg-violet-900/40 border-violet-700/50 text-violet-200', desc: 'On-air talent for live coverage. Paid via pro_payments (salary or appearance fee). Not in tournament_results.' },
						{ type: 'commentator', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', desc: 'Play-by-play or colour commentary. Same payment model as broadcaster.' },
						{ type: 'analyst', color: 'bg-amber-900/40 border-amber-700/50 text-amber-200', desc: 'Statistical or strategic analysis on-air. May also be a former player.' }
					] as t}
						<div class="p-3 rounded-lg border {t.color}">
							<div class="font-mono font-bold text-sm mb-1">{t.type}</div>
							<div class="text-[11px] opacity-80 leading-snug">{t.desc}</div>
						</div>
					{/each}
				</div>
				<p class="text-xs text-muted-foreground mt-3">A single talent record can hold multiple types — e.g. a retired player who now does commentary.</p>
			</Card>

			<!-- Collections map -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">How the Collections Connect</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">league → tournaments</div>
						<div class="text-xs text-slate-400">The league's <code class="text-violet-300">totalPrizePool</code> is the input to PayoutCalculator. Each tournament gets a computed <code class="text-amber-300">prizePool</code> — never set manually.</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">franchises → talent</div>
						<div class="text-xs text-slate-400">Many-to-many. A pro can be on one franchise per season. The franchise record links to the deal that created it and the owner who manages it.</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">tournament_results → pro_payments</div>
						<div class="text-xs text-slate-400">When a result is entered, a <code class="text-pink-300">pro_payments</code> record is created automatically with <code class="text-pink-300">paymentType = "Prize"</code> and the computed earnings amount.</div>
					</div>
				</div>
			</Card>

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

	{#if activeTab === 'prize-money'}
		<div class="space-y-6">

			<!-- Overview -->
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold">Season Prize Money Model</h2>
						<p class="text-sm text-muted-foreground mt-1">
							How a single season budget flows from the league down to every pro.
						</p>
					</div>
					<div class="p-4 bg-amber-950/40 border border-amber-700/50 rounded-lg text-sm text-amber-200 space-y-2">
						<p><strong>Key principle:</strong> Prize money is never entered per-tournament manually. A season budget (e.g. $4 M for 2027) is set once in <code class="font-mono bg-black/30 px-1 rounded">PayoutCalculator.ts</code> as a <code class="font-mono bg-black/30 px-1 rounded">SeasonConfig</code>. The calculator distributes it across tournaments using arithmetic progression, then splits each tournament purse 50/50 between Men's and Women's divisions, then distributes each division purse across 20 placements.</p>
					</div>
				</div>
			</Card>

			<!-- Money flow diagram -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-6">Prize Money Flow</h2>
				<div class="space-y-6">

					<!-- Row 1: Season budget -->
					<div class="flex justify-center">
						<div class="px-8 py-4 bg-yellow-600 text-white rounded-xl border-2 border-yellow-500 shadow-lg text-center">
							<div class="text-xs uppercase tracking-wide text-yellow-200 mb-1">SeasonConfig</div>
							<div class="font-mono font-bold text-lg">totalSeasonBudget</div>
							<div class="text-sm text-yellow-100 mt-1">e.g. $4,000,000 for 2027</div>
						</div>
					</div>

					<div class="flex justify-center text-slate-400 text-2xl">↓ <span class="text-xs self-center ml-2">calculateSeasonPurses() — arithmetic progression</span></div>

					<!-- Row 2: Per-tournament purses -->
					<div>
						<div class="text-xs text-muted-foreground uppercase tracking-wide mb-3 text-center">6 tournaments — later = larger</div>
						<div class="grid grid-cols-6 gap-2">
							{#each [
								{ n: 1, pct: '12.5%', ex: '$500K' },
								{ n: 2, pct: '14.2%', ex: '$567K' },
								{ n: 3, pct: '15.8%', ex: '$633K' },
								{ n: 4, pct: '17.5%', ex: '$700K' },
								{ n: 5, pct: '19.2%', ex: '$767K' },
								{ n: 6, pct: '20.8%', ex: '$833K' }
							] as t}
								<div class="p-3 bg-amber-900/40 border border-amber-700/50 rounded-lg text-center">
									<div class="text-xs text-amber-300 font-semibold">T#{t.n}</div>
									<div class="font-mono font-bold text-sm text-white mt-1">{t.ex}</div>
									<div class="text-xs text-amber-400">{t.pct}</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="flex justify-center text-slate-400 text-2xl">↓ <span class="text-xs self-center ml-2">split 50/50 → Men's purse + Women's purse</span></div>

					<!-- Row 3: Division split -->
					<div class="grid grid-cols-2 gap-4">
						<div class="p-4 bg-cyan-900/40 border border-cyan-700/50 rounded-lg text-center">
							<div class="text-xs text-cyan-300 uppercase tracking-wide mb-1">Men's Purse (50%)</div>
							<div class="font-mono font-bold text-white">mensPurse</div>
							<div class="text-xs text-cyan-200 mt-2">e.g. T#1 → $250,000</div>
						</div>
						<div class="p-4 bg-pink-900/40 border border-pink-700/50 rounded-lg text-center">
							<div class="text-xs text-pink-300 uppercase tracking-wide mb-1">Women's Purse (50%)</div>
							<div class="font-mono font-bold text-white">womensPurse</div>
							<div class="text-xs text-pink-200 mt-2">e.g. T#1 → $250,000</div>
						</div>
					</div>

					<div class="flex justify-center text-slate-400 text-2xl">↓ <span class="text-xs self-center ml-2">calculatePlacementPayouts() — top-heavy decay</span></div>

					<!-- Row 4: Placement distribution -->
					<div>
						<div class="text-xs text-muted-foreground uppercase tracking-wide mb-3 text-center">20 paid placements per division — same schedule for Men's and Women's</div>
						<div class="grid grid-cols-4 gap-2 text-xs">
							{#each [
								{ place: '1st', pct: '30%', note: 'top-heavy' },
								{ place: '2nd', pct: '20%', note: '' },
								{ place: '3rd', pct: '15%', note: '' },
								{ place: '4th–20th', pct: '35%', note: 'exponential decay (×0.85 per place)' }
							] as row}
								<div class="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
									<div class="font-semibold text-slate-200">{row.place}</div>
									<div class="text-emerald-300 font-mono font-bold">{row.pct}</div>
									{#if row.note}<div class="text-slate-400 mt-1">{row.note}</div>{/if}
								</div>
							{/each}
						</div>
					</div>

					<div class="flex justify-center text-slate-400 text-2xl">↓ <span class="text-xs self-center ml-2">written to DB when a result is added</span></div>

					<!-- Row 5: DB records -->
					<div class="grid grid-cols-2 gap-4">
						<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
							<div class="font-mono font-bold text-slate-200 mb-2">tournament_results</div>
							<div class="space-y-1 text-xs text-slate-400">
								<div><code class="text-emerald-300">earnings</code> — pro's placement payout</div>
								<div><code class="text-slate-300">division</code> — mens / womens</div>
								<div><code class="text-slate-300">placement</code> — 1–20</div>
								<div><code class="text-slate-300">score</code> — final score</div>
								<div><code class="text-slate-300">rounds</code> — rounds played</div>
							</div>
						</div>
						<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
							<div class="font-mono font-bold text-slate-200 mb-2">pro_payments</div>
							<div class="space-y-1 text-xs text-slate-400">
								<div><code class="text-emerald-300">amount</code> — payment amount</div>
								<div><code class="text-cyan-300">paymentType</code> — Prize, Salary, Bonus…</div>
								<div><code class="text-pink-300">paymentDate</code> — date paid</div>
								<div><code class="text-slate-300">pro</code> — relation to talent</div>
								<div><code class="text-yellow-300">status</code> — pending / paid</div>
							</div>
						</div>
					</div>
				</div>
			</Card>

			<!-- SeasonConfig reference -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">SeasonConfig — Where to Set the Budget</h2>
				<p class="text-sm text-muted-foreground mb-4">
					Defined in <code class="font-mono bg-muted px-1 rounded">src/lib/domain/services/PayoutCalculator.ts</code>. Add a new config object for each season.
				</p>
				<div class="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
					<pre class="text-slate-300">{`export const SEASON_2027_CONFIG: SeasonConfig = {
  year: 2027,
  totalSeasonBudget: 4_000_000,   // ← change this to adjust the whole season
  numberOfTournaments: 6,
  numberOfPlacements: 20          // paid placements per division (each division)
};`}</pre>
				</div>
				<div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
					<div class="p-3 bg-muted/30 rounded-lg border">
						<div class="font-semibold mb-1">totalSeasonBudget</div>
						<div class="text-muted-foreground">The only number you need to change to rescale all 6 tournament purses. Everything else is derived.</div>
					</div>
					<div class="p-3 bg-muted/30 rounded-lg border">
						<div class="font-semibold mb-1">numberOfPlacements</div>
						<div class="text-muted-foreground">Every placement from 1 to this number receives a cheque. Positions beyond this get $0.</div>
					</div>
				</div>
			</Card>

			<!-- Where it shows in the UI -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">Where This Appears in the UI</h2>
				<div class="space-y-3">
					{#each [
						{
							route: '/dashboard/talent/tournaments?season=2027',
							label: 'Tournaments list — Season Budget panel',
							desc: 'Shows total season budget, Men\'s total, Women\'s total, and a 6-card progressive distribution grid. Each card shows the tournament purse split 50/50 between Men\'s and Women\'s.'
						},
						{
							route: '/dashboard/talent/tournaments/[id]',
							label: 'Tournament detail — Payout Structure table',
							desc: 'Full 20-row table: Place and Earnings. Every placement from 1–20 has a defined payout so pros can see their cheque before results are entered.'
						},
						{
							route: '/dashboard/talent/tournaments/[id]',
							label: 'Tournament detail — Results tabs',
							desc: 'Once results are added, each row shows the pro\'s earnings for their placement alongside their division purse total.'
						},
						{
							route: '/dashboard/talent/payments',
							label: 'Pro Payments page',
							desc: 'Individual payment records for pros. Tracks salary, bonuses, prize payouts, and appearance fees.'
						}
					] as item}
						<div class="flex gap-4 p-3 bg-muted/30 rounded-lg border">
							<div class="flex-1">
								<div class="font-semibold text-sm">{item.label}</div>
								<div class="text-xs text-muted-foreground mt-1">{item.desc}</div>
							</div>
							<div class="shrink-0">
								<a href={item.route} class="text-xs font-mono text-blue-400 hover:underline">{item.route}</a>
							</div>
						</div>
					{/each}
				</div>
			</Card>

		</div>
	{/if}

	{#if activeTab === 'sponsors'}
		<div class="space-y-6">

			<!-- Overview -->
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold">Sponsor System Overview</h2>
						<p class="text-sm text-muted-foreground mt-1">
							How companies become sponsors, pay their commitments, and optionally convert into franchise owners.
						</p>
					</div>
					<div class="p-4 bg-emerald-950/40 border border-emerald-700/50 rounded-lg text-sm text-emerald-200">
						Sponsors are the primary revenue source outside of franchise fees. A single sponsor record can simultaneously represent a league-level partner, a franchise-level backer (via the bridge table), and a prospect for franchise ownership — all tracked in one place.
					</div>
				</div>
			</Card>

			<!-- Sponsor lifecycle -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-6">Sponsor Lifecycle</h2>
				<div class="space-y-4">
					<!-- Status flow -->
					<div>
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Status Progression</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'Prospect', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200', note: 'In conversation' },
								{ label: '→', color: '', note: '' },
								{ label: 'Active', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'Contract signed, paying' },
								{ label: '→', color: '', note: '' },
								{ label: 'Inactive', color: 'bg-slate-700/50 border-slate-600 text-slate-300', note: 'Lapsed or paused' },
								{ label: '→', color: '', note: '' },
								{ label: 'Cancelled', color: 'bg-red-900/40 border-red-700/50 text-red-300', note: 'Terminated early' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Franchise conversion path -->
					<div class="border-t border-border pt-4">
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Franchise Conversion Path</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'Active Sponsor', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'franchiseInterest = false' },
								{ label: '→', color: '', note: '' },
								{ label: 'Interested', color: 'bg-yellow-900/40 border-yellow-700/50 text-yellow-200', note: 'franchiseInterest = true' },
								{ label: '→', color: '', note: '' },
								{ label: 'Deal Created', color: 'bg-violet-900/40 border-violet-700/50 text-violet-200', note: 'franchiseDealId set' },
								{ label: '→', color: '', note: '' },
								{ label: 'Franchise Owner', color: 'bg-amber-900/40 border-amber-700/50 text-amber-200', note: 'franchiseConversionDate set' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground text-center">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</Card>

			<!-- Tier breakdown -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">Sponsorship Tiers</h2>
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
					{#each [
						{ tier: 'Title', color: 'bg-yellow-900/40 border-yellow-600/50 text-yellow-200', desc: 'Naming rights. "FLI Golf presented by X." Highest visibility across all broadcasts, events, and digital.' },
						{ tier: 'Platinum', color: 'bg-slate-700/60 border-slate-500 text-slate-100', desc: 'Premium placement. Logo on all league materials, broadcast lower-thirds, and tournament signage.' },
						{ tier: 'Gold', color: 'bg-amber-900/40 border-amber-600/50 text-amber-200', desc: 'Major placement. Tournament signage, digital ads, and select broadcast mentions.' },
						{ tier: 'Silver', color: 'bg-gray-700/50 border-gray-500 text-gray-200', desc: 'Standard placement. Event signage and digital presence.' },
						{ tier: 'Bronze', color: 'bg-orange-900/40 border-orange-700/50 text-orange-200', desc: 'Entry-level. Website listing and select event presence.' },
						{ tier: 'Community', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', desc: 'Local/grassroots partners. Minimal commitment, local activation only.' }
					] as t}
						<div class="p-3 rounded-lg border {t.color}">
							<div class="font-bold text-sm mb-1">{t.tier}</div>
							<div class="text-[11px] opacity-80 leading-snug">{t.desc}</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Collections map -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">How the Collections Connect</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">sponsors</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One record per company.</div>
							<div>Tracks the relationship, contract terms, and total financials.</div>
							<div class="pt-1 text-emerald-300">annualCommitment − totalPaid = balance due</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">sponsor_franchise_bridge</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One record per sponsor ↔ franchise pairing.</div>
							<div>Holds the level and amount specific to that team relationship.</div>
							<div class="pt-1 text-violet-300">A league sponsor can also be a franchise title sponsor at a different rate.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">sponsor_payments</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One record per payment instalment.</div>
							<div>Sum of paid records = totalPaid on the sponsor.</div>
							<div class="pt-1 text-cyan-300">Supports quarterly, monthly, or upfront payment schedules.</div>
						</div>
					</div>
				</div>
			</Card>

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

			<!-- Overview -->
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold">Franchise System Overview</h2>
						<p class="text-sm text-muted-foreground mt-1">
							How a territory becomes a team, and how that team is managed, branded, and connected to the rest of the league.
						</p>
					</div>
					<div class="p-4 bg-amber-950/40 border border-amber-700/50 rounded-lg text-sm text-amber-200">
						A franchise is never created manually — it is the end result of a completed sales pipeline. A territory is identified, a lead qualifies, an opportunity closes, a deal is signed and paid, and only then does a franchise record appear. The franchise is the operational entity: it holds the roster, the brand assets, the sponsor relationships, and the tournament results. The deal is the financial record; the franchise is what the owner actually runs.
					</div>
				</div>
			</Card>

			<!-- Franchise lifecycle -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-6">Franchise Lifecycle</h2>
				<div class="space-y-4">
					<!-- Territory to franchise flow -->
					<div>
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">From Territory to Active Team</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'Territory', color: 'bg-slate-700/50 border-slate-600 text-slate-200', note: 'Available market' },
								{ label: '→', color: '', note: '' },
								{ label: 'Reserved', color: 'bg-yellow-900/40 border-yellow-700/50 text-yellow-200', note: 'Held for prospect' },
								{ label: '→', color: '', note: '' },
								{ label: 'Deal Signed', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200', note: 'franchise_deal created' },
								{ label: '→', color: '', note: '' },
								{ label: 'Paid', color: 'bg-violet-900/40 border-violet-700/50 text-violet-200', note: 'Milestones complete' },
								{ label: '→', color: '', note: '' },
								{ label: 'Active Franchise', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'Franchise record created' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground text-center">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Franchise status -->
					<div class="border-t border-border pt-4">
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Franchise Status</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'Pending', color: 'bg-yellow-900/40 border-yellow-700/50 text-yellow-200', note: 'Deal signed, onboarding in progress' },
								{ label: '→', color: '', note: '' },
								{ label: 'Active', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'Competing in current season' },
								{ label: '→', color: '', note: '' },
								{ label: 'Suspended', color: 'bg-orange-900/40 border-orange-700/50 text-orange-200', note: 'Temporarily removed from competition' },
								{ label: '→', color: '', note: '' },
								{ label: 'Inactive', color: 'bg-slate-700/50 border-slate-600 text-slate-300', note: 'Sold or permanently removed' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground text-center">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</Card>

			<!-- Logo variants -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">Brand Asset Variants</h2>
				<p class="text-sm text-muted-foreground mb-4">Each franchise stores six logo variants as separate file fields. All six are used across different surfaces — never substitute one for another.</p>
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
					{#each [
						{ field: 'logoFull', label: 'Full', color: 'bg-amber-900/40 border-amber-600/50 text-amber-200', desc: 'Primary brand mark. Used on the franchise detail page, printed materials, and large digital placements.' },
						{ field: 'logoMini', label: 'Mini', color: 'bg-blue-900/40 border-blue-600/50 text-blue-200', desc: 'Icon or badge. Used in list cards, standings tables, and anywhere a small square format is needed.' },
						{ field: 'logoHorizontal', label: 'Horizontal', color: 'bg-violet-900/40 border-violet-600/50 text-violet-200', desc: 'Wide layout. Used in broadcast lower-thirds, website headers, and sponsor decks.' },
						{ field: 'logoVertical', label: 'Vertical', color: 'bg-emerald-900/40 border-emerald-600/50 text-emerald-200', desc: 'Stacked layout. Used on posters, banners, and portrait-format placements.' },
						{ field: 'logoMonochrome', label: 'Monochrome', color: 'bg-slate-700/60 border-slate-500 text-slate-100', desc: 'Single color. Used on merchandise, embroidery, and placements where full color is unavailable.' },
						{ field: 'logoWordmark', label: 'Wordmark', color: 'bg-pink-900/40 border-pink-600/50 text-pink-200', desc: 'Text-only. Used in co-branding with sponsors and contexts where the icon alone is not recognizable.' }
					] as v}
						<div class="p-3 rounded-lg border {v.color}">
							<div class="font-bold text-sm mb-1 font-mono">{v.field}</div>
							<div class="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">{v.label}</div>
							<div class="text-[11px] opacity-80 leading-snug">{v.desc}</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Collections map -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">How the Collections Connect</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">franchise_territories</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One record per market. Controls availability (available → reserved → sold → unavailable).</div>
							<div>When sold, <code class="text-amber-300">dealId</code> links to the purchase deal.</div>
							<div class="pt-1 text-amber-300">reservedUntil auto-reverts to available if no deal is signed.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">franchises</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Created automatically when a franchise_deal reaches "active".</div>
							<div>Holds the roster, brand assets, sponsor links, and tournament results.</div>
							<div class="pt-1 text-emerald-300">primaryColor + secondaryColor drive the gradient header.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">franchise_owners</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Public-facing owner profile — bio, photo, contact.</div>
							<div>Separate from <code class="text-blue-300">user_profiles</code> so the public profile can be updated without touching login credentials.</div>
							<div class="pt-1 text-violet-300">userId links to the auth record; franchiseId links to the team.</div>
						</div>
					</div>
				</div>
			</Card>

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
												<div class="flex items-start gap-3 p-3 rounded-lg border bg-amber-900/30 text-white">
													<Badge variant="default" class="text-xs shrink-0">
														{rel.type}
													</Badge>
													<div class="flex-1 min-w-0">
														<div class="font-mono text-sm font-medium text-white">
															{collection.collection} → {rel.to}
														</div>
														<div class="text-sm text-amber-100">{rel.description}</div>
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
								<div class="relative p-8 bg-muted/30 rounded-lg">
									<div class="flex justify-center mb-8">
										<div class="px-6 py-4 bg-amber-600 text-white rounded-lg border-2 border-amber-700 shadow-lg">
											<div class="font-mono font-bold text-lg">{collection.collection}</div>
											<div class="text-xs text-amber-100 mt-1">{collection.fields.length} fields</div>
										</div>
									</div>
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
													<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-0.5 h-8 bg-amber-400"></div>
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

		</div>
	{/if}
	{#if activeTab === 'pros'}
		<div class="space-y-6">

			<!-- Overview -->
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold">Talent System Overview</h2>
						<p class="text-sm text-muted-foreground mt-1">
							How players, managers, and broadcasters are onboarded, contracted, rostered, compete, and get paid.
						</p>
					</div>
					<div class="p-4 bg-cyan-950/40 border border-cyan-700/50 rounded-lg text-sm text-cyan-200">
						The <code class="font-mono bg-black/30 px-1 rounded">talent</code> collection covers everyone contracted to FLI Golf — not just players. A single record can hold multiple types (e.g. a player who also does commentary). Only talent with <code class="font-mono bg-black/30 px-1 rounded">talentType = player</code> appear in tournament standings and earn placement-based prize money. All talent types receive payments via <code class="font-mono bg-black/30 px-1 rounded">pro_payments</code>. Prize payments are created automatically when tournament results are entered — no manual entry needed.
					</div>

					<!-- Role → onboarding flow summary -->
					<div class="p-4 bg-emerald-950/40 border border-emerald-700/50 rounded-lg text-sm text-emerald-200 space-y-2">
						<div class="font-semibold text-emerald-100">Onboarding Flow (Pros, Managers, Broadcasters)</div>
						<div>When a user with role <code class="font-mono bg-black/30 px-1 rounded">pro</code>, <code class="font-mono bg-black/30 px-1 rounded">manager</code>, or <code class="font-mono bg-black/30 px-1 rounded">broadcaster</code> signs in, they are routed through a dedicated onboarding sequence before reaching the main dashboard. The sequence is tracked in <code class="font-mono bg-black/30 px-1 rounded">onboarding_status</code> and consists of four steps:</div>
						<ol class="list-decimal list-inside space-y-1 pl-1 opacity-90">
							<li><span class="font-semibold">Welcome</span> — league overview, format, benefits, and expectations at <code class="font-mono bg-black/30 px-1 rounded">/dashboard/welcome</code>.</li>
							<li><span class="font-semibold">Documents</span> — four documents initialed + one contract with full drawn signature at <code class="font-mono bg-black/30 px-1 rounded">/dashboard/onboarding</code>. Each signature is stored in <code class="font-mono bg-black/30 px-1 rounded">document_signatures</code>.</li>
							<li><span class="font-semibold">Player Profile</span> — 7-section questionnaire (personal info, competitive background, branding, sponsorship, management, integrity, additional) at <code class="font-mono bg-black/30 px-1 rounded">/dashboard/player-profile</code>. Stored in <code class="font-mono bg-black/30 px-1 rounded">player_profiles</code>.</li>
							<li><span class="font-semibold">Complete</span> — all steps done; user proceeds to their role-specific dashboard.</li>
						</ol>
					</div>
				</div>
			</Card>

			<!-- Roles that use the onboarding flow -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-1">Onboarding Roles</h2>
				<p class="text-sm text-muted-foreground mb-4">These three <code class="font-mono">user_profiles.role</code> values trigger the onboarding flow on login and have access to the My Onboarding sidebar group.</p>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					{#each [
						{
							role: 'pro',
							color: 'bg-cyan-900/40 border-cyan-600/50 text-cyan-200',
							badge: 'bg-cyan-800/60 text-cyan-100',
							desc: 'A competing player. Appears in tournament standings and earns placement-based prize money. Rostered to a franchise. Must complete all onboarding documents and the full player profile.',
							access: ['tournament_results (read own)', 'pro_payments (read own)', 'player_profiles (own)', 'document_signatures (own)']
						},
						{
							role: 'manager',
							color: 'bg-amber-900/40 border-amber-600/50 text-amber-200',
							badge: 'bg-amber-800/60 text-amber-100',
							desc: 'Represents one or more pros. Linked to talent records via pro_access with accessType = manager. Can view and manage their clients\' profiles, payments, and contracts. Must complete onboarding documents.',
							access: ['talent (read managed)', 'pro_payments (read managed)', 'pro_access (own)', 'document_signatures (own)']
						},
						{
							role: 'broadcaster',
							color: 'bg-violet-900/40 border-violet-600/50 text-violet-200',
							badge: 'bg-violet-800/60 text-violet-100',
							desc: 'On-air talent covering events. Paid via pro_payments (salary or appearance fee). Does not appear in tournament_results. Linked to talent records via pro_access with accessType = broadcaster. Must complete onboarding documents.',
							access: ['tournaments (read)', 'talent (read)', 'pro_payments (read own)', 'document_signatures (own)']
						}
					] as r}
						<div class="p-4 rounded-lg border {r.color} space-y-2">
							<div class="flex items-center gap-2">
								<span class="font-mono font-bold text-sm">{r.role}</span>
								<span class="text-[10px] px-1.5 py-0.5 rounded font-semibold {r.badge}">onboarding required</span>
							</div>
							<div class="text-[11px] opacity-80 leading-snug">{r.desc}</div>
							<div class="pt-1 border-t border-white/10">
								<div class="text-[10px] font-semibold opacity-60 uppercase tracking-wide mb-1">Key access</div>
								{#each r.access as a}
									<div class="text-[10px] font-mono opacity-70">• {a}</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Talent types -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-1">Talent Types</h2>
				<p class="text-sm text-muted-foreground mb-4">The <code class="font-mono">talentType</code> field on a <code class="font-mono">talent</code> record is separate from the user account role. A broadcaster user account can be linked to a talent record with <code class="font-mono">talentType = broadcaster</code>.</p>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
					{#each [
						{ type: 'player', color: 'bg-cyan-900/40 border-cyan-600/50 text-cyan-200', desc: 'Competes in tournaments. Appears in standings. Earns placement-based prize money from the division purse. Rostered to a franchise.' },
						{ type: 'broadcaster', color: 'bg-violet-900/40 border-violet-600/50 text-violet-200', desc: 'Covers events on-air. Paid via pro_payments (salary or appearance fee). Does not appear in tournament results.' },
						{ type: 'commentator', color: 'bg-blue-900/40 border-blue-600/50 text-blue-200', desc: 'Provides live commentary during broadcasts. Paid via pro_payments. Does not appear in tournament results.' },
						{ type: 'analyst', color: 'bg-slate-700/60 border-slate-500 text-slate-100', desc: 'Provides expert analysis and breakdown content. Paid via pro_payments. Does not appear in tournament results.' }
					] as t}
						<div class="p-3 rounded-lg border {t.color}">
							<div class="font-mono font-bold text-sm mb-1">{t.type}</div>
							<div class="text-[11px] opacity-80 leading-snug">{t.desc}</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Payment flow -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-6">Payment Flow</h2>
				<div class="space-y-4">
					<!-- Prize money path -->
					<div>
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Prize Money (Auto-Generated)</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'Tournament Completes', color: 'bg-slate-700/50 border-slate-600 text-slate-200', note: 'Results entered by admin' },
								{ label: '→', color: '', note: '' },
								{ label: 'tournament_results', color: 'bg-cyan-900/40 border-cyan-700/50 text-cyan-200', note: 'placement → earnings calculated' },
								{ label: '→', color: '', note: '' },
								{ label: 'pro_payments', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'Prize record auto-created' },
								{ label: '→', color: '', note: '' },
								{ label: 'Paid', color: 'bg-violet-900/40 border-violet-700/50 text-violet-200', note: 'status = paid' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground text-center">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Manual payment types -->
					<div class="border-t border-border pt-4">
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Manual Payment Types</h3>
						<div class="flex flex-wrap gap-2">
							{#each [
								{ label: 'Salary', note: 'Contracted base pay', color: 'bg-blue-900/40 border-blue-700/50 text-blue-200' },
								{ label: 'Bonus', note: 'Performance or signing', color: 'bg-amber-900/40 border-amber-700/50 text-amber-200' },
								{ label: 'Appearance Fee', note: 'Non-tournament events', color: 'bg-pink-900/40 border-pink-700/50 text-pink-200' }
							] as p}
								<div class="flex flex-col items-center gap-1">
									<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold {p.color}">{p.label}</div>
									<div class="text-[10px] text-muted-foreground">{p.note}</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</Card>

			<!-- Collections map -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">How the Collections Connect</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">talent</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One record per person. Holds the full profile, contract, travel info, and social links.</div>
							<div><code class="text-cyan-300">talentType</code> determines which views and payment flows apply.</div>
							<div class="pt-1 text-cyan-300">userId links to a user account for self-service access.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">tournament_results</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One record per player per tournament division.</div>
							<div><code class="text-emerald-300">placement</code> drives all earnings. 1st = 30%, 2nd = 20%, 3rd = 15%, 4th–20th decay at ×0.85.</div>
							<div class="pt-1 text-violet-300">Saving a result auto-creates a pro_payments prize record.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">pro_payments</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One record per payment. Prize records are auto-generated; salary, bonus, and appearance fees are manual.</div>
							<div class="pt-1 text-pink-300">Sum of all paid records = talent's total season earnings.</div>
						</div>
					</div>
				</div>
			</Card>


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
												<div class="flex items-start gap-3 p-3 rounded-lg border bg-cyan-900/30 text-white">
													<Badge variant="default" class="text-xs shrink-0">
														{rel.type}
													</Badge>
													<div class="flex-1 min-w-0">
														<div class="font-mono text-sm font-medium text-white">
															{collection.collection} → {rel.to}
														</div>
														<div class="text-sm text-cyan-100">{rel.description}</div>
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
								<div class="relative p-8 bg-muted/30 rounded-lg">
									<div class="flex justify-center mb-8">
										<div class="px-6 py-4 bg-cyan-600 text-white rounded-lg border-2 border-cyan-700 shadow-lg">
											<div class="font-mono font-bold text-lg">{collection.collection}</div>
											<div class="text-xs text-cyan-100 mt-1">{collection.fields.length} fields</div>
										</div>
									</div>
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
													<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-0.5 h-8 bg-cyan-400"></div>
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

		</div>
	{/if}
	{#if activeTab === 'vendors'}
		<div class="space-y-6">

			<!-- Overview -->
			<Card class="p-6">
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold">Vendor System Overview</h2>
						<p class="text-sm text-muted-foreground mt-1">
							How external partners are tracked, engaged on projects, and paid through expenses.
						</p>
					</div>
					<div class="p-4 bg-orange-950/40 border border-orange-700/50 rounded-lg text-sm text-orange-200">
						Vendors sit at the intersection of Operations and Finance. A vendor is linked to one or more <code class="font-mono bg-black/30 px-1 rounded">projects</code> (many-to-many) and referenced on individual <code class="font-mono bg-black/30 px-1 rounded">expenses</code> as the payee. This means you can see every dollar paid to a vendor across all projects in one place. The <code class="font-mono bg-black/30 px-1 rounded">open_invoices_total</code> field gives a live outstanding balance without querying individual expense records.
					</div>
				</div>
			</Card>

			<!-- Vendor types -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">Vendor Types</h2>
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
					{#each [
						{ type: 'venue', color: 'bg-orange-900/40 border-orange-600/50 text-orange-200', desc: 'Event spaces, disc golf courses, and facilities used for tournaments and activations.' },
						{ type: 'product_supplier', color: 'bg-amber-900/40 border-amber-600/50 text-amber-200', desc: 'Equipment, merchandise, discs, apparel, and physical goods supplied to FLI Golf.' },
						{ type: 'beverage', color: 'bg-emerald-900/40 border-emerald-600/50 text-emerald-200', desc: 'Food and beverage partners for events and activations.' },
						{ type: 'technology', color: 'bg-blue-900/40 border-blue-600/50 text-blue-200', desc: 'Software, hardware, streaming infrastructure, and tech services.' },
						{ type: 'gaming', color: 'bg-violet-900/40 border-violet-600/50 text-violet-200', desc: 'Disc golf gaming, simulation, and interactive fan experience providers.' },
						{ type: 'service_provider', color: 'bg-slate-700/60 border-slate-500 text-slate-100', desc: 'General services — legal, logistics, staffing, production, and anything not covered by other types.' }
					] as v}
						<div class="p-3 rounded-lg border {v.color}">
							<div class="font-mono font-bold text-sm mb-1">{v.type}</div>
							<div class="text-[11px] opacity-80 leading-snug">{v.desc}</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Vendor lifecycle -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-6">Vendor Engagement Flow</h2>
				<div class="space-y-4">
					<!-- Engagement path -->
					<div>
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">From Onboarding to Payment</h3>
						<div class="flex flex-wrap items-center gap-2">
							{#each [
								{ label: 'Vendor Created', color: 'bg-slate-700/50 border-slate-600 text-slate-200', note: 'active = true' },
								{ label: '→', color: '', note: '' },
								{ label: 'Linked to Project', color: 'bg-orange-900/40 border-orange-700/50 text-orange-200', note: 'vendors[] on project' },
								{ label: '→', color: '', note: '' },
								{ label: 'Expense Created', color: 'bg-amber-900/40 border-amber-700/50 text-amber-200', note: 'vendor field on expense' },
								{ label: '→', color: '', note: '' },
								{ label: 'Approved & Paid', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-200', note: 'open_invoices_total decreases' }
							] as step}
								{#if step.note}
									<div class="flex flex-col items-center gap-1">
										<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold {step.color}">{step.label}</div>
										<div class="text-[10px] text-muted-foreground text-center">{step.note}</div>
									</div>
								{:else}
									<div class="text-slate-500 text-lg font-light">{step.label}</div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Active vs inactive -->
					<div class="border-t border-border pt-4">
						<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active vs Inactive</h3>
						<div class="flex flex-wrap gap-3">
							<div class="flex flex-col items-center gap-1">
								<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-emerald-900/40 border-emerald-700/50 text-emerald-200">active = true</div>
								<div class="text-[10px] text-muted-foreground text-center">Appears in project dropdowns.<br/>Can be assigned to new work.</div>
							</div>
							<div class="flex items-center text-slate-500 text-lg font-light">→</div>
							<div class="flex flex-col items-center gap-1">
								<div class="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-slate-700/50 border-slate-600 text-slate-300">active = false</div>
								<div class="text-[10px] text-muted-foreground text-center">Hidden from dropdowns.<br/>Historical expenses preserved.</div>
							</div>
						</div>
					</div>
				</div>
			</Card>

			<!-- Collections map -->
			<Card class="p-6">
				<h2 class="text-xl font-bold mb-4">How Vendors Connect to the Rest of the System</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">vendors → projects</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Many-to-many. A vendor can work on multiple projects; a project can have multiple vendors.</div>
							<div class="pt-1 text-orange-300">Set via the vendors[] array on the project record.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">vendors → expenses</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>One-to-many. Each expense can reference a vendor as the payee.</div>
							<div class="pt-1 text-amber-300">Querying expenses by vendor gives a full spend history across all projects.</div>
						</div>
					</div>
					<div class="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
						<div class="font-mono font-bold text-slate-100 mb-2">open_invoices_total</div>
						<div class="text-xs text-slate-400 space-y-1">
							<div>Live outstanding balance across all active invoices for this vendor.</div>
							<div class="pt-1 text-emerald-300">Decreases as linked expenses move to paid status.</div>
						</div>
					</div>
				</div>
			</Card>

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
												<div class="flex items-start gap-3 p-3 rounded-lg border bg-orange-900/30 text-white">
													<Badge variant="default" class="text-xs shrink-0">
														{rel.type}
													</Badge>
													<div class="flex-1 min-w-0">
														<div class="font-mono text-sm font-medium text-white">
															{collection.collection} → {rel.to}
														</div>
														<div class="text-sm text-orange-100">{rel.description}</div>
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
								<div class="relative p-8 bg-muted/30 rounded-lg">
									<div class="flex justify-center mb-8">
										<div class="px-6 py-4 bg-orange-600 text-white rounded-lg border-2 border-orange-700 shadow-lg">
											<div class="font-mono font-bold text-lg">{collection.collection}</div>
											<div class="text-xs text-orange-100 mt-1">{collection.fields.length} fields</div>
										</div>
									</div>
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
													<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 w-0.5 h-8 bg-orange-400"></div>
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
