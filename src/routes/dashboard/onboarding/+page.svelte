<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import DocumentSigner from '$lib/components/onboarding/DocumentSigner.svelte';
	import { CheckCircle, Circle, ChevronRight, User, FileText, PenLine, Shield } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	// ── Document content ────────────────────────────────────────────────────

	const PLAYER_INFO_PACKET = `FLI GOLF LEAGUE — PLAYER INFORMATION PACKET

OVERVIEW
The FLI Golf League (FGL) is a professional disc golf league structured around team-based competition with individual performance recognition. This packet outlines the key terms, expectations, and benefits of participation.

COMPETITION FORMAT
• 12 elite teams, each featuring top-ranked disc golfers
• 6 high-stakes tournaments per season at custom-built courses
• Every team earns prize money at every event regardless of finish position
• Individual and team rankings tracked throughout the season
• Season culminates in a Championship Tournament with the largest payouts

FINANCIAL TERMS
• Prize money distributed based on individual and team performance
• Travel and accommodation fully covered for all events, including international travel
• Additional revenue streams: footage licensing, player likeness, milestone bonuses, marketing opportunities

MEDIA & BROADCAST OBLIGATIONS
• Players agree to participate in scheduled media appearances
• Interview slots: pre-event, halftime, post-event (as scheduled by production)
• Player profiles featured in league-wide promotions and broadcasts
• Behind-the-scenes content and mic'd-up segments (with player consent)

SPONSORSHIP
• Players may pursue personal sponsorships subject to FGL approval
• FGL Player Opportunities Packet connects players with affiliate brands
• All sponsorship agreements must be disclosed to FGL

SCHEDULE COMMITMENT
• Players must be available for all 6 regular season events
• Preseason draft participation required
• Media and promotional obligations as scheduled by FGL

CONTACT
Andrew Panza — CEO & Tour Director
Andrew@FLIGolf.com | fligolf.com`;

	const PLAYER_OPPORTUNITY_PACKET = `FLI GOLF LEAGUE — PLAYER OPPORTUNITY PACKET

REVENUE OPPORTUNITIES FOR FGL PLAYERS

1. TOURNAMENT PRIZE MONEY
Performance-based earnings at each of the 6 season events. Prize structures are announced prior to each event. Every team receives a guaranteed minimum payout regardless of placement.

2. FOOTAGE LICENSING
Players earn a share of revenue generated from event footage licensed to media partners, streaming platforms, and broadcast networks — similar to UFC fighter footage rights.

3. PLAYER LIKENESS & MERCHANDISE
FGL facilitates licensing deals for player likeness use in merchandise, video games, and promotional materials — modeled after NFLPA and NBA licensing structures.

4. PERFORMANCE MILESTONE BONUSES
Bonuses awarded for achieving specific competitive benchmarks (e.g., tournament wins, season rankings, championship performance).

5. LEAGUE MARKETING OPPORTUNITIES
Top-performing players are featured in league-wide marketing campaigns, providing brand-building exposure and additional compensation.

6. PERSONAL SPONSORSHIP & ENDORSEMENTS
The FGL Player Opportunities Packet connects players with FGL affiliate brands seeking athlete endorsements. Players retain the right to negotiate personal sponsorship deals subject to FGL disclosure requirements.

7. SOCIAL MEDIA & CONTENT CREATION
Players are encouraged to create content around their FGL participation. FGL may amplify player content through official channels, increasing reach and follower growth.

ELIGIBILITY
All active FGL players are eligible for the above opportunities. Specific terms and revenue splits are detailed in the Official Player Contract.

CONTACT
Andrew Panza — CEO & Tour Director
Andrew@FLIGolf.com | fligolf.com`;

	const INTEGRITY_POLICY = `FLI GOLF LEAGUE — INTEGRITY & SUBSTANCE ABUSE POLICY

PREAMBLE
The FLI Golf League is committed to maintaining the highest standards of competitive integrity, fair play, and athlete welfare. All players, staff, and officials are bound by this policy.

SECTION 1 — COMPETITIVE INTEGRITY

1.1 PROHIBITED CONDUCT
The following are strictly prohibited:
• Match-fixing or any attempt to manipulate the outcome of any competition
• Sharing inside information for betting purposes
• Accepting bribes or inducements related to competition outcomes
• Failing to perform to the best of one's ability (tanking)
• Facilitating or encouraging others to engage in the above

1.2 SPORTS BETTING
• Players may not bet on any FGL event, including events in which they are not competing
• Players may not bet on any disc golf competition globally while under FGL contract
• Players must disclose any prior sports betting activity on their Player Profile

1.3 REPORTING OBLIGATIONS
Players who become aware of any integrity violation must report it to FGL immediately. Failure to report is itself a violation.

SECTION 2 — SUBSTANCE ABUSE POLICY

2.1 PROHIBITED SUBSTANCES
FGL adopts the World Anti-Doping Agency (WADA) prohibited list as its baseline. Performance-enhancing drugs, stimulants, and masking agents are prohibited.

2.2 TESTING
FGL reserves the right to conduct random and targeted substance testing at any time during the season, including at events and training facilities.

2.3 RECREATIONAL SUBSTANCES
Players are expected to maintain professional conduct. Use of recreational substances that impairs performance or brings the league into disrepute may result in disciplinary action.

SECTION 3 — SANCTIONS

Violations may result in:
• Warning and mandatory education
• Suspension (event, season, or permanent)
• Forfeiture of prize money
• Termination of player contract
• Public disclosure of violation

SECTION 4 — APPEALS
Players have the right to appeal sanctions through the FGL Disciplinary Committee within 14 days of notification.

By initialing this document, you confirm you have read, understood, and agree to comply with this policy in its entirety.

CONTACT
Andrew Panza — CEO & Tour Director
Andrew@FLIGolf.com | fligolf.com`;

	const PLAYER_CONTRACT = `FLI GOLF LEAGUE — OFFICIAL PLAYER CONTRACT

This Player Contract ("Agreement") is entered into between FLI Golf League ("FGL") and the undersigned player ("Player").

ARTICLE 1 — TERM
This Agreement is effective upon signing and covers the current FGL season, including all 6 regular season events and the Championship Tournament.

ARTICLE 2 — PLAYER OBLIGATIONS
2.1 The Player agrees to compete in all scheduled FGL events to the best of their ability.
2.2 The Player agrees to fulfill all media, interview, and promotional obligations as scheduled by FGL.
2.3 The Player agrees to comply with the FGL Integrity & Substance Abuse Policy.
2.4 The Player agrees to disclose all existing sponsorships and obtain FGL approval for new sponsorships.
2.5 The Player agrees to participate in the Preseason Draft process.

ARTICLE 3 — FGL OBLIGATIONS
3.1 FGL agrees to provide fully covered travel and accommodation for all events.
3.2 FGL agrees to distribute prize money in accordance with the published prize structure.
3.3 FGL agrees to provide media exposure and promotional support for all players.
3.4 FGL agrees to facilitate player opportunity connections as outlined in the Player Opportunity Packet.

ARTICLE 4 — COMPENSATION
4.1 Prize money is performance-based and distributed per the event prize structure.
4.2 Guaranteed team minimums apply at every event regardless of placement.
4.3 Additional compensation opportunities are outlined in the Player Opportunity Packet.

ARTICLE 5 — INTELLECTUAL PROPERTY & LIKENESS
5.1 Player grants FGL a non-exclusive license to use Player's name, image, and likeness for league promotion.
5.2 Player retains ownership of personal brand and social media channels.
5.3 Revenue sharing for footage licensing and merchandise is detailed in the Player Opportunity Packet.

ARTICLE 6 — TERMINATION
6.1 Either party may terminate this Agreement with 30 days written notice.
6.2 FGL may terminate immediately for material breach, including integrity violations.
6.3 Upon termination, Player forfeits any unpaid prize money from events not yet completed.

ARTICLE 7 — GOVERNING LAW
This Agreement is governed by applicable law. Disputes shall be resolved through binding arbitration.

ARTICLE 8 — ENTIRE AGREEMENT
This Agreement, together with the Player Information Packet, Player Opportunity Packet, and Integrity & Substance Abuse Policy, constitutes the entire agreement between the parties.

By signing below, both parties agree to the terms of this Agreement.

CONTACT
Andrew Panza — CEO & Tour Director
Andrew@FLIGolf.com | fligolf.com`;

	const LEGAL_DOCUMENTS = `FLI GOLF LEAGUE — LEGAL DOCUMENTS & DISCLOSURES

SECTION 1 — PRIVACY & DATA POLICY
FGL collects and processes player personal data for the purposes of league administration, media production, and player services. Data is not sold to third parties. Players may request access to or deletion of their data at any time.

SECTION 2 — MEDIA RELEASE
By participating in FGL, players grant FGL the right to record, photograph, and broadcast their participation in all league events. This includes live broadcasts, highlight packages, social media content, and archival footage.

SECTION 3 — LIABILITY WAIVER
Players acknowledge that disc golf involves inherent physical risks. Players participate voluntarily and waive claims against FGL for injuries sustained during competition, except in cases of gross negligence by FGL.

SECTION 4 — DISPUTE RESOLUTION
Any disputes arising from participation in FGL shall first be addressed through good-faith negotiation. If unresolved within 30 days, disputes shall proceed to binding arbitration.

SECTION 5 — ANTI-DISCRIMINATION POLICY
FGL is committed to a discrimination-free environment. Discrimination or harassment based on gender, race, nationality, religion, sexual orientation, or disability is strictly prohibited and may result in immediate termination of participation.

SECTION 6 — SOCIAL MEDIA CONDUCT
Players represent FGL in all public communications. Players agree not to post content that is defamatory, discriminatory, or brings FGL into disrepute. FGL reserves the right to request removal of such content.

SECTION 7 — AMENDMENTS
FGL reserves the right to amend these policies with 30 days notice to players. Continued participation constitutes acceptance of amended terms.

By initialing this document, you confirm you have read and agree to all legal terms and disclosures above.

CONTACT
Andrew Panza — CEO & Tour Director
Andrew@FLIGolf.com | fligolf.com`;

	// ── State ───────────────────────────────────────────────────────────────

	type DocType =
		| 'player_information_packet'
		| 'player_opportunity_packet'
		| 'integrity_substance_policy'
		| 'player_contract'
		| 'legal_documents';

	const isSigned = (type: DocType) => !!data.signatures?.[type];

	let sigStates = $state<Record<DocType, { initials: string; sig: string; signed: boolean }>>({
		player_information_packet: {
			initials: data.signatures?.player_information_packet?.initials ?? '',
			sig: '',
			signed: isSigned('player_information_packet')
		},
		player_opportunity_packet: {
			initials: data.signatures?.player_opportunity_packet?.initials ?? '',
			sig: '',
			signed: isSigned('player_opportunity_packet')
		},
		integrity_substance_policy: {
			initials: data.signatures?.integrity_substance_policy?.initials ?? '',
			sig: '',
			signed: isSigned('integrity_substance_policy')
		},
		player_contract: {
			initials: data.signatures?.player_contract?.initials ?? '',
			sig: data.signatures?.player_contract?.signatureDataUrl ?? '',
			signed: isSigned('player_contract')
		},
		legal_documents: {
			initials: data.signatures?.legal_documents?.initials ?? '',
			sig: '',
			signed: isSigned('legal_documents')
		}
	});

	let saving = $state<DocType | null>(null);
	let saveError = $state('');

	async function handleSign(
		type: DocType,
		payload: { initials: string; signatureDataUrl: string; agreed: boolean }
	) {
		saving = type;
		saveError = '';
		try {
			const fd = new FormData();
			fd.set('documentType', type);
			fd.set('initials', payload.initials);
			fd.set('signatureDataUrl', payload.signatureDataUrl);
			fd.set('agreed', String(payload.agreed));

			const res = await fetch('?/signDocument', { method: 'POST', body: fd });
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				saveError = body?.data?.error ?? 'Failed to save signature.';
			} else {
				sigStates[type].signed = true;
				sigStates[type].initials = payload.initials;
				await invalidateAll();
			}
		} catch (e: any) {
			saveError = e.message;
		} finally {
			saving = null;
		}
	}

	// ── Progress ────────────────────────────────────────────────────────────

	const steps = [
		{ id: 'welcome', label: 'Welcome', done: true },
		{
			id: 'documents',
			label: 'Documents',
			done:
				sigStates.player_information_packet.signed &&
				sigStates.player_opportunity_packet.signed &&
				sigStates.integrity_substance_policy.signed &&
				sigStates.legal_documents.signed
		},
		{ id: 'contract', label: 'Contract', done: sigStates.player_contract.signed },
		{
			id: 'profile',
			label: 'Player Profile',
			done: data.playerProfile?.status === 'submitted' || data.playerProfile?.status === 'approved'
		}
	] as const;

	const completedCount = $derived(steps.filter((s) => s.done).length);
	const progressPct = $derived(Math.round((completedCount / steps.length) * 100));
