import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import type PocketBase from 'pocketbase';
import type { RequestHandler } from './$types';

type FinancePayload = {
	downPaymentAmount?: number;
	travelAmount?: number;
	lodgingAmount?: number;
	notes?: string;
};

async function createExpenseWithApproval(
	pb: PocketBase,
	{
		amount,
		category,
		description,
		notes,
		requestedBy,
	}: {
		amount: number;
		category: string;
		description: string;
		notes: string;
		requestedBy: string | null;
	}
) {
	if (!amount || amount <= 0) return;

	const existing = await pb.collection('expenses').getList(1, 1, {
		filter: `description = "${description.replaceAll('"', '\\"')}"`,
		fields: 'id'
	}).catch(() => ({ totalItems: 0 }));

	if ((existing as any).totalItems > 0) return;

	const today = new Date().toISOString().slice(0, 10);
	const expense = await pb.collection('expenses').create({
		description,
		amount,
		category,
		status: 'submitted',
		date: today,
		notes,
		paymentMethod: 'wire_transfer',
		...(requestedBy ? { submittedBy: requestedBy } : {})
	});

	await pb.collection('approvals').create({
		entityType: 'expense',
		entityId: expense.id,
		status: 'pending',
		requestedBy,
		requestedDate: new Date().toISOString(),
		amount,
		comments: '<p>Auto-created from event booking confirmation. Sent to approvals queue.</p>'
	}).catch(() => null);
}

export const PATCH: RequestHandler = async ({ locals, url, request, params }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const ctx = guard.ctx;
		const pb = ctx.pb;
		const body = await request.json();
		const payload: Record<string, unknown> = {};
		const finance: FinancePayload | null = body.finance ?? null;

		const existing = await pb.collection('event_talent').getOne(params.eventTalentId, {
			expand: 'talent,talentGroup,event'
		}).catch(() => null);
		if (!existing) {
			return json({ message: 'Booking not found' }, { status: 404 });
		}

		if (body.status) payload.status = body.status;
		if (body.role) payload.role = body.role;
		if (body.rateOverride !== undefined) {
			payload.rateOverride = body.rateOverride;
			payload.confirmedRate = body.rateOverride;
		}

		const updated = await pb.collection('event_talent').update(params.eventTalentId, payload);

		const movedToConfirmed = body.status === 'confirmed' && existing.status !== 'confirmed';
		if (movedToConfirmed) {
			const baseRate = Number(payload.confirmedRate ?? existing.confirmedRate ?? 0);
			const defaultDownPayment = Math.round((baseRate * 0.3) * 100) / 100;
			const downPaymentAmount = Number(finance?.downPaymentAmount ?? defaultDownPayment);
			const travelAmount = Number(finance?.travelAmount ?? 0);
			const lodgingAmount = Number(finance?.lodgingAmount ?? 0);
			const extraNotes = String(finance?.notes ?? '').trim();

			const talentName = existing.expand?.talentGroup?.name
				?? existing.expand?.talent?.name
				?? 'Talent Booking';
			const eventName = existing.expand?.event?.name ?? 'Event';
			const marker = `[ET:${existing.id}]`;
			const commonNotes = [
				`Auto-created when booking moved to Booked.`,
				`Event: ${eventName}`,
				extraNotes ? `Notes: ${extraNotes}` : ''
			].filter(Boolean).join(' ');

			await createExpenseWithApproval(pb, {
				amount: downPaymentAmount,
				category: 'Consultants',
				description: `${eventName} - ${talentName} down payment ${marker}`,
				notes: commonNotes,
				requestedBy: ctx?.profile?.id ?? null,
			});

			await createExpenseWithApproval(pb, {
				amount: travelAmount,
				category: 'Travel/Airefare',
				description: `${eventName} - ${talentName} travel reimbursement ${marker}`,
				notes: commonNotes,
				requestedBy: ctx?.profile?.id ?? null,
			});

			await createExpenseWithApproval(pb, {
				amount: lodgingAmount,
				category: 'Travel/Lodging',
				description: `${eventName} - ${talentName} lodging reimbursement ${marker}`,
				notes: commonNotes,
				requestedBy: ctx?.profile?.id ?? null,
			});
		}

		return json(updated);
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to update booking' }, { status: 400 });
	}
};
