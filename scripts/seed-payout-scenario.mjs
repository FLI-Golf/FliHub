/**
 * seed-payout-scenario.mjs
 *
 * Seeds a full realistic payout scenario for testing:
 *   1. Adds manager data to 8 pros (mix of male/female, 10–15% cuts)
 *   2. Seeds completed results for tournaments #1, #2, #3
 *      - Top 12 placements per division (men + women)
 *      - Pro earnings calculated from PayoutCalculator logic
 *      - Manager splits applied where applicable
 *   3. Creates pro_payment records (pro + manager) for each result
 *   4. Creates one work_order per tournament (source = pro_payment)
 *   5. Writes payment_audit_log entries (created → pending)
 *
 * Run:  node scripts/seed-payout-scenario.mjs
 * Reset: node scripts/reset-payout-scenario.mjs
 */

const PB_URL  = 'https://pocketbase-production-6ab5.up.railway.app';
const EMAIL   = 'ddinsmore8@gmail.com';
const PASS    = 'MADcap(123)';

// ─── Known IDs from the database ──────────────────────────────────────────────

const SEASON_ID = 't9yegq2db2sml8j';

const PROS = {
  // Male
  gannon:   { id: 'uzuf56knibwl68w', name: 'Gannon Buhr',      gender: 'male' },
  ricky:    { id: 'tva49rgl955akix', name: 'Ricky Wysocki',    gender: 'male' },
  calvin:   { id: 'ef0xzf0ue7306d9', name: 'Calvin Heimburg',  gender: 'male' },
  isaac:    { id: '16bxti7wk38j1pa', name: 'Isaac Robinson',   gender: 'male' },
  matthew:  { id: '1i61b1szvlgxaqu', name: 'Matthew Orum',     gender: 'male' },
  niklas:   { id: 'dwp6kl08z5w3iwq', name: 'Niklas Anttila',   gender: 'male' },
  chris:    { id: '96tcuadqc14kbmg', name: 'Chris Dickerson',  gender: 'male' },
  ezra:     { id: 'dx6jse7pyy4tdlu', name: 'Ezra Robinson',    gender: 'male' },
  eagle:    { id: 'ylj0npw6l3815xe', name: 'Eagle McMahon',    gender: 'male' },
  cole:     { id: '0kznvkisjzuo9rj', name: 'Cole Redalen',     gender: 'male' },
  james:    { id: 'pljl0evg3qv45tj', name: 'James Proctor',    gender: 'male' },
  // Female
  kristin:  { id: 'cdttri55nf950ln', name: 'Kristin Tattar',   gender: 'female' },
  evelina:  { id: 'bv6gn2ilyvgsd3e', name: 'Evelina Salonen',  gender: 'female' },
  ohn:      { id: '4f1fxvb74956f35', name: 'Ohn Scoggins',     gender: 'female' },
  missy:    { id: 'u5z0w7djuht4ebi', name: 'Missy Gannon',     gender: 'female' },
  holyn:    { id: 'pjes2nuuaba3y1v', name: 'Holyn Handley',    gender: 'female' },
  kat:      { id: 'x6gp8fax2htqunk', name: 'Kat Mertsch',      gender: 'female' },
  ella:     { id: '0beua1tpmo1xray', name: 'Ella Hansen',      gender: 'female' },
  hailey:   { id: 'fnupgcb1knpxhr1', name: 'Hailey King',      gender: 'female' },
  heidi:    { id: 'qcwwe5xt2dfu66j', name: 'Heidi Laine',      gender: 'female' },
  paige:    { id: 'ohx3qmt4ou4gp68', name: 'Paige Pierce',     gender: 'female' },
  natalie:  { id: '29heie6mwmt4iah', name: 'Natalie Ryan',     gender: 'female' },
  henna:    { id: 's0xjuygr0abijvs', name: 'Henna Blomroos',   gender: 'female' },
};

const FRANCHISES = {
  hyzer:    '4rp0eau92x1f4fk',
  huka:     'k8y0svelyjjaz47',
  flight:   'igmmd9uvl41k4px',
  birdie:   'fpukova7y6xrqid',
  chain:    'e13hj3uexx4a2px',
  jester:   '8pyuqi7ofdjdojk',
  midas:    'h6ci08imhcwdtd3',
  seekers:  'dhwt6slnkhjazma',
  fairway:  'l76h2jprbd7qxbe',
  dynasty:  'sdpvhevuxi19xut',
  ace:      'sl1br880897tnwz',
  glide:    '35h5y2wc53c0mib',
};

