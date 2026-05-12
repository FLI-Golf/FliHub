<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { MapPin, Globe, TrendingUp, BarChart3, Target, Star, Info } from 'lucide-svelte';

	// ── Scoring dimensions ────────────────────────────────────────────────────
	// Source: Target Geographic Marketing Report · In-House + Smartboost · May 2026
	// Scores: 1–5 per dimension. Weight: DG 35%, Fantasy 25%, Rec 20%, Betting 20%

	type Market = {
		market: string;
		region: string;
		dg: number;
		fantasy: number;
		rec: number;
		betting: number | null; // null = no legal betting
		tier: 1 | 2 | 3;
		anchor: string;
		segment: string;
	};

	const domestic: Market[] = [
		{ market: 'Denver, CO',              region: 'Mountain West', dg: 5, fantasy: 4, rec: 5, betting: 4,    tier: 1, anchor: 'Johnny Roberts DGC — 2025 US #1',        segment: 'Tourist + core player' },
		{ market: 'Chicago / Chicagoland, IL',region: 'Midwest',      dg: 4, fantasy: 5, rec: 4, betting: 5,    tier: 1, anchor: 'Canyons at Dellwood Park (top-20 world)', segment: 'Core player + fantasy' },
		{ market: 'Dallas / Fort Worth, TX', region: 'South',         dg: 5, fantasy: 5, rec: 4, betting: null, tier: 1, anchor: 'Hideaway DG Ranch',                       segment: 'Newcomer + fantasy' },
		{ market: 'Minneapolis / St. Paul, MN',region:'Midwest',      dg: 5, fantasy: 4, rec: 5, betting: 3,    tier: 1, anchor: 'Bryant Lake Park (top-25 world)',          segment: 'Core player + rec sports' },
		{ market: 'Philadelphia / Pittsburgh, PA',region:'Northeast',  dg: 4, fantasy: 5, rec: 3, betting: 5,   tier: 1, anchor: 'Faylor Lake DGC',                          segment: 'Tourist + betting crossover' },
		{ market: 'New York Metro (NY/NJ)',   region: 'Northeast',    dg: 3, fantasy: 5, rec: 3, betting: 5,    tier: 1, anchor: 'Hudson Valley DG community',               segment: 'Betting + core player' },
		{ market: 'Columbus / Dayton, OH',   region: 'Midwest',      dg: 4, fantasy: 4, rec: 3, betting: 4,    tier: 1, anchor: 'Dayton — UDisc revival city',              segment: 'B2B parks + betting' },
		{ market: 'Phoenix / Scottsdale, AZ',region: 'Southwest',    dg: 3, fantasy: 4, rec: 3, betting: 4,    tier: 1, anchor: 'Scottsdale outdoor culture',               segment: 'Outdoor lifestyle' },
		{ market: 'Boston, MA',              region: 'Northeast',    dg: 3, fantasy: 4, rec: 4, betting: 3,    tier: 1, anchor: 'Blue Hills trail system',                  segment: 'Urban newcomer + parks B2B' },
		{ market: 'Raleigh-Charlotte, NC',   region: 'Southeast',    dg: 3, fantasy: 4, rec: 4, betting: 3,    tier: 1, anchor: 'Raleigh-Charlotte growth corridor',        segment: 'Newcomer campaigns' },
		{ market: 'Seattle, WA',             region: 'Pacific NW',   dg: 4, fantasy: 3, rec: 5, betting: 2,    tier: 1, anchor: "Gaffney's Grove",                          segment: 'Rec sports + tourist' },
		{ market: 'Portland, OR',            region: 'Pacific NW',   dg: 4, fantasy: 3, rec: 5, betting: 2,    tier: 1, anchor: 'Milo McIver (top-25 world)',               segment: 'Rec sports + tourist' },
		{ market: 'Salt Lake City, UT',      region: 'Mountain West', dg: 4, fantasy: 3, rec: 5, betting: 2,   tier: 1, anchor: 'Creekside Park (+50% YOY rounds)',         segment: 'Multi-sport crossover' },
		{ market: 'San Diego, CA',           region: 'West Coast',   dg: 5, fantasy: 4, rec: 4, betting: null, tier: 2, anchor: 'Morley Field — former global #1',          segment: 'Tourism + lifestyle' },
		{ market: 'Austin, TX',              region: 'South',        dg: 3, fantasy: 4, rec: 4, betting: null, tier: 2, anchor: 'Explosive population growth',              segment: 'Newcomer + family' },
		{ market: 'Indianapolis, IN',        region: 'Midwest',      dg: 3, fantasy: 3, rec: 3, betting: 4,    tier: 2, anchor: 'Indianapolis metro anchor',               segment: 'Betting crossover' },
	];

	const international: Market[] = [
		{ market: 'Finland',      region: 'Nordics',         dg: 5, fantasy: 3, rec: 5, betting: 4, tier: 1, anchor: '1.8M YLE Areena streams (2025 Worlds)', segment: 'All segments — intl.' },
		{ market: 'Norway',       region: 'Nordics',         dg: 5, fantasy: 3, rec: 5, betting: 3, tier: 1, anchor: '845 courses; +100/yr; Telia co-broadcast', segment: 'Core player + media' },
		{ market: 'Sweden',       region: 'Nordics',         dg: 5, fantasy: 3, rec: 5, betting: 4, tier: 1, anchor: 'Ale DGC — world #1; DGPT Elite host',    segment: 'Core player + betting' },
		{ market: 'Iceland',      region: 'Nordics',         dg: 5, fantasy: 2, rec: 5, betting: 3, tier: 1, anchor: 'Most DG courses per capita globally',     segment: 'Core player + tourism' },
		{ market: 'Denmark',      region: 'Nordics',         dg: 4, fantasy: 2, rec: 4, betting: 3, tier: 1, anchor: 'Copenhagen DG community',                segment: 'Core player' },
		{ market: 'UK',           region: 'Western Europe',  dg: 3, fantasy: 4, rec: 3, betting: 5, tier: 2, anchor: 'Bet365 / William Hill HQ; FanDuel UK',    segment: 'Betting + core player' },
		{ market: 'Germany',      region: 'Western Europe',  dg: 3, fantasy: 3, rec: 4, betting: 4, tier: 2, anchor: 'Berlin, Munich, Hamburg DG scenes',       segment: 'Core player + betting' },
		{ market: 'Canada',       region: 'North America',   dg: 4, fantasy: 4, rec: 4, betting: 4, tier: 2, anchor: "Raptors Knoll (top-25 world); Alberta",   segment: 'Tourist + rec sports' },
		{ market: 'Australia',    region: 'Asia-Pacific',    dg: 3, fantasy: 3, rec: 4, betting: 5, tier: 2, anchor: 'Top-5 global betting market; Tabcorp',    segment: 'Betting + outdoor' },
		{ market: 'Estonia',      region: 'Eastern Europe',  dg: 3, fantasy: 2, rec: 3, betting: 3, tier: 2, anchor: '2026 DGPT Major host; Tallinn hub',       segment: 'Core player + event' },
		{ market: 'Netherlands',  region: 'Western Europe',  dg: 3, fantasy: 3, rec: 4, betting: 3, tier: 2, anchor: 'Regulated betting 2021; strong rec culture', segment: 'Rec sports + betting' },
		{ market: 'Colombia',     region: 'South America',   dg: 3, fantasy: 2, rec: 3, betting: 3, tier: 3, anchor: 'Medellín + Bogotá scenes; UDisc 2026',    segment: 'Youth + newcomer' },
		{ market: 'Philippines',  region: 'Asia-Pacific',    dg: 2, fantasy: 3, rec: 2, betting: 3, tier: 3, anchor: 'Youth DG movement; mobile-first culture', segment: 'Youth + newcomer' },
		{ market: 'Brazil',       region: 'South America',   dg: 2, fantasy: 4, rec: 3, betting: 4, tier: 3, anchor: 'Flutter/Betfair entered 2025; DraftKings', segment: 'Fantasy + betting' },
		{ market: 'Serbia / Balkans', region: 'Eastern Europe', dg: 2, fantasy: 2, rec: 2, betting: 2, tier: 3, anchor: 'McBeth Foundation Belgrade course 2025', segment: 'Emerging' },
	];

	const totalScore = (m: Market) =>
		m.dg + m.fantasy + m.rec + (m.betting ?? 0);

	const weightedScore = (m: Market) =>
		+(m.dg * 0.35 + m.fantasy * 0.25 + m.rec * 0.20 + (m.betting ?? 0) * 0.20).toFixed(2);

	const tierColor = (t: 1 | 2 | 3) =>
		t === 1 ? 'text-emerald-400 bg-emerald-950/40 border-emerald-700' :
		t === 2 ? 'text-blue-400 bg-blue-950/40 border-blue-700' :
		          'text-slate-400 bg-slate-800/40 border-slate-600';

	const tierLabel = (t: 1 | 2 | 3) =>
		t === 1 ? 'Tier 1 ★★★' : t === 2 ? 'Tier 2 ★★' : 'Tier 3 ★';

	const scoreBar = (v: number | null) => {
		if (v === null) return { w: '0%', cls: 'bg-slate-600' };
		const w = `${(v / 5) * 100}%`;
		const cls = v >= 5 ? 'bg-emerald-500' : v >= 4 ? 'bg-blue-500' : v >= 3 ? 'bg-amber-500' : 'bg-red-500';
		return { w, cls };
	};

	// Quarterly rollout
	const rollout = [
		{ q: 'Q3 2026', domestic: 'Denver, Chicago, Twin Cities, Dallas/FW', intl: 'Finland, Norway', focus: 'DG hotspots + rec sports' },
		{ q: 'Q4 2026', domestic: 'Philadelphia, New York Metro, Ohio',      intl: 'Sweden (DGPT), UK, Germany', focus: 'DG hotspots + sports betting' },
		{ q: 'Q1 2027', domestic: 'Seattle, Portland, Salt Lake City, Boston', intl: 'Canada, Estonia (DGPT Major)', focus: 'Rec sports + tourist segment' },
		{ q: 'Q2 2027', domestic: 'Raleigh-NC, Austin, San Diego, Boise',    intl: 'Colombia, Philippines, Netherlands', focus: 'Newcomer + emerging intl.' },
		{ q: 'Ongoing', domestic: 'Missouri (betting launched Dec 2025), Indiana', intl: 'Nordic year-round; Brazil watch', focus: 'Fantasy sports crossover' },
	];

	let activeTab = $state<'domestic' | 'international'>('domestic');

	// ── Sport overview stats (UDisc 2026 Growth Report) ───────────────────────
	const sportStats = [
		{ value: '17,287', label: 'Courses worldwide', sub: '99 countries' },
		{ value: '21.2M',  label: 'Rounds played (2025)', sub: '+86% since 2020' },
		{ value: '2M+',    label: 'UDisc app users', sub: 'Active players' },
		{ value: '500M',   label: 'People within 10km', sub: 'Addressable reach' },
		{ value: '11,165', label: 'US courses', sub: 'More than Dunkin\', Taco Bell & Domino\'s' },
		{ value: '108K+',  label: 'PDGA members', sub: 'Active registered players' },
		{ value: '32.8M hrs', label: 'On-course hours (2025)', sub: 'Total engagement' },
		{ value: '89%',    label: 'Courses free to play', sub: 'Key newcomer conversion hook' },
	];

	// ── Audience segments ─────────────────────────────────────────────────────
	type Segment = {
		name: string;
		color: string;
		channels: string;
		owner: string;
		message: string;
		conversion: string;
		note: string;
	};
	const segments: Segment[] = [
		{
			name: 'Core Players (US, 18–44)',
			color: 'border-blue-700 bg-blue-950/20',
			channels: 'YouTube, DGN, Reddit, UDisc app',
			owner: 'In-house (content) + Smartboost (SEO & distribution)',
			message: 'Community, competition, and course discovery',
			conversion: 'App downloads, gear purchases, DGN subscriptions, event registration',
			note: 'JomezPro: 467K subscribers, 281M total views — benchmark content model. ~73% male / 27% female; 25–39 age peak.',
		},
		{
			name: 'Women & Newcomers',
			color: 'border-pink-700 bg-pink-950/20',
			channels: 'TikTok, Instagram Reels, local league sign-ups',
			owner: 'In-house (organic social) + Smartboost (landing page CRO)',
			message: '"Got $15 and 90 minutes? You\'re ready to play."',
			conversion: 'Local league sign-ups, newsletter subscribers, beginner course visits',
			note: 'Female participation rising but underdeveloped. 9-hole courses (built 2× rate of 18-hole) are the ideal newcomer on-ramp.',
		},
		{
			name: 'Disc Golf Tourists',
			color: 'border-amber-700 bg-amber-950/20',
			channels: 'UDisc app, travel content, Instagram, Google Search',
			owner: 'In-house (content + UDisc partnership) + Smartboost (destination SEO)',
			message: '"The sport that makes your destination worth the drive."',
			conversion: 'Destination page CTR, lodging referrals, course visit tracking',
			note: '90% of DG players traveled 20+ miles to play; 58% took a dedicated trip. Faylor Lake drew visitors from 40 states + 6 countries.',
		},
		{
			name: 'Families & Multi-Generational',
			color: 'border-emerald-700 bg-emerald-950/20',
			channels: 'Facebook, local community boards, parks events',
			owner: 'In-house (organic + event) + Smartboost (family landing page)',
			message: '"A sport where a 5-year-old and a 50-year-old play together."',
			conversion: 'Family course visits, beginner event attendance, social sharing',
			note: '3,800 steps/round, 400 calories burned, ~93 min outdoors. Multi-generational play is a key differentiator vs. pickleball.',
		},
		{
			name: 'Parks & Rec Decision Makers (B2B)',
			color: 'border-violet-700 bg-violet-950/20',
			channels: 'LinkedIn, trade publications, direct email, UDisc Health Index',
			owner: 'Shared — in-house outreach + Smartboost data landing pages',
			message: '"97 disc golf courses built for every 1 golf course (2022–2024). Your community is next."',
			conversion: 'Course consultation bookings, UDisc data report requests',
			note: 'Montgomery County MD Northwest Branch DGC: 2,200+ rounds in first 3 months. Lead with outcomes like this.',
		},
	];

	// ── Monthly interaction projections ───────────────────────────────────────
	type Projection = {
		segment: string;
		channel: string;
		owner: string;
		reachLow: number;
		reachHigh: number;
		engLow: number;
		engHigh: number;
		intLow: number;
		intHigh: number;
		goal: string;
	};
	const projections: Projection[] = [
		{ segment: 'Core Players',      channel: 'YouTube + DGN',       owner: 'In-house',   reachLow: 450000, reachHigh: 500000, engLow: 4,  engHigh: 6,  intLow: 18000, intHigh: 30000, goal: 'App downloads, merch' },
		{ segment: 'Core Players',      channel: 'SEO / blog',           owner: 'Smartboost', reachLow: 80000,  reachHigh: 120000, engLow: 2.5,engHigh: 4,  intLow: 2000,  intHigh: 4800,  goal: 'Email sign-ups' },
		{ segment: 'Women & Newcomers', channel: 'TikTok + Instagram',   owner: 'In-house',   reachLow: 150000, reachHigh: 250000, engLow: 5,  engHigh: 8,  intLow: 7500,  intHigh: 20000, goal: 'League sign-ups' },
		{ segment: 'Women & Newcomers', channel: 'Landing page CRO',     owner: 'Smartboost', reachLow: 30000,  reachHigh: 50000,  engLow: 3,  engHigh: 5,  intLow: 900,   intHigh: 2500,  goal: 'Form fills, newsletter' },
		{ segment: 'DG Tourists',       channel: 'UDisc + travel content',owner: 'In-house',  reachLow: 200000, reachHigh: 300000, engLow: 3,  engHigh: 5,  intLow: 6000,  intHigh: 15000, goal: 'Course visits, lodging' },
		{ segment: 'DG Tourists',       channel: 'Destination SEO',      owner: 'Smartboost', reachLow: 40000,  reachHigh: 70000,  engLow: 3,  engHigh: 5,  intLow: 1200,  intHigh: 3500,  goal: 'Travel page CTR' },
		{ segment: 'Parks & Rec (B2B)', channel: 'LinkedIn + email',     owner: 'Shared',     reachLow: 10000,  reachHigh: 20000,  engLow: 8,  engHigh: 12, intLow: 800,   intHigh: 2400,  goal: 'Consultations booked' },
		{ segment: 'Parks & Rec (B2B)', channel: 'SEO + data pages',     owner: 'Smartboost', reachLow: 5000,   reachHigh: 10000,  engLow: 6,  engHigh: 10, intLow: 300,   intHigh: 1000,  goal: 'Health Index leads' },
		{ segment: 'Intl — Nordics',    channel: 'YLE / Telia / content', owner: 'Smartboost', reachLow: 500000, reachHigh: 1000000,engLow: 1.5,engHigh: 3,  intLow: 7500,  intHigh: 30000, goal: 'Brand awareness, DGN subs' },
		{ segment: 'Intl — Emerging',   channel: 'Social + partnerships', owner: 'Shared',     reachLow: 50000,  reachHigh: 100000, engLow: 3,  engHigh: 6,  intLow: 1500,  intHigh: 6000,  goal: 'First-course activations' },
	];

	const totalIntLow  = projections.reduce((s, p) => s + p.intLow, 0);
	const totalIntHigh = projections.reduce((s, p) => s + p.intHigh, 0);

	// ── 12-month ramp ─────────────────────────────────────────────────────────
	const ramp = [
		{ mo: 'Month 1',  low: 20000,  high: 25000,  milestone: 'Smartboost onboarding; tracking infrastructure live' },
		{ mo: 'Month 2',  low: 24000,  high: 35000,  milestone: 'SEO audit + landing pages delivered' },
		{ mo: 'Month 3',  low: 30000,  high: 52000,  milestone: 'Full campaign activation — first growth sprint' },
		{ mo: 'Month 4',  low: 34000,  high: 62000,  milestone: 'A/B results inform segment prioritization' },
		{ mo: 'Month 5',  low: 38000,  high: 72000,  milestone: 'Women/newcomer campaign reaches scale' },
		{ mo: 'Month 6',  low: 42000,  high: 82000,  milestone: 'International (Nordic) channels activate' },
		{ mo: 'Month 7',  low: 45000,  high: 88000,  milestone: 'DGPT European event coverage amplification' },
		{ mo: 'Month 8',  low: 48000,  high: 94000,  milestone: 'B2B pipeline converting to consultations' },
		{ mo: 'Month 9',  low: 52000,  high: 100000, milestone: 'Tourist segment peak (fall travel season)' },
		{ mo: 'Month 10', low: 55000,  high: 107000, milestone: 'Q4 OKR review; sprint 3 optimization' },
		{ mo: 'Month 11', low: 58000,  high: 112000, milestone: 'Emerging market content reaching organic lift' },
		{ mo: 'Month 12', low: 61000,  high: 116000, milestone: 'Full-year review; Year 2 plan initiated' },
	];

	// ── KPIs ──────────────────────────────────────────────────────────────────
	const kpis = [
		{ kpi: 'Monthly total interactions',      target: '45K (low) → 115K (high)', owner: 'Shared',     cadence: 'Monthly' },
		{ kpi: 'YouTube watch time growth',        target: '+25% QoQ',                owner: 'In-house',   cadence: 'Monthly' },
		{ kpi: 'Organic search traffic',           target: '+80K visits/mo by Month 6',owner: 'Smartboost', cadence: 'Monthly' },
		{ kpi: 'Email list growth',                target: '5,000 new subs by Month 6',owner: 'In-house',   cadence: 'Monthly' },
		{ kpi: 'Landing page conversion rate',     target: '3–5% across all segments', owner: 'Smartboost', cadence: 'Monthly' },
		{ kpi: 'B2B consultations booked',         target: '50+ by end of Year 1',     owner: 'Shared',     cadence: 'Monthly' },
		{ kpi: 'Nordic market impressions',        target: '1M+ by Month 9',           owner: 'Smartboost', cadence: 'Quarterly' },
		{ kpi: 'Women/newcomer engagement growth', target: '+30% by Month 6',          owner: 'In-house',   cadence: 'Monthly' },
		{ kpi: 'Disc golf tourist CTR',            target: '3–5% on destination content',owner: 'Shared',   cadence: 'Monthly' },
		{ kpi: 'Annual total interactions',        target: '548K (low) — 1.38M (high)',owner: 'Shared',     cadence: 'Quarterly' },
	];

	// ── Campaign phases ───────────────────────────────────────────────────────
	const phases = [
		{ phase: '1 — Foundation', months: '1–2',  inhouse: 'Social channel setup; PDGA + UDisc outreach; first email send', smartboost: 'Tracking infra; SEO audit; brand framework; landing page builds', shared: 'OKR alignment; data handoff protocol', color: 'border-amber-600' },
		{ phase: '2 — Activation', months: '3–5',  inhouse: 'YouTube + TikTok cadence live; women/newcomer campaign launch', smartboost: 'Growth sprint #1; A/B tests on segment pages; content distribution begins', shared: 'First performance review; segment data shared', color: 'border-blue-600' },
		{ phase: '3 — Scale',      months: '6–9',  inhouse: 'Tourist + family content peaks; DGPT event coverage', smartboost: 'Nordic/international channels live; sprint #2 optimization; B2B SEO', shared: 'Mid-year OKR review; budget reallocation if needed', color: 'border-emerald-600' },
		{ phase: '4 — Optimize',   months: '10–12',inhouse: 'Q4 community events; Year 2 influencer planning', smartboost: 'Sprint #3; full-year SEO performance review; Year 2 strategy draft', shared: 'Annual review; Year 2 plan presented', color: 'border-violet-600' },
	];

	function fmtK(n: number) {
		return n >= 1000 ? `${(n/1000).toFixed(0)}K` : `${n}`;
	}

	let activeSection = $state<'overview' | 'segments' | 'projections' | 'kpis'>('overview');
