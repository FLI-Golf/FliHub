<script lang="ts">
	import DashboardImportPage from '../../dashboard/import/+page.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<DashboardImportPage {data} />