const TOURNAMENTS = [
  { id: '2najeglkb5rq5av', name: 'FLI Golf Season Opener',    number: 1, prizePool: 500000,  date: '2027-02-01' },
  { id: 'olf8nz8ov6a1nma', name: 'Spring Championship',       number: 2, prizePool: 566667,  date: '2027-04-01' },
  { id: 'zgi3dqik3hl5szc', name: 'Mid-Season Classic',        number: 3, prizePool: 633333,  date: '2027-06-01' },
];

// ─── Manager assignments (8 pros) ─────────────────────────────────────────────

const MANAGER_DATA = [
  { proId: PROS.gannon.id,  managerName: 'Scott Buhr',       managerEmail: 'scott.buhr@mgmt.com',      managerCutPercentage: 12 },
  { proId: PROS.ricky.id,   managerName: 'Dave Wysocki',     managerEmail: 'dave.wysocki@mgmt.com',    managerCutPercentage: 15 },
  { proId: PROS.calvin.id,  managerName: 'Lisa Heimburg',    managerEmail: 'lisa.heimburg@mgmt.com',   managerCutPercentage: 10 },
  { proId: PROS.eagle.id,   managerName: 'Tom McMahon',      managerEmail: 'tom.mcmahon@mgmt.com',     managerCutPercentage: 12 },
  { proId: PROS.kristin.id, managerName: 'Andres Tattar',    managerEmail: 'andres.tattar@mgmt.com',   managerCutPercentage: 15 },
  { proId: PROS.paige.id,   managerName: 'Steve Pierce',     managerEmail: 'steve.pierce@mgmt.com',    managerCutPercentage: 10 },
  { proId: PROS.evelina.id, managerName: 'Mikael Salonen',   managerEmail: 'mikael.salonen@mgmt.com',  managerCutPercentage: 12 },
  { proId: PROS.natalie.id, managerName: 'Chris Ryan',       managerEmail: 'chris.ryan@mgmt.com',      managerCutPercentage: 10 },
];

// ─── Tournament results (top 12 per division) ─────────────────────────────────
// Ordered by placement. Franchise assigned per pro for realism.

