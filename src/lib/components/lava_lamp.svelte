<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, init } from '$lib/lava_lamp';

	onMount(() => {
		init();
		animate();
	});
</script>

<div id="container" />
