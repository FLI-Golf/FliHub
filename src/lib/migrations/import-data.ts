import PocketBase from 'pocketbase';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { ManagerSchema, TaskSchema, BroadcastPartnerSchema } from '../domain/schemas';

interface ImportOptions {
	url: string;
	email: string;
	password: string;
	dataDir: string;
	dryRun?: boolean;
}

export async function importData(options: ImportOptions) {
	const { url, email, password, dataDir, dryRun = false } = options;

	console.log(`🔄 Connecting to PocketBase at ${url}...`);
	const pb = new PocketBase(url);

	try {
		await pb.admins.authWithPassword(email, password);
		console.log('✅ Authenticated successfully\n');

		// Import Managers
		await importManagers(pb, `${dataDir}/Managers.csv`, dryRun);

		// Import Tasks
		await importTasks(pb, `${dataDir}/Business Roadmap.csv`, dryRun);

		// Import Broadcast Partners
		await importBroadcastPartners(pb, `${dataDir}/FanNetApp_broadcast_partner.csv`, dryRun);

		console.log('\n✅ Data import completed successfully!');
	} catch (error: any) {
		console.error('❌ Import failed:', error.message);
		throw error;
	}
}

async function importManagers(pb: PocketBase, filePath: string, dryRun: boolean) {
	console.log(`📥 Importing managers from ${filePath}...`);

	try {
		const content = readFileSync(filePath, 'utf-8');
		const records = parse(content, { columns: true, skip_empty_lines: true });

		let imported = 0;
		let skipped = 0;

		for (const record of records) {
			try {
				const data = {
					name: record.Name,
					department: record.Department,
					email: record.Email || undefined,
					phone: record.Phone || undefined,
					goals: record.Goals || undefined
				};

				// Validate with Zod
				const validated = ManagerSchema.parse(data);

				if (!dryRun) {
					await pb.collection('managers').create(validated);
				}
				imported++;
			} catch (error: any) {
				console.error(`  ⚠️  Skipped invalid record:`, error.message);
				skipped++;
			}
		}

		console.log(`✅ Managers: ${imported} imported, ${skipped} skipped\n`);
	} catch (error: any) {
		console.error(`❌ Error importing managers:`, error.message);
	}
}

async function importTasks(pb: PocketBase, filePath: string, dryRun: boolean) {
	console.log(`📥 Importing tasks from ${filePath}...`);

	try {
		const content = readFileSync(filePath, 'utf-8');
		const records = parse(content, { columns: true, skip_empty_lines: true });

		let imported = 0;
		let skipped = 0;

		for (const record of records) {
			// Skip summary rows
			if (
				!record.Task ||
				record.Task === 'In Progress' ||
				record.Task === 'Scheduled' ||
				record.Task.trim().length === 0
			) {
				continue;
			}

			try {
				const parseDate = (dateStr: string): Date | undefined => {
					if (!dateStr || dateStr.trim() === '') return undefined;
					try {
						return new Date(dateStr);
					} catch {
						return undefined;
					}
				};

				const parseNumber = (numStr: string): number | undefined => {
					if (!numStr || numStr.trim() === '') return undefined;
					const cleaned = numStr.replace(/[$,]/g, '');
					const num = parseFloat(cleaned);
					return isNaN(num) ? undefined : num;
				};

				const data = {
					task: record.Task,
					subTasksChecklist: record['Sub Tasks Checklist'] || undefined,
					managers: record.Managers || undefined,
					track: record.Track || undefined,
					strategicGoal: record['Strategic Goal'] || undefined,
					departments: record.Departments || undefined,
					quarters: record.Quarters || undefined,
					startDate: parseDate(record['Start Date']),
					endDate: parseDate(record['End Date']),
					budget: parseNumber(record.Budget),
					income: parseNumber(record.Income),
					status: 'Scheduled' as const
				};

				// Validate with Zod
				const validated = TaskSchema.parse(data);

				if (!dryRun) {
					await pb.collection('tasks').create(validated);
				}
				imported++;
			} catch (error: any) {
				console.error(`  ⚠️  Skipped invalid record:`, error.message);
				skipped++;
			}
		}

		console.log(`✅ Tasks: ${imported} imported, ${skipped} skipped\n`);
	} catch (error: any) {
		console.error(`❌ Error importing tasks:`, error.message);
	}
}

async function importBroadcastPartners(pb: PocketBase, filePath: string, dryRun: boolean) {
	console.log(`📥 Importing broadcast partners from ${filePath}...`);

	try {
		const content = readFileSync(filePath, 'utf-8');
		const records = parse(content, { columns: true, skip_empty_lines: true });

		let imported = 0;
		let skipped = 0;

		for (const record of records) {
			try {
				const data = {
					point: record.Point,
					details: record.Details,
					type: record.Type,
					category: record.Category,
					importanceLevel: record['Importance Level'],
					tags: record.Tags || undefined,
					additionalNotes: record['Additional Notes'] || undefined
				};

				// Validate with Zod
				const validated = BroadcastPartnerSchema.parse(data);

				if (!dryRun) {
					await pb.collection('broadcast_partners').create(validated);
				}
				imported++;
			} catch (error: any) {
				console.error(`  ⚠️  Skipped invalid record:`, error.message);
				skipped++;
			}
		}

		console.log(`✅ Broadcast Partners: ${imported} imported, ${skipped} skipped\n`);
	} catch (error: any) {
		console.error(`❌ Error importing broadcast partners:`, error.message);
	}
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);
	const options: Partial<ImportOptions> = {};

	args.forEach((arg) => {
		const [key, value] = arg.split('=');
		const cleanKey = key.replace('--', '');
		if (cleanKey === 'dry-run') {
			options.dryRun = true;
		} else {
			(options as any)[cleanKey] = value;
		}
	});

	if (!options.url || !options.email || !options.password || !options.dataDir) {
		console.error('❌ Missing required arguments');
		console.log('\nUsage:');
		console.log(
			'  npm run import-data -- --url=https://your-pocketbase.com --email=admin@example.com --password=yourpassword --dataDir=./static/csv_data'
		);
		console.log('\nOptions:');
		console.log('  --dry-run    Show what would be done without making changes');
		process.exit(1);
	}

	importData(options as ImportOptions).catch(() => process.exit(1));
}
