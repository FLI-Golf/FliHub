/**
 * Migration: Create Pro Payment Management Collections
 * 
 * Creates collections for managing pro payments, tournaments, and special events
 */

export const proPaymentCollections = [
	{
		name: 'tournaments',
		type: 'base',
		schema: [
			{
				name: 'name',
				type: 'text',
				required: true,
				options: { min: 1, max: 255 }
			},
			{
				name: 'season',
				type: 'number',
				required: true,
				options: { min: 2024 }
			},
			{
				name: 'tournamentNumber',
				type: 'number',
				required: false,
				options: { min: 1 }
			},
			{
				name: 'startDate',
				type: 'date',
				required: true
			},
			{
				name: 'endDate',
				type: 'date',
				required: true
			},
			{
				name: 'location',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'venue',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'prizePool',
				type: 'number',
				required: true,
				options: { min: 0 }
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['scheduled', 'in_progress', 'completed', 'cancelled']
				}
			},
			{
				name: 'description',
				type: 'editor',
				required: false
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			}
		],
		indexes: [
			'CREATE INDEX idx_tournaments_season ON tournaments (season)',
			'CREATE INDEX idx_tournaments_status ON tournaments (status)',
			'CREATE INDEX idx_tournaments_dates ON tournaments (startDate, endDate)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'tournament_results',
		type: 'base',
		schema: [
			{
				name: 'tournament',
				type: 'relation',
				required: true,
				options: {
					collectionId: 'tournaments',
					cascadeDelete: true,
					maxSelect: 1
				}
			},
			{
				name: 'pro',
				type: 'relation',
				required: true,
				options: {
					collectionId: 'pros',
					cascadeDelete: false,
					maxSelect: 1
				}
			},
			{
				name: 'placement',
				type: 'number',
				required: true,
				options: { min: 1 }
			},
			{
				name: 'earnings',
				type: 'number',
				required: true,
				options: { min: 0 }
			},
			{
				name: 'score',
				type: 'text',
				required: false,
				options: { max: 50 }
			},
			{
				name: 'rounds',
				type: 'number',
				required: false,
				options: { min: 1 }
			},
			{
				name: 'notes',
				type: 'text',
				required: false,
				options: { max: 1000 }
			}
		],
		indexes: [
			'CREATE INDEX idx_tournament_results_tournament ON tournament_results (tournament)',
			'CREATE INDEX idx_tournament_results_pro ON tournament_results (pro)',
			'CREATE INDEX idx_tournament_results_placement ON tournament_results (placement)',
			'CREATE UNIQUE INDEX idx_tournament_results_unique ON tournament_results (tournament, pro)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'special_events',
		type: 'base',
		schema: [
			{
				name: 'name',
				type: 'text',
				required: true,
				options: { min: 1, max: 255 }
			},
			{
				name: 'eventType',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: [
						'appearance',
						'clinic',
						'media',
						'promotional',
						'content_creation',
						'other'
					]
				}
			},
			{
				name: 'eventDate',
				type: 'date',
				required: true
			},
			{
				name: 'location',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'description',
				type: 'editor',
				required: false
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['scheduled', 'completed', 'cancelled']
				}
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			}
		],
		indexes: [
			'CREATE INDEX idx_special_events_type ON special_events (eventType)',
			'CREATE INDEX idx_special_events_status ON special_events (status)',
			'CREATE INDEX idx_special_events_date ON special_events (eventDate)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	},
	{
		name: 'pro_payments',
		type: 'base',
		schema: [
			{
				name: 'pro',
				type: 'relation',
				required: true,
				options: {
					collectionId: 'pros',
					cascadeDelete: false,
					maxSelect: 1
				}
			},
			{
				name: 'paymentType',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['tournament', 'special_event', 'bonus', 'other']
				}
			},
			{
				name: 'tournament',
				type: 'relation',
				required: false,
				options: {
					collectionId: 'tournaments',
					cascadeDelete: false,
					maxSelect: 1
				}
			},
			{
				name: 'specialEvent',
				type: 'relation',
				required: false,
				options: {
					collectionId: 'special_events',
					cascadeDelete: false,
					maxSelect: 1
				}
			},
			{
				name: 'amount',
				type: 'number',
				required: true,
				options: { min: 0 }
			},
			{
				name: 'paymentDate',
				type: 'date',
				required: false
			},
			{
				name: 'dueDate',
				type: 'date',
				required: false
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['pending', 'processing', 'paid', 'cancelled']
				}
			},
			{
				name: 'paymentMethod',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['bank_transfer', 'check', 'paypal', 'venmo', 'zelle', 'other']
				}
			},
			{
				name: 'transactionId',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'description',
				type: 'text',
				required: false,
				options: { max: 1000 }
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			}
		],
		indexes: [
			'CREATE INDEX idx_pro_payments_pro ON pro_payments (pro)',
			'CREATE INDEX idx_pro_payments_type ON pro_payments (paymentType)',
			'CREATE INDEX idx_pro_payments_status ON pro_payments (status)',
			'CREATE INDEX idx_pro_payments_tournament ON pro_payments (tournament)',
			'CREATE INDEX idx_pro_payments_event ON pro_payments (specialEvent)',
			'CREATE INDEX idx_pro_payments_dates ON pro_payments (paymentDate, dueDate)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	}
];
