<script>
import * as d3 from 'd3';
import mapboxgl from 'mapbox-gl';
import { onMount, onDestroy } from 'svelte';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

let map;
let mapContainer;
let lng, lat, zoom;
let geocoderContainer;

lng = -0.1;
lat = 51.5;
zoom = 12;

let selectedTree = null;

let treeTypes = [];
let selectedTreeType = "All";

let allTreeData = null;
let topBoroughTrees = [];
let highlightedTreeIds = [];
let colorScale;

let chartWidth = 320;
let chartHeight = 180;
let chartMargin = { top: 20, right: 20, bottom: 30, left: 110 };

$: chartInnerWidth = chartWidth - chartMargin.left - chartMargin.right;
$: chartInnerHeight = chartHeight - chartMargin.top - chartMargin.bottom;

$: xScale = d3.scaleLinear()
    .domain([0, d3.max(topBoroughTrees, d => d.properties.treeValueScore) || 1])
    .range([0, chartInnerWidth]);

$: yScale = d3.scaleBand()
    .domain(topBoroughTrees.map(d => `${d.properties.tree} #${d.properties.boroughRank}`))
    .range([0, chartInnerHeight])
    .padding(0.2);

let initialState = {
    lng: lng,
    lat: lat,
    zoom: zoom
};

$: if (map && map.getLayer('tree-bar-layer')) {
    if (selectedTreeType === "All") {
        map.setFilter('tree-bar-layer', null);
    } else {
        const filter = ['==', ['get', 'tree'], selectedTreeType];
        map.setFilter('tree-bar-layer', filter);
    }
}

function updateData() {
    zoom = map.getZoom();
    lat = map.getCenter().lat;
    lng = map.getCenter().lng;
}

async function loadTreeData() {
    try {
        const response = await fetch('/boroughs_with_top_trees.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch json: ${response.statusText}`);
        }

        const jsonData = await response.json();
        console.log('loaded Tree Data', jsonData);

        //Rank treees within each borough by Tree Value Score
        jsonData.boroughs.forEach(borough => {
            borough.trees.sort((a, b) => b['Tree Value Score'] - a['Tree Value Score'])
            .forEach((tree, index) => {
                tree.boroughRank = index + 1;
            });
        });

        // flatten boroughs -> trees into GeoJSON format
        const features = jsonData.boroughs.flatMap((borough) => 
            borough.trees.map((tree) => ({
                id: tree.uniqueid,
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [tree.lon, tree.lat]
                },
                properties: {
                    uniqueid: tree.uniqueid,
                    borough: borough.borough,
                    tree: tree.Tree,
                    species: tree.taxon_species,
                    location: tree.location,
                    height: tree.height,
                    girth: tree.girth,
                    treeRent: tree.TreeRent,
                    treeValueScore: tree['Tree Value Score'],
                    squirrelFood: tree["Food squirrels can eat (Yes / No)"],
                    londonRank: tree.Rank,
                    boroughRank: tree.boroughRank
                }
                }))
            );
            return {
                type: 'FeatureCollection',
                features: features
            };
    } catch (error) {
        console.error(error);
        return null;
    }
}

function makeSquarePolygon(lon, lat, size = 0.00025) {
    return {
        type: 'Polygon',
        coordinates: [[
            [lon - size, lat - size],
            [lon + size, lat - size],
            [lon + size, lat + size],
            [lon - size, lat + size],
            [lon - size, lat - size]
        ]]
    };
}

function makeTreeBarGeoJSON(treeGeoJSON) {
    if (!treeGeoJSON) return null;

    const heights = treeGeoJSON.features.map(f => f.properties.height);
    const girths = treeGeoJSON.features.map(f => f.properties.girth);

    const hScale = d3.scaleLinear()
        .domain(d3.extent(heights))
        .range([50, 2000]);
    
    const wScale = d3.scaleLinear()
        .domain(d3.extent(girths))
        .range([0.00015, 0.0003]);

    const barFeatures = treeGeoJSON.features.map((feature) => {
        const [lon, lat] = feature.geometry.coordinates;
        const footprintSize = wScale(feature.properties.girth);

        return {
            type: 'Feature',
            id: feature.id,
            geometry: makeSquarePolygon(lon, lat, footprintSize),
            properties: {
                ...feature.properties,
                extrusionHeight: hScale(feature.properties.height)
            }
        }
    });

    return {
        type: 'FeatureCollection',
        features: barFeatures
    };
}

