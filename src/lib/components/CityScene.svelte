<script>
    import {onMount, onDestroy} from 'svelte';
    import { T } from '@threlte/core'
    import { useGltf, OrbitControls, interactivity, HTML} from '@threlte/extras'
    import Borough from './BoroughInstance.svelte'

  interactivity()

  const cityGLTF = useGltf('/models/london_city_v2.glb')

  function getMeshes(root) {
    const meshes = []
    root.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child)
      }
    })
    return meshes
  }

  let hoveredBorough = null
</script>

<style>
    .indie-flower-regular {
        font-family: "Indie Flower", cursive;
        font-weight: 400;
        font-style: normal;
        font-size: 3em;
        width: 50vw;
        color: white;
    }
</style>

<T.OrthographicCamera zoom={80} position={[0, 12, 15]} makeDefault>
  <OrbitControls />
</T.OrthographicCamera>

<T.HemisphereLight intensity={0.6} color="#ffffff" groundColor="#2b2b2b" />

<T.AmbientLight intensity={0.6} />
<T.DirectionalLight position={[1, 2, 5]} />

<T.PointLight
  position={[-10, 5, 10]}
  intensity={1.8}
  color="#FFAA33"
/>

<!-- Key light (sun) -->
<T.DirectionalLight
  position={[6, 10, 6]}
  intensity={2.0}
  castShadow
/>

{#await cityGLTF then gltf}
    {@const boroughMeshes = getMeshes(gltf.scene)}

    {#each boroughMeshes as mesh}
        <Borough 
        object={mesh}
        onHover={(name) => hoveredBorough = name}
        onUnhover={() => hoveredBorough = null} 
        />
    {/each}
{/await}

<HTML 
    transform
    wrapperClass="htmlText"
    position={[6, -2, 0]}>
    <div class="indie-flower-regular">
        {#if hoveredBorough}
            {hoveredBorough}
        {:else}
            Hover over a borough
        {/if}
    </div>
</HTML>
