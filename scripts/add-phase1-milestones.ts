/**
 * Add Phase 1 Milestones as Subtasks
 * 
 * Adds CEO's Phase 1 milestones as subtasks to existing tasks.
 * Uses the subTasksChecklist field to track milestone progress.
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

interface SubtaskMapping {
  taskTitle: string;
  subtasks: string[];
}

const subtaskMappings: SubtaskMapping[] = [
  {
    taskTitle: 'P1 Clothing/Shoes/Apparel',
    subtasks: [
      'Design apparel line completed',
      'Initial inventory ordered',
      'Apparel ready for marketing launch'
    ]
  },
  {
    taskTitle: 'P1 Sizzle Reel Development',
    subtasks: [
      'Sizzle reel script finalized',
      'Sizzle reel filming completed',
      'Sizzle reel editing completed',
      'Sizzle reel approved for distribution'
    ]
  },
  {
    taskTitle: 'P1-3 Documentary/Sizzle Reel',
    subtasks: [
      'Documentary concept and script approved',
      'Production crew hired',
      'Documentary filming has begun',
      'Initial footage captured'
    ]
  },
  {
    taskTitle: 'P1 Office Staff',
    subtasks: [
      'Office staff hired',
      'Staff onboarding completed',
      'Office operations fully functional',
      'Tier 3 & 4 sponsor packages defined',
      'Sales process and materials created',
      'Sales team begins signups for Tiers 3 & 4'
    ]
  },
  {
    taskTitle: 'P1 San Diego Office',
    subtasks: [
      'San Diego office lease secured',
      'Office setup complete',
      'Office operational'
    ]
  },
  {
    taskTitle: 'P1 Scottsdale Office',
    subtasks: [
      'Scottsdale office lease secured',
      'Office setup complete',
      'Office operational'
    ]
  },
  {
    taskTitle: 'P1 Office Upgrades',
    subtasks: [
      'Furniture ordered and delivered',
      'Office upgrades completed'
    ]
  },
  {
    taskTitle: 'P1-3 Marketing',
    subtasks: [
      'Smartboost vendor contract signed',
      'Marketing content strategy approved',
      'Smartboost content deliverables received',
      'In-house marketing team content created',
      'All required content for full launch completed'
    ]
  },
  {
    taskTitle: 'P1-3 Advertising',
    subtasks: [
      'Advertising campaign strategy approved',
      'Ad creative assets developed',
      'Advertising content ready for launch'
    ]
  },
  {
    taskTitle: 'P1-3 Public Relations',
    subtasks: [
      'Neology PR vendor contract signed',
      'Launch strategy developed',
      'PR materials prepared',
      'Launch strategy approved and ready'
    ]
  },
  {
    taskTitle: 'P1 MPO/FPO Sponsored Players',
    subtasks: [
      'Player sponsorship contracts signed',
      'Content filming schedule created',
      'Professional player content filming has begun',
      'Initial player content captured',
      'Disc manufacturer partnership discussions initiated',
      'Bag manufacturer partnership discussions initiated',
      'Title Disc Golf Partners secured or in advanced negotiations'
    ]
  },
  {
    taskTitle: 'P1 Tech/App Development',
    subtasks: [
      'FGL website design approved',
      'FGL website development completed',
      'FGL website is functional and live',
      'App development has begun',
      'App-website pairing initiated'
    ]
  },
  {
    taskTitle: 'P1 State Gaming Licensing',
    subtasks: [
      'Gaming licensing applications submitted',
      'Key state gaming licenses secured'
    ]
  },
  {
    taskTitle: 'P1 Executive Staff',
    subtasks: [
      'Streaming partnership negotiations initiated',
      'Streaming partnership secured or in advanced negotiations',
      'Fanduel partnership discussions initiated',
      'Gaming app partnership negotiations in progress',
      'Fanduel/Gaming app partnerships secured or in advanced negotiations',
      'Tier 1 & 2 sponsor target list created',
      'Sponsor outreach initiated',
      'Letters of intent secured for 1/5 of target sponsors (Tiers 1 & 2)'
    ]
  }
];

async function main() {
  console.log('📋 Adding Phase 1 Milestones as Subtasks...\n');

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    console.log('✓ Authenticated\n');

    const tasks = await pb.collection('tasks').getFullList();

    console.log('='.repeat(60));
    console.log('ADDING SUBTASKS TO TASKS');
    console.log('='.repeat(60));

    let updatedCount = 0;
    let totalSubtasks = 0;

    for (const mapping of subtaskMappings) {
      const task = tasks.find((t: any) => t.title === mapping.taskTitle);

      if (!task) {
        console.log(`⚠️  Task not found: ${mapping.taskTitle}`);
        continue;
      }

      // Create subtasks checklist array
      const subtasksChecklist = mapping.subtasks.map(subtask => ({
        text: subtask,
        completed: false
      }));

      await pb.collection('tasks').update(task.id, {
        subTasksChecklist: subtasksChecklist
      });

      console.log(`✓ ${mapping.taskTitle}`);
      console.log(`  Added ${mapping.subtasks.length} subtasks`);
      mapping.subtasks.forEach(st => console.log(`    - ${st}`));
      console.log();

      updatedCount++;
      totalSubtasks += mapping.subtasks.length;
    }

    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Tasks Updated: ${updatedCount}`);
    console.log(`Total Subtasks Added: ${totalSubtasks}`);
    console.log();

    console.log('✅ Phase 1 milestones added successfully!');
    console.log('\nAll 12 CEO milestones are now tracked as subtasks.');
    console.log('Progress can be monitored by checking subtask completion.');

  } catch (error: any) {
    console.error('❌ Failed to add milestones:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

main();
