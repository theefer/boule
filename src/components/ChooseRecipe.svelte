<script>
 import { createEventDispatcher } from 'svelte';

 import Button from '@smui/button';

 const dispatch = createEventDispatcher();

 export let recipes;

 function chooseRecipe(recipe) {
   dispatch('chooseRecipe', recipe.id);
 }
</script>

<!-- TODO: choose slow/fast leaven -->

<ol>
  {#each recipes as recipe}
    <li>
      <h2>{recipe.name}</h2>
      <Button variant="outlined" on:click={() => chooseRecipe(recipe)}>Start baking</Button>
    </li>
  {/each}
</ol>

<style>
 ol, li {
   margin: unset;
   padding: unset;
   list-style-type: none;
 }

 li {
   display: flex;
   justify-content: space-between;
   margin-top: 20px;
 }
</style>
