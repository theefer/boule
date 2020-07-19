<script context="module">
 import {RECIPES} from '../../content/recipes';

 export async function preload({ params, query }) {
   const recipeId = params.id;
   const stepId = Number(query.step) || 1;
   const recipe = RECIPES.find(r => r.id === recipeId);
   // TODO: error if missing
   return {
     recipe,
     stepId,
   };
 }
</script>

<script>
 import Steps from '../../components/Steps.svelte';

 export let recipe;
 export let stepId;
</script>

<Steps recipe={recipe} displayedStepId={stepId}></Steps>
