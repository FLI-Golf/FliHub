require('dotenv').config({ path: '.env', override: true });

const BASE = 'https://pocketbase-production-6ab5.up.railway.app';

const CLAIMANTS = [
  'l8wj56007t6cqoo', // Dustin Dinsmore
  'b1q8lmerdwzt1d4', // Mark Coleman
  'ipa0vii1qs3ycbj', // Gary Santos
  'z3gnzf5fg1284or', // Andrew Panza
  'cr1zmsps9yive0k', // Kimberly Martinez
  'l1dvc585cozc3ov', // Nate Panza
  'tsyjlae5ienzd8z', // Corey La Russo
  'j534vv0tvcc7q9c', // Gannon Buhr
];

const STATUSES = ['draft','submitted','submitted','under_review','under_review','approved','approved','paid','paid','rejected'];

const CATEGORIES = ['travel','meals','equipment','software','marketing','legal','office','other'];

const TITLES = [
  'March Travel — Phoenix Conference',
  'Team Lunch — Strategy Session',
  'Office Supplies Q2',
  'Software Licenses — Adobe Suite',
  'Marketing Materials — Trade Show',
  'Legal Review — Player Contracts',
  'San Diego Office Expenses',
  'Flight — Scottsdale to Portland',
  'Hotel — PDGA Worlds',
  'Equipment — Camera Gear',
  'Uber Rides — Event Week',
  'Client Dinner — Sponsor Meeting',
  'Printing — Sponsor Decks',
  'Parking — Tournament Day',
  'Internet — Remote Office',
  'Phone Bill — March',
  'Catering — Team Meeting',
  'Shipping — Apparel Samples',
  'Background Check — New Hire',
  'Conference Registration',
  'Airfare — Board Meeting NYC',
  'Rental Car — Phoenix Trip',
  'Meals — Production Week',
  'Hardware — iPad for Scoring',
  'Subscription — Slack Annual',
  'PR Event — Media Day Expenses',
  'Travel — League Partnership Visit',
  'Office Furniture — Standing Desk',
  'Photography — Event Coverage',
  'Miscellaneous — Q1 Ops',
];

const VENDORS = ['Delta Airlines','Marriott','Uber','Amazon','Adobe','Slack','FedEx','Staples','Costco','Best Buy','Apple','Google','Zoom','Dropbox','Canva'];

const PAYMENT_METHODS = ['bank_transfer','check','zelle','paypal'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randAmount() { return Math.round((Math.random() * 1800 + 20) * 100) / 100; }
function randDate(daysBack = 180) {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysBack));
  return d.toISOString().slice(0, 10);
}
function pad(n) { return String(n).padStart(3, '0'); }

async function getToken() {
  const r = await fetch(`${BASE}/api/collections/_superusers/auth-with-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'ddinsmore8@gmail.com', password: process.env.POCKETBASE_ADMIN_PASSWORD })
  });
  const d = await r.json();
  if (!d.token) throw new Error('Auth failed: ' + JSON.stringify(d));
  return d.token;
}

async function pbFetch(token, method, path, body) {
  const r = await fetch(`${BASE}/api/collections/${path}`, {
    method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: body ? JSON.stringify(body) : undefined
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`${method} ${path} failed: ${d.message}`);
  return d;
}

// Get next WO number
async function nextWO(token, offset) {
  const existing = await pbFetch(token, 'GET', 'reimbursement_claims/records?perPage=500&fields=referenceNumber', null);
  let max = 0;
  for (const r of existing.items ?? []) {
    const m = (r.referenceNumber ?? '').match(/^WO-(\d+)$/);
    if (m) { const n = parseInt(m[1]); if (n > max) max = n; }
  }
  return `WO-${pad(max + 1 + offset)}`;
}

async function main() {
  const token = await getToken();
  console.log('Authenticated. Seeding 100 claims...');

  let created = 0;
  for (let i = 0; i < 100; i++) {
    const status   = rand(STATUSES);
    const claimant = rand(CLAIMANTS);
    const title    = rand(TITLES) + ` #${i + 1}`;
    const wo       = await nextWO(token, i);

    // Create claim
    const claim = await pbFetch(token, 'POST', 'reimbursement_claims/records', {
      title,
      claimant,
      status,
      referenceNumber: wo,
      notes: status === 'rejected' ? 'Missing receipts for some items.' : '',
      reviewNotes: status === 'rejected' ? 'Please resubmit with proper documentation.' : status === 'under_review' ? 'Reviewing line items with CPA.' : '',
      paymentMethod: status === 'paid' ? rand(PAYMENT_METHODS) : '',
      paidDate: status === 'paid' ? randDate(60) : '',
      totalAmount: 0,
    });

    // Add 1–4 line items
    const itemCount = randInt(1, 4);
    let total = 0;
    for (let j = 0; j < itemCount; j++) {
      const amount = randAmount();
      total += amount;
      await pbFetch(token, 'POST', 'reimbursement_items/records', {
        claim: claim.id,
        description: `${rand(CATEGORIES).charAt(0).toUpperCase() + rand(CATEGORIES).slice(1)} expense — ${rand(VENDORS)}`,
        amount,
        date: randDate(90),
        category: rand(CATEGORIES),
        vendor: rand(VENDORS),
        notes: '',
      });
    }

    // Update total
    await pbFetch(token, 'PATCH', `reimbursement_claims/records/${claim.id}`, { totalAmount: Math.round(total * 100) / 100 });

    created++;
    if (created % 10 === 0) console.log(`  ${created}/100 created...`);
  }

  console.log('Done! 100 claims seeded.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
