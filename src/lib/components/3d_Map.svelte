<script>
    import {onMount} from 'svelte';
    import * as d3 from 'd3';
    import mapboxgl from 'mapbox-gl';
	import * as Three from 'threebox-plugin';
    import * as THREE from 'three';
	import { MeshToonMaterial } from 'three';

    let mapContainer;

    let jsonData;
    
    //Mapbox Access Token
    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    const data = [
    { borough: "Barking", display_name: "Alder", tree_count: 174, avg_latitude: 51.5487015361, avg_longitude: 0.1230013442 },
    { borough: "Barking", display_name: "Apple", tree_count: 556, avg_latitude: 51.5487015361, avg_longitude: 0.1230013442 },
    { borough: "Barking", display_name: "Ash", tree_count: 762, avg_latitude: 51.5487015361, avg_longitude: 0.1230013442 },
    { borough: "Barking", display_name: "Beech", tree_count: 156, avg_latitude: 51.5487015361, avg_longitude: 0.1230013442 },
    { borough: "Barking", display_name: "Birch", tree_count: 458, avg_latitude: 51.5487015361, avg_longitude: 0.1230013442 },
  ];

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

  const makeMap = () => {

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    //Initialize mapbox map
    mapContainer = new mapboxgl.Map({
        container: 'mapContainer',
        style: 'mapbox://styles/mapbox/light-v11',
        center: { lng: -0.1, lat: 51.5 },
        zoom: 10,
        pitch: 64.9,
        bearing: 172.5,
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

    mapContainer.on('style.load', () => {
        let realdata;

        if (jsonData) {
            realdata = jsonData;

            

        mapContainer.addLayer({
            id: 'bar-layer',
            type: 'custom',
            renderingMode: '3d',
            onAdd: function() {

                const treeCounts = data.map(d => d.tree_count);

                const hscale = d3.scaleLinear()
                .domain([d3.min(treeCounts), d3.max(treeCounts)])
                .range([0.01, 0.1]);

                const scale = 5.2;
                const barWidth = 30;
                const barMaterial = new THREE.MeshBasicMaterial({ color: 0x44aa88 });

                var geometry  = new THREE.BoxGeometry(barWidth, barWidth, 120);
                var bar = new THREE.Mesh(geometry, barMaterial);
                let cubetemplate = tb.Object3D({obj: bar, units: 'meters', scale: {x: scale, y: scale, z: 2.7}})
                realdata.forEach((d,i) => {
                    const heightScale = hscale(d.tree_count)

                    let newcube = cubetemplate.duplicate()
                    .setCoords([d.avg_longitude, d.avg_latitude])

                    newcube.scale.set(0.1,0.1,heightScale)
                    newcube.addTooltip("Location: " + d.borough +" Tree Type: " + d.display_name + " Tree Count: " + d.tree_count , true)
                    
                    tb.add(newcube)
                })
                
            },

            render: function() {
                tb.update();
            }

        })
    }
    })

  }

    onMount( async() => {
        await loaddata();
        makeMap();
    });

</script>

<style>
    #mapContainer {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 100%;
        height: 100vh;
        z-index: 2;
    }

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

<div id="mapContainer">
</div>

<div id="navi">
    <nav>
        <a href="/">HomePage</a>
        <a href="/interactive">interactive</a>
    </nav>
</div>

<div id="frontsheet">
    <h1>Checking if this shows</h1>
</div>