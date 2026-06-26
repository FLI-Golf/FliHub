<script lang="ts">
	import DashboardReimbursementsAdminPage from '../../../dashboard/reimbursements/admin/+page.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<DashboardReimbursementsAdminPage {data} backHref="/portal/reimbursements" />