</script>

<svelte:head>
	<title>Onboarding — FLI Golf League</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8 space-y-8">

	<!-- Header -->
	<div>
		<h1 class="text-2xl font-black tracking-tight">FLI Golf League Onboarding</h1>
		<p class="text-muted-foreground mt-1">
			Complete each step below to finalize your participation in the league.
		</p>
	</div>

	<!-- Progress tracker -->
	<div class="bg-card border-2 border-border rounded-xl p-5">
		<div class="flex items-center justify-between mb-3">
			<span class="text-sm font-semibold">Overall Progress</span>
			<span class="text-sm font-bold text-emerald-600">{completedCount}/{steps.length} steps complete</span>
		</div>
		<div class="w-full bg-muted rounded-full h-2.5 mb-4">
			<div
				class="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
				style="width: {progressPct}%"
			></div>
		</div>
		<div class="grid grid-cols-4 gap-2">
			{#each steps as step}
				<div class="flex flex-col items-center gap-1 text-center">
					{#if step.done}
						<CheckCircle class="w-5 h-5 text-emerald-500" />
					{:else}
						<Circle class="w-5 h-5 text-muted-foreground" />
					{/if}
					<span class="text-xs font-medium {step.done ? 'text-emerald-600' : 'text-muted-foreground'}">{step.label}</span>
				</div>
			{/each}
		</div>
	</div>

	{#if saveError}
		<div class="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-4 text-sm text-rose-700 dark:text-rose-300 font-medium">
			{saveError}
		</div>
	{/if}

	<!-- ── SECTION 1: Documents to initial ─────────────────────────────── -->
	<section class="space-y-4">
		<div class="flex items-center gap-3">
			<div class="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900">
				<FileText class="w-4 h-4 text-violet-600 dark:text-violet-400" />
			</div>
			<div>
				<h2 class="font-bold text-lg">League Documents</h2>
				<p class="text-sm text-muted-foreground">Read each document and add your initials to confirm agreement.</p>
			</div>
		</div>

		<DocumentSigner
			documentType="player_information_packet"
			title="Player Information Packet"
			description="League format, financial terms, media obligations, and schedule commitment."
			content={PLAYER_INFO_PACKET}
			requiresSignature={false}
			bind:signed={sigStates.player_information_packet.signed}
			bind:initials={sigStates.player_information_packet.initials}
			onSign={(d) => handleSign('player_information_packet', d)}
		/>

		<DocumentSigner
			documentType="player_opportunity_packet"
			title="Player Opportunity Packet"
			description="Revenue streams, sponsorship opportunities, and brand-building pathways."
			content={PLAYER_OPPORTUNITY_PACKET}
			requiresSignature={false}
			bind:signed={sigStates.player_opportunity_packet.signed}
			bind:initials={sigStates.player_opportunity_packet.initials}
			onSign={(d) => handleSign('player_opportunity_packet', d)}
		/>

		<DocumentSigner
			documentType="integrity_substance_policy"
			title="FLI Golf League Integrity & Substance Abuse Policy"
			description="Competitive integrity rules, betting prohibitions, substance testing, and sanctions."
			content={INTEGRITY_POLICY}
			requiresSignature={false}
			bind:signed={sigStates.integrity_substance_policy.signed}
			bind:initials={sigStates.integrity_substance_policy.initials}
			onSign={(d) => handleSign('integrity_substance_policy', d)}
		/>

		<DocumentSigner
			documentType="legal_documents"
			title="Legal Documents & Disclosures"
			description="Privacy policy, media release, liability waiver, and conduct standards."
			content={LEGAL_DOCUMENTS}
			requiresSignature={false}
			bind:signed={sigStates.legal_documents.signed}
			bind:initials={sigStates.legal_documents.initials}
			onSign={(d) => handleSign('legal_documents', d)}
		/>
	</section>

	<!-- ── SECTION 2: Official Contract (full signature) ───────────────── -->
	<section class="space-y-4">
		<div class="flex items-center gap-3">
			<div class="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900">
				<PenLine class="w-4 h-4 text-rose-600 dark:text-rose-400" />
			</div>
			<div>
				<h2 class="font-bold text-lg">Official Player Contract</h2>
				<p class="text-sm text-muted-foreground">Full signature required. This finalizes your commitment to the league.</p>
			</div>
		</div>

		<DocumentSigner
			documentType="player_contract"
			title="Official Player Contract"
			description="The binding agreement between you and FLI Golf League covering the full season."
			content={PLAYER_CONTRACT}
			requiresSignature={true}
			bind:signed={sigStates.player_contract.signed}
			bind:initials={sigStates.player_contract.initials}
			bind:signatureDataUrl={sigStates.player_contract.sig}
			onSign={(d) => handleSign('player_contract', d)}
		/>
	</section>

	<!-- ── SECTION 3: Player Profile ───────────────────────────────────── -->
	<section class="space-y-4">
		<div class="flex items-center gap-3">
			<div class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900">
				<User class="w-4 h-4 text-blue-600 dark:text-blue-400" />
			</div>
			<div>
				<h2 class="font-bold text-lg">Player Profile</h2>
				<p class="text-sm text-muted-foreground">Fill out your full player profile for broadcast, media, and league records.</p>
			</div>
		</div>

		<div class="border-2 rounded-xl overflow-hidden {data.playerProfile?.status === 'submitted' || data.playerProfile?.status === 'approved' ? 'border-emerald-300 dark:border-emerald-700' : 'border-border'}">
			<div class="flex items-center gap-4 p-5 {data.playerProfile?.status === 'submitted' || data.playerProfile?.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-card'}">
				<div class="flex items-center justify-center w-10 h-10 rounded-xl {data.playerProfile?.status === 'submitted' || data.playerProfile?.status === 'approved' ? 'bg-emerald-500' : 'bg-muted'} shrink-0">
					{#if data.playerProfile?.status === 'submitted' || data.playerProfile?.status === 'approved'}
						<CheckCircle class="w-5 h-5 text-white" />
					{:else}
						<User class="w-5 h-5 text-muted-foreground" />
					{/if}
				</div>
				<div class="flex-1">
					<h3 class="font-bold text-base">FLI Golf Player Profile Form</h3>
					{#if data.playerProfile?.status === 'submitted'}
						<p class="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Submitted — under review</p>
					{:else if data.playerProfile?.status === 'approved'}
						<p class="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Approved</p>
					{:else if data.playerProfile}
						<p class="text-sm text-amber-600 dark:text-amber-400 font-medium">Draft saved — not yet submitted</p>
					{:else}
						<p class="text-sm text-muted-foreground">Personal info, competitive background, media presence, sponsorships, and more.</p>
					{/if}
				</div>
				<a
					href="/dashboard/player-profile"
					class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg {data.playerProfile ? 'bg-muted hover:bg-muted/80 text-foreground' : 'bg-black text-white hover:bg-gray-800'} font-semibold text-sm transition-all duration-150"
				>
					{data.playerProfile ? 'Edit Profile' : 'Fill Out Profile'}
					<ChevronRight class="w-4 h-4" />
				</a>
			</div>
		</div>
	</section>

	<!-- ── All done ─────────────────────────────────────────────────────── -->
	{#if completedCount === steps.length}
		<div class="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl p-6 text-center">
			<CheckCircle class="w-12 h-12 text-emerald-500 mx-auto mb-3" />
			<h3 class="text-xl font-black text-emerald-800 dark:text-emerald-200 mb-2">Onboarding Complete!</h3>
			<p class="text-emerald-700 dark:text-emerald-300 text-sm mb-4">
				You're all set. The FLI Golf League team will be in touch with next steps.
			</p>
			<a
				href="/dashboard"
				class="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors text-sm"
			>
				Go to Dashboard <ChevronRight class="w-4 h-4" />
			</a>
		</div>
	{/if}

</div>
