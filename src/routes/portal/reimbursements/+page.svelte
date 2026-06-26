<script lang="ts">
	import DashboardReimbursementsPage from '../../dashboard/reimbursements/+page.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<DashboardReimbursementsPage {data} portalView="my" />
