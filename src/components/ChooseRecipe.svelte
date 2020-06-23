<script>
 import { createEventDispatcher } from 'svelte';

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
      {recipe.name}
      <input type="button" on:click={() => chooseRecipe(recipe)} value="Start baking">
    </li>
{/each}
</ol>

