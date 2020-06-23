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
 import Steps from '../components/Steps.svelte';
</script>

<svelte:head>
  <title>Crusty</title>
</svelte:head>

<h1>Crusty</h1>

<Steps></Steps>
