<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect root to default user for now
		goto('/jaredmorgenstern');
	});
</script>

<svelte:head>
	<title>iAdventured</title>
</svelte:head>

<main style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
	<p>Redirecting...</p>
</main>
