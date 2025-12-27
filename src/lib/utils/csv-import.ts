import Papa from 'papaparse';
import type { Task, TaskStatus, TaskTrack, StrategicGoal, Quarter } from '$lib/domain/modules/projects';

// DEPRECATED: Managers are now user_profiles with role='leader'
// Keeping these types for backward compatibility
export interface ManagerCSVRow {
	Name: string;
	Department: string;
	Email: string;
	Phone: string;
	Goals: string;
}

export interface TaskCSVRow {
	Task: string;
	'Sub Tasks Checklist': string;
	Managers: string;
	Track: string;
	'Strategic Goal': string;
	Departments: string;
	Quarters: string;
	'Start Date': string;
	'End Date': string;
	Budget: string;
	Income: string;
}

export interface BroadcastPartnerCSVRow {
	Point: string;
	Details: string;
	Type: string;
	Category: string;
	'Importance Level': string;
	Tags: string;
	'Additional Notes': string;
}

// DEPRECATED: Use import-managers.js script instead
export function parseManagersCSV(csvText: string): ManagerCSVRow[] {
	const result = Papa.parse<ManagerCSVRow>(csvText, {
		header: true,
		skipEmptyLines: true,
		transformHeader: (header) => header.trim()
	});

	return result.data;
}

export function parseTasksCSV(csvText: string): TaskCSVRow[] {
	const result = Papa.parse<TaskCSVRow>(csvText, {
		header: true,
		skipEmptyLines: true,
		transformHeader: (header) => header.trim()
	});

	// Filter out summary rows (rows without a proper task name)
	return result.data.filter(row => 
		row.Task && 
		row.Task !== 'In Progress' && 
		row.Task !== 'Scheduled' &&
		row.Task.trim().length > 0
	);
}

// DEPRECATED: Managers are now user_profiles
export function managerCSVToRecord(row: ManagerCSVRow) {
	const nameParts = row.Name.split(' ');
	return {
		firstName: nameParts[0] || row.Name,
		lastName: nameParts.slice(1).join(' ') || row.Name,
		email: row.Email || undefined,
		phone: row.Phone || undefined,
		organization: row.Department,
		role: 'leader' as const,
		status: 'active' as const
	};
}

export function parseBroadcastPartnersCSV(csvText: string): BroadcastPartnerCSVRow[] {
	const result = Papa.parse<BroadcastPartnerCSVRow>(csvText, {
		header: true,
		skipEmptyLines: true,
		transformHeader: (header) => header.trim()
	});

	return result.data.filter(row => 
		row.Point && 
		row.Point.trim().length > 0
	);
}

export function broadcastPartnerCSVToRecord(row: BroadcastPartnerCSVRow) {
	return {
		point: row.Point,
		details: row.Details || '',
		type: row.Type,
		category: row.Category,
		importanceLevel: row['Importance Level'],
		tags: row.Tags || '',
		additionalNotes: row['Additional Notes'] || ''
	};
}

export function taskCSVToRecord(row: TaskCSVRow) {
	const parseDate = (dateStr: string): string | undefined => {
		if (!dateStr || dateStr.trim() === '') return undefined;
		try {
			const date = new Date(dateStr);
			return date.toISOString().split('T')[0];
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

	// Determine status based on context
	let status: TaskStatus = 'Scheduled';
	if (row.Task === 'In Progress') {
		status = 'In Progress';
	}

	return {
		task: row.Task,
		subTasksChecklist: row['Sub Tasks Checklist'] || undefined,
		managers: row.Managers || undefined,
		track: row.Track as TaskTrack || undefined,
		strategicGoal: row['Strategic Goal'] as StrategicGoal || undefined,
		departments: row.Departments || undefined,
		quarters: row.Quarters as Quarter || undefined,
		startDate: parseDate(row['Start Date']),
		endDate: parseDate(row['End Date']),
		budget: parseNumber(row.Budget),
		income: parseNumber(row.Income),
		status
	};
}
