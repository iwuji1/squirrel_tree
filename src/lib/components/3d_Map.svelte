<script>
    import * as d3 from 'd3';
    import mapboxgl from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
	import * as Three from 'threebox-plugin';
    import * as THREE from 'three';
    import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
    import { onMount, onDestroy } from 'svelte';

    let map;
    let mapContainer;
    let lng, lat, zoom;

    lng = -0.1;
    lat = 51.5;
    zoom = 16.8;

    let initialState = {
        lng: lng,
        lat: lat,
        zoom: zoom
    };


    let jsonData;
    
    //Mapbox Access Token
    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

//     const data = [
//     { borough: "Barking", display_name: "Alder", tree_count: 174, avg_latitude: 51.5487015361, avg_longitude: 0.1230013442 },
//     { borough: "Barking", display_name: "Apple", tree_count: 556, avg_latitude: 51.5487015361, avg_longitude: 0.1230013442 },
//     { borough: "Barking", display_name: "Ash", tree_count: 762, avg_latitude: 51.5487015361, avg_longitude: 0.1230013442 },
//     { borough: "Barking", display_name: "Beech", tree_count: 156, avg_latitude: 51.5487015361, avg_longitude: 0.1230013442 },
//     { borough: "Barking", display_name: "Birch", tree_count: 458, avg_latitude: 51.5487015361, avg_longitude: 0.1230013442 },
//   ];

    // Custom tooltip element
    let tooltip;

    const createTooltip = () => {
        tooltip = document.createElement("div");
        tooltip.className = "custom-tooltip";
        tooltip.style.position = "absolute";
        tooltip.style.display = "none";
        tooltip.style.pointerEvents = "none";
        document.body.appendChild(tooltip);
    };

    const showTooltip = (text, event) => {
        tooltip.innerHTML = text;
        tooltip.style.left = event.pageX + 10 + "px";
        tooltip.style.top = event.pageY + 10 + "px";
        tooltip.style.display = "block";
    };

    const hideTooltip = () => {
        tooltip.style.display = "none";
    };

  const loaddata = async () => {
    try {
        const response = await fetch('/tree_name_counts.json');
        if (!response.ok) {
            throw new Error(`Failed to fetcg json: ${response.statusText}`);
        }

        jsonData = await response.json();
        console.log('loaded Json Data', jsonData);
    } catch (error) {
        console.error(error)
    }
  }

  const loadtreedata = async () => {
    try {
        const response = await fetch('/boroughs_with_top_trees.json');
        if (!response.ok) {
            throw new Error(`Failed to fetcg json: ${response.statusText}`);
        }

        jsonData = await response.json();
        console.log('loaded Tree Data', jsonData);
    } catch (error) {
        console.error(error)
    }
  }

  const loadtreedata_full = async () => {
    try {
        const response = await fetch('/tree_borough_data.json');
        if (!response.ok) {
            throw new Error(`Failed to fetcg json: ${response.statusText}`);
        }

        let treedata = await response.json();
        console.log('loaded Tree Data', treedata);
    } catch (error) {
        console.error(error)
    }
  }

  const makeMap = () => {

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    //Initialize mapbox map
    mapContainer = new mapboxgl.Map({
        container: 'mapContainer',
        style: 'mapbox://styles/obiwuji/cmen0w4vc005m01s8d0rocj1l', //mapbox://styles/obiwuji/cmen0w4vc005m01s8d0rocj1l //mapbox://styles/mapbox/standard
        center: { lng: -0.1, lat: 51.5 },
        zoom: 16.8,
        pitch: 74,
        bearing: 12.8,
        antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
    });

    const tb = (window.tb = new Three.Threebox(
        mapContainer,
        mapContainer.getCanvas().getContext('webgl'),
        {
            defaultLights: true,
            enableSelectingObjects: true,
            enableTooltips: true,
        }
    ));

    // Create a popup, but don't add it to the map yet.
    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    mapContainer.addControl(
        new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            useBrowserFocus: true,
            mapboxgl: mapboxgl
        })
    )

    mapContainer.on('style.load', () => {

        let realdata;

        if (jsonData) {
            realdata = jsonData.boroughs;

            // mapContainer.setConfigProperty('basemap', 'lightPresets', 'dusk');

            const zoomBasedReveal = (e) => {
                return [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    11,
                    0,
                    13,
                    e
                ];
            };

            // mapContainer.setRain({
            //     density: zoomBasedReveal(0.3),
            //     intensity: 1.0,
            //     color: '#a8adbc',
            //     opacity: 0.7,
            //     vignette: zoomBasedReveal(1.0),
            //     'vignette-color': '#464646',
            //     direction: [0, 80],
            //     'droplet-size': [2.6, 18.2],
            //     'distortion-strength': 0.7,
            //     'center-thinning': 0
            // })



            

        mapContainer.addLayer({
            id: 'bar-layer',
            type: 'custom',
            renderingMode: '3d',
            onAdd: function() {

                const treeCounts = realdata.map(d => d.tree_count);

                const hscale = d3.scaleLinear()
                .domain([0, 50])
                .range([0.01, 0.1]);

                const wscale = d3.scaleLinear()
                .domain([0, 70])
                .range([0.01, 0.1]);

                const scale = 3;
                const barWidth = 0.5;
                const barMaterial = new THREE.MeshBasicMaterial({ color: 0x44aa88 });

                var geometry  = new THREE.BoxGeometry(barWidth, barWidth, 50);
                var bar = new THREE.Mesh(geometry, barMaterial);
                let cubetemplate = tb.Object3D({obj: bar, units: 'meters', scale: {x: scale, y: scale, z: 2.7}})
                realdata.forEach((d) => {
                    d.trees.forEach((t, i) => {
                        const heightScale = hscale(t.height)
                        const widthScale = wscale(t.girth)

                        let newcube = cubetemplate.duplicate()
                        .setCoords([t.lon, t.lat])

                        newcube.scale.set(widthScale, widthScale, heightScale)

                        newcube.addTooltip("Location: " + t.location +" Tree Type: " + t.Tree + " Tree Rent: " + t.TreeRent + " Food: " + t["Food squirrels can eat (Yes / No)"] , true)

                        tb.add(newcube)
                    })
                })
                
            },

            render: function() {
                tb.update();
            }

        })
    }
    })

  }

  console.log()

    onMount( async() => {
        // await loaddata();
        await loadtreedata();
        await loadtreedata_full();
        makeMap();
    });

</script>

<style>

    #frontsheet {
        position: absolute;
        top: 20%;
        left: 5%;
        z-index: 10;
        background-color: white;
    }

    #navi {
        position: absolute;
        z-index: 10;
        background-color: white;
    }


</style>

<div id="mapContainer" class="map" bind:this={mapContainer}></div>

<div id="navi">
    <nav>
        <a href="/">HomePage</a>
        <a href="/interactive">interactive</a>
    </nav>
</div>

<div id="frontsheet">
    <h1>Checking if this shows</h1>
</div>