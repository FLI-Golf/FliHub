/**
 * GET /api/pb-file/[collectionId]/[recordId]/[filename]
 *
 * Server-side proxy for PocketBase file storage.
 * The browser cannot reach pocketbase-production directly, so all
 * file URLs are routed through this endpoint which fetches from PB
 * and streams the response back to the client.
 *
 * Supports the same query params PocketBase accepts (e.g. ?thumb=400x400).
 */
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const PB_URL = env.POCKETBASE_URL?.replace(/\/$/, '')
	?? 'https://pocketbase-production-6ab5.up.railway.app';

export const GET: RequestHandler = async ({ params, url }) => {
	// params.path = 'collectionId/recordId/filename'
	const pbUrl = `${PB_URL}/api/files/${params.path}${url.search}`;

	try {
		const res = await fetch(pbUrl, { signal: AbortSignal.timeout(120000) });

		if (!res.ok) {
			return new Response(`File not found: ${res.status}`, { status: res.status });
		}

		// Forward content-type and content-disposition from PocketBase
		const headers = new Headers();
		const ct = res.headers.get('content-type');
		const cd = res.headers.get('content-disposition');
		if (ct) headers.set('content-type', ct);
		if (cd) headers.set('content-disposition', cd);

		// Cache for 1 hour — files in PB are content-addressed
		headers.set('cache-control', 'public, max-age=3600');

		return new Response(res.body, { status: 200, headers });
	} catch (err: any) {
		return new Response(`Proxy error: ${err.message}`, { status: 502 });
	}
};