function getTopTreesInBorough(clickedFeature, limit = 5) {
    if (!allTreeData || !clickedFeature) return [];

    const borough = clickedFeature.properties.borough;

    return allTreeData.features
        .filter((feature) => feature.properties.borough === borough)
        .sort((a, b) => b.properties.treeValueScore - a.properties.treeValueScore)
        .slice(0, limit);
}

function clearTopTreeHighlights() {
    if (!map || highlightedTreeIds.length === 0) return;

    highlightedTreeIds.forEach((id) => {
        map.setFeatureState(
            { source: 'tree-bars', id },
            { topFive: false }
        );
    });

    highlightedTreeIds = [];
}

onMount(() => {

    const initMap = async () => {
        const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        const treeGeoJSON = await loadTreeData();
        const treeBarGeoJSON = makeTreeBarGeoJSON(treeGeoJSON);

        allTreeData = treeGeoJSON;

        console.log('treeBarGeoJSON', treeBarGeoJSON);

        treeTypes = treeGeoJSON
            ? [...new Set(treeGeoJSON?.features.map(feature => feature.properties.tree))]
            : [];

        colorScale = d3.scaleOrdinal(d3.schemePaired)
            .domain(treeTypes);

        const colorExpression = [
            'match',
            ['get', 'tree'],
            ...treeTypes.flatMap(tree => [tree, colorScale(tree)]),
            '#ccc' // default color
        ];
        
        map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/obiwuji/cmen0w4vc005m01s8d0rocj1l',
            center: [initialState.lng, initialState.lat],
            zoom: initialState.zoom,
            pitch: 74,
            bearing: 12.8,
            dragRotate: true,
            touchZoomRotate: true,
            antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
        });

        const geocoder = new MapboxGeocoder({
            accessToken: MAPBOX_ACCESS_TOKEN,
            useBrowserFocus: true,
            mapboxgl: mapboxgl,
            marker: false
        });

        if (geocoderContainer) {
            geocoderContainer.appendChild(geocoder.onAdd(map));
        }

        map.addControl(new mapboxgl.NavigationControl({
            visualizePitch: true,
            showZoom: true,
            showCompass: true
        }), 'bottom-right');


        map.on('move', updateData);

        map.on('load', () => {
            if (!treeGeoJSON) return;

            // map.setConfigProperty('basemap', 'lightPresets', 'dusk');

            map.addSource('trees', {
                type: 'geojson',
                data: treeGeoJSON
            });

            map.addSource('tree-bars', {
                type: 'geojson',
                data: treeBarGeoJSON
            });

            map.addLayer({
                id: 'tree-bar-layer',
                type: 'fill-extrusion',
                source: 'tree-bars',
                paint: {
                    'fill-extrusion-color': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false],
                        '#ff0000',
                        ['boolean', ['feature-state', 'topFive'], false],
                        '#fbb03b',
                        ['boolean', ['feature-state', 'highlight'], false],
                        '#4cc9f0',
                        colorExpression
                    ],
                    'fill-extrusion-height': ['get', 'extrusionHeight'],
                    'fill-extrusion-base': 0,
                    'fill-extrusion-opacity': 1,
                    'fill-extrusion-vertical-gradient': true
                }
            })


            let selectedFeature = null;

            map.on('click', 'tree-bar-layer', (e) => {
                const feature = e.features?.[0];
                if (!feature) return;

                if (selectedFeature) {
                    map.setFeatureState(
                        { source: 'trees', id: selectedFeature.id },
                        { selected: false }
                    );
                }

                selectedFeature = feature;

                clearTopTreeHighlights();
                topBoroughTrees = getTopTreesInBorough(feature, 5);
                highlightedTreeIds = topBoroughTrees.map(tree => tree.id);

                highlightedTreeIds.forEach((id) => {
                    map.setFeatureState(
                        { source: 'tree-bars', id },
                        { topFive: true }
                    );
                });

                map.setFeatureState(
                    { source: 'tree-bars', id: selectedFeature.id },
                    { selected: true }
                );

                selectedTree = feature
            });

            map.on('click', (e) => {
                const features = map.queryRenderedFeatures(e.point, { layers: ['tree-bar-layer'] });

                if (features.length === 0 && selectedFeature) {
                    map.setFeatureState(
                        { source: 'tree-bars', id: selectedFeature.id },
                        { selected: false }
                    );
                    selectedFeature = null;
                    selectedTree = null;

                    clearTopTreeHighlights();
                    topBoroughTrees = [];
                }
            });

            map.on('mouseenter', 'tree-bar-layer', (e) => {
                const feature = e.features?.[0];
                if (!feature) return;

                map.setFeatureState(
                    { source: 'tree-bars', id: feature.id },
                    { highlight: true }
                );
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'tree-bar-layer', (e) => {
                const feature = e.features?.[0];
                if (!feature) return;

                map.setFeatureState(
                    { source: 'tree-bars', id: feature.id },
                    { highlight: false }
                );
                map.getCanvas().style.cursor = '';
            });
        });
    };

    initMap();
});

