<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<div class="text-center space-y-4 max-w-md px-6">
		<div class="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white text-2xl font-black mx-auto">
			F
		</div>
		<h1 class="text-4xl font-bold">{$page.status}</h1>
		<p class="text-muted-foreground text-lg">{$page.error?.message ?? 'Something went wrong'}</p>
		<a
			href="/dashboard"
			class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
		>
			← Back to Dashboard
		</a>
	</div>
</div>
