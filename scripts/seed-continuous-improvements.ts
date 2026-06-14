/**
 * Seed Continuous Improvements Collection
 * 
 * Creates sample improvement suggestions for the FliHub platform
 * 
 * Usage: npx tsx scripts/seed-continuous-improvements.ts
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const pb = new PocketBase(POCKETBASE_URL);

const IMPROVEMENTS = [
  {
    title: 'Implement automated email notifications',
    description: 'Add real-time email notifications for important events like expense approvals, league updates, and tournament announcements',
    category: 'Feature',
    currentState: 'Manual email reminders sent ad-hoc by staff',
    proposedSolution: 'Integrate email service (SendGrid or AWS SES) with automated triggers for key events',
    expectedBenefit: 'Reduce administrative overhead by 20% and improve user engagement through timely notifications',
    status: 'Under Review',
    priority: 'High',
    implementationDate: '2026-02-15'
  },
  {
    title: 'Dark mode dashboard redesign',
    description: 'Modernize the dashboard with a comprehensive dark theme and improved visual hierarchy',
    category: 'UI/UX',
    currentState: 'Minimal dark mode support, inconsistent styling',
    proposedSolution: 'Complete redesign using Tailwind CSS dark mode with consistent color palette and component styling',
    expectedBenefit: 'Improved user experience, reduced eye strain, and modern appearance',
    status: 'In Progress',
    priority: 'Medium',
    implementationDate: '2026-02-28'
  },
  {
    title: 'Add API rate limiting and caching',
    description: 'Improve API performance and security with rate limiting and response caching',
    category: 'Performance',
    currentState: 'No rate limiting or caching implemented',
    proposedSolution: 'Implement Redis caching layer and rate limiting middleware on all API endpoints',
    expectedBenefit: 'Reduce server load by 30%, improve response times, and prevent API abuse',
    status: 'Identified',
    priority: 'High',
    implementationDate: '2026-03-15'
  },
  {
    title: 'Mobile app responsive improvements',
    description: 'Enhance mobile experience with better touch targets and responsive layouts',
    category: 'Mobile',
    currentState: 'Basic responsive design, some mobile usability issues',
    proposedSolution: 'Review and improve touch targets, optimize forms for mobile, add mobile-specific navigation',
    expectedBenefit: 'Increase mobile user retention and reduce bounce rate',
    status: 'Under Review',
    priority: 'Medium',
    implementationDate: '2026-03-01'
  },
  {
    title: 'Implement advanced search and filtering',
    description: 'Add full-text search and advanced filtering capabilities across all data tables',
    category: 'Feature',
    currentState: 'Basic filtering by single field only',
    proposedSolution: 'Implement Elasticsearch or similar for full-text search, add multi-field filtering UI',
    expectedBenefit: 'Dramatically improve data discovery and reduce time users spend looking for information',
    status: 'Identified',
    priority: 'Medium',
    implementationDate: '2026-04-01'
  },
  {
    title: 'Add audit logging for all database changes',
    description: 'Create comprehensive audit logs for compliance and security tracking',
    category: 'Security',
    currentState: 'No audit logging implemented',
    proposedSolution: 'Implement database-level audit logging with detailed change tracking and user attribution',
    expectedBenefit: 'Improve security posture, enable compliance reporting, and facilitate troubleshooting',
    status: 'Identified',
    priority: 'High',
    implementationDate: '2026-03-30'
  }
];

async function seedImprovements() {
  try {
    // Authenticate as admin
    console.log('🔐 Authenticating as admin...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✓ Authenticated\n');

    // Get the collection
    const collection = pb.collection('continuous_improvements');

    // Create improvements
    console.log('📋 Creating continuous improvements...\n');
    let created = 0;

    for (const improvement of IMPROVEMENTS) {
      try {
        const record = await collection.create(improvement);
        console.log(`✓ Created: "${record.title}"`);
        created++;
      } catch (error: any) {
        console.error(`✗ Failed to create "${improvement.title}":`, error);
      }
    }

    console.log(`\n✅ Seeding complete! Created ${created}/${IMPROVEMENTS.length} improvements`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedImprovements();
