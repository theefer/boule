<script lang="ts">
 import { getContext } from 'svelte';

 import { getRecipeStepLink } from '../utils/routes';

 const { progress, isStartedStep, isWaitingStep, isCompletedStep } = getContext('state');

 export let recipe: Recipe;
 export let displayedStep: RecipeStep;

 // TODO: expose on state
 $: steps = recipe.methodSteps || [];

 // TODO: share
 function getStepLink(stepId) {
   return getRecipeStepLink(recipe, stepId);
 }
</script>

<ol class="step-bullets">
  {#each steps as step}
    <a href="{getStepLink(step.id)}"
       class="step-bullet"
       class:step-bullet--displayed="{step == displayedStep}"
       class:step-bullet--started="{$isStartedStep(step)}"
       class:step-bullet--waiting="{$isWaitingStep(step)}"
       class:step-bullet--completed="{$isCompletedStep(step)}"
       class:step-bullet--future="{!$isStartedStep(step) && !$isWaitingStep(step) && !$isCompletedStep(step)}"
    >
    </a>
  {/each}
</ol>

<style type="text/scss">
 @import "../theme/colors";

 .step-bullets {
   display: flex;
   flex-direction: row;
   margin: 0;
   padding: 0;
 }

 .step-bullet {
   font-size: 0.88em;
   text-decoration: none;
   display: inline-block;
   width: 8px;
   height: 8px;
   border-radius: 8px;
   margin-right: 4px;
 }

 .step-bullet--started {
   border: 2px solid #c77e3e;
 }

 .step-bullet--waiting {
   border: 2px solid #c77e3e;
   /* TODO: pulse instead */
   background-color: #e7ce9e;
 }

 .step-bullet--completed {
   border: 2px solid #c77e3e;
   background-color: #c77e3e;
 }

 .step-bullet--future {
   border: 2px solid #e7ce9e;
   background-color: #e7ce9e;
 }

 .step-bullet--displayed:after {
   content: "^";
   position: relative;
   top: 5px;
   left: -2px;
   color: #c77e3e;
   font-weight: bold;
   font-family: monospace;
   font-size: 1.33em;
 }
</style>
