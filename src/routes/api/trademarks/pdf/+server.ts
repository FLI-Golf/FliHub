/**
 * POST /api/trademarks/pdf
 *
 * Generates a PDF for one or more trademark filings using PDFKit,
 * saves it back to each filing record in PocketBase, logs the run
 * to trademark_pdf_jobs, and returns proxy URLs for the generated files.
 *
 * Body:
 *   filingIds?:    string[]  — specific filing IDs
 *   franchiseIds?: string[]  — all filings for these franchises
 *   includeLeague?: boolean
 *
 * Returns: { jobId: string, urls: { filingId: string, url: string }[] }
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

const PB_URL = 'https://pocketbase-production-6ab5.up.railway.app';

const STATUS_LABELS: Record<string,string> = {
	not_filed:'Not Filed', attorney_review:'Attorney Review', filed:'Filed',
	published:'Published for Opposition', approved:'Registered',
	rejected:'Refused', abandoned:'Abandoned', opposition:'Under Opposition'
};
const CLASS_LABELS: Record<string,string> = {
	ic_025:'IC 025 — Clothing, Footwear & Headgear',
	ic_028:'IC 028 — Sporting Goods, Games & Toys',
	ic_041:'IC 041 — Entertainment, Sports Events & Education',
	ic_035:'IC 035 — Advertising & Business Management',
	ic_038:'IC 038 — Telecommunications & Broadcasting',
	ic_009:'IC 009 — Software & Digital Goods',
};
const VARIANT_LABELS: Record<string,string> = {
	logoFull:'Full Logo', logoMini:'Mini / Icon', logoHorizontal:'Horizontal',
	logoVertical:'Vertical', logoMonochrome:'Monochrome', logoWordmark:'Wordmark', none:'N/A'
};
const MARK_TYPE_LABELS: Record<string,string> = {
	word_mark:'Word Mark', design_mark:'Design Mark (Logo/Graphic)',
	composite_mark:'Composite Mark', service_mark:'Service Mark'
};
const STATUS_COLORS: Record<string,string> = {
	not_filed:'#64748b', attorney_review:'#3b82f6', filed:'#8b5cf6',
	published:'#f59e0b', approved:'#10b981', rejected:'#ef4444',
	abandoned:'#475569', opposition:'#f97316'
};
const VARIANT_FIELD_MAP: Record<string,string> = {
	logoFull:'logoFull', logoMini:'logoMini', logoHorizontal:'logoHorizontal',
	logoVertical:'logoVertical', logoMonochrome:'logoMonochrome', logoWordmark:'logoWordmark'
};

function hex2rgb(hex: string): [number,number,number] {
	const h = (hex||'#1e293b').replace('#','');
	return [parseInt(h.slice(0,2),16)||30, parseInt(h.slice(2,4),16)||41, parseInt(h.slice(4,6),16)||59];
}

function normalizeHex(hex: string): string {
	if (!hex) return '#000000';
	return hex.startsWith('#') ? hex : '#' + hex;
}

async function fetchImageBuffer(url: string): Promise<Buffer|null> {
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
		if (!res.ok) return null;
		return Buffer.from(await res.arrayBuffer());
	} catch { return null; }
}

function pick01(files: string[]): string|null {
	return files.find(f => /_01_/i.test(f) && /\.jpe?g$/i.test(f))
		?? files.find(f => /\.jpe?g$/i.test(f))
		?? files[0] ?? null;
}

async function buildPDF(
	subject: { name:string; primaryColor?:string; secondaryColor?:string; colorPalette?: any[] },
	filings: Array<{ filing:any; imgBuffer:Buffer|null }>
): Promise<Buffer> {
	const PDFDocument = (await import('pdfkit')).default;
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ size:'LETTER', margin:0, info:{
			Title:`${subject.name} — Trademark Filing`, Author:'FLI Golf League'
		}});
		const chunks: Buffer[] = [];
		doc.on('data', (c:Buffer) => chunks.push(c));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);

		const W=612, MARGIN=48;
		const primary   = normalizeHex(subject.primaryColor   || '#1e293b');
		const secondary = normalizeHex(subject.secondaryColor || '#334155');
		const [r1,g1,b1] = hex2rgb(primary);
		const [r2,g2,b2] = hex2rgb(secondary);

		// Header
		doc.rect(0,0,W,120).fill([r1,g1,b1]);
		doc.rect(W*0.55,0,W*0.45,120).fillOpacity(0.45).fill([r2,g2,b2]);
		doc.fillOpacity(1);
		doc.fillColor('#ffffff').font('Helvetica').fontSize(8)
		   .text('FLI GOLF LEAGUE — TRADEMARK FILING', MARGIN, 26, {characterSpacing:1.5});
		doc.font('Helvetica-Bold').fontSize(24).text(subject.name, MARGIN, 44);
		const genDate = new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
		doc.font('Helvetica').fontSize(8).fillColor('#ffffffaa')
		   .text(filings.length + ' mark' + (filings.length!==1?'s':'') + '  ·  Generated ' + genDate, MARGIN, 96);

		// Brand Colors section
		let y = 138;
		doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b')
		   .text('BRAND COLORS', MARGIN, y, {characterSpacing:1});
		y += 14;

		const swatchW=110, swatchH=36, swatchGap=12;
		// Build full color list: Primary + Secondary + any palette entries
		const paletteEntries: { label: string; hex: string }[] = Array.isArray(subject.colorPalette)
			? subject.colorPalette.map((e: any) => ({ label: e.label || 'Color', hex: normalizeHex(e.value || '#000000') }))
			: [];

		const colorDefs: { label: string; hex: string; rgb: [number,number,number] }[] = [
			{ label: 'Primary',   hex: primary,   rgb: [r1,g1,b1] },
			{ label: 'Secondary', hex: secondary, rgb: [r2,g2,b2] },
			...paletteEntries.map(e => ({ label: e.label, hex: e.hex, rgb: hex2rgb(e.hex) }))
		];

		colorDefs.forEach((c, i) => {
			const cx = MARGIN + i * (swatchW + swatchGap);
			doc.roundedRect(cx, y, swatchW, swatchH, 5).fill(c.rgb);
			doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e293b')
			   .text(c.label, cx, y + swatchH + 4, {width: swatchW});
			doc.font('Helvetica').fontSize(7.5).fillColor('#475569')
			   .text(c.hex.toUpperCase(), cx, y + swatchH + 14, {width: swatchW});
		});
		y += swatchH + 32;

		// Section header
		doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b')
		   .text('TRADEMARK MARKS', MARGIN, y, {characterSpacing:1});
		y += 18;

		for (const {filing:f, imgBuffer} of filings) {
			const cardH = 148;
			if (y+cardH > 730) { doc.addPage(); y=MARGIN; }
			doc.roundedRect(MARGIN,y,W-MARGIN*2,cardH,7).fillAndStroke('#ffffff','#e2e8f0');

			// Left accent bar in primary color
			doc.roundedRect(MARGIN,y,4,cardH,2).fill([r1,g1,b1]);

			const imgSz=100, imgX=MARGIN+18, imgY=y+(cardH-imgSz)/2;
			if (imgBuffer) {
				try { doc.image(imgBuffer, imgX, imgY, {fit:[imgSz,imgSz],align:'center',valign:'center'}); }
				catch {}
			} else {
				doc.rect(imgX,imgY,imgSz,imgSz).fillAndStroke('#f8fafc','#e2e8f0');
				doc.font('Helvetica').fontSize(8).fillColor('#94a3b8')
				   .text('No image',imgX,imgY+44,{width:imgSz,align:'center'});
			}

			const tx=imgX+imgSz+18, tw=W-MARGIN*2-imgSz-50;
			let ty=y+16;
			doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b')
			   .text(MARK_TYPE_LABELS[f.markType]??f.markType, tx, ty);
			ty+=15;

			const vLabel=VARIANT_LABELS[f.logoVariant]??f.logoVariant;
			const sLabel=STATUS_LABELS[f.status]??f.status;
			const [sr,sg,sb]=hex2rgb(STATUS_COLORS[f.status]||'#64748b');

			doc.font('Helvetica').fontSize(8);
			const vw=doc.widthOfString(vLabel)+12;
			const sw=doc.widthOfString(sLabel)+12;
			doc.roundedRect(tx,ty,vw,15,7).fill('#f1f5f9');
			doc.font('Helvetica').fontSize(8).fillColor('#475569').text(vLabel,tx+6,ty+3.5);
			doc.roundedRect(tx+vw+6,ty,sw,15,7).fill([sr,sg,sb]);
			doc.font('Helvetica').fontSize(8).fillColor('#ffffff').text(sLabel,tx+vw+12,ty+3.5);
			ty+=24;

			const rows:[string,string][] = [
				['Trademark Class', CLASS_LABELS[f.trademarkClass]??f.trademarkClass],
				['USPTO App. #',    f.usptoAppNumber||'—'],
				['Filed Date',      f.filedDate ? new Date(f.filedDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'],
				['Approved Date',   f.approvedDate ? new Date(f.approvedDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'],
			];
			for (const [lbl,val] of rows) {
				doc.font('Helvetica').fontSize(8.5).fillColor('#64748b').text(lbl,tx,ty,{width:110});
				doc.font('Helvetica').fontSize(8.5).fillColor('#1e293b').text(val,tx+115,ty,{width:tw-115});
				ty+=13;
				doc.moveTo(tx,ty).lineTo(tx+tw,ty).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
			}

			const rh = Array.isArray(f.reviewHistory) ? f.reviewHistory : [];
			if (rh.length)
				doc.font('Helvetica').fontSize(7.5).fillColor('#3b82f6')
				   .text(rh.length + ' attorney review' + (rh.length!==1?'s':'') + ' on record', tx, ty+4);

			y += cardH+12;
		}

		// Footer
		if (y+58>760) { doc.addPage(); y=MARGIN; }
		doc.roundedRect(MARGIN,y,W-MARGIN*2,50,6).fillAndStroke('#fffbeb','#fde68a');
		doc.font('Helvetica-Bold').fontSize(8).fillColor('#92400e')
		   .text('Confidential — Attorney Work Product.', MARGIN+12, y+10);
		doc.font('Helvetica').fontSize(8).fillColor('#92400e')
		   .text('This document is prepared in connection with trademark registration proceedings before the USPTO. Not for public distribution. © ' + new Date().getFullYear() + ' FLI Golf League. All rights reserved.',
		         MARGIN+12, y+22, {width:W-MARGIN*2-24});
		doc.end();
	});
}

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.from(locals, url);

	const body = await request.json() as {
		filingIds?: string[];
		franchiseIds?: string[];
		includeLeague?: boolean;
	};
	const { filingIds, franchiseIds, includeLeague=false } = body;

	// Create a pending job record up front
	let jobRecord: any = null;
	try {
		jobRecord = await ctx.pb.collection('trademark_pdf_jobs').create({
			triggeredBy:  ctx.pb.authStore.record?.id ?? 'system',
			filingIds:    filingIds    ?? [],
			franchiseIds: franchiseIds ?? [],
			includeLeague,
			filingCount:  0,
			pdfUrls:      [],
			status:       'pending',
		});
	} catch (e: any) {
		console.error('Failed to create pdf job record:', e.message);
	}

	try {
		// Load filings
		const allFilings = await ctx.pb.collection('trademark_filings').getFullList({ sort:'trademarkClass,markType' });
		let targets: any[] = allFilings;
		if (filingIds?.length)         targets = allFilings.filter((f:any) => filingIds.includes(f.id));
		else if (franchiseIds?.length) targets = allFilings.filter((f:any) => franchiseIds.includes(f.franchiseId));
		if (!targets.length) {
			if (jobRecord) await ctx.pb.collection('trademark_pdf_jobs').update(jobRecord.id, { status:'failed', errorMessage:'No filings found' }).catch(()=>{});
			return json({ message:'No filings found' }, { status:404 });
		}

		// Load franchises (no territory field needed)
		const allFranchises = await ctx.pb.collection('franchises').getFullList({
			fields:'id,collectionId,name,primaryColor,secondaryColor,colorPalette,logoFull,logoMini,logoHorizontal,logoVertical,logoMonochrome,logoWordmark'
		});

		// Load league if needed
		let league: any = null;
		const needsLeague = includeLeague || targets.some((f:any) => !allFranchises.find((x:any) => x.id===f.franchiseId));
		if (needsLeague) {
			try {
				const leagues = await ctx.pb.collection('league').getFullList({
					fields:'id,collectionId,name,primaryColor,secondaryColor,logoMens,logoWomens,logoHorizontal,logoVertical,logoMonochrome,logoWordmark'
				});
				league = leagues[0]??null;
			} catch {}
		}

		// Group filings by subject (franchise or league)
		const subjectMap = new Map<string,any[]>();
		for (const f of targets) {
			if (!subjectMap.has(f.franchiseId)) subjectMap.set(f.franchiseId,[]);
			subjectMap.get(f.franchiseId)!.push(f);
		}

		const results: { filingId:string; url:string }[] = [];
		const jobPdfUrls: string[] = [];

		for (const [subjectId, subjectFilings] of subjectMap) {
			const franchise = allFranchises.find((x:any) => x.id===subjectId);
			const subject   = franchise ?? (league?.id===subjectId ? league : null);
			if (!subject) continue;

			// Resolve logo images per filing variant
			const filingsWithImages = await Promise.all(subjectFilings.map(async (f:any) => {
				const variantField = VARIANT_FIELD_MAP[f.logoVariant];
				const files: string[] = (variantField ? subject[variantField] : null)
					?? subject.logoFull ?? subject.logoMens ?? [];
				const file = pick01(files);
				const imgBuffer = file
					? await fetchImageBuffer(`${PB_URL}/api/files/${subject.collectionId}/${subject.id}/${file}`)
					: null;
				return { filing:f, imgBuffer };
			}));

			// Build PDF
			const pdfBuffer = await buildPDF({
				name:           subject.name,
				primaryColor:   subject.primaryColor,
				secondaryColor: subject.secondaryColor,
				colorPalette:   subject.colorPalette ?? [],
			}, filingsWithImages);

			const slug     = subject.name.replace(/\s+/g,'-').toLowerCase();
			const dateStr  = new Date().toISOString().slice(0,10);
			const filename = slug + '-trademark-' + dateStr + '.pdf';

			// Save PDF to each filing record
			for (const {filing:f} of filingsWithImages) {
				try {
					const fd = new FormData();
					fd.append('pdf', new Blob([pdfBuffer.buffer as ArrayBuffer], {type:'application/pdf'}), filename);
					const updated = await ctx.pb.collection('trademark_filings').update(f.id, fd);
					const storedFile = Array.isArray(updated.pdf) ? updated.pdf[0] : updated.pdf;
					if (storedFile) {
						const proxyUrl = '/api/pb-file/' + updated.collectionId + '/' + updated.id + '/' + storedFile;
						results.push({ filingId:f.id, url:proxyUrl });
						if (!jobPdfUrls.includes(proxyUrl)) jobPdfUrls.push(proxyUrl);
					}
				} catch (e:any) {
					console.error('PDF save failed for ' + f.id + ':', e.message);
				}
			}
		}

		// Mark job complete
		if (jobRecord) {
			await ctx.pb.collection('trademark_pdf_jobs').update(jobRecord.id, {
				filingCount: results.length,
				pdfUrls:     jobPdfUrls,
				status:      'complete',
			}).catch((e:any) => console.error('Job update failed:', e.message));
		}

		return json({ jobId: jobRecord?.id ?? null, urls: results });

	} catch (err:any) {
		console.error('PDF generation error:', err);
		if (jobRecord) {
			await ctx.pb.collection('trademark_pdf_jobs').update(jobRecord.id, {
				status:       'failed',
				errorMessage: err?.message ?? 'unknown error',
			}).catch(()=>{});
		}
		return json({ message: err?.message ?? 'PDF generation failed' }, { status:500 });
	}
};
