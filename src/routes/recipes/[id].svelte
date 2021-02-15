<script context="module">
 import {RECIPES} from '../../content/recipes';

 export async function preload({ params, query }) {
   const recipeId = params.id;
   const stepId = query.step && Number(query.step);
   const recipe = RECIPES.find(r => r.id === recipeId);
   // TODO: error if missing
   return {
     recipe,
     stepId,
   };
 }
</script>

<script lang="ts">
 import type {Recipe} from '../../content/recipes';

 import RecipeIntro from '../../components/RecipeIntro.svelte';
 import Steps from '../../components/Steps.svelte';

 export let recipe: Recipe;
 export let stepId: number;
</script>

{#if stepId}
  <Steps recipe={recipe} displayedStepId={stepId}></Steps>
{:else}
  <RecipeIntro recipe={recipe}></RecipeIntro>
{/if}
