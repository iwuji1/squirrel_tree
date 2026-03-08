<script>
    import { T, useTask } from '@threlte/core'
    import { useGltf, OrbitControls, Environment } from '@threlte/extras'
    import SquirrelInstance from './SquirrelInstance.svelte';
	import { path } from 'd3';
	import { PointLight } from 'three';

    const squirrelGLTF = useGltf('/models/squirrel_2_anim.glb');
    
    const roadGLTF = useGltf('/models/Tree wheel.glb');

    let roadRef;
    let pathLeftRef;
    let pathRightRef;

    const PavementSpeed = 0.3; //radians per second
    const RoadSpeed = 0.15; //radians per second

    useTask((delta) => {
      console.log(roadRef);
      if (roadRef) roadRef.rotation.x += RoadSpeed * delta;
      if (pathLeftRef) pathLeftRef.rotation.x += PavementSpeed * delta;
      if (pathRightRef) pathRightRef.rotation.x += PavementSpeed * delta;
    });

</script>

<T.PerspectiveCamera
  makeDefault
  position={[0, 2, 25]}
  fov={25}
>
  <OrbitControls
    enableDamping
  />
</T.PerspectiveCamera>

<T.HemisphereLight intensity={0.6} color="#ffffff" groundColor="#2b2b2b" />

<!-- Soft global light -->
<T.AmbientLight color="#FF651C" intensity={0.12} />

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

<!-- Rim light for separation -->
<T.DirectionalLight
  position={[-8, 6, -6]}
  intensity={0.8}
/>
<Environment url="/HDR/pure_sky.hdr" />

{#await roadGLTF then roadGltf}
  <T.Group position={[0, -16, 0]} scale={2.5}>

    <T.Group bind:ref={roadRef}>
      <T is={roadGltf.scene.getObjectByName('Road')} />
    </T.Group>
    <T.Group bind:ref={pathLeftRef}>
      <T is={roadGltf.scene.getObjectByName('Path_Left')} />
    </T.Group>
    <T.Group bind:ref={pathRightRef}>
      <T is={roadGltf.scene.getObjectByName('Path_Right')} />
    </T.Group>

  </T.Group>
{/await}



{#await squirrelGLTF then gltf}
  <!-- <T is={gltf.scene} position={[-5, 0, 0]} rotation={[0, -.50, 0]} scale={1} /> -->
  <!-- <SquirrelInstance gltf={gltf} action="running" position={[-8, 0, 0]} rotation={[0.5, -.5, 0]} scale={2} timeScale={2} />
  <SquirrelInstance gltf={gltf} action="running" position={[8, 0, 0]} rotation={[0, .25, 0]} scale={1.2} timeScale={3} />
  <SquirrelInstance gltf={gltf} action="head move" position={[10, -14, -12]} rotation={[0, -.5, 0]} scale={4} timeScale={0.8} /> -->
{/await}

<T.Mesh position={[0, 0, -15]} rotation={[0, 0, 0]}>
  <T.PlaneGeometry args={[50, 50]} />
  <T.MeshStandardMaterial color="#009AEE" />
</T.Mesh>