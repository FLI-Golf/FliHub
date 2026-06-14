import fs from 'fs';
import path from 'path';

const root = process.cwd();

const mustUseAdminGuard = [
  'src/routes/api/events/+server.ts',
  'src/routes/api/events/[id]/+server.ts',
  'src/routes/api/events/[id]/tasks/+server.ts',
  'src/routes/api/events/[id]/tasks/[taskId]/+server.ts',
  'src/routes/api/events/[id]/payments/generate/+server.ts',
  'src/routes/api/events/[id]/payments/[paymentId]/mark-paid/+server.ts',
  'src/routes/api/events/[id]/talent/+server.ts',
  'src/routes/api/events/[id]/talent/[eventTalentId]/+server.ts',
  'src/routes/api/talent-groups/+server.ts',
  'src/routes/api/admin/data-status/+server.ts'
];

const mustUseNonProdGuard = [
  'src/routes/api/admin/migrate-onboarding/+server.ts',
  'src/routes/api/admin/seed-data/+server.ts',
  'src/routes/api/admin/reset-data/+server.ts',
  'src/routes/api/events/seed/+server.ts',
  'src/routes/api/test-data/seed/+server.ts',
  'src/routes/api/test-data/reset/+server.ts',
  'src/routes/api/test-data/restore/+server.ts',
  'src/routes/api/test-data/seed-approvals/+server.ts',
  'src/routes/api/test-data/remove-approvals/+server.ts',
  'src/routes/api/approvals/test-data/+server.ts',
  'src/routes/api/reimbursements/test-data/+server.ts',
  'src/routes/api/media/test-data/+server.ts'
];

const failures = [];

function read(relPath) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing file: ${relPath}`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

for (const relPath of mustUseAdminGuard) {
  const source = read(relPath);
  if (!source) continue;
  if (!source.includes('requireAdminApi(')) {
    failures.push(`${relPath} must enforce requireAdminApi()`);
  }
}

for (const relPath of mustUseNonProdGuard) {
  const source = read(relPath);
  if (!source) continue;
  if (!source.includes('requireAdminNonProductionApi(')) {
    failures.push(`${relPath} must enforce requireAdminNonProductionApi()`);
  }
}

if (failures.length > 0) {
  console.error('API auth regression check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('API auth regression check passed.');
