/**
 * reset-to-funded.ts
 *
 * Full data reset for FLI Golf League — funded June 30, 2026.
 * Wipes all test/seed data and rebuilds the four departments
 * aligned to the $7.5M Use of Proceeds allocation.
 *
 * Usage: npx tsx scripts/reset-to-funded.ts [--dry-run]
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const FUNDED_DATE = '2026-06-30';
const PHASE1_END = '2026-12-31';

// Admin user profile ID — used as default headOfDepartment
const DEFAULT_HEAD_ID = 'w8if7xf53rcne0h';

const pb = new PocketBase(process.env.POCKETBASE_URL);

// ── helpers ──────────────────────────────────────────────────────────────────

async function clearCollection(name: string) {
  try {
    const records = await pb.collection(name).getFullList({ batch: 500 });
    let deleted = 0;
    for (const r of records) {
      try {
        if (!DRY_RUN) await pb.collection(name).delete(r.id);
        deleted++;
      } catch (e: any) {
        console.warn(`  ⚠️  Could not delete ${name}/${r.id}: ${e.message}`);
      }
    }
    console.log(`  ${DRY_RUN ? '[dry-run]' : '✅'} ${name}: ${deleted} records removed`);
  } catch (e: any) {
    console.log(`  ⚠️  ${name}: ${e.message} (skipped)`);
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏌️  FLI Golf League — Reset to Funded (June 30, 2026)');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '⚠️  LIVE'}\n`);

  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,
    process.env.POCKETBASE_ADMIN_PASSWORD!
  );
  console.log('✅ Authenticated\n');

  // ── STEP 1: Wipe transactional / test data ──────────────────────────────
  console.log('━━━ STEP 1: Clear test data ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Order matters — delete children before parents
  const collectionsToWipe = [
    'tasks',
    'projects',
    'expenses',
    'vendors',
    'approvals',
    'sponsor_franchise_bridge',
    'franchise_deals',
    'franchise_opportunities',
    'franchise_leads',
    'franchise_territories',
    'sponsors',
    'fgl_funding_model',
    'departments',
  ];

  for (const col of collectionsToWipe) {
    await clearCollection(col);
  }

  // ── STEP 2: Rebuild departments from Use of Proceeds ───────────────────
  console.log('\n━━━ STEP 2: Create departments (Use of Proceeds) ━━━━━━━━━━━━');

  const departments = [
    {
      name: 'Event Production & Technology',
      description:
        'Venue setup, course design, obstacle fabrication, live streaming infrastructure, broadcast production, scoring technology, real-time data feeds, mobile app and fan-facing digital experience.',
      annualBudget: 2_625_000,
      color: 'amber',
    },
    {
      name: 'League Operations & Team Development',
      description:
        'Player contracts, travel, competition logistics for 20+ committed pros, team franchise development, owner onboarding, league office staffing, rulebook and officiating standards.',
      annualBudget: 1_875_000,
      color: 'emerald',
    },
    {
      name: 'Media & Content Buildout',
      description:
        'Documentary and behind-the-scenes content, trading card and gaming asset production, social media content team, athlete storytelling, broadcast rights packaging for domestic and international distribution.',
      annualBudget: 1_500_000,
      color: 'violet',
    },
    {
      name: 'Marketing, Working Capital & Reserve',
      description:
        'Launch campaign targeting disc golf, sports betting and fantasy audiences, sponsor acquisition, brand partnership outreach, 6+ month operating reserve, contingency buffer.',
      annualBudget: 1_500_000,
      color: 'blue',
    },
  ];

  const deptIds: Record<string, string> = {};

  for (const dept of departments) {
    console.log(`  Creating: ${dept.name} ($${dept.annualBudget.toLocaleString()})`);
    if (!DRY_RUN) {
      const created = await pb.collection('departments').create({
        name: dept.name,
        description: dept.description,
        department_annual_budget: dept.annualBudget,
        department_manual_budget_override: dept.annualBudget,
        department_budget_mode: 'annual_cap',
        department_budget_cap: dept.annualBudget,
        headOfDepartment: DEFAULT_HEAD_ID,
        status: 'active',
      });
      deptIds[dept.name] = created.id;
      console.log(`    ✅ Created (${created.id})`);
    } else {
      console.log(`    [dry-run] Would create department`);
    }
  }

  // ── STEP 3: Seed starter projects per department ────────────────────────
  console.log('\n━━━ STEP 3: Seed starter projects ━━━━━━━━━━━━━━━━━━━━━━━━━━');

  type ProjectSeed = { name: string; description: string; budget: number; dept: string };

  const projects: ProjectSeed[] = [
    // Event Production & Technology
    { name: 'Venue & Course Build', description: 'Stadium-format venue setup, course design, and obstacle fabrication.', budget: 1_300_000, dept: 'Event Production & Technology' },
    { name: 'Broadcast Infrastructure', description: 'Live streaming infrastructure and broadcast production crew.', budget: 1_000_000, dept: 'Event Production & Technology' },
    { name: 'Tech & Data Platform', description: 'Scoring technology, real-time data feeds for betting integrations, mobile app.', budget: 325_000, dept: 'Event Production & Technology' },

    // League Operations & Team Development
    { name: 'Player Contracts & Travel', description: 'Player contracts, travel, and competition logistics for 20+ committed pros.', budget: 1_000_000, dept: 'League Operations & Team Development' },
    { name: 'League Office & Staff', description: 'Commissioner, ops, legal, compliance staffing and league office setup.', budget: 600_000, dept: 'League Operations & Team Development' },
    { name: 'Franchise Dev & Legal', description: 'Team franchise development, owner onboarding, rulebook and officiating standards.', budget: 275_000, dept: 'League Operations & Team Development' },

    // Media & Content Buildout
    { name: 'Documentary & Streaming', description: 'Documentary and behind-the-scenes content for streaming platforms.', budget: 600_000, dept: 'Media & Content Buildout' },
    { name: 'Social & Athlete Content', description: 'Social media content team and athlete storytelling campaigns.', budget: 400_000, dept: 'Media & Content Buildout' },
    { name: 'Licensing & Trading Cards', description: 'Trading card, gaming, and licensing asset production.', budget: 500_000, dept: 'Media & Content Buildout' },

    // Marketing, Working Capital & Reserve
    { name: 'Launch Marketing', description: 'Launch campaign targeting disc golf, sports betting, and fantasy audiences.', budget: 600_000, dept: 'Marketing, Working Capital & Reserve' },
    { name: 'Sponsor Outreach', description: 'Sponsor acquisition and brand partnership outreach.', budget: 300_000, dept: 'Marketing, Working Capital & Reserve' },
    { name: 'Operating Reserve', description: '6+ month operating reserve and contingency buffer.', budget: 600_000, dept: 'Marketing, Working Capital & Reserve' },
  ];

  for (const proj of projects) {
    const deptId = deptIds[proj.dept];
    console.log(`  Creating project: ${proj.name} ($${proj.budget.toLocaleString()})`);
    if (!DRY_RUN && deptId) {
      const created = await pb.collection('projects').create({
        name: proj.name,
        description: proj.description,
        department: deptId,
        status: 'planned',
        type: 'campaign',
        startDate: FUNDED_DATE,
        endDate: PHASE1_END,
        project_budget: proj.budget,
        project_budget_cap: proj.budget,
        project_manual_budget_override: proj.budget,
        project_budget_mode: 'capped',
        fiscalYear: '2026',
      });
      console.log(`    ✅ Created (${created.id})`);
    } else {
      console.log(`    [dry-run] Would create project`);
    }
  }

  // ── STEP 4: Rebuild fgl_funding_model ──────────────────────────────────
  console.log('\n━━━ STEP 4: Seed funding model (2026 seed round) ━━━━━━━━━━━━');

  if (!DRY_RUN) {
    try {
      const record = await pb.collection('fgl_funding_model').create({
        season: 2026,
        label: 'FGL 2026 Seed Round — Funded June 30, 2026',
        tournament_ops_per_event: 0,
        tournament_count: 0,
        player_purse: 0,
        player_sponsorship_program: 0,
        overhead_marketing: 1_500_000,
        overhead_staff_payroll: 1_875_000,
        overhead_tech_platform: 2_625_000,
        overhead_legal_admin: 275_000,
        rev_naming_rights: 0,
        rev_league_partners: 0,
        rev_on_course_activation: 0,
        rev_fan_interaction: 0,
        rev_ticket_presales: 0,
        rev_merchandise: 0,
        rev_subscriptions_fantasy: 0,
        rev_licensing_advances: 0,
        capital_raise_1: 7_500_000,
        capital_raise_2_equity: 0,
        capital_raise_2_debt: 0,
        notes: 'Seed round funded June 30, 2026. $7.5M total raise via Young America Capital, LLC (SEC Registered · FINRA, SIPC). Deployed across four pillars per Use of Proceeds: Event Production & Technology 35% ($2.625M), League Operations & Team Development 25% ($1.875M), Media & Content Buildout 20% ($1.5M), Marketing/Working Capital/Reserve 20% ($1.5M).',
      });
      console.log(`  ✅ Funding model seeded (${record.id})`);
    } catch (e: any) {
      console.warn(`  ⚠️  Could not seed funding model: ${e.message}`);
    }
  } else {
    console.log('  [dry-run] Would create 2026 funding model record');
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (DRY_RUN) {
    console.log('🔍 DRY RUN complete — no changes made.');
    console.log('   Run without --dry-run to apply.\n');
  } else {
    console.log('✅ Reset complete. FLI Golf League is ready for June 30, 2026 funding.');
    console.log('\n   Departments created:');
    console.log('   • Event Production & Technology    $2,625,000 (35%)');
    console.log('   • League Operations & Team Dev     $1,875,000 (25%)');
    console.log('   • Media & Content Buildout         $1,500,000 (20%)');
    console.log('   • Marketing, Working Capital & Reserve $1,500,000 (20%)');
    console.log('\n   Total: $7,500,000\n');
  }
}

main().catch((e) => {
  console.error('\n❌ Reset failed:', e.message ?? e);
  process.exit(1);
});
