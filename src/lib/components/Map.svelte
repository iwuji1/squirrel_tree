<script>
    import {onMount} from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import * as THREE from "three";
    
    let map;

    let geojsonData;

    //Mapbox Access Token
    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    //Load GeoJSON Data
    const loadGeoJSON = async () => {
        try {
            const response = await fetch('/tree_volumes.geojson'); // File in the `static` folder
            if (!response.ok) {
                throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
            }
            geojsonData = await response.json();
            console.log('Loaded GeoJSON Data:', geojsonData);
        } catch (error) {
            console.error(error);
        }
    }

    //Initialize the Map
    const initializeMap = () => {
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        map = new mapboxgl.Map({
            container: 'map', // ID of the container div
            style: 'mapbox://styles/mapbox/streets-v11', // Replace with your preferred style
            center: [-0.1, 51.5], // Example: London coordinates
            zoom: 10
        });

        map.on('load', () => {
            if (geojsonData) {
                // add the GeoJSON as a source
                map.addSource('tree-volumes', {
                    type: 'geojson',
                    data: geojsonData
                });

                map.addLayer({
                    id: 'tree-points-layer',
                    type: 'circle',
                    source: 'tree-volumes',
                    paint: {
                        'circle-radius': 5, // Adjust the size of the points
                        'circle-color': '#228B22', // Tree green color
                        }});
            }
        });

    };

    // Load the GeoJSON and Initialize the Map on Component Mount
    onMount(async () => {
        await loadGeoJSON();
        initializeMap();
    });

</script>

<style>
    #map {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 100%;
    }
  </style>
  
  <div id="map" style="width: 100%; height: 100%;"></div>