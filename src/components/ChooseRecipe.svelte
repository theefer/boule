<script>
 import {getRecipeLink} from '../utils/routes';

 export let recipes;
</script>

<!-- TODO: choose variant: slow/fast leaven (or on next page) -->

<ol>
  {#each recipes as recipe}
    <li>
      <h2><a href="{getRecipeLink(recipe)}">{recipe.name}</a></h2>
      <!-- TODO: add description or more details -->
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

 a {
   text-decoration: none;
 }
</style>
