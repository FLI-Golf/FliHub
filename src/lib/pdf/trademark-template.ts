const PB_URL = 'https://pocketbase-production-6ab5.up.railway.app';

export interface TrademarkMark {
	id: string;
	markType: string;
	logoVariant: string;
	trademarkClass: string;
	status: string;
	usptoAppNumber?: string;
	filedDate?: string;
	logoUrl?: string;       // resolved absolute URL to the logo image
}

export interface TrademarkSubject {
	type: 'franchise' | 'league';
	name: string;
	tagline?: string;
	description?: string;
	primaryColor?: string;
	secondaryColor?: string;
	ownerName?: string;     // franchisee name or league owner
	ownerEmail?: string;
	territory?: string;
	marks: TrademarkMark[];
}

const CLASS_LABELS: Record<string, string> = {
	ic_028: 'IC 028 — Sporting Goods, Games & Toys',
	ic_041: 'IC 041 — Entertainment, Sports Events & Education',
	ic_025: 'IC 025 — Clothing, Footwear & Headgear',
	ic_035: 'IC 035 — Advertising & Business Management',
	ic_038: 'IC 038 — Telecommunications & Broadcasting',
	ic_009: 'IC 009 — Software & Digital Goods',
	other:  'Other'
};

const MARK_TYPE_LABELS: Record<string, string> = {
	word_mark:      'Word Mark (Standard Character)',
	design_mark:    'Design Mark (Logo/Graphic)',
	composite_mark: 'Composite Mark (Name + Logo)'
};

const VARIANT_LABELS: Record<string, string> = {
	none:           'N/A',
	logoFull:       'Full Logo',
	logoMini:       'Mini / Icon',
	logoHorizontal: 'Horizontal Layout',
	logoVertical:   'Vertical Layout',
	logoMonochrome: 'Monochrome',
	logoWordmark:   'Wordmark'
};