onDestroy(() => {
    if (map) map.remove();
});

function handleReset() {
    if (map) {
        map.flyTo({
            center: [initialState.lng, initialState.lat],
            zoom: initialState.zoom,
            essential: true
        });
    }
}

</script>

<svelte:head>
    <title>3D Trees in London</title>
    <link href="https://fonts.googleapis.com/css2?family=Indie+Flower&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Send+Flowers&display=swap" rel="stylesheet">
</svelte:head>

<div bind:this={mapContainer} class="map"></div>

<div class="navbar">
    <div class="navleft">
        <a href="/"><img src="/k-grove-logo.png" alt="Korok Image" href="/"/></a>
        <select bind:value={selectedTreeType} class="tree-filter">
            <option value="All">All Trees</option>
            {#each treeTypes as treeType}
                <option value={treeType}>{treeType}</option>
            {/each}
        </select>
    </div>
    <div class="navcentre">
        <div class="sidebar">Longitude: {lng.toFixed(4)} | Latitude: {lat.toFixed(4)} | Zoom: {zoom.toFixed(2)}</div>
        <div bind:this={geocoderContainer} class="geocoder-slot"></div>
    </div>
    <div class="navright">
        <button on:click={handleReset} class="reset-button">Reset View</button>
    </div>
</div>

<div class="sidebar">
    Longitude: {lng.toFixed(4)} | Latitude: {lat.toFixed(4)} | Zoom: {zoom.toFixed(2)}
</div>



{console.log('selected tree', selectedTree)}

{#if selectedTree}
    <div class="map-overlay">
        <button class="close-button" on:click={() => selectedTree = null}>X</button>
        <h3>The {selectedTree.properties.tree}</h3>
        
        <div class="map-overlay-inner">
            <div class="card">
                <h5>London Rank:</h5>
                <p>{selectedTree.properties.londonRank}</p>
            </div>
            <div class="card">
                <h5>Borough Rank:</h5>
                <p>{selectedTree.properties.boroughRank}</p>
            </div>
            <div class="card">
                <h5>Tree Rent:</h5>
                <p>£{selectedTree.properties.treeRent.toFixed()}</p>
            </div>
            <div class="card">
                <h5>Location:</h5>
                <p>{selectedTree.properties.location}</p>
            </div>
            <div class="card">
                <h5>Borough:</h5>
                <p>{selectedTree.properties.borough}</p>
            </div>
            <div class="card">
                <h5>Tree Value Score:</h5>
                <p>{selectedTree.properties['treeValueScore'].toFixed(2)}</p>
            </div>
        

        {#if topBoroughTrees.length > 0}
            <div class="chart-wrap">
                <h4>Top 5 Trees in {selectedTree.properties.borough}</h4>

                <svg {chartWidth} {chartHeight} class="popup-chart">
                    <g transform={`translate(${chartMargin.left}, ${chartMargin.top})`}>
                        {#each topBoroughTrees as tree}
                            {@const label = `${tree.properties.tree} #${tree.properties.boroughRank}`}
                            {@const y = yScale(label)}
                            {@const barWidth = xScale(tree.properties.treeValueScore)}
                            {@const fill = colorScale ? colorScale(tree.properties.tree) : '#888'}

                            <text
                                x="-10"
                                y={y + yScale.bandwidth() / 2}
                                text-anchor="end"
                                dominant-baseline="middle"
                                class="chart-label"
                            >
                                {tree.properties.tree}
                            </text>

                            <rect
                                x="0"
                                y={y}
                                width={barWidth}
                                height={yScale.bandwidth()}
                                fill={fill}
                                rx="4"
                            />

                            <text
                                x={barWidth + 8}
                                y={y + yScale.bandwidth() / 2}
                                dominant-baseline="middle"
                                class="chart-value"
                            >
                                {tree.properties.treeValueScore.toFixed(1)}
                            </text>
                        {/each}
                    </g>
                </svg>
            </div>
        {/if}
        </div>
    </div>
{/if}

<style>
    .map {
        position: absolute;
        width: 100%;
        height: 100vh;
    }

    .map-overlay {
        position: absolute;
        right: 5%;
        top: 10%;
        height: 88vh;
        width: 25vw;
        background-color: #ffeac8;
        padding: 10px;
        border-radius: 4px;
        z-index: 5;
        border: 3px solid #742f15;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .map-overlay-inner {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
    }

    .map-overlay-inner div {
        padding: 20px;
        margin: 10px;
    }

    .card {
        background-color: white;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        width: 28%;
        height: 25%;
        gap: 2px;
        text-wrap: wrap;
        border: 4px solid #00730b;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }



    .navbar {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 8vh;
        padding: 10px;
        z-index: 10;
        display: flex;
        justify-content: flex-start;
        background-color: #ffeac8;
    }

    .navleft {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 5px;
        width: 20%;
    }

    .navleft img {
        height: auto;
        width: 30%;
        cursor: pointer;
    }

    .navcentre {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60%;
        gap: 2%;
    }

    .navright {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        width: 20%;
    }

    .sidebar {
        background-color: #ffeac8;
        color: #742f15;
        padding: 6px 12px;
        font-family: "Indie Flower", cursive;
        border-radius: 4px;
        border: 2px solid #742f15;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .close-button {
        font-family: "Indie Flower", cursive;
        font-size: 3em;
        color: #742f15;
        align-self: flex-end;
    }

    .reset-button {
        padding: 4px 10px;
        border-radius: 10px;
        cursor: pointer;
        background-color: #742f15;
        color: #ffeac8;
        font-family: "Indie Flower", cursive;
        margin-top: 1%;
    }

    h3 {
        align-self: center;
        font-size: 2.5em;
        font-family: "Indie Flower", cursive;
        font-weight: 400;
        font-style: normal;
        text-transform: uppercase;
    }

    h5 {
        font-family: "Indie Flower", cursive;
        font-weight: 400;
        font-style: normal;
        font-size: 1.5em;
        color: #742f15;
        line-height: 80%;
    }

    p {
        font-family: "Nunito", sans-serif;
        font-weight: 700;
        font-style: normal;
        font-size: 1.25em;
    }

    select {
        background-color: #ffeac8;
        border: #742f15 solid 2px;
        border-radius: 4px;
        font-family: "Indie Flower", cursive;
        color: #742f15;
        font-weight: 800;
    }

    .indie-flower-regular {
        font-family: "Indie Flower", cursive;
        font-weight: 400;
        font-style: normal;
    }

    .nunito-regular {
        font-family: "Nunito", sans-serif;
        font-weight: 400;
        font-style: normal;
    }

    .geocoder-slot {
        min-width: 260px;
        margin-left: 12px;
        height: 100%;
    }

    :global(.geocoder-slot .mapboxgl-ctrl-geocoder) {
        width: 100%;
        min-width: 260px;
        font-family: "Indie Flower", cursive;
        border: 2px solid #742f15;
        box-shadow: none;
        border-radius: 20px;
    }

    :global(.geocoder-slot .mapboxgl-ctrl-geocoder--input) {
        font-family: "Indie Flower", cursive;
    }

    .chart-wrap {
        width: 100%;
        padding: 12px;
        background: white;
        border: 4px solid #00730b;
        border-radius: 8px;
    }

    .chart-wrap h4 {
        margin: 0 0 10px 0;
        font-family: "Indie Flower", cursive;
        font-size: 1.5em;
        color: #742f15;
        text-align: center;
    }

    .popup-chart {
        width: 100%;
        height: 80%;
        overflow: visible;
    }

    .chart-label {
        font-family: "Nunito", sans-serif;
        font-size: 12px;
        font-weight: 700;
        fill: #742f15;
    }

    .chart-value {
        font-family: "Nunito", sans-serif;
        font-size: 12px;
        font-weight: 700;
        fill: #222;
    }
</style>