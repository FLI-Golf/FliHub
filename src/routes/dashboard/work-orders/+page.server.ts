import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		const workOrders = await pb.collection('work_orders').getFullList({
			sort: '-approvedDate',
		});

		const stats = {
			total:     (workOrders as any[]).length,
			open:      (workOrders as any[]).filter((w: any) => w.status === 'open').length,
			paid:      (workOrders as any[]).filter((w: any) => w.status === 'paid').length,
			cancelled: (workOrders as any[]).filter((w: any) => w.status === 'cancelled').length,
			totalAmount: (workOrders as any[]).reduce((s: number, w: any) => s + (w.amount || 0), 0),
			openAmount:  (workOrders as any[]).filter((w: any) => w.status === 'open').reduce((s: number, w: any) => s + (w.amount || 0), 0),
		};

		return { workOrders, stats };
	} catch (e: any) {
		console.error('work-orders load error:', e.message, e.status, JSON.stringify(e.data));
		return { workOrders: [], stats: { total: 0, open: 0, paid: 0, cancelled: 0, totalAmount: 0, openAmount: 0 } };
	}
};
