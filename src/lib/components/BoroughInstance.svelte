<script>
  import { T } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
	import { on } from 'svelte/events';
  import { Spring } from 'svelte/motion'

  export let object = null
  export let onHover = () => {}
  export let onUnhover = () => {}

  const { onPointerEnter, onPointerLeave } = useCursor()

  let baseX = 0
  let baseY = 0
  let baseZ = 0

  const lift = new Spring(0, { stiffness: 0.15, damping: 0.4 })
  const blocked = (name) => name === 'Vert' || name === 'Vert_1'

  $: if (object) {
    // capture base pos from the imported mesh
    baseX = object.position.x
    baseY = object.position.y
    baseZ = object.position.z
  }
</script>

{#if object}
  <T
    is={object}
    onpointerenter={() => {
      {object.name}
      if (blocked(object.name)) return
      onPointerEnter()
      onHover(object.name)
      lift.target = 0.6
    }}
    onpointerleave={() => {
      if (blocked(object.name)) return
      onPointerLeave()
      onUnhover()
      lift.target = 0
    }}
    
    position.x={baseX}
    position.y={baseY + (blocked(object.name) ? 0 : lift.current)}
    position.z={baseZ}
  />
{/if}