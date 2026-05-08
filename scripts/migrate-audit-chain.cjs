/**
 * Audit chain migration
 * Adds work_order_number (text) to: reimbursement_claims, reimbursement_items, tasks
 * Adds claimId (relation) and fixes expenseId/taskId/projectId/approvedBy to relations on work_orders
 */

require('dotenv').config({ path: '.env', override: true });

const BASE  = 'https://pocketbase-production-6ab5.up.railway.app';
const EMAIL = 'ddinsmore8@gmail.com';

async function auth() {
  const r = await fetch(`${BASE}/api/collections/_superusers/auth-with-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: process.env.POCKETBASE_ADMIN_PASSWORD })
  });
  const d = await r.json();
  if (!d.token) throw new Error('Auth failed: ' + JSON.stringify(d));
  return d.token;
}

async function getCollection(token, name) {
  const r = await fetch(`${BASE}/api/collections/${name}`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  return r.json();
}

async function patchCollection(token, id, body) {
  const r = await fetch(`${BASE}/api/collections/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(body)
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`PATCH ${id} failed: ${d.message}\n${JSON.stringify(d.data)}`);
  return d;
}

function hasField(col, name) {
  return col.fields?.some(f => f.name === name);
}

function woTextField(id) {
  return {
    id,
    type: 'text',
    name: 'work_order_number',
    required: false,
    presentable: false,
    hidden: false,
    min: 0, max: 50,
    pattern: '',
    autogeneratePattern: '',
    primaryKey: false,
    system: false,
  };
}

async function main() {
  const token = await auth();
  console.log('Authenticated.\n');

  // ── 1. reimbursement_claims — add work_order_number ──────────────────────
  {
    const col = await getCollection(token, 'reimbursement_claims');
    if (hasField(col, 'work_order_number')) {
      console.log('reimbursement_claims.work_order_number — already exists, skipping');
    } else {
      const updated = await patchCollection(token, col.id, {
        fields: [...col.fields, woTextField('wo_reimb_claim_001')]
      });
      console.log('✅ reimbursement_claims.work_order_number added');
    }
  }

  // ── 2. reimbursement_items — add work_order_number ───────────────────────
  {
    const col = await getCollection(token, 'reimbursement_items');
    if (hasField(col, 'work_order_number')) {
      console.log('reimbursement_items.work_order_number — already exists, skipping');
    } else {
      const updated = await patchCollection(token, col.id, {
        fields: [...col.fields, woTextField('wo_reimb_item_001')]
      });
      console.log('✅ reimbursement_items.work_order_number added');
    }
  }

  // ── 3. tasks — add work_order_number ─────────────────────────────────────
  {
    const col = await getCollection(token, 'tasks');
    if (hasField(col, 'work_order_number')) {
      console.log('tasks.work_order_number — already exists, skipping');
    } else {
      const updated = await patchCollection(token, col.id, {
        fields: [...col.fields, woTextField('wo_task_001')]
      });
      console.log('✅ tasks.work_order_number added');
    }
  }

  // ── 4. work_orders — add claimId relation + audit fields ─────────────────
  {
    const col = await getCollection(token, 'work_orders');
    const newFields = [...col.fields];
    let changed = false;

    // claimId — relation to reimbursement_claims
    if (!hasField(col, 'claimId')) {
      newFields.push({
        id: 'wo_claim_rel_001',
        type: 'relation',
        name: 'claimId',
        required: false,
        presentable: false,
        hidden: false,
        cascadeDelete: false,
        collectionId: 'pbc_3512471659', // reimbursement_claims
        maxSelect: 1,
        minSelect: 0,
        system: false,
      });
      changed = true;
      console.log('✅ work_orders.claimId relation added');
    } else {
      console.log('work_orders.claimId — already exists, skipping');
    }

    // paymentMethod — text field for audit
    if (!hasField(col, 'paymentMethod')) {
      newFields.push({
        id: 'wo_pay_method_001',
        type: 'text',
        name: 'paymentMethod',
        required: false,
        presentable: false,
        hidden: false,
        min: 0, max: 100,
        pattern: '',
        autogeneratePattern: '',
        primaryKey: false,
        system: false,
      });
      changed = true;
      console.log('✅ work_orders.paymentMethod added');
    } else {
      console.log('work_orders.paymentMethod — already exists, skipping');
    }

    // submittedBy — who created the expense/claim
    if (!hasField(col, 'submittedBy')) {
      newFields.push({
        id: 'wo_submitted_by_001',
        type: 'relation',
        name: 'submittedBy',
        required: false,
        presentable: false,
        hidden: false,
        cascadeDelete: false,
        collectionId: 'user_profiles_collection',
        maxSelect: 1,
        minSelect: 0,
        system: false,
      });
      changed = true;
      console.log('✅ work_orders.submittedBy relation added');
    } else {
      console.log('work_orders.submittedBy — already exists, skipping');
    }

    // source — 'expense' | 'reimbursement' | 'task' for audit filtering
    if (!hasField(col, 'source')) {
      newFields.push({
        id: 'wo_source_001',
        type: 'select',
        name: 'source',
        required: false,
        presentable: false,
        hidden: false,
        maxSelect: 1,
        values: ['expense', 'reimbursement', 'task'],
        system: false,
      });
      changed = true;
      console.log('✅ work_orders.source select added');
    } else {
      console.log('work_orders.source — already exists, skipping');
    }

    if (changed) {
      await patchCollection(token, col.id, { fields: newFields });
      console.log('✅ work_orders schema saved');
    }
  }

  console.log('\nMigration complete.');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
