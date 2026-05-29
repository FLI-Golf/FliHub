/**
 * Shared pipeline API helpers (client-side fetch wrappers).
 *
 * Each domain's API route handles the actual PocketBase write; these helpers
 * provide a consistent calling convention and error shape.
 */

export interface PipelineApiError {
	message: string;
	status: number;
}

export interface PipelineMoveResult {
	ok: boolean;
	error?: PipelineApiError;
}

/**
 * Move a record to a new pipeline stage via a PATCH request.
 *
 * @param url    - e.g. `/api/talent-onboarding/abc123`
 * @param status - the new stage key
 * @param extra  - any additional fields to patch alongside status
 */
export async function pipelineMove(
	url: string,
	status: string,
	extra: Record<string, unknown> = {}
): Promise<PipelineMoveResult> {
	try {
		const res = await fetch(url, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status, ...extra })
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			return { ok: false, error: { message: body.message ?? `Error ${res.status}`, status: res.status } };
		}
		return { ok: true };
	} catch (err: any) {
		return { ok: false, error: { message: err?.message ?? 'Network error', status: 0 } };
	}
}

/**
 * Generic POST helper for pipeline actions (assign, approve, reject, etc.).
 */
export async function pipelineAction(
	url: string,
	body: Record<string, unknown> = {}
): Promise<{ ok: boolean; data?: any; error?: PipelineApiError }> {
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) {
			return { ok: false, error: { message: data.message ?? `Error ${res.status}`, status: res.status } };
		}
		return { ok: true, data };
	} catch (err: any) {
		return { ok: false, error: { message: err?.message ?? 'Network error', status: 0 } };
	}
}
