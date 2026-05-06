/**
 * reset-test-data.mjs
 *
 * Resets all test data created during expense/approval/work-order flow testing.
 * Safe to run repeatedly — each section is idempotent.
 *
 * Usage:
 *   node scripts/reset-test-data.mjs
 *   node scripts/reset-test-data.mjs --dry-run   (preview only, no writes)
 *
 * What it resets:
 *   - All expenses (delete)
 *   - All approvals (delete)
 *   - All work_orders (delete)
 *   - Tasks: clears needs_review flag
 *   - Projects: zeros project_actual_expenses
 *   - Departments: zeros department_actual_expenses
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency needed)
function loadEnv() {
  try {
    const env = readFileSync(resolve(__dirname, '../.env'), 'utf8');
    const vars = {};
    for (const line of env.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) vars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
    return vars;
  } catch {
    console.error('❌  Could not read .env file');
    process.exit(1);
  }
}

const env = loadEnv();
const BASE_URL = (env.POCKETBASE_URL || '').replace(/\/$/, '');
const EMAIL    = env.POCKETBASE_ADMIN_EMAIL;
const PASSWORD = env.POCKETBASE_ADMIN_PASSWORD;
const DRY_RUN  = process.argv.includes('--dry-run');

if (!BASE_URL || !EMAIL || !PASSWORD) {
  console.error('❌  Missing POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD in .env');
  process.exit(1);
}

if (DRY_RUN) console.log('🔍  DRY RUN — no changes will be made\n');

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function adminToken() {
  const res = await fetch(`${BASE_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) { console.error('❌  Admin auth failed:', res.status); process.exit(1); }
  return (await res.json()).token;
}

async function getAll(token, collection, fields = 'id') {
  const res = await fetch(`${BASE_URL}/api/collections/${collection}/records?perPage=500&fields=${fields}`, {
    headers: { Authorization: token },
  });
  if (!res.ok) { console.warn(`  ⚠️  Could not fetch ${collection}: ${res.status}`); return []; }
  return (await res.json()).items ?? [];
}

async function del(token, collection, id) {
  if (DRY_RUN) return;
  const res = await fetch(`${BASE_URL}/api/collections/${collection}/records/${id}`, {
    method: 'DELETE',
    headers: { Authorization: token },
  });
  if (!res.ok && res.status !== 404) {
    console.warn(`  ⚠️  DELETE ${collection}/${id} failed: ${res.status}`);
  }
}

async function patch(token, collection, id, data) {
  if (DRY_RUN) return;
  const res = await fetch(`${BASE_URL}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) console.warn(`  ⚠️  PATCH ${collection}/${id} failed: ${res.status}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const token = await adminToken();
console.log('✅  Authenticated as admin\n');

// 1. Delete all work_orders
const workOrders = await getAll(token, 'work_orders', 'id,work_order_number,status');
console.log(`🗑   Work orders: ${workOrders.length} found`);
for (const wo of workOrders) {
  console.log(`    ${DRY_RUN ? '[dry]' : 'DELETE'} work_orders/${wo.id}  (${wo.work_order_number} — ${wo.status})`);
  await del(token, 'work_orders', wo.id);
}

// 2. Delete all approvals
const approvals = await getAll(token, 'approvals', 'id,entityType,status,amount');
console.log(`\n🗑   Approvals: ${approvals.length} found`);
for (const a of approvals) {
  console.log(`    ${DRY_RUN ? '[dry]' : 'DELETE'} approvals/${a.id}  (${a.entityType} — ${a.status} — $${a.amount})`);
  await del(token, 'approvals', a.id);
}

// 3. Delete all expenses
const expenses = await getAll(token, 'expenses', 'id,description,status,amount');
console.log(`\n🗑   Expenses: ${expenses.length} found`);
for (const e of expenses) {
  console.log(`    ${DRY_RUN ? '[dry]' : 'DELETE'} expenses/${e.id}  (${e.description} — ${e.status} — $${e.amount})`);
  await del(token, 'expenses', e.id);
}

// 4. Clear needs_review on all tasks
const tasks = await getAll(token, 'tasks', 'id,title,needs_review');
const flagged = tasks.filter(t => t.needs_review);
console.log(`\n🔧  Tasks with needs_review=true: ${flagged.length}`);
for (const t of flagged) {
  console.log(`    ${DRY_RUN ? '[dry]' : 'PATCH'} tasks/${t.id}  needs_review → false  (${t.title})`);
  await patch(token, 'tasks', t.id, { needs_review: false });
}

// 5. Zero project_actual_expenses on all projects that have a non-zero value
const projects = await getAll(token, 'projects', 'id,name,project_actual_expenses');
const dirtyProjects = projects.filter(p => (p.project_actual_expenses ?? 0) > 0);
console.log(`\n🔧  Projects with actual expenses > 0: ${dirtyProjects.length}`);
for (const p of dirtyProjects) {
  console.log(`    ${DRY_RUN ? '[dry]' : 'PATCH'} projects/${p.id}  project_actual_expenses → 0  (${p.name}: was $${p.project_actual_expenses})`);
  await patch(token, 'projects', p.id, { project_actual_expenses: 0 });
}

// 6. Zero department_actual_expenses on all departments that have a non-zero value
const depts = await getAll(token, 'departments', 'id,name,department_actual_expenses');
const dirtyDepts = depts.filter(d => (d.department_actual_expenses ?? 0) > 0);
console.log(`\n🔧  Departments with actual expenses > 0: ${dirtyDepts.length}`);
for (const d of dirtyDepts) {
  console.log(`    ${DRY_RUN ? '[dry]' : 'PATCH'} departments/${d.id}  department_actual_expenses → 0  (${d.name}: was $${d.department_actual_expenses})`);
  await patch(token, 'departments', d.id, { department_actual_expenses: 0 });
}

console.log(`\n${DRY_RUN ? '🔍  Dry run complete — no changes made.' : '✅  Reset complete.'}`);
