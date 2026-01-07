import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function seedRelatedExpenses() {
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );

    console.log('🌱 Seeding expenses with proper relationships...\n');

    // Get existing departments
    const departments = await pb.collection('departments').getFullList();
    console.log(`Found ${departments.length} departments`);

    // Get existing projects
    const projects = await pb.collection('projects').getFullList();
    console.log(`Found ${projects.length} projects`);

    // Create vendors first
    console.log('\n📦 Creating vendors...');
    const vendorData = [
      {
        vendor_name: 'CloudTech Solutions',
        vendor_email: 'billing@cloudtech.example.com',
        vendor_phone: '555-0101',
        vendor_type: 'Technology',
        vendor_status: 'active'
      },
      {
        vendor_name: 'Marketing Pro Agency',
        vendor_email: 'accounts@marketingpro.example.com',
        vendor_phone: '555-0102',
        vendor_type: 'Marketing',
        vendor_status: 'active'
      },
      {
        vendor_name: 'Media Production Studios',
        vendor_email: 'billing@mediastudios.example.com',
        vendor_phone: '555-0103',
        vendor_type: 'Content',
        vendor_status: 'active'
      },
      {
        vendor_name: 'Office Supplies Co',
        vendor_email: 'sales@officesupplies.example.com',
        vendor_phone: '555-0104',
        vendor_type: 'Operations',
        vendor_status: 'active'
      }
    ];

    const vendors = [];
    for (const vendor of vendorData) {
      const created = await pb.collection('vendors').create(vendor);
      vendors.push(created);
      console.log(`  ✓ Created vendor: ${vendor.vendor_name}`);
    }

    // Create tasks for projects (we need tasks to link expenses)
    console.log('\n📋 Creating tasks for projects...');
    const tasks = [];
    
    // Get a few projects from different departments
    const marketingProjects = projects.filter(p => {
      const dept = departments.find(d => d.id === p.department);
      return dept?.name === 'Marketing';
    });
    
    const techProjects = projects.filter(p => {
      const dept = departments.find(d => d.id === p.department);
      return dept?.name === 'Technology';
    });
    
    const contentProjects = projects.filter(p => {
      const dept = departments.find(d => d.id === p.department);
      return dept?.name === 'Content & Media';
    });

    // Create tasks for marketing projects
    if (marketingProjects.length > 0) {
      const project = marketingProjects[0];
      const task = await pb.collection('tasks').create({
        title: 'Social Media Campaign',
        description: 'Run Q1 social media advertising campaign',
        projectId: project.id,
        status: 'in_progress',
        priority: 'high',
        estimatedHours: 40,
        actualHours: 15,
        task_budget: 50000,
        task_actual_cost: 0
      });
      tasks.push({ task, projectId: project.id, department: project.department });
      console.log(`  ✓ Created task: ${task.title} (Marketing)`);
    }

    // Create tasks for tech projects
    if (techProjects.length > 0) {
      const project = techProjects[0];
      const task = await pb.collection('tasks').create({
        title: 'Cloud Infrastructure',
        description: 'Maintain and scale cloud hosting infrastructure',
        projectId: project.id,
        status: 'in_progress',
        priority: 'high',
        estimatedHours: 80,
        actualHours: 30,
        task_budget: 100000,
        task_actual_cost: 0
      });
      tasks.push({ task, projectId: project.id, department: project.department });
      console.log(`  ✓ Created task: ${task.title} (Technology)`);
    }

    // Create tasks for content projects
    if (contentProjects.length > 0) {
      const project = contentProjects[0];
      const task = await pb.collection('tasks').create({
        title: 'Video Production',
        description: 'Produce promotional video content',
        projectId: project.id,
        status: 'in_progress',
        priority: 'medium',
        estimatedHours: 60,
        actualHours: 20,
        task_budget: 75000,
        task_actual_cost: 0
      });
      tasks.push({ task, projectId: project.id, department: project.department });
      console.log(`  ✓ Created task: ${task.title} (Content & Media)`);
    }

    // Create expenses linked to tasks
    console.log('\n💰 Creating expenses linked to tasks...');
    
    const expenseData = [
      // Marketing expenses
      {
        description: 'Social media advertising - Facebook/Instagram',
        amount: 8500,
        category: 'Advertising',
        status: 'paid',
        date: new Date('2026-01-15').toISOString(),
        paidDate: new Date('2026-01-20').toISOString(),
        paymentMethod: 'credit_card',
        notes: 'Q1 social media campaign spend'
      },
      {
        description: 'Google Ads campaign',
        amount: 12000,
        category: 'Marketing',
        status: 'approved',
        date: new Date('2026-01-20').toISOString(),
        paymentMethod: '',
        notes: 'Search and display advertising'
      },
      {
        description: 'PR agency retainer',
        amount: 15000,
        category: 'Public relations',
        status: 'submitted',
        date: new Date('2026-02-01').toISOString(),
        paymentMethod: '',
        notes: 'Monthly PR services'
      },
      // Technology expenses
      {
        description: 'AWS cloud hosting',
        amount: 6800,
        category: 'Internal Tech Budget',
        status: 'paid',
        date: new Date('2026-01-10').toISOString(),
        paidDate: new Date('2026-01-15').toISOString(),
        paymentMethod: 'credit_card',
        notes: 'Monthly cloud infrastructure costs'
      },
      {
        description: 'Database hosting and backup',
        amount: 3200,
        category: 'Internal Tech Budget',
        status: 'approved',
        date: new Date('2026-01-12').toISOString(),
        paymentMethod: '',
        notes: 'Database services'
      },
      {
        description: 'Software licenses - Development tools',
        amount: 4500,
        category: 'Software',
        status: 'paid',
        date: new Date('2026-01-05').toISOString(),
        paidDate: new Date('2026-01-10').toISOString(),
        paymentMethod: 'credit_card',
        notes: 'Annual software subscriptions'
      },
      {
        description: 'API integration development',
        amount: 18000,
        category: 'Tech/App Development',
        status: 'submitted',
        date: new Date('2026-02-05').toISOString(),
        paymentMethod: '',
        notes: 'Third-party API integration work'
      },
      // Content & Media expenses
      {
        description: 'Video production services',
        amount: 25000,
        category: 'Production Studio',
        status: 'approved',
        date: new Date('2026-01-25').toISOString(),
        paymentMethod: '',
        notes: 'Promotional video shoot and editing'
      },
      {
        description: 'Stock footage and music licensing',
        amount: 2800,
        category: 'Production Studio',
        status: 'paid',
        date: new Date('2026-01-18').toISOString(),
        paidDate: new Date('2026-01-22').toISOString(),
        paymentMethod: 'credit_card',
        notes: 'Content licensing for video production'
      },
      {
        description: 'Photography equipment rental',
        amount: 1500,
        category: 'Production Studio',
        status: 'submitted',
        date: new Date('2026-02-10').toISOString(),
        paymentMethod: '',
        notes: 'Camera and lighting equipment'
      }
    ];

    let expensesCreated = 0;
    
    // Link expenses to appropriate tasks
    for (let i = 0; i < expenseData.length; i++) {
      const expense = expenseData[i];
      let taskInfo;
      
      // Determine which task to link based on category
      if (expense.category === 'Advertising' || expense.category === 'Marketing' || expense.category === 'Public relations') {
        taskInfo = tasks.find(t => {
          const dept = departments.find(d => d.id === t.department);
          return dept?.name === 'Marketing';
        });
      } else if (expense.category === 'Internal Tech Budget' || expense.category === 'Software' || expense.category === 'Tech/App Development') {
        taskInfo = tasks.find(t => {
          const dept = departments.find(d => d.id === t.department);
          return dept?.name === 'Technology';
        });
      } else if (expense.category === 'Production Studio') {
        taskInfo = tasks.find(t => {
          const dept = departments.find(d => d.id === t.department);
          return dept?.name === 'Content & Media';
        });
      }

      // Find appropriate vendor
      let vendorId = vendors[0].id; // default
      if (expense.category.includes('Tech') || expense.category === 'Software') {
        vendorId = vendors.find(v => v.vendor_name === 'CloudTech Solutions')?.id || vendors[0].id;
      } else if (expense.category === 'Marketing' || expense.category === 'Advertising' || expense.category === 'Public relations') {
        vendorId = vendors.find(v => v.vendor_name === 'Marketing Pro Agency')?.id || vendors[1].id;
      } else if (expense.category === 'Production Studio') {
        vendorId = vendors.find(v => v.vendor_name === 'Media Production Studios')?.id || vendors[2].id;
      }

      const expenseRecord = {
        ...expense,
        taskId: taskInfo?.task.id || '',
        vendor: vendorId
      };

      try {
        const created = await pb.collection('expenses').create(expenseRecord);
        expensesCreated++;
        
        const deptName = taskInfo ? departments.find(d => d.id === taskInfo.department)?.name : 'Unlinked';
        console.log(`  ✓ Created expense: ${expense.description} ($${expense.amount}) - ${deptName}`);
      } catch (err: any) {
        console.error(`  ✗ Failed to create expense: ${expense.description}`);
        console.error(`    Error: ${err.message}`);
        if (err.data) {
          console.error(`    Details: ${JSON.stringify(err.data, null, 2)}`);
        }
        throw err; // Re-throw to stop execution
      }
    }

    console.log(`\n✅ Successfully created:`);
    console.log(`   ${vendors.length} vendors`);
    console.log(`   ${tasks.length} tasks`);
    console.log(`   ${expensesCreated} expenses`);
    console.log(`\n🔗 All expenses are now properly linked:`);
    console.log(`   Expense → Task → Project → Department`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
  }
}

seedRelatedExpenses();
