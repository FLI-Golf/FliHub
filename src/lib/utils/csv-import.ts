import Papa from 'papaparse';
import type { Manager, Department } from '$lib/domain/modules/people';
import type { Task, TaskStatus, TaskTrack, StrategicGoal, Quarter } from '$lib/domain/modules/projects';

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

export function managerCSVToRecord(row: ManagerCSVRow) {
	return {
		name: row.Name,
		department: row.Department as Department,
		email: row.Email || undefined,
		phone: row.Phone || undefined,
		goals: row.Goals || undefined
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
