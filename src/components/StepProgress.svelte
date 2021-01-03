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

 @mixin bullet-border($color) {
   border: 2px solid $color;
 }

 @mixin bullet-fill($color) {
   background-color: $color;
 }

 @mixin bullet-light-border {
   @include bullet-border($secondary-color);
 }

 @mixin bullet-light-fill {
   @include bullet-fill($secondary-color);
 }

 @mixin bullet-strong-border {
   @include bullet-border($primary-color);
 }

 @mixin bullet-strong-fill {
   @include bullet-fill($primary-color);
 }

 .step-bullets {
   display: flex;
   flex-direction: column;
   align-items: center;
   gap: 8px;
   /* Vertical line joining bullets. */
   background: linear-gradient(
     90deg,
     rgba(0,0,0,0) calc(50% - 1px),
     $secondary-color calc(50% - 1px),
     $secondary-color calc(50% + 1px),
     rgba(0,0,0,0) calc(50% + 1px)
   );
 }

 .step-bullet {
   font-size: 0.88em;
   text-decoration: none;
   display: inline-block;
   width: 12px;
   height: 12px;
   border-radius: 12px;
   transition: width 0.2s ease, height 0.2s ease;
   // TODO: variable for page bg color
   @include bullet-fill(white);
 }

 .step-bullet--started {
   @include bullet-strong-border;
   @include bullet-strong-fill;
 }

 @keyframes pulse {
   0% { opacity: 1; }
   40% { opacity: 1; }
   50% { opacity: 0.2; }
   60% { opacity: 1; }
   100%   { opacity: 1; }
 }

 .step-bullet--waiting {
   @include bullet-strong-border;
   @include bullet-strong-fill;
   animation: 3s pulse infinite both ease;
 }

 .step-bullet--completed {
   @include bullet-light-border;
   @include bullet-light-fill;
 }

 .step-bullet--future {
   @include bullet-light-border;
 }

 .step-bullet--displayed {
   width: 20px;
   height: 20px;
 }
</style>
