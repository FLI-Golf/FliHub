/**
 * PocketBase Collection Definitions
 * 
 * This file contains the complete schema for all PocketBase collections.
 * Use this to create or update collections in your PocketBase instance.
 */

export const collections = [
	// Note: 'managers' collection has been deprecated
	// We now use user_profiles with role='leader' for leadership roles
	{
		name: 'tasks',
		type: 'base',
		schema: [
			{
				name: 'task',
				type: 'text',
				required: true,
				options: { min: 1, max: 500 }
			},
			{
				name: 'subTasksChecklist',
				type: 'editor',
				required: false
			},
			{
				name: 'managers',
				type: 'text',
				required: false
			},
			{
				name: 'track',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['Phase 1', 'Phase 2', 'Overall', 'Other']
				}
			},
			{
				name: 'strategicGoal',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: [
						'Company Growth',
						'Brand Awareness',
						'Revenue',
						'Increase Revenue',
						'Managerial Tasks',
						'App',
						'Legal Tasks'
					]
				}
			},
			{
				name: 'departments',
				type: 'text',
				required: false
			},
			{
				name: 'quarters',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['Q1', 'Q2', 'Q3', 'Q4']
				}
			},
			{
				name: 'startDate',
				type: 'date',
				required: false
			},
			{
				name: 'endDate',
				type: 'date',
				required: false
			},
			{
				name: 'budget',
				type: 'number',
				required: false
			},
			{
				name: 'income',
				type: 'number',
				required: false
			},
			{
				name: 'contentProductionId',
				type: 'relation',
				required: false,
				options: { collectionId: 'content_production', maxSelect: 1 }
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['In Progress', 'Scheduled', 'Completed', 'Cancelled']
				}
			}
		],
		indexes: [
			'CREATE INDEX idx_tasks_status ON tasks (status)',
			'CREATE INDEX idx_tasks_track ON tasks (track)',
			'CREATE INDEX idx_tasks_strategic_goal ON tasks (strategicGoal)',
			'CREATE INDEX idx_tasks_quarters ON tasks (quarters)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'broadcast_partners',
		type: 'base',
		schema: [
			{
				name: 'point',
				type: 'text',
				required: true
			},
			{
				name: 'details',
				type: 'editor',
				required: true
			},
			{
				name: 'type',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['Key Point', 'Supporting Point', 'Risk', 'Opportunity']
				}
			},
			{
				name: 'category',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: [
						'Broadcasting & Audience Growth',
						'Viewer Engagement',
						'Revenue Opportunities',
						'Technology & Innovation',
						'Brand Building',
						'Operational Efficiency',
						'Risk Management'
					]
				}
			},
			{
				name: 'importanceLevel',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['High', 'Medium', 'Low']
				}
			},
			{
				name: 'tags',
				type: 'text',
				required: false
			},
			{
				name: 'additionalNotes',
				type: 'editor',
				required: false
			}
		],
		indexes: [
			'CREATE INDEX idx_broadcast_partners_type ON broadcast_partners (type)',
			'CREATE INDEX idx_broadcast_partners_category ON broadcast_partners (category)',
			'CREATE INDEX idx_broadcast_partners_importance ON broadcast_partners (importanceLevel)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'brand_positioning',
		type: 'base',
		schema: [
			{
				name: 'name',
				type: 'text',
				required: true
			},
			{
				name: 'positioningId',
				type: 'text',
				required: false
			},
			{
				name: 'keyDifferentiator',
				type: 'text',
				required: false
			},
			{
				name: 'brandMessage',
				type: 'editor',
				required: false
			},
			{
				name: 'coreValues',
				type: 'text',
				required: false
			},
			{
				name: 'targetAudience',
				type: 'text',
				required: false
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			}
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'budgets',
		type: 'base',
		schema: [
			{
				name: 'name',
				type: 'text',
				required: true
			},
			{
				name: 'budgetId',
				type: 'text',
				required: false
			},
			{
				name: 'departmentArea',
				type: 'text',
				required: false
			},
			{
				name: 'allocatedBudget',
				type: 'number',
				required: false
			},
			{
				name: 'spentBudget',
				type: 'number',
				required: false
			},
			{
				name: 'remainingBudget',
				type: 'number',
				required: false
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			}
		],
		indexes: ['CREATE INDEX idx_budgets_department ON budgets (departmentArea)'],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'business_objectives',
		type: 'base',
		schema: [
			{
				name: 'objectiveName',
				type: 'text',
				required: true
			},
			{
				name: 'objectId',
				type: 'text',
				required: false
			},
			{
				name: 'priorityLevel',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['High', 'Medium', 'Low']
				}
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled']
				}
			},
			{
				name: 'targetDate',
				type: 'date',
				required: false
			},
			{
				name: 'responsiblePerson',
				type: 'text',
				required: false
			}
		],
		indexes: [
			'CREATE INDEX idx_business_objectives_status ON business_objectives (status)',
			'CREATE INDEX idx_business_objectives_priority ON business_objectives (priorityLevel)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'campaigns',
		type: 'base',
		schema: [
			{
				name: 'name',
				type: 'text',
				required: true
			},
			{
				name: 'campaignId',
				type: 'text',
				required: false
			},
			{
				name: 'startDate',
				type: 'date',
				required: false
			},
			{
				name: 'endDate',
				type: 'date',
				required: false
			}
		],
		indexes: ['CREATE INDEX idx_campaigns_dates ON campaigns (startDate, endDate)'],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'continuous_improvements',
		type: 'base',
		schema: [
			{
				name: 'name',
				type: 'text',
				required: true
			},
			{
				name: 'improvementId',
				type: 'text',
				required: false
			},
			{
				name: 'areaOfImprovement',
				type: 'text',
				required: false
			},
			{
				name: 'actionPlan',
				type: 'editor',
				required: false
			},
			{
				name: 'responsiblePerson',
				type: 'text',
				required: false
			},
			{
				name: 'status',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['Identified', 'In Progress', 'Implemented', 'Monitoring']
				}
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			}
		],
		indexes: ['CREATE INDEX idx_continuous_improvements_status ON continuous_improvements (status)'],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'digital_marketing_strategies',
		type: 'base',
		schema: [
			{
				name: 'name',
				type: 'text',
				required: true
			},
			{
				name: 'strategyId',
				type: 'text',
				required: false
			},
			{
				name: 'channel',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: [
						'Social Media',
						'Email',
						'SEO',
						'PPC',
						'Content Marketing',
						'Influencer Marketing',
						'Affiliate Marketing',
						'Display Advertising',
						'Video Marketing',
						'Other'
					]
				}
			},
			{
				name: 'description',
				type: 'editor',
				required: false
			},
			{
				name: 'budgetAllocated',
				type: 'number',
				required: false
			},
			{
				name: 'status',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled']
				}
			},
			{
				name: 'responsiblePerson',
				type: 'text',
				required: false
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			}
		],
		indexes: [
			'CREATE INDEX idx_digital_marketing_strategies_channel ON digital_marketing_strategies (channel)',
			'CREATE INDEX idx_digital_marketing_strategies_status ON digital_marketing_strategies (status)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'marketing_goals',
		type: 'base',
		schema: [
			{
				name: 'name',
				type: 'text',
				required: true
			},
			{
				name: 'goalId',
				type: 'text',
				required: false
			},
			{
				name: 'descriptionOfGoal',
				type: 'editor',
				required: false
			},
			{
				name: 'smartCriteria',
				type: 'text',
				required: false
			},
			{
				name: 'status',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled']
				}
			},
			{
				name: 'dueDate',
				type: 'date',
				required: false
			},
			{
				name: 'responsiblePerson',
				type: 'text',
				required: false
			},
			{
				name: 'marketingMix',
				type: 'text',
				required: false
			},
			// Progress tracking — added to support task-driven progress
			{
				name: 'progressMode',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['manual', 'task_driven'] }
			},
			{
				name: 'progressBaseline',
				type: 'number',
				required: false
			}
		],
		indexes: ['CREATE INDEX idx_marketing_goals_status ON marketing_goals (status)'],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'swot_analysis',
		type: 'base',
		schema: [
			{
				name: 'name',
				type: 'text',
				required: true
			},
			{
				name: 'swotId',
				type: 'text',
				required: false
			},
			{
				name: 'category',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['Strength', 'Weakness', 'Opportunity', 'Threat']
				}
			},
			{
				name: 'description',
				type: 'editor',
				required: false
			},
			{
				name: 'impactLevel',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['High', 'Medium', 'Low']
				}
			},
			{
				name: 'actionPlan',
				type: 'editor',
				required: false
			},
			{
				name: 'responsiblePerson',
				type: 'text',
				required: false
			}
		],
		indexes: [
			'CREATE INDEX idx_swot_analysis_category ON swot_analysis (category)',
			'CREATE INDEX idx_swot_analysis_impact ON swot_analysis (impactLevel)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'kpis',
		type: 'base',
		schema: [
			{
				name: 'name',
				type: 'text',
				required: true
			},
			{
				name: 'kpiId',
				type: 'text',
				required: false
			},
			{
				name: 'kpiDescription',
				type: 'editor',
				required: false
			},
			{
				name: 'targetValue',
				type: 'text',
				required: false
			},
			{
				name: 'currentValue',
				type: 'text',
				required: false
			},
			{
				name: 'analysisFrequency',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually']
				}
			},
			{
				name: 'responsiblePerson',
				type: 'text',
				required: false
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			}
		],
		indexes: ['CREATE INDEX idx_kpis_frequency ON kpis (analysisFrequency)'],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'pros',
		type: 'base',
		schema: [
			{
				name: 'name',
				type: 'text',
				required: true,
				options: { min: 1, max: 255 }
			},
			{
				name: 'nickname',
				type: 'text',
				required: false,
				options: { max: 100 }
			},
			{
				name: 'worldRanking',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'country',
				type: 'text',
				required: false,
				options: { max: 100 }
			},
			{
				name: 'residence',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'bio',
				type: 'editor',
				required: false
			},
			{
				name: 'photo',
				type: 'url',
				required: false
			},
			{
				name: 'sponsoredBy',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'dateOfBirth',
				type: 'date',
				required: false
			},
			{
				name: 'height',
				type: 'text',
				required: false,
				options: { max: 50 }
			},
			{
				name: 'weight',
				type: 'text',
				required: false,
				options: { max: 50 }
			},
			{
				name: 'yearTurnedPro',
				type: 'number',
				required: false,
				options: { min: 1900, max: 2100 }
			},
			{
				name: 'primarySponsor',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'favoriteDisc',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'signatureMove',
				type: 'text',
				required: false,
				options: { max: 500 }
			},
			{
				name: 'careerHighlights',
				type: 'editor',
				required: false
			},
			{
				name: 'tournamentsPlayed',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'notableRecords',
				type: 'editor',
				required: false
			},
			{
				name: 'education',
				type: 'text',
				required: false,
				options: { max: 500 }
			},
			{
				name: 'otherSports',
				type: 'text',
				required: false,
				options: { max: 500 }
			},
			{
				name: 'hobbies',
				type: 'text',
				required: false,
				options: { max: 500 }
			},
			{
				name: 'favoriteDestination',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'personalMotivation',
				type: 'editor',
				required: false
			},
			{
				name: 'website',
				type: 'url',
				required: false
			},
			{
				name: 'tiktok',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'twitch',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'videoHighlightsLinks',
				type: 'editor',
				required: false
			},
			{
				name: 'injuryHistory',
				type: 'editor',
				required: false
			},
			{
				name: 'fitnessRegimen',
				type: 'editor',
				required: false
			},
			{
				name: 'dietaryPreferences',
				type: 'text',
				required: false,
				options: { max: 500 }
			},
			{
				name: 'longTermGoals',
				type: 'editor',
				required: false
			},
			{
				name: 'missionStatement',
				type: 'editor',
				required: false
			},
			{
				name: 'primaryAirport',
				type: 'text',
				required: false,
				options: { max: 100 }
			},
			{
				name: 'secondaryAirport',
				type: 'text',
				required: false,
				options: { max: 100 }
			},
			{
				name: 'frequentFlyerNumbers',
				type: 'text',
				required: false,
				options: { max: 500 }
			},
			{
				name: 'signedContract',
				type: 'json',
				required: false
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['active', 'inactive', 'retired']
				}
			},
			{
				name: 'gender',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['male', 'female', 'other']
				}
			}
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	// ─── Onboarding: tracks per-user completion state ───────────────────────
	{
		name: 'onboarding_status',
		type: 'base',
		schema: [
			{ name: 'userId', type: 'text', required: true, options: { max: 255 } },
			{ name: 'welcomeSeen', type: 'bool', required: false },
			{ name: 'documentsInitialed', type: 'bool', required: false },
			{ name: 'contractSigned', type: 'bool', required: false },
			{ name: 'profileCompleted', type: 'bool', required: false },
			{ name: 'completedAt', type: 'date', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: null
	},

	// ─── Document signatures: stores initials/signature per document per user ─
	{
		name: 'document_signatures',
		type: 'base',
		schema: [
			{ name: 'userId', type: 'text', required: true, options: { max: 255 } },
			{
				name: 'documentType',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: [
						'player_information_packet',
						'player_opportunity_packet',
						'integrity_substance_policy',
						'player_contract',
						'legal_documents'
					]
				}
			},
			{ name: 'initials', type: 'text', required: false, options: { max: 10 } },
			{ name: 'signatureDataUrl', type: 'text', required: false },
			{ name: 'fullName', type: 'text', required: false, options: { max: 255 } },
			{ name: 'signedAt', type: 'date', required: false },
			{ name: 'ipAddress', type: 'text', required: false, options: { max: 100 } },
			{ name: 'agreed', type: 'bool', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: null
	},

	// ─── Player profiles: the detailed onboarding questionnaire ─────────────
	{
		name: 'player_profiles',
		type: 'base',
		schema: [
			// Personal Information
			{ name: 'userId', type: 'text', required: true, options: { max: 255 } },
			{ name: 'fullName', type: 'text', required: false, options: { max: 255 } },
			{ name: 'dateOfBirth', type: 'date', required: false },
			{ name: 'nationality', type: 'text', required: false, options: { max: 255 } },
			{ name: 'countryOfResidence', type: 'text', required: false, options: { max: 255 } },
			{ name: 'primaryLanguages', type: 'text', required: false, options: { max: 255 } },
			{ name: 'phone', type: 'text', required: false, options: { max: 50 } },
			{ name: 'email', type: 'email', required: false },
			{ name: 'mailingAddress', type: 'text', required: false, options: { max: 500 } },
			{ name: 'emergencyContactName', type: 'text', required: false, options: { max: 255 } },
			{ name: 'emergencyContactRelationship', type: 'text', required: false, options: { max: 100 } },
			{ name: 'emergencyContactPhone', type: 'text', required: false, options: { max: 50 } },
			{ name: 'emergencyContactEmail', type: 'email', required: false },
			// Competitive Background
			{ name: 'worldRanking', type: 'number', required: false },
			{ name: 'yearsCompeting', type: 'number', required: false },
			{ name: 'majorTournamentWins', type: 'text', required: false },
			{ name: 'notableAchievements', type: 'text', required: false },
			{ name: 'otherLeagues', type: 'text', required: false, options: { max: 500 } },
			{ name: 'playingStyle', type: 'text', required: false, options: { max: 255 } },
			{ name: 'strongestSkills', type: 'text', required: false, options: { max: 500 } },
			{ name: 'knownInjuries', type: 'text', required: false, options: { max: 500 } },
			// Branding & Media
			{ name: 'broadcastNickname', type: 'text', required: false, options: { max: 100 } },
			{ name: 'instagram', type: 'text', required: false, options: { max: 255 } },
			{ name: 'twitter', type: 'text', required: false, options: { max: 255 } },
			{ name: 'youtube', type: 'text', required: false, options: { max: 255 } },
			{ name: 'otherSocialMedia', type: 'text', required: false, options: { max: 500 } },
			{ name: 'personalWebsite', type: 'url', required: false },
			{ name: 'mediaFeatures', type: 'text', required: false },
			{ name: 'comfortableWithInterviews', type: 'bool', required: false },
			{ name: 'openToBehindScenes', type: 'bool', required: false },
			// Sponsorship
			{ name: 'currentSponsorships', type: 'text', required: false },
			{ name: 'openToNewSponsors', type: 'bool', required: false },
			{ name: 'wantsLeagueSponsorHelp', type: 'bool', required: false },
			{ name: 'personalBrandingGoals', type: 'text', required: false },
			// Management / Representation
			{ name: 'hasAgent', type: 'bool', required: false },
			{ name: 'repName', type: 'text', required: false, options: { max: 255 } },
			{ name: 'repAgency', type: 'text', required: false, options: { max: 255 } },
			{ name: 'repPosition', type: 'text', required: false, options: { max: 100 } },
			{ name: 'repPhone', type: 'text', required: false, options: { max: 50 } },
			{ name: 'repEmail', type: 'email', required: false },
			// Betting & Integrity
			{ name: 'participatedInBetting', type: 'bool', required: false },
			{ name: 'understandsIntegrityPolicy', type: 'bool', required: false },
			{ name: 'priorIntegrityViolations', type: 'bool', required: false },
			{ name: 'integrityViolationDetails', type: 'text', required: false },
			// Additional
			{ name: 'excitementAboutLeague', type: 'text', required: false },
			{ name: 'careerGoals', type: 'text', required: false },
			{ name: 'additionalInfo', type: 'text', required: false },
			// Status
			{
				name: 'status',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['draft', 'submitted', 'approved'] }
			},
			{ name: 'submittedAt', type: 'date', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: null
	},

	// ─── Goal tasks ───────────────────────────────────────────────────────────
	// Tasks attached to a marketing goal. Move through todo → in_progress →
	// needs_approval → approved → expense_created → work_order → completed.
	{
		name: 'goal_tasks',
		type: 'base',
		schema: [
			{ name: 'goalId',        type: 'text',   required: true,  options: { max: 255 } },
			{ name: 'title',         type: 'text',   required: true,  options: { max: 500 } },
			{ name: 'description',   type: 'text',   required: false },
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['todo','in_progress','needs_approval','approved','expense_created','work_order','completed','cancelled']
				}
			},
			{
				name: 'priority',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['low','medium','high','urgent'] }
			},
			{ name: 'dueDate',       type: 'date',   required: false },
			{ name: 'estimatedCost',        type: 'number', required: false },
			{ name: 'actualCost',           type: 'number', required: false },
			{ name: 'assignedTo',           type: 'text',   required: false, options: { max: 255 } },
			{ name: 'notes',                type: 'text',   required: false },
			// When this task is marked completed, add this value to the goal's currentValue.
			// Leave null to have no effect on progress (task is purely operational).
			{ name: 'progressContribution', type: 'number', required: false },
			// Approval tracking
			{ name: 'approvalId',    type: 'text',   required: false, options: { max: 255 } },
			{ name: 'approvedBy',    type: 'text',   required: false, options: { max: 255 } },
			{ name: 'approvedAt',    type: 'date',   required: false },
			// Downstream links
			{ name: 'expenseId',     type: 'text',   required: false, options: { max: 255 } },
			{ name: 'workOrderId',   type: 'text',   required: false, options: { max: 255 } },
			{ name: 'createdBy',     type: 'text',   required: false, options: { max: 255 } }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	// ─── Sponsor activity log ─────────────────────────────────────────────────
	{
		name: 'sponsor_activity',
		type: 'base',
		schema: [
			{ name: 'sponsorId',  type: 'text',   required: true,  options: { max: 255 } },
			{
				name: 'type',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['note', 'call', 'email', 'meeting', 'stage_change', 'payment', 'contract', 'other']
				}
			},
			{ name: 'note',      type: 'text',   required: false },
			{ name: 'createdBy', type: 'text',   required: false, options: { max: 255 } }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	// ─── Content production pipeline ─────────────────────────────────────────
	{
		name: 'media_assets',
		type: 'base',
		schema: [
			{ name: 'title', type: 'text', required: true, options: { max: 500 } },
			{
				name: 'asset_type',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['flyer', 'jersey', 'shoe', 'logo', 'banner', 'social', 'other'] }
			},
			{
				name: 'media_category',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: [
						'graphic',
						'photo',
						'video',
						'audio',
						'document',
						'broadcast_segment',
						'social_clip',
						'interview',
						'highlight',
						'sponsor_asset',
						'archive_package',
						'other'
					]
				}
			},
			{ name: 'file', type: 'file', required: true, options: { maxSelect: 1, maxSize: 104857600 } },
			{ name: 'franchise', type: 'relation', required: false, options: { collectionId: 'franchises', maxSelect: 1 } },
			{ name: 'project', type: 'relation', required: false, options: { collectionId: 'projects', maxSelect: 1 } },
			{ name: 'campaign', type: 'relation', required: false, options: { collectionId: 'campaigns', maxSelect: 1 } },
			{ name: 'season', type: 'relation', required: false, options: { collectionId: 'seasons', maxSelect: 1 } },
			{ name: 'tournament', type: 'relation', required: false, options: { collectionId: 'tournaments', maxSelect: 1 } },
			{ name: 'special_event', type: 'relation', required: false, options: { collectionId: 'special_events', maxSelect: 1 } },
			{
				name: 'source_type',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: [
						'broadcast_camera',
						'drone',
						'mobile',
						'photographer',
						'livestream',
						'social_export',
						'production_company',
						'podcast',
						'sponsor_submission',
						'other'
					]
				}
			},
			{ name: 'capture_date', type: 'date', required: false },
			{ name: 'duration_seconds', type: 'number', required: false },
			{ name: 'file_size_bytes', type: 'number', required: false },
			{ name: 'resolution', type: 'text', required: false, options: { max: 100 } },
			{
				name: 'status',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['uploaded', 'processing', 'tagged', 'approved', 'archived', 'restricted'] }
			},
			{
				name: 'storage_tier',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['hot', 'warm', 'archive'] }
			},
			{
				name: 'usage_scope',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['internal', 'sponsor', 'broadcast', 'commercial', 'restricted'] }
			},
			{
				name: 'rights_status',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['owned', 'shared', 'licensed_out', 'licensed_in', 'talent_restricted', 'expired'] }
			},
			{ name: 'tags', type: 'text', required: false },
			{ name: 'notes', type: 'editor', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	// ─── Media taxonomy + structured metadata (Phase 2) ──────────────────────
	{
		name: 'media_asset_tags',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'tag', type: 'text', required: true, options: { max: 100 } },
			{
				name: 'domain',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['general', 'mood', 'scene', 'brand', 'competition', 'broadcast', 'location', 'other']
				}
			},
			{ name: 'notes', type: 'text', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_asset_people',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'person', type: 'relation', required: true, options: { collectionId: 'talent', maxSelect: 1 } },
			{
				name: 'role',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['player', 'host', 'interviewer', 'analyst', 'coach', 'staff', 'fan', 'vip', 'other']
				}
			},
			{ name: 'is_primary', type: 'bool', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_asset_teams',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'team', type: 'relation', required: true, options: { collectionId: 'franchises', maxSelect: 1 } },
			{
				name: 'context',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['featured', 'opponent', 'crowd', 'support', 'other'] }
			}
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_asset_sponsors',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'sponsor', type: 'relation', required: true, options: { collectionId: 'sponsors', maxSelect: 1 } },
			{
				name: 'visibility',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['background', 'partial', 'clear', 'hero', 'verbal_mention'] }
			},
			{ name: 'placement', type: 'text', required: false, options: { max: 120 } }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_asset_events',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'season', type: 'relation', required: false, options: { collectionId: 'seasons', maxSelect: 1 } },
			{ name: 'tournament', type: 'relation', required: false, options: { collectionId: 'tournaments', maxSelect: 1 } },
			{ name: 'special_event', type: 'relation', required: false, options: { collectionId: 'special_events', maxSelect: 1 } },
			{ name: 'hole_number', type: 'number', required: false, options: { min: 1, max: 36, noDecimal: true } },
			{
				name: 'round_type',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['practice', 'qualifier', 'round_1', 'round_2', 'round_3', 'final_round', 'playoff', 'other'] }
			},
			{
				name: 'shot_type',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['drive', 'approach', 'chip', 'putt', 'bunker', 'penalty', 'other'] }
			},
			{
				name: 'moment_type',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['crowd_reaction', 'interview_segment', 'award_ceremony', 'vip_hospitality', 'sponsor_activation', 'other']
				}
			}
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_asset_markers',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{
				name: 'marker_type',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['timestamp', 'segment'] }
			},
			{ name: 'start_seconds', type: 'number', required: true, options: { min: 0 } },
			{ name: 'end_seconds', type: 'number', required: false, options: { min: 0 } },
			{ name: 'label', type: 'text', required: false, options: { max: 200 } },
			{ name: 'description', type: 'text', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	// ─── Media rights + licensing (Phase 3) ─────────────────────────────────
	{
		name: 'media_rights_profiles',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'rights_owner', type: 'text', required: true, options: { max: 255 } },
			{
				name: 'usage_type',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['internal', 'sponsor', 'broadcast', 'commercial', 'social', 'other'] }
			},
			{ name: 'territory', type: 'text', required: false, options: { max: 120 } },
			{ name: 'channel', type: 'text', required: false, options: { max: 120 } },
			{ name: 'exclusive', type: 'bool', required: false },
			{ name: 'start_date', type: 'date', required: false },
			{ name: 'expiration_date', type: 'date', required: false },
			{ name: 'restrictions', type: 'text', required: false },
			{ name: 'contract_reference', type: 'text', required: false, options: { max: 255 } },
			{
				name: 'status',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['active', 'pending', 'expired', 'restricted', 'disputed'] }
			}
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_license_deals',
		type: 'base',
		schema: [
			{ name: 'name', type: 'text', required: true, options: { max: 255 } },
			{ name: 'licensee', type: 'text', required: true, options: { max: 255 } },
			{
				name: 'usage_type',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['broadcast', 'streaming', 'social', 'sponsor', 'commercial', 'other'] }
			},
			{ name: 'territory', type: 'text', required: false, options: { max: 120 } },
			{ name: 'channel', type: 'text', required: false, options: { max: 120 } },
			{ name: 'exclusive', type: 'bool', required: false },
			{ name: 'start_date', type: 'date', required: false },
			{ name: 'expiration_date', type: 'date', required: false },
			{ name: 'fee_amount', type: 'number', required: false },
			{ name: 'currency', type: 'text', required: false, options: { max: 12 } },
			{
				name: 'payment_status',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['draft', 'invoiced', 'paid', 'past_due', 'void'] }
			},
			{ name: 'contract_reference', type: 'text', required: false, options: { max: 255 } },
			{ name: 'notes', type: 'text', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_license_line_items',
		type: 'base',
		schema: [
			{ name: 'deal', type: 'relation', required: true, options: { collectionId: 'media_license_deals', maxSelect: 1 } },
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{
				name: 'usage_type',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['broadcast', 'streaming', 'social', 'sponsor', 'commercial', 'other'] }
			},
			{ name: 'fee_amount', type: 'number', required: false },
			{ name: 'revenue_share_pct', type: 'number', required: false },
			{ name: 'restrictions', type: 'text', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_usage_logs',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'deal', type: 'relation', required: false, options: { collectionId: 'media_license_deals', maxSelect: 1 } },
			{ name: 'used_by', type: 'text', required: false, options: { max: 255 } },
			{ name: 'channel', type: 'text', required: false, options: { max: 120 } },
			{ name: 'territory', type: 'text', required: false, options: { max: 120 } },
			{ name: 'usage_date', type: 'date', required: false },
			{ name: 'usage_context', type: 'text', required: false },
			{ name: 'impression_count', type: 'number', required: false, options: { noDecimal: true, min: 0 } },
			{ name: 'revenue_attributed', type: 'number', required: false },
			{ name: 'notes', type: 'text', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	// ─── Sponsor deliverables + visibility tracking (Phase 4) ───────────────
	{
		name: 'sponsor_recap_packages',
		type: 'base',
		schema: [
			{ name: 'sponsor', type: 'relation', required: true, options: { collectionId: 'sponsors', maxSelect: 1 } },
			{ name: 'package_name', type: 'text', required: true, options: { max: 255 } },
			{ name: 'season', type: 'relation', required: false, options: { collectionId: 'seasons', maxSelect: 1 } },
			{ name: 'tournament', type: 'relation', required: false, options: { collectionId: 'tournaments', maxSelect: 1 } },
			{ name: 'special_event', type: 'relation', required: false, options: { collectionId: 'special_events', maxSelect: 1 } },
			{
				name: 'status',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['draft', 'in_progress', 'ready', 'sent', 'approved', 'archived'] }
			},
			{ name: 'delivered_at', type: 'date', required: false },
			{ name: 'proof_url', type: 'url', required: false },
			{ name: 'notes', type: 'text', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'sponsor_media_deliverables',
		type: 'base',
		schema: [
			{ name: 'sponsor', type: 'relation', required: true, options: { collectionId: 'sponsors', maxSelect: 1 } },
			{ name: 'asset', type: 'relation', required: false, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'recap_package', type: 'relation', required: false, options: { collectionId: 'sponsor_recap_packages', maxSelect: 1 } },
			{
				name: 'deliverable_type',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['logo_exposure', 'highlight_clip', 'recap_image', 'interview_cut', 'social_post', 'broadcast_feature', 'hospitality_recap', 'other']
				}
			},
			{ name: 'obligation_reference', type: 'text', required: false, options: { max: 255 } },
			{
				name: 'status',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['pending', 'in_progress', 'delivered', 'approved', 'overdue', 'cancelled'] }
			},
			{ name: 'due_date', type: 'date', required: false },
			{ name: 'delivered_at', type: 'date', required: false },
			{ name: 'visibility_score', type: 'number', required: false, options: { noDecimal: true, min: 0, max: 100 } },
			{ name: 'proof_note', type: 'text', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'sponsor_media_appearances',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'sponsor', type: 'relation', required: true, options: { collectionId: 'sponsors', maxSelect: 1 } },
			{ name: 'deliverable', type: 'relation', required: false, options: { collectionId: 'sponsor_media_deliverables', maxSelect: 1 } },
			{
				name: 'logo_visibility',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['background', 'partial', 'clear', 'hero', 'verbal_mention'] }
			},
			{ name: 'placement', type: 'text', required: false, options: { max: 120 } },
			{ name: 'timestamp_seconds', type: 'number', required: false, options: { min: 0 } },
			{ name: 'screenshot_url', type: 'url', required: false },
			{ name: 'verified', type: 'bool', required: false },
			{ name: 'notes', type: 'text', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	// ─── Highlight builder + internal packaging (Phase 5) ───────────────────
	{
		name: 'media_collections',
		type: 'base',
		schema: [
			{ name: 'name', type: 'text', required: true, options: { max: 255 } },
			{
				name: 'collection_type',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['reel', 'event_recap', 'player_package', 'sponsor_package', 'social_export', 'other'] }
			},
			{ name: 'season', type: 'relation', required: false, options: { collectionId: 'seasons', maxSelect: 1 } },
			{ name: 'tournament', type: 'relation', required: false, options: { collectionId: 'tournaments', maxSelect: 1 } },
			{ name: 'special_event', type: 'relation', required: false, options: { collectionId: 'special_events', maxSelect: 1 } },
			{ name: 'sponsor', type: 'relation', required: false, options: { collectionId: 'sponsors', maxSelect: 1 } },
			{ name: 'owner', type: 'text', required: false, options: { max: 120 } },
			{
				name: 'status',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['draft', 'curating', 'ready_for_edit', 'complete', 'archived'] }
			},
			{ name: 'notes', type: 'text', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'highlight_packages',
		type: 'base',
		schema: [
			{ name: 'name', type: 'text', required: true, options: { max: 255 } },
			{
				name: 'package_type',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['reel', 'event_recap', 'player_package', 'sponsor_package', 'social_export', 'other'] }
			},
			{
				name: 'status',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['draft', 'review', 'approved', 'published', 'archived'] }
			},
			{
				name: 'export_target',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['broadcast', 'social', 'internal', 'sponsor', 'editorial', 'other'] }
			},
			{
				name: 'approval_status',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['pending', 'approved', 'rejected'] }
			},
			{ name: 'approved_by', type: 'text', required: false, options: { max: 120 } },
			{ name: 'approved_at', type: 'date', required: false },
			{ name: 'published_url', type: 'url', required: false },
			{ name: 'manifest_json', type: 'json', required: false },
			{ name: 'notes', type: 'text', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'highlight_package_items',
		type: 'base',
		schema: [
			{ name: 'highlight_package', type: 'relation', required: true, options: { collectionId: 'highlight_packages', maxSelect: 1 } },
			{ name: 'media_collection', type: 'relation', required: false, options: { collectionId: 'media_collections', maxSelect: 1 } },
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'clip_in_seconds', type: 'number', required: false, options: { min: 0 } },
			{ name: 'clip_out_seconds', type: 'number', required: false, options: { min: 0 } },
			{ name: 'sort_order', type: 'number', required: false, options: { noDecimal: true, min: 0 } },
			{
				name: 'usage_role',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['opening', 'feature', 'sponsor_callout', 'transition', 'closing', 'other'] }
			},
			{ name: 'notes', type: 'text', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	// ─── Marketplace + archive + executive reporting (Phase 6 / Modules 8-10) ──
	{
		name: 'media_marketplace_listings',
		type: 'base',
		schema: [
			{ name: 'title', type: 'text', required: true, options: { max: 255 } },
			{ name: 'highlight_package', type: 'relation', required: false, options: { collectionId: 'highlight_packages', maxSelect: 1 } },
			{ name: 'media_collection', type: 'relation', required: false, options: { collectionId: 'media_collections', maxSelect: 1 } },
			{ name: 'primary_asset', type: 'relation', required: false, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{
				name: 'listing_status',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['draft', 'pending_review', 'active', 'inactive', 'sold', 'archived'] }
			},
			{
				name: 'pricing_model',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['flat_fee', 'license_tier', 'custom_quote'] }
			},
			{ name: 'asking_price', type: 'number', required: false, options: { min: 0 } },
			{ name: 'currency', type: 'text', required: false, options: { max: 3 } },
			{
				name: 'license_scope',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['single_use', 'season_use', 'perpetual_internal', 'broadcast_window', 'custom'] }
			},
			{
				name: 'approved_buyer_types',
				type: 'select',
				required: false,
				options: { maxSelect: 6, values: ['internal', 'sponsor', 'brand_partner', 'broadcaster', 'media_outlet', 'other'] }
			},
			{ name: 'available_from', type: 'date', required: false },
			{ name: 'expires_at', type: 'date', required: false },
			{ name: 'rights_summary', type: 'text', required: false },
			{ name: 'notes', type: 'text', required: false }
		],
		indexes: [
			'CREATE INDEX idx_media_marketplace_listings_status ON media_marketplace_listings (listing_status)',
			'CREATE INDEX idx_media_marketplace_listings_price ON media_marketplace_listings (asking_price)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_purchase_requests',
		type: 'base',
		schema: [
			{ name: 'listing', type: 'relation', required: true, options: { collectionId: 'media_marketplace_listings', maxSelect: 1 } },
			{ name: 'buyer_name', type: 'text', required: true, options: { max: 120 } },
			{ name: 'buyer_email', type: 'text', required: false, options: { max: 200 } },
			{ name: 'buyer_organization', type: 'text', required: false, options: { max: 200 } },
			{
				name: 'request_status',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['submitted', 'reviewing', 'quoted', 'approved', 'rejected', 'cancelled', 'fulfilled'] }
			},
			{
				name: 'intended_use',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['social', 'broadcast', 'sponsor_campaign', 'internal', 'press', 'other'] }
			},
			{ name: 'offered_price', type: 'number', required: false, options: { min: 0 } },
			{ name: 'requested_terms', type: 'text', required: false },
			{ name: 'approved_by', type: 'text', required: false, options: { max: 120 } },
			{ name: 'approved_at', type: 'date', required: false },
			{ name: 'fulfilled_at', type: 'date', required: false },
			{ name: 'notes', type: 'text', required: false }
		],
		indexes: [
			'CREATE INDEX idx_media_purchase_requests_status ON media_purchase_requests (request_status)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_download_audits',
		type: 'base',
		schema: [
			{ name: 'listing', type: 'relation', required: false, options: { collectionId: 'media_marketplace_listings', maxSelect: 1 } },
			{ name: 'purchase_request', type: 'relation', required: false, options: { collectionId: 'media_purchase_requests', maxSelect: 1 } },
			{ name: 'highlight_package', type: 'relation', required: false, options: { collectionId: 'highlight_packages', maxSelect: 1 } },
			{ name: 'asset', type: 'relation', required: false, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'downloaded_by', type: 'text', required: true, options: { max: 120 } },
			{ name: 'downloader_organization', type: 'text', required: false, options: { max: 200 } },
			{
				name: 'download_source',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['marketplace', 'internal_export', 'sponsor_portal', 'api', 'other'] }
			},
			{
				name: 'usage_context',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['evaluation', 'licensed_use', 'internal_review', 'press', 'other'] }
			},
			{ name: 'file_variant', type: 'text', required: false, options: { max: 120 } },
			{ name: 'bytes_served', type: 'number', required: false, options: { noDecimal: true, min: 0 } },
			{ name: 'ip_hash', type: 'text', required: false, options: { max: 128 } },
			{ name: 'downloaded_at', type: 'date', required: true },
			{
				name: 'status',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['started', 'completed', 'failed', 'cancelled'] }
			}
		],
		indexes: [
			'CREATE INDEX idx_media_download_audits_downloaded_at ON media_download_audits (downloaded_at)',
			'CREATE INDEX idx_media_download_audits_status ON media_download_audits (status)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_dashboard_snapshots',
		type: 'base',
		schema: [
			{ name: 'snapshot_date', type: 'date', required: true },
			{ name: 'total_assets_stored', type: 'number', required: false, options: { noDecimal: true, min: 0 } },
			{ name: 'hours_of_footage', type: 'number', required: false, options: { min: 0 } },
			{ name: 'photo_count', type: 'number', required: false, options: { noDecimal: true, min: 0 } },
			{ name: 'most_used_assets_json', type: 'json', required: false },
			{ name: 'assets_by_season_json', type: 'json', required: false },
			{ name: 'sponsor_deliverables_completed', type: 'number', required: false, options: { noDecimal: true, min: 0 } },
			{ name: 'licensing_revenue', type: 'number', required: false, options: { min: 0 } },
			{ name: 'downloads', type: 'number', required: false, options: { noDecimal: true, min: 0 } },
			{ name: 'top_players_by_media_value_json', type: 'json', required: false },
			{ name: 'top_teams_by_media_value_json', type: 'json', required: false },
			{ name: 'notes', type: 'text', required: false }
		],
		indexes: [
			'CREATE UNIQUE INDEX idx_media_dashboard_snapshots_date ON media_dashboard_snapshots (snapshot_date)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	// ─── AI enrichment + natural language search (Phase 7) ───────────────────
	{
		name: 'media_ai_jobs',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{
				name: 'job_type',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['player_recognition', 'logo_recognition', 'scene_detection', 'transcript_extraction', 'clip_summarization', 'metadata_suggestion'] }
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['queued', 'running', 'completed', 'failed', 'cancelled'] }
			},
			{ name: 'provider', type: 'text', required: false, options: { max: 120 } },
			{ name: 'model_name', type: 'text', required: false, options: { max: 120 } },
			{ name: 'started_at', type: 'date', required: false },
			{ name: 'completed_at', type: 'date', required: false },
			{ name: 'error_message', type: 'text', required: false },
			{ name: 'result_json', type: 'json', required: false }
		],
		indexes: [
			'CREATE INDEX idx_media_ai_jobs_asset ON media_ai_jobs (asset)',
			'CREATE INDEX idx_media_ai_jobs_type_status ON media_ai_jobs (job_type, status)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_ai_detections',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'job', type: 'relation', required: false, options: { collectionId: 'media_ai_jobs', maxSelect: 1 } },
			{
				name: 'detection_type',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['player', 'sponsor_logo', 'scene', 'keyword', 'moment'] }
			},
			{ name: 'label', type: 'text', required: true, options: { max: 255 } },
			{ name: 'confidence', type: 'number', required: false, options: { min: 0, max: 1 } },
			{ name: 'time_in_seconds', type: 'number', required: false, options: { min: 0 } },
			{ name: 'time_out_seconds', type: 'number', required: false, options: { min: 0 } },
			{ name: 'bbox_json', type: 'json', required: false },
			{ name: 'metadata_json', type: 'json', required: false }
		],
		indexes: [
			'CREATE INDEX idx_media_ai_detections_asset_type ON media_ai_detections (asset, detection_type)',
			'CREATE INDEX idx_media_ai_detections_label ON media_ai_detections (label)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_ai_transcripts',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'job', type: 'relation', required: false, options: { collectionId: 'media_ai_jobs', maxSelect: 1 } },
			{ name: 'language', type: 'text', required: false, options: { max: 16 } },
			{ name: 'transcript_text', type: 'text', required: true },
			{ name: 'segments_json', type: 'json', required: false },
			{ name: 'word_count', type: 'number', required: false, options: { noDecimal: true, min: 0 } },
			{ name: 'confidence_avg', type: 'number', required: false, options: { min: 0, max: 1 } }
		],
		indexes: [
			'CREATE INDEX idx_media_ai_transcripts_asset ON media_ai_transcripts (asset)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'media_ai_summaries',
		type: 'base',
		schema: [
			{ name: 'asset', type: 'relation', required: true, options: { collectionId: 'media_assets', maxSelect: 1 } },
			{ name: 'job', type: 'relation', required: false, options: { collectionId: 'media_ai_jobs', maxSelect: 1 } },
			{ name: 'summary_text', type: 'text', required: true },
			{ name: 'suggested_tags_json', type: 'json', required: false },
			{ name: 'suggested_title', type: 'text', required: false, options: { max: 255 } },
			{ name: 'priority_score', type: 'number', required: false, options: { min: 0, max: 100 } },
			{ name: 'approved', type: 'bool', required: false }
		],
		indexes: [
			'CREATE INDEX idx_media_ai_summaries_asset ON media_ai_summaries (asset)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	{
		name: 'content_production',
		type: 'base',
		schema: [
			{ name: 'title',           type: 'text',   required: true,  options: { max: 500 } },
			{
				name: 'contentType',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['youtube','instagram','tiktok','podcast','documentary','promo','interview','highlight','other'] }
			},
			{
				name: 'stage',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['brief','shoot','edit','approval','published','paid','cancelled'] }
			},
			{ name: 'description',     type: 'text',   required: false },
			{ name: 'department',      type: 'relation', required: false, options: { collectionId: 'departments', maxSelect: 1 } },
			{ name: 'project',         type: 'relation', required: false, options: { collectionId: 'projects', maxSelect: 1 } },
			{ name: 'talent',          type: 'relation', required: false, options: { collectionId: 'talent', maxSelect: 10 } },
			{ name: 'assignedTo',      type: 'text',   required: false, options: { max: 255 } },
			{ name: 'dueDate',         type: 'date',   required: false },
			{ name: 'budget',          type: 'number', required: false },
			{ name: 'actualCost',      type: 'number', required: false },
			{ name: 'requiresApproval',type: 'bool',   required: false },
			{
				name: 'approvalStatus',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['pending','approved','rejected'] }
			},
			{ name: 'approvedBy',      type: 'text',   required: false, options: { max: 255 } },
			{ name: 'approvedAt',      type: 'date',   required: false },
			{ name: 'publishedUrl',    type: 'url',    required: false },
			{
				name: 'paymentStatus',
				type: 'select',
				required: false,
				options: { maxSelect: 1, values: ['unpaid','pending','paid'] }
			},
			{ name: 'notes',           type: 'text',   required: false },
			{ name: 'createdBy',       type: 'text',   required: false, options: { max: 255 } }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: null
	},

	// ─── Tournament ops checklist ─────────────────────────────────────────────
	{
		name: 'tournament_ops_checklist',
		type: 'base',
		schema: [
			{ name: 'tournamentId', type: 'text',   required: true,  options: { max: 255 } },
			{ name: 'itemId',       type: 'text',   required: true,  options: { max: 100 } },
			{ name: 'checkedBy',    type: 'text',   required: false, options: { max: 255 } },
			{ name: 'checkedAt',    type: 'date',   required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	// ─── Scoreboards ──────────────────────────────────────────────────────────
	{
		name: 'scoreboards',
		type: 'base',
		schema: [
			{ name: 'name',          type: 'text',   required: true,  options: { max: 500 } },
			{ name: 'location',      type: 'text',   required: false, options: { max: 500 } },
			{
				name: 'displayType',
				type: 'select',
				required: true,
				options: { maxSelect: 1, values: ['led','static','digital','hybrid'] }
			},
			{
				name: 'stage',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['concept','design','vendor_quote','approval','procurement',
					         'fabrication','installation','testing','live','maintenance','cancelled']
				}
			},
			{ name: 'widthFt',       type: 'number', required: false },
			{ name: 'heightFt',      type: 'number', required: false },
			{ name: 'vendorName',    type: 'text',   required: false, options: { max: 255 } },
			{ name: 'quotedCost',    type: 'number', required: false },
			{ name: 'approvedBudget',type: 'number', required: false },
			{ name: 'actualCost',    type: 'number', required: false },
			{ name: 'installDate',   type: 'date',   required: false },
			{ name: 'warrantyExpiry',type: 'date',   required: false },
			{ name: 'description',   type: 'text',   required: false },
			{ name: 'notes',         type: 'text',   required: false },
			// Downstream links
			{ name: 'approvalId',    type: 'text',   required: false, options: { max: 255 } },
			{ name: 'workOrderId',   type: 'text',   required: false, options: { max: 255 } },
			{ name: 'expenseId',     type: 'text',   required: false, options: { max: 255 } },
			{ name: 'createdBy',     type: 'text',   required: false, options: { max: 255 } }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: null
	},

	// ─── Scoreboard vendor quotes ─────────────────────────────────────────────
	{
		name: 'scoreboard_vendor_quotes',
		type: 'base',
		schema: [
			{ name: 'scoreboardId',  type: 'text',   required: true,  options: { max: 255 } },
			{ name: 'vendorName',    type: 'text',   required: true,  options: { max: 255 } },
			{ name: 'amount',        type: 'number', required: true  },
			{ name: 'leadTimeDays',  type: 'number', required: false },
			{ name: 'notes',         type: 'text',   required: false },
			{ name: 'selected',      type: 'bool',   required: false },
			{ name: 'submittedBy',   type: 'text',   required: false, options: { max: 255 } }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},

	// ─── Scoreboard install checklist ─────────────────────────────────────────
	{
		name: 'scoreboard_checklist',
		type: 'base',
		schema: [
			{ name: 'scoreboardId', type: 'text', required: true,  options: { max: 255 } },
			{ name: 'itemId',       type: 'text', required: true,  options: { max: 100 } },
			{ name: 'phase',        type: 'text', required: false, options: { max: 50 } },
			{ name: 'checkedBy',    type: 'text', required: false, options: { max: 255 } },
			{ name: 'checkedAt',    type: 'date', required: false }
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	}
];
