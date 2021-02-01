<script lang="ts">
 import { getContext } from 'svelte';
 import { fade } from 'svelte/transition';

 import { getRecipeStepLink } from '../utils/routes';

 const { progress, isStartedStep, isWaitingStep, isCompletedStep } = getContext('state');

 export let recipe: Recipe;
 export let displayedStep: RecipeStep;

 let hovering: boolean;

 // TODO: expose on state
 $: steps = recipe.methodSteps || [];

 $: prevStepLink = getStepLink(displayedStep.id - 1);
 $: nextStepLink = getStepLink(displayedStep.id + 1);

 let timeout: number;

 function setHovering(isOver: boolean) {
   if (timeout) {
     clearTimeout(timeout);
   }

   if (isOver) {
     hovering = true;
   } else {
     // Delay to avoid flicker when hovering in/out.
     timeout = setTimeout(() => {
       hovering = false;
     }, 1000);
   }
 }

 // TODO: share
 function getStepLink(stepId) {
   return getRecipeStepLink(recipe, stepId);
 }
</script>

<div
  class="step-progress"
  on:mouseenter="{() => setHovering(true)}"
  on:mouseleave="{() => setHovering(false)}">
  <div class="prev-next-nav">
    <!-- TODO: don't show a link when it isn't one -->
    <a href="{prevStepLink}"
       class="prev-next-arrow"
       aria-hidden="{prevStepLink ? 'false' : 'true'}">
      &uarr;
    </a>
  </div>

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
        {#if hovering}
          <span
            class="step-title"
            transition:fade="{{ duration: 200 }}"
          >
            {step.title}
          </span>
        {/if}
      </a>
    {/each}
  </ol>

  <div class="prev-next-nav">
    <!-- TODO: don't show a link when it isn't one -->
    <a href="{nextStepLink}"
       class="prev-next-arrow"
       aria-hidden="{nextStepLink ? 'false' : 'true'}">
      &darr;
    </a>
  </div>
</div>

<style type="text/scss">
 @import "../theme/colors";

 $animation-duration: 0.2s;

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

 .step-progress {
   display: flex;
   flex-direction: column;
   align-items: center;
 }

 .prev-next-arrow {
   color: $primary-color;
   text-decoration: none;
   font-size: 24px;
   transition: opacity $animation-duration ease;
   opacity: 1;
 }
 .prev-next-arrow[aria-hidden="true"] {
   opacity: 0;
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
   display: inline-flex;
   justify-content: flex-end;
   width: 12px;
   height: 12px;
   border-radius: 12px;
   transition: width $animation-duration ease, height $animation-duration ease;
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

 .step-title {
   margin-right: 20px;
   margin-top: -5px;
   white-space: nowrap;
   text-align: right;
   color: $primary-color;

   transition: margin $animation-duration ease;

   .step-bullet--displayed & {
     margin-right: 30px;
     margin-top: -1px;
   }
 }
</style>
