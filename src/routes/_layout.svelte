<style type="text/scss">
 @import "../theme/colors";

 $header-border-color: #eee;

 main {
   position: relative;
   max-width: 44em;
   background-color: white;
   padding: 0 1em;
   margin: 0 auto;
   box-sizing: border-box;
 }
 
 header {
   max-width: 44em;
   border-bottom: 1px solid $header-border-color;
   padding: 10px 1em;
   margin: 0 auto 10px;
 }

 aside {
   border-top: 10px solid $primary-color;
   background-color: #f7f0de;
   max-width: 40em;
   padding: 5px 10px;
   margin: 0 auto;
   position: absolute;
   left: 0;
   right: 0;
   bottom: 0;
 }
 /* TODO: if present, add bottom margin to main */

 .current-label {
   font-size: 0.66em;
   text-transform: uppercase;
 }

 .header-line {
   display: flex;
   text-decoration: none;
 }

 .logo {
   max-height: 24px;
   width: auto;
   margin-right: 0.5em;
 }

 h1 {
   font-size: 1.3em;
   font-weight: 700;
   margin: 0;
   /* margin: 0 0 0.5em 0; */
 }

 @media (min-width: 40em) {
   .header-line {
     margin: 0 1em;
   }
 }
</style>

<!-- TODO: move to context="module" to initialize only once? -->
<script lang="ts">
 import { setContext, getContext } from 'svelte';

 import Button from '../components/Button.svelte';

 import { init } from '../state/state';

 setContext('state', init());

 const { isBaking, bakingRecipe, actions, ongoingStep } = getContext('state');
</script>

<svelte:head>
  <title>Boule</title>
</svelte:head>

<header>
  <a href="/" class="header-line">
    <img src="/logo-128.png" alt="" width="128" height="128" class="logo">
    <h1>Boule</h1>
  </a>
</header>

<main>
  <slot></slot>
</main>

{#if $isBaking}
  <aside>
    <div class="current-label">Currently baking</div>
    <h3>{$bakingRecipe.name}</h3>

    <div>{$ongoingStep.title}</div>

    <!-- TODO: more ongoing details re active vs waiting, actions, timing, eta, etc -->

    <Button on:click={actions.stopBaking}>Stop baking</Button>
  </aside>
{/if}
