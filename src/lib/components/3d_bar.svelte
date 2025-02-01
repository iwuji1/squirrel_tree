<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as THREE from 'three';
    import { GUI } from 'lil-gui';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import mapboxgl from 'mapbox-gl';
    import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
    import { FontLoader } from 'three/addons/loaders/FontLoader.js';
    import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
	import { color, depth } from 'three/tsl';

    let data = [];

    onMount( async () => {

        //Fetching data
        const response = await fetch('/tree_name_counts.json');
        if (response.ok) {
            data = await response.json();
        } else {
            console.error('Failed to load data');
        }

        //Initializing Three.js Scene
        const canvas = document.querySelector("canvas.webgl");
        
        // Scene
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera();

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            canvas: canvas,
            antialias: true,
        });

        renderer.setSize(window.innerWidth, window.innerHeight);

        scene.add(new THREE.GridHelper(100,100))

        const treeCounts = data.map(d => d.tree_count);

        const scale = d3.scaleLinear()
        .domain([d3.min(treeCounts), d3.max(treeCounts)])
        .range([5,500]);


            const barWidth = 0.5;
            const barSpacing = 1;
            const barMaterial = new THREE.MeshBasicMaterial({ color: 0x44aa88 });

            data.forEach((d,i) => {
                const barheight = scale(d.tree_count);
                const geometry = new THREE.BoxGeometry(barWidth, barheight, barWidth);
                const bar = new THREE.Mesh(geometry, barMaterial);

                bar.position.set(i * barSpacing, barheight/2, 0);
                scene.add(bar)
            })

            // Add Light
            const light = new THREE.DirectionalLight(0xffffff, 1);
            light.position.set(5, 10, 7.5);

            const spotLight = new THREE.SpotLight(0xffffff, 1);
            spotLight.position.set(0,0,0);

            const spotLight2 = new THREE.SpotLight(0xffffff, 1);
            spotLight2.position.set(0,0,0);

            const spotLight3 = new THREE.SpotLight(0xffffff, 0.1);
            spotLight3.position.set(0,0,0);
            scene.add(light);
            scene.add(spotLight)
            scene.add(spotLight2)
            scene.add(spotLight3)

        const gui = new GUI();

        const cameraFolder = gui.addFolder("Camera");

        cameraFolder.add(camera.position, "x").min(-100).max(100).step(0.1);
        cameraFolder.add(camera.position, "y").min(-100).max(100).step(0.1);
        cameraFolder.add(camera.position, "z").min(-100).max(100).step(0.1);

        camera.lookAt(0,0,0);

        const controls = new OrbitControls(camera, renderer.domElement)

        camera.position.set(4,8,-10);
        // Camera Position
        camera.position.z = 10;

        const animate = () => {

            requestAnimationFrame( animate );

            controls.update();

            renderer.render(scene, camera);

        }

        animate();
    })

</script>

<style>
    /* .container {
    width: 100%;
    height: 100vh;
    overflow: hidden;
  } */
</style>

<div class="container">
    <canvas class="webgl"></canvas>
</div>