</script>

<svelte:head><title>Geo Marketing — FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Geographic Marketing Intelligence</h1>
		<p class="text-muted-foreground">Disc Golf · Fantasy Sports · Rec Sports · Sports Betting · In-House + Smartboost · May 2026</p>
	</div>

	<!-- Section nav -->
	<div class="flex flex-wrap gap-2">
		{#each [
			{ id: 'overview',     label: 'Sport Overview' },
			{ id: 'segments',     label: 'Audience Segments' },
			{ id: 'projections',  label: 'Interaction Projections' },
			{ id: 'kpis',         label: 'KPIs & Phases' },
		] as tab}
			<button
				class="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors {activeSection === tab.id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}"
				onclick={() => activeSection = tab.id as typeof activeSection}
			>{tab.label}</button>
		{/each}
	</div>

	{#if activeSection === 'overview'}
	<!-- Sport overview stats -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		{#each sportStats as s}
			<div class="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3">
				<p class="text-2xl font-black text-white">{s.value}</p>
				<p class="text-xs font-semibold text-slate-300 mt-0.5">{s.label}</p>
				<p class="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
			</div>
		{/each}
	</div>

	<!-- Key benchmarks -->
	<Card class="p-5">
		<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Key Contextual Benchmarks</h2>
		<div class="space-y-2">
			{#each [
				'Disc golf participation grew 86% since 2020 as measured in UDisc rounds.',
				'89% of disc golf courses are free to play — primary conversion hook for newcomer and family segments.',
				'90% of disc golfers traveled 20+ miles to play; 58% took a trip specifically to play disc golf.',
				'A 9-hole disc golf course serves 432 players/day vs. 192 for a 4-court pickleball facility — at a fraction of the cost ($9K–$18K vs. $28K–$37.5K per court).',
				'2025 PDGA Pro Worlds in Finland: 600,000 peak TV viewers, 1.8M YLE Areena streams — largest disc golf audience in history.',
			] as b}
				<div class="flex items-start gap-2 text-sm text-slate-300">
					<span class="text-orange-400 shrink-0 mt-0.5">→</span>
					<span>{b}</span>
				</div>
			{/each}
		</div>
	</Card>

	<!-- Dual-team structure -->
	<div>
		<div class="flex items-center gap-2 mb-4">
			<Target class="size-5 text-orange-400" />
			<h2 class="text-xl font-bold">Dual-Team Structure</h2>
		</div>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<!-- In-house -->
			<Card class="p-5">
				<p class="text-xs font-bold text-blue-400 uppercase tracking-wide mb-3">In-House Team — Ownership</p>
				<div class="space-y-0 divide-y divide-slate-800 text-sm">
					{#each [
						{ fn: 'Community management',          cadence: 'Daily',      ch: 'Instagram, TikTok, Facebook, Reddit, YouTube' },
						{ fn: 'Short-form video content',      cadence: '2×/week',    ch: 'TikTok Reels, YouTube Shorts' },
						{ fn: 'YouTube longform',              cadence: 'Weekly',     ch: 'Course spotlights, pro interviews, tutorials' },
						{ fn: 'Email newsletter',              cadence: 'Weekly',     ch: 'CRM / Email platform' },
						{ fn: 'UDisc & PDGA outreach',         cadence: 'Ongoing',    ch: 'Direct + UDisc app' },
						{ fn: 'Pro player / influencer collabs',cadence: 'Monthly',   ch: 'DGPT roster, PDGA members' },
						{ fn: 'Parks dept outreach',           cadence: 'Bi-weekly',  ch: 'LinkedIn + email (UDisc Health Index)' },
						{ fn: 'Event activations',             cadence: 'Per-event',  ch: 'On-site + social' },
					] as row}
						<div class="py-2 flex items-start gap-2">
							<div class="flex-1">
								<p class="text-slate-200 font-medium">{row.fn}</p>
								<p class="text-[11px] text-slate-500">{row.ch}</p>
							</div>
							<span class="text-[10px] font-semibold text-blue-400 bg-blue-950/40 border border-blue-800 px-1.5 py-0.5 rounded shrink-0">{row.cadence}</span>
						</div>
					{/each}
				</div>
			</Card>
			<!-- Smartboost -->
			<Card class="p-5">
				<p class="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">Smartboost (Las Vegas, NV) — Ownership</p>
				<div class="space-y-0 divide-y divide-slate-800 text-sm">
					{#each [
						{ fn: 'SEO audit & keyword map',           timeline: 'Month 1',   del: 'Target "disc golf near me", destination + newcomer terms' },
						{ fn: 'Website & landing page build',      timeline: 'Months 1–2',del: '5 segment-specific pages: newcomers, tourists, parks, families, intl.' },
						{ fn: 'Brand positioning framework',       timeline: 'Month 1',   del: 'UDisc stat hooks (vs Dunkin\', 89% free, 500M reach) into brand story' },
						{ fn: 'Analytics & attribution dashboard', timeline: 'Months 1–2',del: 'Full-funnel tracking built before any campaign activates' },
						{ fn: 'Monthly growth experiment sprints', timeline: 'Ongoing',   del: 'A/B test messaging, CTAs, and audience segments per OKRs' },
						{ fn: 'Organic content distribution',      timeline: 'Month 3+',  del: 'Amplify in-house content; no paid-ads dependency' },
						{ fn: 'International digital reach',       timeline: 'Month 6+',  del: 'Nordic SEO, Telia/Delfi-adjacent content distribution' },
						{ fn: 'Quarterly OKR reporting',           timeline: 'Quarterly', del: 'Full performance review shared with in-house team' },
					] as row}
						<div class="py-2 flex items-start gap-2">
							<div class="flex-1">
								<p class="text-slate-200 font-medium">{row.fn}</p>
								<p class="text-[11px] text-slate-500">{row.del}</p>
							</div>
							<span class="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">{row.timeline}</span>
						</div>
					{/each}
				</div>
			</Card>
		</div>
	</div>
	{/if}

	{#if activeSection === 'segments'}
	<div>
		<div class="flex items-center gap-2 mb-4">
			<Target class="size-5 text-orange-400" />
			<h2 class="text-xl font-bold">Target Audience Segments</h2>
			<span class="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 ml-1">5 primary segments · UDisc 2026 data</span>
		</div>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{#each segments as seg}
				<Card class="p-5 border {seg.color.split(' ')[0]} {seg.color.split(' ')[1]}">
					<p class="text-sm font-bold text-white mb-3">{seg.name}</p>
					<div class="space-y-2 text-sm">
						<div class="flex gap-2">
							<span class="text-[10px] text-slate-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">Channels</span>
							<span class="text-slate-300">{seg.channels}</span>
						</div>
						<div class="flex gap-2">
							<span class="text-[10px] text-slate-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">Owner</span>
							<span class="text-slate-300">{seg.owner}</span>
						</div>
						<div class="flex gap-2">
							<span class="text-[10px] text-slate-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">Message</span>
							<span class="text-slate-200 italic">{seg.message}</span>
						</div>
						<div class="flex gap-2">
							<span class="text-[10px] text-slate-500 uppercase tracking-wide w-20 shrink-0 pt-0.5">Goal</span>
							<span class="text-slate-300">{seg.conversion}</span>
						</div>
						<div class="pt-2 border-t border-slate-700/50 text-[11px] text-slate-500">{seg.note}</div>
					</div>
				</Card>
			{/each}
		</div>
	</div>
	{/if}

	{#if activeSection === 'projections'}
	<div class="flex flex-col gap-6">
		<!-- Summary KPI strip -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
			{#each [
				{ value: fmtK(totalIntLow),         label: 'Monthly interactions (low)',  sub: 'Conservative floor', color: 'border-slate-600 bg-slate-800/40' },
				{ value: fmtK(totalIntHigh),        label: 'Monthly interactions (high)', sub: 'Optimistic ceiling', color: 'border-emerald-700 bg-emerald-950/30' },
				{ value: fmtK(totalIntLow * 12),    label: 'Annual interactions (low)',   sub: 'Year 1 floor',       color: 'border-slate-600 bg-slate-800/40' },
				{ value: fmtK(totalIntHigh * 12),   label: 'Annual interactions (high)',  sub: 'Year 1 ceiling',     color: 'border-emerald-700 bg-emerald-950/30' },
			] as s}
				<div class="rounded-xl border {s.color} px-4 py-3">
					<p class="text-2xl font-black text-white">~{s.value}</p>
					<p class="text-xs font-semibold text-slate-300 mt-0.5">{s.label}</p>
					<p class="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
				</div>
			{/each}
		</div>

		<!-- Projections table -->
		<Card class="overflow-hidden">
			<div class="px-5 py-4 border-b border-border">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Monthly Interaction Projections by Segment</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-slate-900 border-b border-border">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-900">Segment</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Channel</th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Owner</th>
							<th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Eng. Rate</th>
							<th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Int/Mo (Low)</th>
							<th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Int/Mo (High)</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversion Goal</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800">
						{#each projections as p, i}
							{@const ownerColor = p.owner === 'In-house' ? 'text-blue-400 bg-blue-950/40 border-blue-800' : p.owner === 'Smartboost' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800' : 'text-violet-400 bg-violet-950/40 border-violet-800'}
							<tr class="{i % 2 === 1 ? 'bg-slate-900/30' : ''} hover:bg-slate-800/40 transition-colors">
								<td class="px-4 py-2.5 font-medium text-slate-200 sticky left-0 bg-inherit">{p.segment}</td>
								<td class="px-4 py-2.5 text-slate-400">{p.channel}</td>
								<td class="px-4 py-2.5 text-center">
									<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border {ownerColor}">{p.owner}</span>
								</td>
								<td class="px-4 py-2.5 text-right text-slate-400">{p.engLow}–{p.engHigh}%</td>
								<td class="px-4 py-2.5 text-right text-slate-300 font-medium">{fmtK(p.intLow)}</td>
								<td class="px-4 py-2.5 text-right text-emerald-400 font-semibold">{fmtK(p.intHigh)}</td>
								<td class="px-4 py-2.5 text-xs text-slate-400">{p.goal}</td>
							</tr>
						{/each}
						<tr class="bg-slate-800/60 border-t-2 border-slate-600 font-bold">
							<td class="px-4 py-3 sticky left-0 bg-slate-800/60" colspan="4">Total Monthly</td>
							<td class="px-4 py-3 text-right text-slate-200">{fmtK(totalIntLow)}</td>
							<td class="px-4 py-3 text-right text-emerald-400">{fmtK(totalIntHigh)}</td>
							<td class="px-4 py-3"></td>
						</tr>
					</tbody>
				</table>
			</div>
		</Card>

		<!-- 12-month ramp -->
		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">12-Month Ramp Projection</h2>
			<div class="space-y-2">
				{#each ramp as r}
					{@const maxHigh = 116000}
					<div class="flex items-center gap-3">
						<span class="text-xs text-slate-400 w-16 shrink-0">{r.mo}</span>
						<div class="flex-1 relative h-6 bg-slate-800 rounded overflow-hidden">
							<div class="absolute inset-y-0 left-0 bg-emerald-900/60 rounded" style="width:{((r.high/maxHigh)*100).toFixed(1)}%"></div>
							<div class="absolute inset-y-0 left-0 bg-emerald-500 rounded" style="width:{((r.low/maxHigh)*100).toFixed(1)}%"></div>
							<span class="absolute inset-y-0 right-2 flex items-center text-[10px] text-slate-400">{r.milestone}</span>
						</div>
						<span class="text-xs font-semibold text-slate-300 w-20 text-right shrink-0">{fmtK(r.low)}–{fmtK(r.high)}</span>
					</div>
				{/each}
			</div>
			<div class="flex gap-4 mt-3 pt-3 border-t border-slate-800 text-xs text-slate-500">
				<span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-emerald-500 inline-block"></span>Conservative</span>
				<span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm bg-emerald-900/60 inline-block"></span>Optimistic</span>
				<span class="ml-auto">Full activation Month 3 · Nordic channels Month 6</span>
			</div>
		</Card>
	</div>
	{/if}

	{#if activeSection === 'kpis'}
	<div class="flex flex-col gap-6">
		<!-- KPI table -->
		<Card class="overflow-hidden">
			<div class="px-5 py-4 border-b border-border">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Key Performance Indicators — Year 1</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-slate-900 border-b border-border">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-900">KPI</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Target</th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Owner</th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Cadence</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800">
						{#each kpis as k, i}
							{@const ownerColor = k.owner === 'In-house' ? 'text-blue-400 bg-blue-950/40 border-blue-800' : k.owner === 'Smartboost' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800' : 'text-violet-400 bg-violet-950/40 border-violet-800'}
							<tr class="{i % 2 === 1 ? 'bg-slate-900/30' : ''} hover:bg-slate-800/40 transition-colors">
								<td class="px-4 py-2.5 font-medium text-slate-200 sticky left-0 bg-inherit">{k.kpi}</td>
								<td class="px-4 py-2.5 text-slate-300">{k.target}</td>
								<td class="px-4 py-2.5 text-center">
									<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border {ownerColor}">{k.owner}</span>
								</td>
								<td class="px-4 py-2.5 text-center text-xs text-slate-400">{k.cadence}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>

		<!-- Campaign phases -->
		<div>
			<div class="flex items-center gap-2 mb-4">
				<BarChart3 class="size-5 text-orange-400" />
				<h2 class="text-xl font-bold">Campaign Phases & Timeline</h2>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{#each phases as ph, i}
					<Card class="p-4 border-l-4 {ph.color}">
						<div class="flex items-center gap-2 mb-3">
							<span class="size-5 rounded-full bg-slate-700 text-white text-[10px] font-black flex items-center justify-center shrink-0">{i+1}</span>
							<div>
								<p class="text-xs font-bold text-white">{ph.phase}</p>
								<p class="text-[10px] text-slate-500">Months {ph.months}</p>
							</div>
						</div>
						<div class="space-y-2 text-xs">
							<div>
								<p class="text-[10px] text-blue-400 uppercase tracking-wide mb-0.5">In-House</p>
								<p class="text-slate-300">{ph.inhouse}</p>
							</div>
							<div>
								<p class="text-[10px] text-emerald-400 uppercase tracking-wide mb-0.5">Smartboost</p>
								<p class="text-slate-300">{ph.smartboost}</p>
							</div>
							<div class="pt-1.5 border-t border-slate-700">
								<p class="text-[10px] text-violet-400 uppercase tracking-wide mb-0.5">Shared Milestone</p>
								<p class="text-slate-400">{ph.shared}</p>
							</div>
						</div>
					</Card>
				{/each}
			</div>
		</div>

		<!-- UDisc data → funnel table -->
		<Card class="overflow-hidden">
			<div class="px-5 py-4 border-b border-border">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">How UDisc Data Feeds the Marketing Funnel</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-slate-900 border-b border-border">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-900">UDisc Data Point</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider">In-House Use</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-emerald-400 uppercase tracking-wider">Smartboost Use</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800">
						{#each [
							{ stat: '21.2M rounds played (2025)',       inhouse: 'Proof-of-market stat in every B2B pitch and sponsor deck',          sb: 'Top-of-funnel SEO hook; headline stat on brand awareness landing pages' },
							{ stat: '11,165 US courses (vs. Dunkin\')', inhouse: 'Organic social hook — shareable comparison graphic',                sb: 'A/B test as brand positioning headline vs. other hooks' },
							{ stat: '89% of courses are free',          inhouse: 'Newcomer and family social content hook; email subject lines',      sb: 'CRO test: does "free" in headline increase form fill rate?' },
							{ stat: '500M people within 10km',          inhouse: 'Awareness-stage social caption; event outreach data point',         sb: 'Geographic SEO targeting — build local landing pages for underserved metros' },
							{ stat: 'UDisc Health Index',               inhouse: 'Identifies underserved counties for parks dept cold outreach',      sb: 'Builds geo-targeted landing pages for those exact markets' },
							{ stat: 'Nordic course data',               inhouse: 'Creates Nordic course spotlight content',                           sb: 'Distributes to Telia/Delfi-adjacent channels; builds Nordic SEO' },
							{ stat: '90% travel stat',                  inhouse: 'Tourist segment email + social content',                            sb: 'Landing page headline for destination/tourism pages' },
							{ stat: 'PDGA 108K+ members',               inhouse: 'Direct email partnership opportunity (PDGA member list)',           sb: 'Retargeting audience seed for organic content amplification' },
						] as row, i}
							<tr class="{i % 2 === 1 ? 'bg-slate-900/30' : ''} hover:bg-slate-800/40 transition-colors">
								<td class="px-4 py-2.5 font-medium text-slate-200 sticky left-0 bg-inherit">{row.stat}</td>
								<td class="px-4 py-2.5 text-slate-400">{row.inhouse}</td>
								<td class="px-4 py-2.5 text-slate-400">{row.sb}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	</div>
	{/if}

	<!-- Stats strip -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		{#each [
			{ label: 'Core dimensions', value: '4', sub: 'DG · Fantasy · Rec · Betting', color: 'border-violet-700 bg-violet-950/30' },
			{ label: 'US priority markets', value: '12+', sub: 'Ranked by overlay score', color: 'border-blue-700 bg-blue-950/30' },
			{ label: 'International markets', value: '15', sub: 'Nordics, Europe, APAC, LatAm', color: 'border-emerald-700 bg-emerald-950/30' },
			{ label: 'Data vintage', value: '2026', sub: 'UDisc · Statista · SportsHandle', color: 'border-amber-700 bg-amber-950/30' },
		] as s}
			<div class="rounded-xl border {s.color} px-4 py-3">
				<p class="text-2xl font-black text-white">{s.value}</p>
				<p class="text-xs font-semibold text-slate-300 mt-0.5">{s.label}</p>
				<p class="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
			</div>
		{/each}
	</div>

	<!-- Methodology -->
	<Card class="p-5">
		<div class="flex items-start gap-3 mb-4">
			<Info class="size-4 text-blue-400 shrink-0 mt-0.5" />
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Scoring Methodology</h2>
		</div>
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
			{#each [
				{ dim: 'Disc Golf Hotspots', weight: '35%', src: 'UDisc 2025 rounds/state, per-capita data', color: 'border-emerald-700 text-emerald-400' },
				{ dim: 'Fantasy Sports',     weight: '25%', src: 'FSGA, DraftKings/FanDuel, Statista 2025', color: 'border-blue-700 text-blue-400' },
				{ dim: 'Recreational Sports',weight: '20%', src: 'Trust for Public Land, WalletHub 2026, NRPA', color: 'border-amber-700 text-amber-400' },
				{ dim: 'Sports Betting',     weight: '20%', src: 'SportsHandle 2025, RG.org state handles', color: 'border-red-700 text-red-400' },
			] as d}
				<div class="rounded-lg border {d.color.split(' ')[0]} bg-slate-900/40 px-3 py-2.5">
					<p class="text-xs font-bold {d.color.split(' ')[1]}">{d.dim}</p>
					<p class="text-lg font-black text-white">{d.weight}</p>
					<p class="text-[10px] text-slate-500 mt-0.5">{d.src}</p>
				</div>
			{/each}
		</div>
		<p class="text-xs text-slate-500 mt-3">Each dimension scored 1–5. Markets with 3+ dimensions scoring 4+ are Priority Tier 1. Texas/California scores exclude betting (no legal market).</p>
	</Card>

	<!-- Market tables -->
	<div>
		<!-- Tab toggle -->
		<div class="flex gap-2 mb-4">
			<button
				class="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors {activeTab === 'domestic' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}"
				onclick={() => activeTab = 'domestic'}
			>
				<MapPin class="size-3.5 inline mr-1" />Domestic ({domestic.length})
			</button>
			<button
				class="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors {activeTab === 'international' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}"
				onclick={() => activeTab = 'international'}
			>
				<Globe class="size-3.5 inline mr-1" />International ({international.length})
			</button>
		</div>

		{#if activeTab === 'domestic'}
		<Card class="overflow-hidden">
			<div class="px-5 py-4 border-b border-border flex items-center justify-between">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">US Priority Markets — Composite Overlay Score</h2>
				<span class="text-xs text-slate-500">Max score 20 · Tier 1 = 14+</span>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-slate-900 border-b border-border">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-900">Market</th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">DG<br/><span class="text-[10px] normal-case font-normal">35%</span></th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Fantasy<br/><span class="text-[10px] normal-case font-normal">25%</span></th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Rec<br/><span class="text-[10px] normal-case font-normal">20%</span></th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Betting<br/><span class="text-[10px] normal-case font-normal">20%</span></th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tier</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Anchor</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Segment</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800">
						{#each domestic.sort((a,b) => totalScore(b) - totalScore(a)) as m, i}
							{@const total = totalScore(m)}
							<tr class="{i % 2 === 1 ? 'bg-slate-900/30' : ''} hover:bg-slate-800/40 transition-colors">
								<td class="px-4 py-2.5 font-semibold sticky left-0 bg-inherit text-white">{m.market}</td>
								{#each [m.dg, m.fantasy, m.rec, m.betting] as score}
									{@const b = scoreBar(score)}
									<td class="px-4 py-2.5 text-center">
										{#if score === null}
											<span class="text-xs text-slate-600">—</span>
										{:else}
											<div class="flex flex-col items-center gap-1">
												<span class="text-xs font-bold text-slate-200">{score}/5</span>
												<div class="w-10 h-1.5 bg-slate-700 rounded-full overflow-hidden">
													<div class="{b.cls} h-full rounded-full" style="width:{b.w}"></div>
												</div>
											</div>
										{/if}
									</td>
								{/each}
								<td class="px-4 py-2.5 text-center">
									<span class="text-base font-black {total >= 17 ? 'text-emerald-400' : total >= 14 ? 'text-blue-400' : 'text-slate-400'}">{total}</span>
								</td>
								<td class="px-4 py-2.5">
									<span class="text-xs font-semibold px-2 py-0.5 rounded border {tierColor(m.tier)}">{tierLabel(m.tier)}</span>
								</td>
								<td class="px-4 py-2.5 text-xs text-slate-400 max-w-[180px]">{m.anchor}</td>
								<td class="px-4 py-2.5 text-xs text-slate-400">{m.segment}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
		{:else}
		<Card class="overflow-hidden">
			<div class="px-5 py-4 border-b border-border flex items-center justify-between">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">International Priority Markets</h2>
				<span class="text-xs text-slate-500">Nordics · Europe · APAC · LatAm</span>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-slate-900 border-b border-border">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-900">Market</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Region</th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">DG</th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Fantasy</th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Rec</th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Betting</th>
							<th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tier</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Anchor</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800">
						{#each international.sort((a,b) => totalScore(b) - totalScore(a)) as m, i}
							{@const total = totalScore(m)}
							<tr class="{i % 2 === 1 ? 'bg-slate-900/30' : ''} hover:bg-slate-800/40 transition-colors">
								<td class="px-4 py-2.5 font-semibold sticky left-0 bg-inherit text-white">{m.market}</td>
								<td class="px-4 py-2.5 text-xs text-slate-400">{m.region}</td>
								{#each [m.dg, m.fantasy, m.rec, m.betting] as score}
									{@const b = scoreBar(score)}
									<td class="px-4 py-2.5 text-center">
										{#if score === null}
											<span class="text-xs text-slate-600">—</span>
										{:else}
											<div class="flex flex-col items-center gap-1">
												<span class="text-xs font-bold text-slate-200">{score}/5</span>
												<div class="w-10 h-1.5 bg-slate-700 rounded-full overflow-hidden">
													<div class="{b.cls} h-full rounded-full" style="width:{b.w}"></div>
												</div>
											</div>
										{/if}
									</td>
								{/each}
								<td class="px-4 py-2.5 text-center">
									<span class="text-base font-black {total >= 17 ? 'text-emerald-400' : total >= 14 ? 'text-blue-400' : 'text-slate-400'}">{total}</span>
								</td>
								<td class="px-4 py-2.5">
									<span class="text-xs font-semibold px-2 py-0.5 rounded border {tierColor(m.tier)}">{tierLabel(m.tier)}</span>
								</td>
								<td class="px-4 py-2.5 text-xs text-slate-400 max-w-[220px]">{m.anchor}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
		{/if}
	</div>

	<!-- Quarterly rollout -->
	<div>
		<div class="flex items-center gap-2 mb-4">
			<TrendingUp class="size-5 text-orange-400" />
			<h2 class="text-xl font-bold">Recommended Quarterly Rollout</h2>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
			{#each rollout as r, i}
				{@const colors = ['border-amber-700 bg-amber-950/20','border-blue-700 bg-blue-950/20','border-emerald-700 bg-emerald-950/20','border-violet-700 bg-violet-950/20','border-slate-600 bg-slate-800/30']}
				{@const badges = ['bg-amber-500','bg-blue-500','bg-emerald-500','bg-violet-500','bg-slate-500']}
				<div class="rounded-xl border {colors[i]} px-4 py-3 flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<span class="size-5 rounded-full {badges[i]} text-white text-[10px] font-black flex items-center justify-center shrink-0">{i+1}</span>
						<span class="text-xs font-bold text-white">{r.q}</span>
					</div>
					<div>
						<p class="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Domestic</p>
						<p class="text-xs text-slate-300">{r.domestic}</p>
					</div>
					<div>
						<p class="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">International</p>
						<p class="text-xs text-slate-300">{r.intl}</p>
					</div>
					<div class="mt-auto pt-2 border-t border-slate-700">
						<p class="text-[10px] text-orange-400 font-semibold">{r.focus}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Key insights -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
		<Card class="p-4 border-yellow-700/50 bg-yellow-950/20">
			<p class="text-xs font-bold text-yellow-400 uppercase tracking-wide mb-2">Pickleball Crossover</p>
			<p class="text-sm text-slate-300">Pickleball courts face noise complaints and capacity limits. Disc golf's silence and 2× daily capacity (432 vs 192 players/day) make it the natural parks-dept alternative. Target pickleball-dense markets with this B2B message.</p>
		</Card>
		<Card class="p-4 border-red-700/50 bg-red-950/20">
			<p class="text-xs font-bold text-red-400 uppercase tracking-wide mb-2">CA + TX Betting Watch</p>
			<p class="text-sm text-slate-300">California and Texas together represent 22% of the US adult population and are two of the top DG states — but have no legal sports betting. When either legalizes, the DG-betting crossover audience will be enormous. Monitor closely.</p>
		</Card>
		<Card class="p-4 border-blue-700/50 bg-blue-950/20">
			<p class="text-xs font-bold text-blue-400 uppercase tracking-wide mb-2">Mid-Size Metro Efficiency</p>
			<p class="text-sm text-slate-300">The highest per-capita DG engagement is in mid-size metros — Denver, Twin Cities, Salt Lake City, Dayton. These markets offer better ad efficiency than coastal megacities and should anchor early campaign spend.</p>
		</Card>
	</div>

</div>
