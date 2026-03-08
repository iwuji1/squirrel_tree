<script>
  import { T } from '@threlte/core'
  import { useGltfAnimations } from '@threlte/extras'
  import { writable } from 'svelte/store'
  import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

  let {
    gltf,
    action,
    position,
    rotation,
    scale = 1,
    timeScale = 1.5
  } = $props()

  console.log(gltf, action)

  // clone once per instance (independent skeleton)
  const scene = clone(gltf.scene)

  const gltfStore = writable(gltf)

  // hook MUST be called during component init
  const { actions, mixer } = useGltfAnimations(gltfStore, scene)

  mixer.timeScale = timeScale

  $effect(() => {
    console.log('available clips:', Object.keys($actions ?? {}))
    $actions[action]?.play()
  })
</script>

<T is={scene} position={position} rotation={rotation} scale={scale} />
