/**
 * POST /api/trademarks/pdf
 *
 * Body:
 *   mode:        'combined' | 'individual'
 *   franchiseIds?: string[]   — specific franchises (omit = all)
 *   includeLeague?: boolean
 *   markIndex?:  number       — for individual mode, which mark (0-based across all subjects)
 *
 * Returns: application/pdf
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { buildTrademarkHTML, resolveLogoUrl } from '$lib/pdf/trademark-template';
import type { TrademarkSubject, TrademarkMark } from '$lib/pdf/trademark-template';

const PB_URL = 'https://pocketbase-production-6ab5.up.railway.app';

// Logo variant fields in priority order for each filing
const VARIANT_FIELD_MAP: Record<string, string> = {
	logoFull:       'logoFull',
	logoMini:       'logoMini',
	logoHorizontal: 'logoHorizontal',
	logoVertical:   'logoVertical',
	logoMonochrome: 'logoMonochrome',
	logoWordmark:   'logoWordmark'
};

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.from(locals, url);

	if (ctx.role !== 'admin') {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json() as {
		mode: 'combined' | 'individual';
		franchiseIds?: string[];
		includeLeague?: boolean;
		markIndex?: number;
	};

	const { mode = 'combined', franchiseIds, includeLeague = false, markIndex } = body;

	try {
		// ── Load franchises ───────────────────────────────────────────────────
		const allFranchises = await ctx.pb.collection('franchises').getFullList({
			sort: 'priority',
			fields: 'id,collectionId,name,tagline,description,primaryColor,secondaryColor,territory,franchiseeName,franchiseeEmail,logoFull,logoMini,logoHorizontal,logoVertical,logoMonochrome,logoWordmark'
		});

		const franchises = franchiseIds?.length
			? allFranchises.filter((f: any) => franchiseIds.includes(f.id))
			: allFranchises;

		// ── Load trademark filings ────────────────────────────────────────────
		const filings = await ctx.pb.collection('trademark_filings').getFullList({
			sort: 'markType,logoVariant'
		});

		// ── Build subjects ────────────────────────────────────────────────────
		const subjects: TrademarkSubject[] = [];

		for (const franchise of franchises) {
			const franchiseFilings = filings.filter((f: any) => f.franchiseId === franchise.id);
			if (!franchiseFilings.length) continue;

			const marks: TrademarkMark[] = franchiseFilings.map((f: any) => {
				// Resolve logo URL from the franchise record using the filing's logoVariant
				const variantField = VARIANT_FIELD_MAP[f.logoVariant];
				const files: string[] = variantField ? (franchise[variantField] ?? []) : [];
				const logoUrl = files.length
					? resolveLogoUrl(franchise.collectionId, franchise.id, files[0])
					: resolveLogoUrl(franchise.collectionId, franchise.id, franchise.logoFull?.[0]);

				return {
					id:              f.id,
					markType:        f.markType,
					logoVariant:     f.logoVariant,
					trademarkClass:  f.trademarkClass,
					status:          f.status,
					usptoAppNumber:  f.usptoAppNumber,
					filedDate:       f.filedDate,
					logoUrl
				};
			});

			subjects.push({
				type:          'franchise',
				name:          franchise.name,
				tagline:       franchise.tagline,
				description:   franchise.description,
				primaryColor:  franchise.primaryColor,
				secondaryColor:franchise.secondaryColor,
				ownerName:     franchise.franchiseeName,
				ownerEmail:    franchise.franchiseeEmail,
				territory:     franchise.territory,
				marks
			});
		}

		// ── Optionally include league ─────────────────────────────────────────
		if (includeLeague) {
			try {
				const leagues = await ctx.pb.collection('league').getFullList({
					fields: 'id,collectionId,name,tagline,primaryColor,secondaryColor,logoMens,logoWomens,logoHorizontal,logoVertical,logoMonochrome,logoWordmark'
				});
				const league = leagues[0];
				if (league) {
					const leagueFilings = filings.filter((f: any) => f.franchiseId === league.id);
					// If no filings linked, generate default word + design marks
					const leagueMarks: TrademarkMark[] = leagueFilings.length
						? leagueFilings.map((f: any) => ({
							id: f.id, markType: f.markType, logoVariant: f.logoVariant,
							trademarkClass: f.trademarkClass, status: f.status,
							usptoAppNumber: f.usptoAppNumber, filedDate: f.filedDate,
							logoUrl: resolveLogoUrl(league.collectionId, league.id, league.logoMens?.[0])
						}))
						: [
							{
								id: 'league-word', markType: 'word_mark', logoVariant: 'none',
								trademarkClass: 'ic_041', status: 'not_filed',
								logoUrl: resolveLogoUrl(league.collectionId, league.id, league.logoMens?.[0])
							},
							{
								id: 'league-design-mens', markType: 'design_mark', logoVariant: 'logoFull',
								trademarkClass: 'ic_041', status: 'not_filed',
								logoUrl: resolveLogoUrl(league.collectionId, league.id, league.logoMens?.[0])
							},
							{
								id: 'league-design-womens', markType: 'design_mark', logoVariant: 'logoFull',
								trademarkClass: 'ic_041', status: 'not_filed',
								logoUrl: resolveLogoUrl(league.collectionId, league.id, league.logoWomens?.[0])
							}
						];

					subjects.unshift({
						type:          'league',
						name:          league.name ?? 'FLI Golf League',
						tagline:       league.tagline,
						primaryColor:  league.primaryColor,
						secondaryColor:league.secondaryColor,
						marks:         leagueMarks
					});
				}
			} catch {
				// league collection missing — skip silently
			}
		}

		if (!subjects.length) {
			return json({ message: 'No filings found for the selected franchises' }, { status: 404 });
		}

		// ── Render HTML ───────────────────────────────────────────────────────
		const html = buildTrademarkHTML(subjects, mode, markIndex);

		// ── Launch Puppeteer ──────────────────────────────────────────────────
		const chromium = (await import('@sparticuz/chromium')).default;
		const puppeteer = (await import('puppeteer-core')).default;

		const browser = await puppeteer.launch({
			args:           chromium.args,
			executablePath: await chromium.executablePath(),
			headless:       true
		});

		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: 'networkidle0' });

		const pdf = await page.pdf({
			format:              'Letter',
			printBackground:     true,
			margin:              { top: '0', right: '0', bottom: '0', left: '0' }
		});

		await browser.close();

		// ── Return PDF ────────────────────────────────────────────────────────
		const subjectNames = subjects.map(s => s.name.replace(/\s+/g, '-')).join('_');
		const filename = `FLI-Trademark-${subjectNames}-${new Date().toISOString().slice(0,10)}.pdf`;

		return new Response(Buffer.from(pdf), {
			headers: {
				'Content-Type':        'application/pdf',
				'Content-Disposition': `attachment; filename="${filename}"`,
				'Cache-Control':       'no-store'
			}
		});

	} catch (err: any) {
		console.error('PDF generation error:', err);
		return json({ message: err?.message ?? 'PDF generation failed' }, { status: 500 });
	}
};
