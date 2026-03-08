<script>
    import {Canvas} from '@threlte/core';
    import Scene from '$lib/components/Scene.svelte';    

</script>

<svelte:head>
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.9.2/mapbox-gl.css" rel="stylesheet">
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.9.2/mapbox-gl.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" >
<link href="https://fonts.googleapis.com/css2?family=Indie+Flower&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Send+Flowers&display=swap" rel="stylesheet">
</svelte:head>

<style>
    .indie-flower-regular {
        font-family: "Indie Flower", cursive;
        font-weight: 400;
        font-style: normal;
    }

    .send-flowers-regular {
        font-family: "Send Flowers", cursive;
        font-weight: 400;
        font-style: normal;
    }

    .nunito-regular {
        font-family: "Nunito", sans-serif;
        font-weight: 400;
        font-style: normal;
    }


    .title {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
        flex-direction: column;
        position: relative;
    }

    .enter {
        align-self: center;
        font-size: 4em;
    }

    .enter-title {
        align-self: center;
        font-size: 8em;
    }

    .title-container {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 20px;
        border: 10px solid #742f15;
        padding: 20px;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
        background-color: #ffeac8;
    }

    .button-89 {
        --b: 3px;   /* border thickness */
        --s: .45em; /* size of the corner */
        --color: #00730b;
        
        padding: calc(.5em + var(--s)) calc(.9em + var(--s));
        color: var(--color);
        --_p: var(--s);
        background:
            conic-gradient(from 90deg at var(--b) var(--b),#0000 90deg,var(--color) 0)
            var(--_p) var(--_p)/calc(100% - var(--b) - 2*var(--_p)) calc(100% - var(--b) - 2*var(--_p));
        transition: .3s linear, color 0s, background-color 0s;
        outline: var(--b) solid #0000;
        outline-offset: .6em;
        font-size: 24px;

        border: 0;

        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
    }

        .button-89:hover,
        .button-89:focus-visible{
        --_p: 0px;
        outline-color: var(--color);
        outline-offset: .05em;
        }

        .button-89:active {
        background: var(--color);
        color: #fff;
        }

</style>

<div class="title">
    <Canvas>
        <Scene />
    </Canvas>

    <div class="title-container">
        <img src="/k-grove-logo.png" alt="Korok Image" width="200" height="200"/>
        <h1 class="enter indie-flower-regular">Welcome</h1>
        <h1 class="enter indie-flower-regular">to</h1>
        <h1 class="enter-title send-flowers-regular">Korok Grove</h1>
        <a href="/interactive">
        <button class="button-89 indie-flower-regular">Enter the Grove</button>
        </a>
    </div>
</div>
