/**
 * reset-payout-scenario.mjs
 *
 * Wipes all seeded payout data so seed-payout-scenario.mjs can be re-run cleanly:
 *   - tournament_results
 *   - pro_payments
 *   - franchise_payouts
 *   - payment_audit_log
 *   - work_orders where source = 'pro_payment'
 *   - Resets tournaments #1–#3 status back to 'scheduled'
 *   - Clears manager data from the 8 seeded pros
 *
 * Run: node scripts/reset-payout-scenario.mjs
 */

const PB_URL = 'https://pocketbase-production-6ab5.up.railway.app';
const EMAIL  = 'ddinsmore8@gmail.com';
const PASS   = 'MADcap(123)';

const SEEDED_PRO_IDS = [
  'uzuf56knibwl68w', // Gannon Buhr
  'tva49rgl955akix', // Ricky Wysocki
  'ef0xzf0ue7306d9', // Calvin Heimburg
  'ylj0npw6l3815xe', // Eagle McMahon
  'cdttri55nf950ln', // Kristin Tattar
  'ohx3qmt4ou4gp68', // Paige Pierce
  'bv6gn2ilyvgsd3e', // Evelina Salonen
  '29heie6mwmt4iah', // Natalie Ryan
];

const SEEDED_TOURNAMENT_IDS = [
  '2najeglkb5rq5av',
  'olf8nz8ov6a1nma',
  'zgi3dqik3hl5szc',
];

async function getToken() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PASS }),
  });
  return (await res.json()).token;
}

async function getAll(collection, filter, token) {
  const q = filter ? `?filter=${encodeURIComponent(filter)}&perPage=500` : '?perPage=500';
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records${q}`, {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  const d = await res.json();
  return d.items ?? [];
}

async function deleteRecord(collection, id, token) {
  await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token },
  });
}

async function wipeCollection(label, collection, filter) {
  const token = await getToken();
  const items = await getAll(collection, filter, token);
  if (items.length === 0) { console.log(`  ${label}: nothing to delete`); return; }
  for (const item of items) {
    const t = await getToken();
    await deleteRecord(collection, item.id, t);
  }
  console.log(`  ✓ Deleted ${items.length} ${label} records`);
}

async function main() {
  console.log('🗑️   FLI Golf payout scenario reset\n');

  // Order matters — delete children before parents
  await wipeCollection('payment_audit_log', 'payment_audit_log', null);
  await wipeCollection('pro_payments',      'pro_payments',      null);
  await wipeCollection('franchise_payouts', 'franchise_payouts', null);
  await wipeCollection('tournament_results','tournament_results', null);

  // Work orders with source = pro_payment only
  await wipeCollection('work_orders (pro_payment)', 'work_orders', `source = 'pro_payment'`);

  // Reset tournament statuses
  console.log('\n  Resetting tournament statuses...');
  for (const id of SEEDED_TOURNAMENT_IDS) {
    const token = await getToken();
    await fetch(`${PB_URL}/api/collections/tournaments/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ status: 'scheduled' }),
    });
  }
  console.log(`  ✓ ${SEEDED_TOURNAMENT_IDS.length} tournaments reset to scheduled`);

  // Clear manager data from seeded pros
  console.log('\n  Clearing manager data from pros...');
  for (const id of SEEDED_PRO_IDS) {
    const token = await getToken();
    await fetch(`${PB_URL}/api/collections/talent/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ managerName: '', managerEmail: '', managerCutPercentage: 0 }),
    });
  }
  console.log(`  ✓ ${SEEDED_PRO_IDS.length} pros cleared`);

  console.log('\n✅  Reset complete. Safe to re-run seed-payout-scenario.mjs');
}

main().catch(err => { console.error('❌ Reset failed:', err.message); process.exit(1); });
