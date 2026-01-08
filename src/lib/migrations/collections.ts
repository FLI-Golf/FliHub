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
	}
];
