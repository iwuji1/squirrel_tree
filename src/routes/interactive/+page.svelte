<script>
    import Map from '$lib/components/Map.svelte'
    import Map3D from '$lib/components/3d_Map.svelte'
    import Chart3D from '$lib/components/3d_bar.svelte' 

</script>

<svelte:head>
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.9.2/mapbox-gl.css" rel="stylesheet">
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.9.2/mapbox-gl.js"></script>
</svelte:head>

<Map3D />

