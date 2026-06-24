import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	const [bids, projects, vendors, workOrders, approvals] = await Promise.all([
		adminFetch('bids', {
			sort: '-created',
			expand: 'projectId,vendorId,taskId',
			fields: 'id,projectId,vendorId,taskId,amount,materialsAmount,laborAmount,logisticsAmount,otherAmount,referenceNumber,timeline,scope,status,notes,created,submittedAt,awardedAt'
		}),
		adminFetch('projects',    { filter: 'biddingOpen=true', fields: 'id,name,type,project_budget', sort: 'name' }),
		adminFetch('vendors',     { fields: 'id,name,category', sort: 'name' }),
		adminFetch('work_orders', { filter: 'source=bid', fields: 'id,work_order_number,bidId', sort: '-created' }),
		adminFetch('approvals',   { filter: 'entityType=bid', fields: 'id,entityId,status', sort: '-created' }),
	]);

	// Map bidId → PO number
	const poByBid: Record<string, string> = {};
	for (const wo of workOrders as any[]) {
		if (wo.bidId) poByBid[wo.bidId] = wo.work_order_number;
	}

	// Map bidId → approval status (most recent)
	const approvalByBid: Record<string, string> = {};
	for (const a of approvals as any[]) {
		if (a.entityId && !approvalByBid[a.entityId]) {
			approvalByBid[a.entityId] = a.status;
		}
	}

	const stageCounts: Record<string, number> = {};
	for (const b of bids as any[]) {
		stageCounts[b.status] = (stageCounts[b.status] ?? 0) + 1;
	}

	return { bids, projects, vendors, stageCounts, poByBid, approvalByBid };
};
