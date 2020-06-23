<style>
 h1 {
   text-align: center;
   margin: 0 auto;

   font-size: 1.8em;
   text-transform: uppercase;
   font-weight: 700;
   margin: 0 0 0.5em 0;
 }

 p {
   margin: 1em auto;
 }

 @media (min-width: 480px) {
   h1 {
     font-size: 3em;
   }
 }
</style>

<script>
 import { onMount } from 'svelte';

 import Steps from '../components/Steps.svelte';

 let hasTriggers = false;

 onMount(async () => {
   if ("showTrigger" in Notification.prototype) {
     /* Notification Triggers supported */
     hasTriggers = true;
   }
 })
</script>

<svelte:head>
  <title>Crusty</title>
</svelte:head>

<h1>Crusty</h1>

{#if hasTriggers}
  <Steps></Steps>
{:else}
  <p>
    Scheduled notifications not supported in your browser, so we won't
    be able to notify you when you need to take the next step.
  </p>
{/if}
