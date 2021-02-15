<script lang="ts">
 import { getRecipeFirstStepLink } from '../utils/routes';

 export let recipe: Recipe;

 const recipeStartLink = getRecipeFirstStepLink(recipe);


 interface IngredientGroup {
   readonly category: IngredientsCategory;
   readonly ingredients: readonly Ingredient[];
 }

 function gatherIngredients(recipe: Recipe): IngredientGroup[] {
   const groupMap = new Map<IngredientsCategory, Ingredient[]>();
   for (const step of recipe.methodSteps) {
     if (!step.ingredients) {
       continue;
     }
     let group = groupMap.get(step.ingredientsCategory);
     if (!group) {
       group = [];
       groupMap.set(step.ingredientsCategory, group);
     }
     group.push(...step.ingredients);
   }

   const groups: IngredientGroup[] = [];
   for (const [category, ingredients] of groupMap) {
     groups.push({category, ingredients});
   }
   return groups;
 }

 const gatheredIngredients = gatherIngredients(recipe);
</script>

{#if recipe.description}
  <p class="description">{recipe.description}</p>
{/if}

<h2 class="ingredient-heading">Ingredients</h2>

<div class="ingredient-groups">
  {#each gatheredIngredients as group}
    <section class="ingredient-group">
      <h3>For the {group.category}</h3>
      <ul>
        {#each group.ingredients as ingredient}
          <li>{ingredient}</li>
        {/each}
      </ul>
    </section>
  {/each}
</div>

<!-- TODO: allow changing the quantities with a multiplier -->
<!-- TODO: allow choosing variant: slow/fast leaven -->
<!-- TODO: preview timeline -->

<div class="start-action">
  <a href={recipeStartLink}>View the recipe</a> 
  <!-- TODO: allow Start baking here -->
</div>


<style type="text/scss">
 @import "../theme/fonts";

 .ingredient-heading {
   text-align: center;
 }

 .ingredient-groups {
   display: flex;
   flex-direction: horizontal;
   justify-content: space-around;
   gap: 1em;
 }

 .start-action {
   text-align: center;
   margin-top: 2em;
 }
</style>
