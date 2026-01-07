/**
 * Add Phase 2 Milestones as Subtasks
 * 
 * Adds CEO's Phase 2 milestones as subtasks to Phase 2 tasks.
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
    taskTitle: 'P2-3 Marketing',
    subtasks: [
      'Global market absorption for FGL marketing/PR has begun',
      'Announcements made on ALL major disc golf podcasts and platforms',
      'Teams and Partners have been announced',
      'Marketing content delivered for launch'
    ]
  },
  {
    taskTitle: 'P2-3 Public Relations',
    subtasks: [
      'Launch campaign executed',
      'Media coverage secured',
      'PR materials distributed'
    ]
  },
  {
    taskTitle: 'P2 Clothing and Apparel',
    subtasks: [
      '1st successful FLI Golf limited drop completed across the US',
      'Limited drop inventory sold',
      'Customer feedback collected'
    ]
  },
  {
    taskTitle: 'P2-3 Advertising',
    subtasks: [
      'Launch advertising campaign executed',
      '50% of title and major league sponsors have been secured',
      'Tier 4 is complete (100% sold)',
      'Advertising metrics tracked'
    ]
  },
  {
    taskTitle: 'P2 Broadcasting Staff',
    subtasks: [
      'Broadcasting staff hired',
      'Broadcasting staff trained and ready for filming',
      'Equipment and logistics finalized'
    ]
  },
  {
    taskTitle: 'P2-3 Go Throw (Media Partner)',
    subtasks: [
      'FGL has sponsored multiple professional events hosted by Go Throw',
      'Event coverage completed',
      'Partnership deliverables met'
    ]
  },
  {
    taskTitle: 'P2 Mini Marketing Event',
    subtasks: [
      'Mini FLO Golf League event at Turf Paradise successfully held',
      'Local community ready for 1st season ticket sales',
      '1st look of world\'s first Stadium-Style FLI Golf course revealed',
      'Event feedback collected',
      'Pre-sale tickets for 2027 season: 20% sold ($100,000)'
    ]
  },
  {
    taskTitle: 'Pure Mobile',
    subtasks: [
      'Pure Mobile Productions has finalized production layout and logistics',
      'Production planning deposit paid',
      'Timeline and deliverables agreed'
    ]
  },
  {
    taskTitle: 'P2 Local Outreach',
    subtasks: [
      'Local school/college/athletic program outreach completed',
      'Community partnerships established',
      'Local engagement metrics tracked'
    ]
  },
  {
    taskTitle: 'P2-3 Documentary',
    subtasks: [
      'Documentary production continues',
      'Additional footage captured',
      'Editing progress on track'
    ]
  },
  {
    taskTitle: 'P2-3 Legal',
    subtasks: [
      'Phase 2 legal work completed',
      'Sponsor contracts reviewed',
      'Compliance maintained'
    ]
  }
];

// Revenue milestones (add to P2-3 Marketing as these are business outcomes)
const revenueMilestones = [
  'Engagement on subscriptions and fantasy players has begun',
  'Professional Player marketing has begun on their platforms',
  'Website/Fantasy App Subscriptions: 17% early subscriptions ($250,000)',
  'Tier 1 sponsors: 3/6 secured ($2,250,000)',
  'Tier 2 sponsors: 3/6 secured ($1,500,000)',
  'Tier 3 sponsors: 66% filled ($1,000,000)',
  'Disc licensing: $100,000 + revenue share',
  'Bag licensing: $100,000 + revenue share',
  'Clothing/Apparel sales: $44,600'
];

async function main() {
  console.log('📋 Adding Phase 2 Milestones as Subtasks...\n');

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    console.log('✓ Authenticated\n');

    const tasks = await pb.collection('tasks').getFullList();

    console.log('='.repeat(60));
    console.log('ADDING SUBTASKS TO PHASE 2 TASKS');
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
      updatedCount++;
      totalSubtasks += mapping.subtasks.length;
    }

    // Add revenue milestones to P2-3 Marketing
    const marketingTask = tasks.find((t: any) => t.title === 'P2-3 Marketing');
    if (marketingTask) {
      const existingSubtasks = (marketingTask as any).subTasksChecklist || [];
      const revenueSubtasks = revenueMilestones.map(milestone => ({
        text: milestone,
        completed: false
      }));

      await pb.collection('tasks').update(marketingTask.id, {
        subTasksChecklist: [...existingSubtasks, ...revenueSubtasks]
      });

      console.log(`\n✓ Added ${revenueMilestones.length} revenue milestones to P2-3 Marketing`);
      totalSubtasks += revenueMilestones.length;
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Tasks Updated: ${updatedCount + 1}`);
    console.log(`Total Subtasks Added: ${totalSubtasks}`);
    console.log();

    console.log('✅ Phase 2 milestones added successfully!');
    console.log('\nAll 13 CEO milestones + revenue projections tracked as subtasks.');

  } catch (error: any) {
    console.error('❌ Failed to add milestones:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

main();
