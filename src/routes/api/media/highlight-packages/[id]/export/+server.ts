import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	const pb = locals.pb;
	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const [pkg, items] = await Promise.all([
			pb.collection('highlight_packages').getOne(params.id),
			pb.collection('highlight_package_items').getFullList({
				filter: `highlight_package = "${params.id}"`,
				sort: 'sort_order,created'
			}).catch(() => [])
		]);

		const assetIds = Array.from(new Set(items.map((row: any) => row.asset).filter(Boolean)));
		const assets = await Promise.all(assetIds.map((id: string) => pb.collection('media_assets').getOne(id).catch(() => null)));
		const assetsById = new Map(assets.filter(Boolean).map((row: any) => [row.id, row]));

		const manifest = {
			package: {
				id: pkg.id,
				name: pkg.name,
				package_type: pkg.package_type,
				status: pkg.status,
				export_target: pkg.export_target,
				approval_status: pkg.approval_status,
				created: pkg.created,
				updated: pkg.updated
			},
			items: items.map((row: any) => {
				const asset = assetsById.get(row.asset);
				return {
					id: row.id,
					sort_order: row.sort_order,
					usage_role: row.usage_role,
					clip_in_seconds: row.clip_in_seconds,
					clip_out_seconds: row.clip_out_seconds,
					asset: asset
						? {
							id: asset.id,
							title: asset.title,
							file: asset.file,
							asset_type: asset.asset_type,
							media_category: asset.media_category,
							duration_seconds: asset.duration_seconds
						}
						: { id: row.asset }
				};
			}),
			summary: {
				total_items: items.length,
				total_duration_seconds: items.reduce((sum: number, row: any) => {
					const start = Number(row.clip_in_seconds) || 0;
					const end = Number(row.clip_out_seconds) || 0;
					if (!end || end < start) return sum;
					return sum + (end - start);
				}, 0)
			}
		};

		await pb.collection('highlight_packages').update(params.id, { manifest_json: manifest });

		return json(manifest);
	} catch (error) {
		console.error('Error exporting highlight package manifest:', error);
		return json({ message: 'Failed to export highlight package manifest', error: String(error) }, { status: 500 });
	}
};
