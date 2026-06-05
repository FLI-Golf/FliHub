import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { RequestContext } from '$lib/infra/RequestContext';

const execFileAsync = promisify(execFile);

export const POST: RequestHandler = async ({ locals }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const role = ctx.profile?.role || '';
	if (!['admin', 'leader'].includes(role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	try {
		const { stdout, stderr } = await execFileAsync('npx', ['tsx', 'scripts/process-media-ai-jobs.ts'], {
			cwd: process.cwd(),
			env: process.env,
			timeout: 120000,
			maxBuffer: 1024 * 1024
		});

		return json({
			ok: true,
			stdout: stdout || '',
			stderr: stderr || ''
		});
	} catch (error: any) {
		return json(
			{
				message: 'Failed to process Phase 7 queue',
				error: error?.message || String(error),
				stdout: error?.stdout || '',
				stderr: error?.stderr || ''
			},
			{ status: 500 }
		);
	}
};
