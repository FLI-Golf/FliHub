/**
 * Seed departments, projects, and tasks from the FLI Golf financial plan.
 *
 * Funding date : June 15, 2026
 * Phase 1      : Jun 15 – Sep 30, 2026   $2,800,000
 * Phase 2      : Oct  1 – Jan 31, 2027   $1,473,300
 * Phase 3      : Feb  1 – Jan  1, 2028   $1,315,000
 *
 * Idempotent — skips records that already exist by name.
 * Usage: npx tsx scripts/seed-departments.ts
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

// ── User profile IDs ──────────────────────────────────────────────────────────
const ANDREW   = 'z3gnzf5fg1284or'; // andrew@fligolf.com  — default fallback
const DUSTIN   = 'l8wj56007t6cqoo'; // dustin@fligolf.com
const COREY    = 'tsyjlae5ienzd8z'; // corey@fligolf.com
const MARK     = 'b1q8lmerdwzt1d4'; // mark@fligolf.com
const NATE     = 'l1dvc585cozc3ov'; // nate@fligolf.com
const KIMBERLY = 'cr1zmsps9yive0k'; // kimberly@fligolf.com
const GARY     = 'ipa0vii1qs3ycbj'; // gary@fligolf.com

// ── Phase date ranges ─────────────────────────────────────────────────────────
const P1_START = '2026-06-15';
const P1_END   = '2026-09-30';
const P2_START = '2026-10-01';
const P2_END   = '2027-01-31';
const P3_START = '2027-02-01';
const P3_END   = '2028-01-01';

// DEPARTMENTS_DATA — filled below
const DEPARTMENTS_DATA: any[] = [
  // ── 1. Executive ────────────────────────────────────────────────────────────
  {
    dept: {
      name: 'Executive',
      code: 'EXEC',
      description: 'CEO, COO, and executive leadership. Covers salaries, league partnership travel, and strategic operations.',
      status: 'active',
      headOfDepartment: DUSTIN,
    },
    projects: [
      {
        name: 'Executive Salaries & Benefits',
        description: 'Executive team compensation across all three phases.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P3_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 Executive Staff Salaries', description: 'Executive team salaries Jun–Sep 2026.', task_budget: 1140000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: DUSTIN },
          { title: 'P1 League Partnership Travel', description: 'Travel for league partnership meetings and site visits.', task_budget: 60000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'medium', assignedTo: DUSTIN },
          { title: 'P2 Executive Staff Salaries', description: 'Executive team salaries Oct 2026–Jan 2027.', task_budget: 0, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'high', assignedTo: DUSTIN },
          { title: 'P3 Executive Staff Salaries', description: 'Executive team salaries Feb 2027–Jan 2028.', task_budget: 0, startDate: P3_START, dueDate: P3_END, status: 'todo', priority: 'high', assignedTo: DUSTIN },
        ],
      },
    ],
  },

  // ── 2. Operations ────────────────────────────────────────────────────────────
  {
    dept: {
      name: 'Operations',
      code: 'OPS',
      description: 'Office facilities (San Diego & Scottsdale), office staff, IT infrastructure, and event logistics.',
      status: 'active',
      headOfDepartment: ANDREW,
    },
    projects: [
      {
        name: 'Facilities & Office Staff',
        description: 'San Diego and Scottsdale offices — leases, utilities, furniture, and office personnel.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P3_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 Office Staff Salaries', description: 'Office staff salaries Jun–Sep 2026.', task_budget: 286000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: ANDREW },
          { title: 'P1 San Diego Office Lease & Ops', description: 'Annual lease and operating costs for San Diego HQ.', task_budget: 95000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: ANDREW },
          { title: 'P1 Scottsdale Office Lease & Ops', description: 'Annual lease and operating costs for Scottsdale office.', task_budget: 48000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'medium', assignedTo: ANDREW },
          { title: 'P1 Utilities — Both Offices', description: 'Combined utilities for San Diego and Scottsdale.', task_budget: 48000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'medium', assignedTo: ANDREW },
          { title: 'P1 Office Upgrades & Furniture', description: 'AZ office furniture and equipment upgrades.', task_budget: 5000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'low', assignedTo: ANDREW },
          { title: 'P1 Mobile Data & Connectivity', description: 'Staff mobile data plans and office connectivity.', task_budget: 10000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'low', assignedTo: ANDREW },
        ],
      },
      {
        name: 'Events & Community Outreach',
        description: 'Mini marketing events, local school/college outreach, and Go Throw event sponsorships.',
        type: 'event', status: 'planned',
        startDate: P2_START, endDate: P2_END, fiscalYear: '2026',
        tasks: [
          { title: 'P2 Mini FLO Golf Event — Turf Paradise', description: 'Mini FLO Golf League event at Turf Paradise. First look at stadium-style course.', task_budget: 250000, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'high', assignedTo: ANDREW },
          { title: 'P2 Local School & College Outreach', description: 'Outreach to local schools, colleges, and athletic programs.', task_budget: 20000, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'medium', assignedTo: ANDREW },
        ],
      },
    ],
  },

  // ── 3. Marketing ─────────────────────────────────────────────────────────────
  {
    dept: {
      name: 'Marketing',
      code: 'MKT',
      description: 'Brand marketing, public relations, advertising, and apparel/merchandise drops across all phases.',
      status: 'active',
      headOfDepartment: COREY,
    },
    projects: [
      {
        name: 'Marketing Campaigns',
        description: 'Smartboost and in-house marketing — $10k/mo Phase 1, $80k/mo Phase 2, scale in Phase 3.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P3_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 Marketing — Smartboost & In-House', description: '$10k/month × 6 months. Content creation and brand awareness.', task_budget: 60000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: COREY },
          { title: 'P2 Marketing — Launch Campaign', description: '$80k/month × 4 months. Global market absorption launch.', task_budget: 320000, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'high', assignedTo: COREY },
          { title: 'P3 Marketing — Scale & Sustain', description: 'Continued marketing through Season 1 and Season 2 pre-sales.', task_budget: 1020000, startDate: P3_START, dueDate: P3_END, status: 'todo', priority: 'high', assignedTo: COREY },
        ],
      },
      {
        name: 'Public Relations',
        description: 'Neology PR — launch strategy, media coverage, and podcast announcements.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P3_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 PR — Launch Strategy Prep', description: 'Neology PR launch strategy preparation.', task_budget: 30000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: COREY },
          { title: 'P2 PR — Launch Campaign Execution', description: 'Announcements on all major disc golf podcasts and platforms.', task_budget: 100000, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'high', assignedTo: COREY },
          { title: 'P3 PR — Ongoing Coverage', description: 'Ongoing PR through Season 1 execution.', task_budget: 70000, startDate: P3_START, dueDate: P3_END, status: 'todo', priority: 'medium', assignedTo: COREY },
        ],
      },
      {
        name: 'Advertising',
        description: 'Paid advertising across digital and traditional channels.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P3_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 Advertising — Pre-Launch', description: 'Pre-launch advertising campaign preparation.', task_budget: 50000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'medium', assignedTo: COREY },
          { title: 'P2 Advertising — Launch Push', description: 'Launch advertising campaign execution.', task_budget: 100000, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'high', assignedTo: COREY },
          { title: 'P3 Advertising — Season 1', description: 'Continued advertising through Season 1.', task_budget: 50000, startDate: P3_START, dueDate: P3_END, status: 'todo', priority: 'medium', assignedTo: COREY },
        ],
      },
      {
        name: 'Apparel & Merchandise',
        description: 'FLI Golf limited apparel drops — sponsored player order and retail drops.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P3_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 Apparel — Sponsored Player & Marketing Order', description: 'Initial apparel order for sponsored players and marketing use.', task_budget: 18300, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'medium', assignedTo: COREY },
          { title: 'P2 Apparel — First Limited Drop', description: 'First FLI Golf limited drop across the US.', task_budget: 18300, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'high', assignedTo: COREY },
          { title: 'P3 Apparel — Multiple Season Drops', description: 'Multiple apparel drops through Season 1.', task_budget: 105000, startDate: P3_START, dueDate: P3_END, status: 'todo', priority: 'medium', assignedTo: COREY },
        ],
      },
    ],
  },

  // ── 4. Technology ─────────────────────────────────────────────────────────────
  {
    dept: {
      name: 'Technology',
      code: 'TECH',
      description: 'App development, hardware/software infrastructure, gaming platform, and Pure Mobile production technology.',
      status: 'active',
      headOfDepartment: NATE,
    },
    projects: [
      {
        name: 'App & Platform Development',
        description: 'FGL website, mobile app, fantasy/gaming platform, and scoring technology.',
        type: 'campaign', status: 'in_progress',
        startDate: P1_START, endDate: P2_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 Tech & App Development', description: 'FGL website functional and mobile app development begun.', task_budget: 150000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: NATE },
          { title: 'P1 Hardware & Software — Both Offices', description: 'Computers, monitors, and software licenses for both offices.', task_budget: 18000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'medium', assignedTo: NATE },
        ],
      },
      {
        name: 'Production Technology — Pure Mobile',
        description: 'Pure Mobile Productions broadcast and production technology deposit and buildout.',
        type: 'campaign', status: 'planned',
        startDate: P2_START, endDate: P3_END, fiscalYear: '2026',
        tasks: [
          { title: 'P2 Pure Mobile — Production Planning Deposit', description: 'Deposit to begin production planning and logistics with Pure Mobile.', task_budget: 200000, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'high', assignedTo: NATE },
          { title: 'P3 Pure Mobile — Production Completion', description: 'Remaining production costs for Pure Mobile broadcast setup.', task_budget: 1000000, startDate: P3_START, dueDate: P3_END, status: 'todo', priority: 'high', assignedTo: NATE },
        ],
      },
    ],
  },

  // ── 5. Legal & Compliance ─────────────────────────────────────────────────────
  {
    dept: {
      name: 'Legal & Compliance',
      code: 'LEGAL',
      description: 'Legal counsel, state gaming licensing, contracts, and ongoing compliance across all phases.',
      status: 'active',
      headOfDepartment: ANDREW,
    },
    projects: [
      {
        name: 'Legal Services',
        description: 'Ongoing legal counsel for contracts, partnerships, and compliance.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P3_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 Legal — Contracts & Counsel', description: 'Phase 1 legal work — player contracts, sponsor agreements, entity setup.', task_budget: 50000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: ANDREW },
          { title: 'P2 Legal — Launch Agreements', description: 'Phase 2 legal work — broadcast agreements, franchise docs.', task_budget: 25000, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'high', assignedTo: ANDREW },
          { title: 'P3 Legal — Season 1 Support', description: 'Phase 3 ongoing legal support through Season 1.', task_budget: 25000, startDate: P3_START, dueDate: P3_END, status: 'todo', priority: 'medium', assignedTo: ANDREW },
        ],
      },
      {
        name: 'Gaming Licensing',
        description: 'State gaming licenses required for fantasy and wagering partnerships.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P1_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 State Gaming Licenses — Key States', description: 'Gaming licenses for key states to enable FanDuel/PrizePicks partnerships.', task_budget: 100000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: ANDREW },
        ],
      },
    ],
  },

  // ── 6. Player Development ─────────────────────────────────────────────────────
  {
    dept: {
      name: 'Player Development',
      code: 'PLAYER',
      description: 'MPO and FPO sponsored player contracts, player content, and travel support.',
      status: 'active',
      headOfDepartment: GARY,
    },
    projects: [
      {
        name: 'Player Sponsorships',
        description: 'MPO and FPO sponsored player contracts across all phases.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P3_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 MPO & FPO Sponsored Player Contracts', description: 'Phase 1 player sponsorship payments — MPO and FPO roster.', task_budget: 300000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: GARY },
          { title: 'P2 Player Marketing Activation', description: 'Professional player marketing on their platforms. Teams and partners announced.', task_budget: 0, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'high', assignedTo: GARY },
          { title: 'P3 Player Sponsorships — Season 1', description: 'Annual player contracts through Season 1 execution.', task_budget: 300000, startDate: P3_START, dueDate: P3_END, status: 'todo', priority: 'high', assignedTo: GARY },
        ],
      },
    ],
  },

  // ── 7. Content & Media ────────────────────────────────────────────────────────
  {
    dept: {
      name: 'Content & Media',
      code: 'MEDIA',
      description: 'Documentary, sizzle reel, Go Throw media partnership, broadcasting staff, and streaming infrastructure.',
      status: 'active',
      headOfDepartment: MARK,
    },
    projects: [
      {
        name: 'Documentary & Sizzle Reel',
        description: 'Full documentary production and sizzle reel from initial filming through completion.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P3_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 Documentary — Initial Production & Staff', description: 'Initial product and production staff. Documentary filming begun.', task_budget: 100000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: MARK },
          { title: 'P1 Sizzle Reel Development', description: 'Separate sizzle reel development for sponsor and partner presentations.', task_budget: 5000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: MARK },
          { title: 'P2 Documentary — Continued Production', description: 'All production continues through launch phase.', task_budget: 250000, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'high', assignedTo: MARK },
          { title: 'P3 Documentary — Completion', description: 'Final production and delivery of completed documentary.', task_budget: 150000, startDate: P3_START, dueDate: P3_END, status: 'todo', priority: 'high', assignedTo: MARK },
        ],
      },
      {
        name: 'Go Throw Media Partnership',
        description: 'Quarterly payments to Go Throw for professional event coverage and media partnership.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P2_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 Go Throw — Payments 1 & 2 (Q1–Q2)', description: 'First two quarterly payments to Go Throw media partner.', task_budget: 40000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'medium', assignedTo: MARK },
          { title: 'P2 Go Throw — Payments 3 & 4 (Q3–Q4)', description: 'Final two quarterly payments. FGL sponsors multiple Go Throw events.', task_budget: 40000, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'medium', assignedTo: MARK },
        ],
      },
      {
        name: 'Broadcasting',
        description: 'Broadcasting staff training, logistics, and live production readiness.',
        type: 'campaign', status: 'planned',
        startDate: P2_START, endDate: P2_END, fiscalYear: '2026',
        tasks: [
          { title: 'P2 Broadcasting Staff Training & Logistics', description: 'Train broadcasting staff and finalize production logistics for Season 1.', task_budget: 150000, startDate: P2_START, dueDate: P2_END, status: 'todo', priority: 'high', assignedTo: MARK },
        ],
      },
    ],
  },

  // ── 8. Finance & Administration ───────────────────────────────────────────────
  {
    dept: {
      name: 'Finance & Administration',
      code: 'FIN',
      description: 'Payroll processing, employee benefits, insurance, relocation, and miscellaneous operational reserves.',
      status: 'active',
      headOfDepartment: KIMBERLY,
    },
    projects: [
      {
        name: 'Payroll & Benefits',
        description: 'Payroll processing, health insurance, employee benefits, and relocation costs.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P3_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 Payroll Processing & Insurance', description: 'Payroll processing fees, health insurance, and relocation costs for new hires.', task_budget: 106000, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'high', assignedTo: KIMBERLY },
          { title: 'P3 League Insurance', description: 'Annual league liability insurance for Season 1.', task_budget: 80000, startDate: P3_START, dueDate: P3_END, status: 'todo', priority: 'high', assignedTo: KIMBERLY },
          { title: 'P3 Employee Health Insurance', description: 'Employee health insurance for full operational year.', task_budget: 65000, startDate: P3_START, dueDate: P3_END, status: 'todo', priority: 'high', assignedTo: KIMBERLY },
        ],
      },
      {
        name: 'Operational Reserve',
        description: 'Miscellaneous and contingency budget for unexpected Phase 1 expenses.',
        type: 'campaign', status: 'planned',
        startDate: P1_START, endDate: P1_END, fiscalYear: '2026',
        tasks: [
          { title: 'P1 Miscellaneous & Contingency', description: 'Phase 1 miscellaneous expenses and operational contingency.', task_budget: 80700, startDate: P1_START, dueDate: P1_END, status: 'todo', priority: 'low', assignedTo: KIMBERLY },
        ],
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function findByName(collection: string, name: string): Promise<any | null> {
  try {
    const results = await pb.collection(collection).getFullList({ filter: `name = "${name.replace(/"/g, '\\"')}"` });
    return results[0] ?? null;
  } catch { return null; }
}

async function findTaskByTitle(projectId: string, title: string): Promise<any | null> {
  try {
    const results = await pb.collection('tasks').getFullList({ filter: `projectId = "${projectId}" && title = "${title.replace(/"/g, '\\"')}"` });
    return results[0] ?? null;
  } catch { return null; }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 FliHub — seed departments, projects & tasks\n');
  console.log(`   PocketBase: ${process.env.POCKETBASE_URL}`);

  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,
    process.env.POCKETBASE_ADMIN_PASSWORD!
  );
  console.log('✅ Authenticated\n');

  let deptCreated = 0, deptSkipped = 0;
  let projCreated = 0, projSkipped = 0;
  let taskCreated = 0, taskSkipped = 0;

  for (const entry of DEPARTMENTS_DATA) {
    // ── Department ──────────────────────────────────────────────────────────
    let deptRecord = await findByName('departments', entry.dept.name);
    if (deptRecord) {
      console.log(`  ⚠️  dept skip   ${entry.dept.name}`);
      deptSkipped++;
    } else {
      deptRecord = await pb.collection('departments').create({
        ...entry.dept,
        department_annual_budget: 0,
        department_actual_expenses: 0,
        department_budget_mode: 'annual_cap', // required by PB schema; app logic ignores this field
      });
      console.log(`  ✅ dept        ${entry.dept.name}`);
      deptCreated++;
    }

    // ── Projects ────────────────────────────────────────────────────────────
    for (const proj of entry.projects) {
      let projRecord = await findByName('projects', proj.name);
      if (projRecord) {
        console.log(`     ⚠️  proj skip   ${proj.name}`);
        projSkipped++;
      } else {
        const taskBudgetTotal = proj.tasks.reduce((s: number, t: any) => s + (t.task_budget ?? 0), 0);
        projRecord = await pb.collection('projects').create({
          name: proj.name,
          description: proj.description,
          type: proj.type,
          status: proj.status,
          startDate: proj.startDate,
          endDate: proj.endDate,
          fiscalYear: proj.fiscalYear,
          department: deptRecord.id,
          project_budget: taskBudgetTotal,
          project_actual_expenses: 0,
          project_forecasted_expenses: taskBudgetTotal,
          project_budget_mode: 'auto', // required by PB schema; app logic ignores this field
        });
        console.log(`     ✅ proj        ${proj.name}  ($${taskBudgetTotal.toLocaleString()})`);
        projCreated++;
      }

      // ── Tasks ──────────────────────────────────────────────────────────
      for (const task of proj.tasks) {
        const existing = await findTaskByTitle(projRecord.id, task.title);
        if (existing) {
          console.log(`        ⚠️  task skip   ${task.title}`);
          taskSkipped++;
        } else {
          await pb.collection('tasks').create({
            title: task.title,
            description: task.description,
            projectId: projRecord.id,
            status: task.status,
            priority: task.priority,
            startDate: task.startDate,
            dueDate: task.dueDate,
            task_budget: task.task_budget,
            task_actual_cost: 0,
            assignedTo: task.assignedTo,
            estimatedHours: 0,
            actualHours: 0,
          });
          console.log(`        ✅ task        ${task.title}  ($${(task.task_budget ?? 0).toLocaleString()})`);
          taskCreated++;
        }
      }
    }

    // ── Roll up dept budget from projects ───────────────────────────────────
    const allProjects = await pb.collection('projects').getFullList({ filter: `department = "${deptRecord.id}"` });
    const deptBudget = allProjects.reduce((s: number, p: any) => s + (p.project_budget ?? 0), 0);
    await pb.collection('departments').update(deptRecord.id, { department_annual_budget: deptBudget });
    console.log(`  💰 dept total  ${entry.dept.name}: $${deptBudget.toLocaleString()}\n`);
  }

  console.log('══════════════════════════════════════════════════════════');
  console.log('✅ Seed complete');
  console.log(`   Departments : ${deptCreated} created, ${deptSkipped} skipped`);
  console.log(`   Projects    : ${projCreated} created, ${projSkipped} skipped`);
  console.log(`   Tasks       : ${taskCreated} created, ${taskSkipped} skipped`);
  console.log('══════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('❌ Fatal:', err?.message ?? err);
  if (err?.data) console.error('Details:', JSON.stringify(err.data, null, 2));
  process.exit(1);
});
