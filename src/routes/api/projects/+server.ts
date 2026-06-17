import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		const getFieldData = (err: any): Record<string, any> | null => {
			const details = err?.response?.data ?? err?.cause?.data ?? err?.data;
			const possibleFieldData = [
				details?.data,
				err?.response?.data?.data,
				err?.cause?.data?.data,
				err?.data?.data
			].find((value) => value && typeof value === 'object' && !Array.isArray(value));

			return (possibleFieldData && typeof possibleFieldData === 'object')
				? possibleFieldData as Record<string, any>
				: null;
		};

		const getUnknownFields = (err: any): string[] => {
			const fieldData = getFieldData(err);
			if (!fieldData) return [];

			return Object.entries(fieldData)
				.filter(([, issue]) => {
					const message = typeof issue?.message === 'string'
						? issue.message
						: (typeof issue === 'string' ? issue : '');
					const lower = message.toLowerCase();
					return lower.includes('unknown')
						|| lower.includes('invalid field')
						|| lower.includes('not allowed')
						|| lower.includes('cannot be found');
				})
				.map(([field]) => field);
		};

		const name = typeof data.name === 'string' ? data.name.trim() : '';
		const description = typeof data.description === 'string' ? data.description.trim() : '';
		const type = typeof data.type === 'string' ? data.type : '';
		const status = typeof data.status === 'string' ? data.status : '';
		const department = typeof data.department === 'string' ? data.department : '';
		const startDate = typeof data.startDate === 'string' && data.startDate.trim() ? data.startDate : null;
		const endDate = typeof data.endDate === 'string' && data.endDate.trim() ? data.endDate : null;
		const fiscalYear = typeof data.fiscalYear === 'string' && data.fiscalYear.trim() ? data.fiscalYear.trim() : undefined;
		const notes = typeof data.notes === 'string' ? data.notes : '';

		const parseOptionalNumber = (value: unknown) => {
			if (value === null || value === undefined || value === '') return undefined;
			const parsed = Number(value);
			return Number.isFinite(parsed) ? parsed : NaN;
		};

		const projectBudget = parseOptionalNumber(data.project_budget);
		const projectForecastedExpenses = parseOptionalNumber(data.project_forecasted_expenses);
		const projectActualExpenses = parseOptionalNumber(data.project_actual_expenses);
		const projectManualBudgetOverride = parseOptionalNumber(data.project_manual_budget_override);
		const projectBudgetBuffer = parseOptionalNumber(data.project_budget_buffer);
		const projectBudgetCap = parseOptionalNumber(data.project_budget_cap);
		const projectBudgetMode = typeof data.project_budget_mode === 'string' && data.project_budget_mode.trim()
			? data.project_budget_mode.trim()
			: 'auto';
		const biddingOpen = typeof data.biddingOpen === 'boolean' ? data.biddingOpen : false;
		const expenseCategories = data.expenseCategories && typeof data.expenseCategories === 'object'
			? data.expenseCategories
			: {};
		const approvedBy = typeof data.approvedBy === 'string' && data.approvedBy.trim()
			? data.approvedBy.trim()
			: undefined;
		const vendors = Array.isArray(data.vendors) ? data.vendors.filter((v) => typeof v === 'string' && v.trim()) : undefined;

		if (!name) {
			return json({ message: 'Project name is required' }, { status: 400 });
		}

		if (!type || !status) {
			return json({ message: 'Project type and status are required' }, { status: 400 });
		}

		if (!department) {
			return json({ message: 'Department is required' }, { status: 400 });
		}

		if (
			Number.isNaN(projectBudget)
			|| Number.isNaN(projectForecastedExpenses)
			|| Number.isNaN(projectActualExpenses)
			|| Number.isNaN(projectManualBudgetOverride)
			|| Number.isNaN(projectBudgetBuffer)
			|| Number.isNaN(projectBudgetCap)
		) {
			return json({ message: 'Budget fields must be valid numbers' }, { status: 400 });
		}

		if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
			return json({ message: 'Start date must be before or equal to end date' }, { status: 400 });
		}

		let payload: Record<string, unknown> = {
			name,
			description,
			type,
			status,
			department,
			startDate,
			endDate,
			budget: projectBudget,
			project_budget: projectBudget,
			forecastedExpenses: projectForecastedExpenses,
			project_forecasted_expenses: projectForecastedExpenses,
			actualExpenses: projectActualExpenses ?? 0,
			project_actual_expenses: projectActualExpenses ?? 0,
			project_manual_budget_override: projectManualBudgetOverride ?? 0,
			project_budget_mode: projectBudgetMode,
			project_budget_buffer: projectBudgetBuffer ?? 0,
			project_budget_cap: projectBudgetCap ?? 0,
			biddingOpen,
			expenseCategories,
			fiscalYear,
			notes,
			approvedBy,
			vendors
		};

		let project: any;
		let createError: any;

		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				project = await pb.collection('projects').create(payload);
				createError = null;
				break;
			} catch (err: any) {
				createError = err;
				const unknownFields = getUnknownFields(err);

				if (!unknownFields.length) {
					break;
				}

				const nextPayload = { ...payload };
				let removedAny = false;
				for (const field of unknownFields) {
					if (field in nextPayload) {
						delete nextPayload[field];
						removedAny = true;
					}
				}

				if (!removedAny) {
					break;
				}

				payload = nextPayload;
			}
		}

		if (createError) {
			throw createError;
		}

		return json(project, { status: 201 });
	} catch (error: any) {
		console.error('Error creating project:', error);
		const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 600
			? error.status
			: 500;
		const details = error?.response?.data ?? error?.cause?.data ?? error?.data;
		const possibleFieldData = [
			details?.data,
			error?.response?.data?.data,
			error?.cause?.data?.data,
			error?.data?.data
		].find((value) => value && typeof value === 'object' && !Array.isArray(value));

		const fieldErrors = possibleFieldData && typeof possibleFieldData === 'object'
			? Object.entries(possibleFieldData)
				.map(([field, issue]: [string, any]) => {
					if (typeof issue?.message === 'string' && issue.message.trim()) {
						return `${field}: ${issue.message}`;
					}
					if (typeof issue === 'string' && issue.trim()) {
						return `${field}: ${issue}`;
					}
					if (issue !== undefined) {
						return `${field}: ${JSON.stringify(issue)}`;
					}
					return null;
				})
				.filter((v): v is string => Boolean(v))
			: [];

		const message = fieldErrors[0]
			|| error?.response?.message
			|| error?.cause?.data?.message
			|| error?.message
			|| 'Failed to create project';

		return json(
			{ message, details, fieldErrors },
			{ status }
		);
	}
};
