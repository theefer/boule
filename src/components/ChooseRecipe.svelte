<script lang="ts">
 import {getRecipeLink} from '../utils/routes';
 import type {Recipe} from '../content/recipes';

 export let recipes: readonly Recipe[];
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

<style type="text/scss">
 @import "../theme/fonts";

 li {
   display: flex;
   justify-content: space-between;
 }

 a {
   text-decoration: none;
 }

 h2 {
   @include font-main-heading;
 }
</style>
