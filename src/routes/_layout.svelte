<style type="text/scss">
 @import "../theme/colors";
 @import "../theme/fonts";

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
   display: flex;
   flex-direction: row;
   max-width: 44em;
   border-bottom: 1px solid $header-border-color;
   padding: 10px 1em;
   margin: 0 auto 10px;
 }

 .header-main {
   display: flex;
   /* Anchor absolutely positioned content. */
   position: relative;
   /* Push action to the right */
   flex: 1;
 }

 .currently-baking {
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

 .home-link {
   display: flex;
   text-decoration: none;
 }

 .about {
   text-decoration: none;
 }

 .home-link__logo {
   max-height: 24px;
   width: auto;
   margin-right: 0.5em;
 }

 .home-link__text,
 .recipe-name {
   @include font-logo;
   margin: 0;
   /* Absolute position for smoother fly in/out. */
   position: absolute;
   left: 30px;
 }

 .baking-action {
   font-size: $font-size-small;
 }

 @media (min-width: 40em) {
   .home-link {
     margin-left: 0 1em;
   }
 }
</style>

<!-- TODO: move to context="module" to initialize only once? -->
<script lang="ts">
 import { setContext, getContext } from 'svelte';

 import { fly } from 'svelte/transition';

 import Button from '../components/Button.svelte';

 import { init } from '../state/state';
 import { getRecipeLink } from '../utils/routes';

 setContext('state', init());

 const { isBaking, bakingRecipe, actions, ongoingStep, displayedRecipe } = getContext('state');
</script>

<svelte:head>
  <title>Boule</title>
</svelte:head>

<header>
  <div class="header-main">
    <a href="/" class="home-link">
      <img src="/logo-128.png" alt="" width="128" height="128" class="home-link__logo">
    </a>
      {#if ! $displayedRecipe}
        <h1
          class="home-link__text"
          in:fly="{{  x: -10, duration: 200, delay: 200 }}"
          out:fly="{{  x: -10, duration: 200 }}"
        >
          Boule
        </h1>
      {/if}
      <!-- </a>
      -->
    {#if $displayedRecipe}
      <h2
        class="recipe-name"
        in:fly="{{  x: -10, duration: 200, delay: 200 }}"
        out:fly="{{  x: -10, duration: 200 }}"
      >
        {$displayedRecipe.name}
      </h2>
    {/if}
  </div>

  <!-- TODO: fly in/out more smoothly -->
  {#if $isBaking}
    {#if $displayedRecipe === $bakingRecipe}
      <!-- TODO: hover+click/tap again to stop? -->
      <div class="baking-action">
        <Button>Currently baking</Button>
      </div>
    {:else}
      <div class="baking-action">
        <a href={getRecipeLink($bakingRecipe)}>
          <Button>Go to current bake</Button>
        </a>
      </div>
    {/if}
  {:else}
    {#if $displayedRecipe}
      <div class="baking-action">
        <Button on:click={() => actions.startBaking($displayedRecipe.id)}>Start baking</Button>
      </div>
    {:else}
      <nav>
        <a href="/about" class="about">About</a>
      </nav>
    {/if}
  {/if}
</header>

<main>
  <slot></slot>
</main>

{#if $isBaking}
  <aside class="currently-baking">
    <div class="current-label">Currently baking</div>
    <h3>{$bakingRecipe.name}</h3>

    <div>{$ongoingStep.title}</div>

    <!-- TODO: more ongoing details re active vs waiting, actions, timing, eta, etc -->

    <Button on:click={actions.stopBaking}>Stop baking</Button>
  </aside>
{/if}
