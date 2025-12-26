import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-production-6ab5.up.railway.app');

async function createCollections() {
  try {
    await pb.admins.authWithPassword('ddinsmore8@gmail.com', 'MADcap(123)');
    console.log('✅ Connected to PocketBase\n');

    // Create managers collection
    console.log('➕ Creating managers collection...');
    try {
      await pb.collections.create({
        name: 'managers',
        type: 'base',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: true,
            options: { min: 1, max: 255 }
          },
          {
            name: 'department',
            type: 'select',
            required: true,
            options: {
              maxSelect: 1,
              values: [
                'Publicist',
                'Sales',
                'Product Development',
                'Finance',
                'Marketing and PR',
                'Technical',
                'Production',
                'Consultant',
                'Operations',
                'Apparel'
              ]
            }
          },
          {
            name: 'email',
            type: 'email',
            required: false
          },
          {
            name: 'phone',
            type: 'text',
            required: false
          },
          {
            name: 'goals',
            type: 'editor',
            required: false
          }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''"
      });
      console.log('✅ Created managers\n');
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      if (error.data) console.error(JSON.stringify(error.data, null, 2));
    }

    // Create tasks collection
    console.log('➕ Creating tasks collection...');
    try {
      await pb.collections.create({
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
            required: false,
            options: { min: 0 }
          },
          {
            name: 'income',
            type: 'number',
            required: false,
            options: { min: 0 }
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
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''"
      });
      console.log('✅ Created tasks\n');
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      if (error.data) console.error(JSON.stringify(error.data, null, 2));
    }

    // Create broadcast_partners collection
    console.log('➕ Creating broadcast_partners collection...');
    try {
      await pb.collections.create({
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
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''"
      });
      console.log('✅ Created broadcast_partners\n');
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      if (error.data) console.error(JSON.stringify(error.data, null, 2));
    }

    console.log('\n✅ All collections created successfully!');
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
  }
}

createCollections();