const RESULTS_BY_TOURNAMENT = {
  // Tournament #1 — Season Opener
  '2najeglkb5rq5av': {
    men: [
      { pro: PROS.gannon,  franchise: FRANCHISES.hyzer,   placement: 1 },
      { pro: PROS.ricky,   franchise: FRANCHISES.huka,    placement: 2 },
      { pro: PROS.calvin,  franchise: FRANCHISES.flight,  placement: 3 },
      { pro: PROS.eagle,   franchise: FRANCHISES.birdie,  placement: 4 },
      { pro: PROS.isaac,   franchise: FRANCHISES.chain,   placement: 5 },
      { pro: PROS.matthew, franchise: FRANCHISES.jester,  placement: 6 },
      { pro: PROS.niklas,  franchise: FRANCHISES.midas,   placement: 7 },
      { pro: PROS.chris,   franchise: FRANCHISES.seekers, placement: 8 },
      { pro: PROS.ezra,    franchise: FRANCHISES.fairway, placement: 9 },
      { pro: PROS.cole,    franchise: FRANCHISES.dynasty, placement: 10 },
      { pro: PROS.james,   franchise: FRANCHISES.ace,     placement: 11 },
      { pro: PROS.ricky,   franchise: FRANCHISES.huka,    placement: 12 }, // placeholder — reuse
    ],
    women: [
      { pro: PROS.kristin, franchise: FRANCHISES.hyzer,   placement: 1 },
      { pro: PROS.evelina, franchise: FRANCHISES.huka,    placement: 2 },
      { pro: PROS.paige,   franchise: FRANCHISES.flight,  placement: 3 },
      { pro: PROS.natalie, franchise: FRANCHISES.birdie,  placement: 4 },
      { pro: PROS.ohn,     franchise: FRANCHISES.chain,   placement: 5 },
      { pro: PROS.missy,   franchise: FRANCHISES.jester,  placement: 6 },
      { pro: PROS.holyn,   franchise: FRANCHISES.midas,   placement: 7 },
      { pro: PROS.kat,     franchise: FRANCHISES.seekers, placement: 8 },
      { pro: PROS.ella,    franchise: FRANCHISES.fairway, placement: 9 },
      { pro: PROS.hailey,  franchise: FRANCHISES.dynasty, placement: 10 },
      { pro: PROS.heidi,   franchise: FRANCHISES.ace,     placement: 11 },
      { pro: PROS.henna,   franchise: FRANCHISES.glide,   placement: 12 },
    ],
  },
  // Tournament #2 — Spring Championship (shuffle top 3)
  'olf8nz8ov6a1nma': {
    men: [
      { pro: PROS.ricky,   franchise: FRANCHISES.huka,    placement: 1 },
      { pro: PROS.eagle,   franchise: FRANCHISES.birdie,  placement: 2 },
      { pro: PROS.gannon,  franchise: FRANCHISES.hyzer,   placement: 3 },
      { pro: PROS.calvin,  franchise: FRANCHISES.flight,  placement: 4 },
      { pro: PROS.chris,   franchise: FRANCHISES.seekers, placement: 5 },
      { pro: PROS.niklas,  franchise: FRANCHISES.midas,   placement: 6 },
      { pro: PROS.matthew, franchise: FRANCHISES.jester,  placement: 7 },
      { pro: PROS.isaac,   franchise: FRANCHISES.chain,   placement: 8 },
      { pro: PROS.cole,    franchise: FRANCHISES.dynasty, placement: 9 },
      { pro: PROS.ezra,    franchise: FRANCHISES.fairway, placement: 10 },
      { pro: PROS.james,   franchise: FRANCHISES.ace,     placement: 11 },
      { pro: PROS.gannon,  franchise: FRANCHISES.hyzer,   placement: 12 },
    ],
    women: [
      { pro: PROS.paige,   franchise: FRANCHISES.flight,  placement: 1 },
      { pro: PROS.kristin, franchise: FRANCHISES.hyzer,   placement: 2 },
      { pro: PROS.natalie, franchise: FRANCHISES.birdie,  placement: 3 },
      { pro: PROS.evelina, franchise: FRANCHISES.huka,    placement: 4 },
      { pro: PROS.hailey,  franchise: FRANCHISES.dynasty, placement: 5 },
      { pro: PROS.ohn,     franchise: FRANCHISES.chain,   placement: 6 },
      { pro: PROS.ella,    franchise: FRANCHISES.fairway, placement: 7 },
      { pro: PROS.missy,   franchise: FRANCHISES.jester,  placement: 8 },
      { pro: PROS.holyn,   franchise: FRANCHISES.midas,   placement: 9 },
      { pro: PROS.kat,     franchise: FRANCHISES.seekers, placement: 10 },
      { pro: PROS.henna,   franchise: FRANCHISES.glide,   placement: 11 },
      { pro: PROS.heidi,   franchise: FRANCHISES.ace,     placement: 12 },
    ],
  },
  // Tournament #3 — Mid-Season Classic (another shuffle)
  'zgi3dqik3hl5szc': {
    men: [
      { pro: PROS.calvin,  franchise: FRANCHISES.flight,  placement: 1 },
      { pro: PROS.gannon,  franchise: FRANCHISES.hyzer,   placement: 2 },
      { pro: PROS.eagle,   franchise: FRANCHISES.birdie,  placement: 3 },
      { pro: PROS.ricky,   franchise: FRANCHISES.huka,    placement: 4 },
      { pro: PROS.matthew, franchise: FRANCHISES.jester,  placement: 5 },
      { pro: PROS.ezra,    franchise: FRANCHISES.fairway, placement: 6 },
      { pro: PROS.isaac,   franchise: FRANCHISES.chain,   placement: 7 },
      { pro: PROS.cole,    franchise: FRANCHISES.dynasty, placement: 8 },
      { pro: PROS.chris,   franchise: FRANCHISES.seekers, placement: 9 },
      { pro: PROS.niklas,  franchise: FRANCHISES.midas,   placement: 10 },
      { pro: PROS.james,   franchise: FRANCHISES.ace,     placement: 11 },
      { pro: PROS.matthew, franchise: FRANCHISES.jester,  placement: 12 },
    ],
    women: [
      { pro: PROS.evelina, franchise: FRANCHISES.huka,    placement: 1 },
      { pro: PROS.natalie, franchise: FRANCHISES.birdie,  placement: 2 },
      { pro: PROS.kristin, franchise: FRANCHISES.hyzer,   placement: 3 },
      { pro: PROS.henna,   franchise: FRANCHISES.glide,   placement: 4 },
      { pro: PROS.ella,    franchise: FRANCHISES.fairway, placement: 5 },
      { pro: PROS.paige,   franchise: FRANCHISES.flight,  placement: 6 },
      { pro: PROS.heidi,   franchise: FRANCHISES.ace,     placement: 7 },
      { pro: PROS.hailey,  franchise: FRANCHISES.dynasty, placement: 8 },
      { pro: PROS.ohn,     franchise: FRANCHISES.chain,   placement: 9 },
      { pro: PROS.missy,   franchise: FRANCHISES.jester,  placement: 10 },
      { pro: PROS.holyn,   franchise: FRANCHISES.midas,   placement: 11 },
      { pro: PROS.kat,     franchise: FRANCHISES.seekers, placement: 12 },
    ],
  },
};