function fmtDate(d?: string) {
	if (!d) return '—';
	return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function colorSwatch(hex?: string) {
	if (!hex) return '';
	return `<span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${hex};border:1px solid #ccc;vertical-align:middle;margin-right:6px;"></span>${hex}`;
}

function markPage(mark: TrademarkMark, subject: TrademarkSubject, index: number, total: number): string {
	return `
	<div class="page mark-page">
		<div class="page-header">
			<div class="header-left">
				<div class="org-name">FLI Golf League</div>
				<div class="doc-title">USPTO Trademark Submission</div>
			</div>
			<div class="header-right">
				<div class="page-num">Mark ${index} of ${total}</div>
				<div class="filing-date">Prepared: ${fmtDate(new Date().toISOString())}</div>
			</div>
		</div>

		<div class="mark-header" style="border-left: 5px solid ${subject.primaryColor || '#1a1a2e'}">
			<h1 class="mark-title">${subject.name}</h1>
			${subject.tagline ? `<p class="mark-tagline">"${subject.tagline}"</p>` : ''}
		</div>

		<div class="two-col">
			<!-- Left: logo -->
			<div class="logo-box">
				${mark.logoUrl
					? `<img src="${mark.logoUrl}" alt="${subject.name} logo" class="logo-img" />`
					: `<div class="logo-placeholder">No logo uploaded</div>`
				}
				<p class="logo-caption">${VARIANT_LABELS[mark.logoVariant] ?? mark.logoVariant}</p>
			</div>

			<!-- Right: filing details -->
			<div class="details-box">
				<table class="details-table">
					<tr>
						<th>Mark Type</th>
						<td>${MARK_TYPE_LABELS[mark.markType] ?? mark.markType}</td>
					</tr>
					<tr>
						<th>Trademark Class</th>
						<td>${CLASS_LABELS[mark.trademarkClass] ?? mark.trademarkClass}</td>
					</tr>
					<tr>
						<th>USPTO App #</th>
						<td>${mark.usptoAppNumber || '— Pending —'}</td>
					</tr>
					<tr>
						<th>Filed Date</th>
						<td>${fmtDate(mark.filedDate)}</td>
					</tr>
					<tr>
						<th>Status</th>
						<td><span class="status-badge status-${mark.status}">${mark.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></td>
					</tr>
					${subject.territory ? `<tr><th>Territory</th><td>${subject.territory}</td></tr>` : ''}
				</table>
			</div>
		</div>

		<!-- Owner / Applicant info -->
		<div class="section">
			<h2 class="section-title">Applicant Information</h2>
			<table class="details-table">
				<tr><th>Organization</th><td>FLI Golf League, LLC</td></tr>
				${subject.ownerName  ? `<tr><th>Contact</th><td>${subject.ownerName}</td></tr>` : ''}
				${subject.ownerEmail ? `<tr><th>Email</th><td>${subject.ownerEmail}</td></tr>` : ''}
				<tr><th>Entity Type</th><td>Limited Liability Company (LLC)</td></tr>
				<tr><th>State of Formation</th><td>Nevada</td></tr>
			</table>
		</div>

		<!-- Description of goods/services -->
		<div class="section">
			<h2 class="section-title">Description of Goods / Services</h2>
			<div class="goods-box">
				${mark.trademarkClass === 'ic_041'
					? `Professional disc golf league services; organizing and conducting professional sporting events and competitions; entertainment services in the nature of professional sports exhibitions; sports franchise services.`
					: mark.trademarkClass === 'ic_028'
					? `Disc golf equipment; flying discs; sporting goods and equipment for disc golf competitions.`
					: mark.trademarkClass === 'ic_025'
					? `Athletic apparel, namely shirts, jerseys, hats, caps, jackets, and shorts bearing franchise team marks.`
					: mark.trademarkClass === 'ic_035'
					? `Franchise services; business management and consulting services for professional sports franchises.`
					: mark.trademarkClass === 'ic_038'
					? `Broadcasting and streaming services for professional disc golf events; digital media distribution.`
					: `See attached description.`
				}
			</div>
		</div>

		<!-- Brand colors -->
		${subject.primaryColor || subject.secondaryColor ? `
		<div class="section">
			<h2 class="section-title">Brand Colors</h2>
			<div class="colors-row">
				${subject.primaryColor   ? `<div class="color-chip"><div class="chip" style="background:${subject.primaryColor}"></div><span>Primary: ${subject.primaryColor}</span></div>` : ''}
				${subject.secondaryColor ? `<div class="color-chip"><div class="chip" style="background:${subject.secondaryColor}"></div><span>Secondary: ${subject.secondaryColor}</span></div>` : ''}
			</div>
		</div>` : ''}

		<div class="page-footer">
			<span>FLI Golf League — Confidential — For Attorney Use</span>
			<span>${subject.name} · ${MARK_TYPE_LABELS[mark.markType] ?? mark.markType}</span>
		</div>
	</div>`;
}

export function buildTrademarkHTML(subjects: TrademarkSubject[], mode: 'combined' | 'individual', targetIndex?: number): string {
	// In individual mode, only render the one mark at targetIndex
	const allMarks: { mark: TrademarkMark; subject: TrademarkSubject }[] = [];
	for (const subject of subjects) {
		for (const mark of subject.marks) {
			allMarks.push({ mark, subject });
		}
	}

	const toRender = mode === 'individual' && targetIndex !== undefined
		? [allMarks[targetIndex]]
		: allMarks;

	const total = toRender.length;

	const coverPage = `
	<div class="page cover-page">
		<div class="cover-logo-area">
			<div class="cover-badge">USPTO</div>
			<div class="cover-badge">Trademark</div>
			<div class="cover-badge">Submission</div>
		</div>
		<h1 class="cover-title">FLI Golf League</h1>
		<p class="cover-subtitle">Trademark Filing Package</p>
		<div class="cover-meta">
			<div class="cover-meta-row"><span>Prepared:</span><span>${fmtDate(new Date().toISOString())}</span></div>
			<div class="cover-meta-row"><span>Total Marks:</span><span>${total}</span></div>
			<div class="cover-meta-row"><span>Subjects:</span><span>${subjects.map(s => s.name).join(', ')}</span></div>
			<div class="cover-meta-row"><span>Prepared for:</span><span>Attorney Review &amp; USPTO Filing</span></div>
		</div>
		<div class="cover-toc">
			<h2>Contents</h2>
			<ol>
				${toRender.map(({ mark, subject }, i) =>
					`<li>${subject.name} — ${MARK_TYPE_LABELS[mark.markType] ?? mark.markType} (${VARIANT_LABELS[mark.logoVariant] ?? mark.logoVariant})</li>`
				).join('')}
			</ol>
		</div>
		<div class="cover-footer">FLI Golf League, LLC · Confidential · For Attorney Use Only</div>
	</div>`;

	const markPages = toRender.map(({ mark, subject }, i) =>
		markPage(mark, subject, i + 1, total)
	).join('');

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>FLI Golf — Trademark Submission</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; color: #1a1a2e; background: #fff; }

  .page { width: 8.5in; min-height: 11in; padding: 0.75in; page-break-after: always; position: relative; display: flex; flex-direction: column; }
  .page:last-child { page-break-after: avoid; }

  /* Cover */
  .cover-page { background: #1a1a2e; color: #fff; align-items: center; justify-content: center; text-align: center; gap: 24px; }
  .cover-logo-area { display: flex; gap: 12px; justify-content: center; margin-bottom: 8px; }
  .cover-badge { background: #fff; color: #1a1a2e; font-weight: 800; font-size: 10pt; padding: 6px 14px; border-radius: 4px; letter-spacing: 0.05em; text-transform: uppercase; }
  .cover-title { font-size: 36pt; font-weight: 900; letter-spacing: -0.02em; }
  .cover-subtitle { font-size: 16pt; color: #94a3b8; margin-top: -8px; }
  .cover-meta { background: rgba(255,255,255,0.08); border-radius: 8px; padding: 20px 32px; width: 100%; max-width: 5in; text-align: left; }
  .cover-meta-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 11pt; }
  .cover-meta-row:last-child { border-bottom: none; }
  .cover-meta-row span:first-child { color: #94a3b8; }
  .cover-toc { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px 32px; width: 100%; max-width: 5in; text-align: left; }
  .cover-toc h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 10px; }
  .cover-toc ol { padding-left: 18px; }
  .cover-toc li { padding: 4px 0; font-size: 10pt; color: #e2e8f0; }
  .cover-footer { position: absolute; bottom: 0.5in; font-size: 9pt; color: #64748b; }

  /* Mark pages */
  .mark-page { gap: 18px; }
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }
  .org-name { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
  .doc-title { font-size: 11pt; font-weight: 700; color: #1a1a2e; }
  .header-right { text-align: right; }
  .page-num { font-size: 10pt; font-weight: 600; }
  .filing-date { font-size: 9pt; color: #64748b; }

  .mark-header { padding: 14px 16px; background: #f8fafc; border-radius: 6px; }
  .mark-title { font-size: 22pt; font-weight: 900; letter-spacing: -0.01em; }
  .mark-tagline { font-size: 11pt; color: #64748b; font-style: italic; margin-top: 4px; }

  .two-col { display: flex; gap: 24px; }
  .logo-box { flex: 0 0 2.5in; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background: #f8fafc; }
  .logo-img { max-width: 2in; max-height: 2in; object-fit: contain; }
  .logo-placeholder { width: 2in; height: 2in; display: flex; align-items: center; justify-content: center; background: #e2e8f0; border-radius: 6px; color: #94a3b8; font-size: 9pt; text-align: center; }
  .logo-caption { font-size: 9pt; color: #64748b; margin-top: 8px; text-align: center; }

  .details-box { flex: 1; }
  .details-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  .details-table th { text-align: left; padding: 7px 10px; background: #f1f5f9; color: #475569; font-weight: 600; width: 38%; border-bottom: 1px solid #e2e8f0; }
  .details-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; color: #1a1a2e; }

  .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: 600; text-transform: capitalize; }
  .status-not_filed       { background: #f1f5f9; color: #475569; }
  .status-attorney_review { background: #dbeafe; color: #1d4ed8; }
  .status-filed           { background: #ede9fe; color: #6d28d9; }
  .status-published       { background: #fef9c3; color: #854d0e; }
  .status-opposition      { background: #ffedd5; color: #9a3412; }
  .status-approved        { background: #dcfce7; color: #166534; }
  .status-rejected        { background: #fee2e2; color: #991b1b; }
  .status-abandoned       { background: #f1f5f9; color: #94a3b8; }

  .section { }
  .section-title { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 700; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
  .goods-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; font-size: 10pt; line-height: 1.6; color: #334155; }

  .colors-row { display: flex; gap: 16px; }
  .color-chip { display: flex; align-items: center; gap: 8px; font-size: 10pt; }
  .chip { width: 28px; height: 28px; border-radius: 4px; border: 1px solid #e2e8f0; flex-shrink: 0; }

  .page-footer { margin-top: auto; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 8pt; color: #94a3b8; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-after: always; }
  }
</style>
</head>
<body>
${coverPage}
${markPages}
</body>
</html>`;
}

/** Build a logo URL from PocketBase file metadata */
export function resolveLogoUrl(
	collectionId: string,
	recordId: string,
	filename: string | undefined
): string | undefined {
	if (!filename) return undefined;
	return `${PB_URL}/api/files/${collectionId}/${recordId}/${filename}`;
}
