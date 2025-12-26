import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-production-6ab5.up.railway.app');

async function createCollections() {
  try {
    await pb.admins.authWithPassword('ddinsmore8@gmail.com', 'MADcap(123)');
    console.log('✅ Connected to PocketBase\n');

    // Create managers collection with proper field format
    console.log('➕ Creating managers collection...');
    try {
      const result = await pb.collections.create({
        name: 'managers',
        type: 'base',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: true,
            presentable: false,
            options: {
              min: 1,
              max: 255,
              pattern: ''
            }
          },
          {
            name: 'department',
            type: 'select',
            required: true,
            presentable: false,
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
            required: false,
            presentable: false,
            options: {
              exceptDomains: null,
              onlyDomains: null
            }
          },
          {
            name: 'phone',
            type: 'text',
            required: false,
            presentable: false,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'goals',
            type: 'editor',
            required: false,
            presentable: false,
            options: {
              convertUrls: false
            }
          }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''"
      });
      console.log('✅ Created managers with', result.schema?.length || 0, 'fields\n');
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      if (error.data) console.error(JSON.stringify(error.data, null, 2));
    }

    // Create tasks collection
    console.log('➕ Creating tasks collection...');
    try {
      const result = await pb.collections.create({
        name: 'tasks',
        type: 'base',
        schema: [
          {
            name: 'task',
            type: 'text',
            required: true,
            presentable: false,
            options: {
              min: 1,
              max: 500,
              pattern: ''
            }
          },
          {
            name: 'subTasksChecklist',
            type: 'editor',
            required: false,
            presentable: false,
            options: {
              convertUrls: false
            }
          },
          {
            name: 'managers',
            type: 'text',
            required: false,
            presentable: false,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'track',
            type: 'select',
            required: false,
            presentable: false,
            options: {
              maxSelect: 1,
              values: ['Phase 1', 'Phase 2', 'Overall', 'Other']
            }
          },
          {
            name: 'strategicGoal',
            type: 'select',
            required: false,
            presentable: false,
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
            required: false,
            presentable: false,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'quarters',
            type: 'select',
            required: false,
            presentable: false,
            options: {
              maxSelect: 1,
              values: ['Q1', 'Q2', 'Q3', 'Q4']
            }
          },
          {
            name: 'startDate',
            type: 'date',
            required: false,
            presentable: false,
            options: {
              min: '',
              max: ''
            }
          },
          {
            name: 'endDate',
            type: 'date',
            required: false,
            presentable: false,
            options: {
              min: '',
              max: ''
            }
          },
          {
            name: 'budget',
            type: 'number',
            required: false,
            presentable: false,
            options: {
              min: 0,
              max: null,
              noDecimal: false
            }
          },
          {
            name: 'income',
            type: 'number',
            required: false,
            presentable: false,
            options: {
              min: 0,
              max: null,
              noDecimal: false
            }
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            presentable: false,
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
      console.log('✅ Created tasks with', result.schema?.length || 0, 'fields\n');
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      if (error.data) console.error(JSON.stringify(error.data, null, 2));
    }

    // Create broadcast_partners collection
    console.log('➕ Creating broadcast_partners collection...');
    try {
      const result = await pb.collections.create({
        name: 'broadcast_partners',
        type: 'base',
        schema: [
          {
            name: 'point',
            type: 'text',
            required: true,
            presentable: false,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'details',
            type: 'editor',
            required: true,
            presentable: false,
            options: {
              convertUrls: false
            }
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            presentable: false,
            options: {
              maxSelect: 1,
              values: ['Key Point', 'Supporting Point', 'Risk', 'Opportunity']
            }
          },
          {
            name: 'category',
            type: 'select',
            required: true,
            presentable: false,
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
            presentable: false,
            options: {
              maxSelect: 1,
              values: ['High', 'Medium', 'Low']
            }
          },
          {
            name: 'tags',
            type: 'text',
            required: false,
            presentable: false,
            options: {
              min: null,
              max: null,
              pattern: ''
            }
          },
          {
            name: 'additionalNotes',
            type: 'editor',
            required: false,
            presentable: false,
            options: {
              convertUrls: false
            }
          }
        ],
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''"
      });
      console.log('✅ Created broadcast_partners with', result.schema?.length || 0, 'fields\n');
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
