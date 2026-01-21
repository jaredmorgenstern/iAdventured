<script>
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Not Found | iAdventured</title>
</svelte:head>

<main class="error-page">
	<h1>{$page.status}</h1>
	<p>{$page.error?.message || 'Page not found'}</p>
	<a href="/">Go home</a>
</main>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		text-align: center;
		padding: 2rem;
	}

	h1 {
		font-size: 6rem;
		font-weight: 700;
		margin: 0;
		color: var(--visited-primary);
	}

	p {
		font-size: 1.25rem;
		color: var(--text-secondary);
		margin: 1rem 0 2rem;
	}

	a {
		color: var(--visited-primary);
		text-decoration: none;
		font-weight: 500;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