// ─── Payout math (mirrors PayoutCalculator.ts) ────────────────────────────────

function calcPlacementPayouts(divisionPurse, numPlacements = 12, franchiseCutPct = 0) {
  const pcts = [30.0, 20.0, 15.0];
  const remaining = 35.0;
  const remainingPlaces = numPlacements - 3;
  let decaySum = 0;
  for (let i = 0; i < remainingPlaces; i++) decaySum += Math.pow(0.85, i);
  for (let i = 0; i < remainingPlaces; i++) {
    pcts.push((Math.pow(0.85, i) / decaySum) * remaining);
  }
  return pcts.map((pct, idx) => {
    const total = (divisionPurse * pct) / 100;
    const franchise = total * (franchiseCutPct / 100);
    const pro = total - franchise;
    return { placement: idx + 1, pct, total, franchise, pro };
  });
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function getToken() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PASS }),
  });
  return (await res.json()).token;
}

async function pb(method, path, body, token) {
  const res = await fetch(`${PB_URL}/api/collections/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

function round2(n) { return Math.round(n * 100) / 100; }

function woNumber(tournamentId, dateStr) {
  const d = dateStr.replace(/-/g, '');
  return `WO-TOUR-${tournamentId.slice(-6).toUpperCase()}-${d}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  FLI Golf payout scenario seed\n');

  // Build manager lookup by proId
  const managerByPro = Object.fromEntries(MANAGER_DATA.map(m => [m.proId, m]));

  // ── Step 1: Update manager data on pros ──────────────────────────────────
  console.log('Step 1: Updating manager data on pros...');
  for (const m of MANAGER_DATA) {
    const token = await getToken();
    await pb('PATCH', `talent/records/${m.proId}`, {
      managerName: m.managerName,
      managerEmail: m.managerEmail,
      managerCutPercentage: m.managerCutPercentage,
    }, token);
    console.log(`  ✓ ${m.managerName} → ${MANAGER_DATA.find(x => x.proId === m.proId) ? Object.values(PROS).find(p => p.id === m.proId)?.name : '?'} (${m.managerCutPercentage}%)`);
  }

  // ── Step 2: Seed results + payments for each tournament ──────────────────
  for (const tournament of TOURNAMENTS) {
    console.log(`\nStep 2: Seeding ${tournament.name} (prize pool $${tournament.prizePool.toLocaleString()})...`);

    const token = await getToken();

    // Season 2027: franchiseCutPercentage = 0 (inaugural season, waived)
    const franchiseCutPct = 0;
    const numPlacements = 12;
    const divisionPurse = tournament.prizePool / 2; // equal men/women split
    const payouts = calcPlacementPayouts(divisionPurse, numPlacements, franchiseCutPct);

    const allResults = RESULTS_BY_TOURNAMENT[tournament.id];
    const allPaymentIds = [];
    let tournamentTotalAmount = 0;

    for (const division of ['men', 'women']) {
      const divLabel = division === 'men' ? 'MPO' : 'FPO';
      const entries = allResults[division];

      for (const entry of entries) {
        const payout = payouts[entry.placement - 1];
        if (!payout) continue;

        const proEarnings = round2(payout.pro);
        const manager = managerByPro[entry.pro.id];
        const managerCutPct = manager?.managerCutPercentage ?? 0;
        const managerEarnings = managerCutPct > 0 ? round2(proEarnings * (managerCutPct / 100)) : 0;
        const netProEarnings = round2(proEarnings - managerEarnings);

        const t2 = await getToken();

        // Create tournament result
        const result = await pb('POST', 'tournament_results/records', {
          tournament:      tournament.id,
          pro:             entry.pro.id,
          franchise:       entry.franchise,
          division:        divLabel,
          placement:       entry.placement,
          proEarnings:     proEarnings,
          managerEarnings: managerEarnings,
          managerName:     manager?.managerName ?? '',
          managerEmail:    manager?.managerEmail ?? '',
          season:          SEASON_ID,
          status:          'completed',
        }, t2);

        const dueDate = new Date(tournament.date);
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateStr = dueDate.toISOString().split('T')[0];

        const paymentBase = {
          pro:                    entry.pro.id,
          paymentType:            'tournament',
          tournament:             tournament.id,
          tournamentResult:       result.id,
          season:                 SEASON_ID,
          grossAmount:            proEarnings,
          managerCutPercentage:   managerCutPct,
          managerAmount:          managerEarnings,
          netProAmount:           netProEarnings,
          managerName:            manager?.managerName ?? '',
          managerEmail:           manager?.managerEmail ?? '',
          status:                 'pending',
          dueDate:                dueDateStr,
          description:            `${tournament.name} — ${divLabel} Place ${entry.placement} — ${entry.pro.name}`,
        };

        // Pro payment
        const t3 = await getToken();
        const proPayment = await pb('POST', 'pro_payments/records', {
          ...paymentBase,
          recipient: 'pro',
          amount:    netProEarnings,
        }, t3);
        allPaymentIds.push(proPayment.id);
        tournamentTotalAmount += netProEarnings;

        // Manager payment (if applicable)
        let managerPaymentId = null;
        if (managerEarnings > 0) {
          const t4 = await getToken();
          const managerPayment = await pb('POST', 'pro_payments/records', {
            ...paymentBase,
            recipient: 'manager',
            amount:    managerEarnings,
          }, t4);
          allPaymentIds.push(managerPayment.id);
          tournamentTotalAmount += managerEarnings;
          managerPaymentId = managerPayment.id;
        }

        console.log(`  ${divLabel} P${entry.placement}: ${entry.pro.name} → pro $${netProEarnings.toLocaleString()}${managerEarnings > 0 ? ` + mgr $${managerEarnings.toLocaleString()} (${managerCutPct}%)` : ''}`);
      }
    }

    // ── Work order for this tournament ──────────────────────────────────────
    const t5 = await getToken();
    const wo = await pb('POST', 'work_orders/records', {
      work_order_number: woNumber(tournament.id, tournament.date),
      source:            'pro_payment',
      status:            'open',
      projectId:         tournament.id,
      projectName:       tournament.name,
      description:       `Tournament payouts — ${tournament.name}`,
      amount:            round2(tournamentTotalAmount),
      proPayment:        allPaymentIds,
      notes:             `${allPaymentIds.length} payment records · seeded ${new Date().toISOString().split('T')[0]}`,
      approvedDate:      tournament.date,
      approvedBy:        'seed-script',
    }, t5);
    console.log(`  ✓ Work order ${wo.work_order_number} — $${round2(tournamentTotalAmount).toLocaleString()} across ${allPaymentIds.length} payments`);

    // ── Audit log entries ────────────────────────────────────────────────────
    for (const pid of allPaymentIds) {
      const t6 = await getToken();
      await pb('POST', 'payment_audit_log/records', {
        payment:    pid,
        workOrder:  wo.id,
        fromStatus: 'created',
        toStatus:   'pending',
        changedBy:  'seed-script',
        changedAt:  new Date().toISOString(),
        notes:      `Seeded from ${tournament.name}`,
      }, t6);
    }
    console.log(`  ✓ ${allPaymentIds.length} audit log entries written`);

    // ── Mark tournament as completed ────────────────────────────────────────
    const t7 = await getToken();
    await pb('PATCH', `tournaments/records/${tournament.id}`, { status: 'completed' }, t7);
    console.log(`  ✓ Tournament marked completed`);
  }

  console.log('\n✅  Seed complete. Run the app and visit /dashboard/talent/payout-testing');
}

main().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
