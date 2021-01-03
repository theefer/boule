<script lang="ts">
 import { onMount, getContext } from 'svelte';
 import { derived } from 'svelte/store';
 import { goto } from '@sapper/app';

 import { minutes } from '../content/duration';
 import { isReady } from '../utils/duration';
 import { clearNotifications, notifyOngoingStep, notifyWait } from '../utils/schedule';
 import { getRecipeStepLink } from '../utils/routes';

 import Button from './Button.svelte';
 import StepProgress from './StepProgress.svelte';
 import Toggle from './Toggle.svelte';

 export let recipe: Recipe;
 export let displayedStepId: number;

 const { progress, alarmEnabled, isBaking, ongoingStep, ongoingStepId, currentWait, isStartedStep, isWaitingStep, actions } = getContext('state');

 $: methodSteps = recipe.methodSteps || [];
 $: displayedStep = methodSteps.find(s => s.id === displayedStepId);

 onMount(() => {
   // TODO: handle notification actions
   navigator.serviceWorker.addEventListener('message', function(event) {
     console.log('got message', event.data)
     if (event.data.type === 'notification-action') {
       if (event.data.action === 'done') {
         startWaitOngoingStep();
       } else if (event.data.action === 'next') {
         finishWaitOngoingStep();
       } else if (event.data.action === 'snooze') {
         delayWaitOngoingStep();
       }
     }
   });

   derived([ongoingStep, progress, alarmEnabled, currentWait, isBaking],
           ([ongoingStep, progress, alarmEnabled, currentWait, isBaking]) => ({ongoingStep, progress, alarmEnabled, currentWait, isBaking}))
   .subscribe(({ongoingStep, progress, alarmEnabled, currentWait, isBaking}) => {
     if (alarmEnabled) {
       if (isBaking && ongoingStep) {
         if ($isStartedStep(ongoingStep)) {
           notifyOngoingStep(ongoingStep);
         } else if ($isWaitingStep(ongoingStep)) {
           notifyWait(currentWait);
         }
       }
     } else {
       clearNotifications('step');
     }
   });
 });

 function displayStep(stepId) {
   goto(getStepLink(stepId));
 }

 function startWaitOngoingStep() {
   actions.startWaitOngoingStep();

   // Go to current (next) step
   displayStep($ongoingStepId);
 }

 function finishWaitOngoingStep() {
   actions.finishWaitOngoingStep();

   // Go to current step
   displayStep($ongoingStepId);
 }

 function delayWaitOngoingStep() {
   actions.delayWait(minutes(10));
   // TODO: add more wait time
 }


 // TODO: as components
 const formatter = new Intl.DateTimeFormat('en-GB', {timeStyle: 'short'});
 function formatTime(date) {
   return formatter.format(date);
 }

 function formatDurationValue(durationValue) {
   // TODO: smarter heuristic using different units.
   const min = durationValue / (60 * 1000);
   return `${min}’`;
 }

 function durationStr(duration) {
   return duration.type === 'exact' ?
          formatDurationValue(duration.value) :
          `${formatDurationValue(duration.min)}-${formatDurationValue(duration.max)}`;
 }

 function getStepLink(stepId) {
   return getRecipeStepLink(recipe, stepId);
 }

 $: prevStepLink = getStepLink(displayedStepId - 1);
 $: nextStepLink = getStepLink(displayedStepId + 1);

 let hasTriggers = false;

 onMount(async () => {
   if ("showTrigger" in Notification.prototype) {
     /* Notification Triggers supported */
     hasTriggers = true;
   } else {
     actions.toggleAlarm(false);
   }
 })
</script>


{#if $currentWait}
  <aside class="current-wait">
    <div class="current-wait-main">
      <div class="current-wait-description">
        <strong>{$ongoingStep.title}</strong>

        <!-- TODO: show time range -->
        <p>Wait {durationStr($currentWait.duration)} until {formatTime($currentWait.endWaitTime)}</p>
      </div>

      <div class="current-wait-actions">
        <!-- TODO(!!): filled variant -->
        <Button on:click={finishWaitOngoingStep}>Start next step</Button>
      </div>
    </div>

    <!-- TODO: show remaining time before this step (editable) -->
    <!-- TODO: show ETA of last step being done -->

    {#if hasTriggers}
      <div>
        <Toggle
          checked={$alarmEnabled}
          on:change={(ev) => actions.toggleAlarm(ev.detail)}
        >
          Track progress with notifications
        </Toggle>
      </div>
    {:else}
      <p>
        Scheduled notifications not supported in your browser, so we won't
        be able to notify you when you need to take the next step.
      </p>
    {/if}
  </aside>
{/if}

<aside class="progress">
  {#if ! $isBaking}
    <!-- TODO: show recipe name -->
    <div class="start-baking">
      <Button on:click={() => actions.startBaking(recipe.id)}>
        Start baking
      </Button>
    </div>
  {/if}

  <StepProgress
    recipe={recipe}
           displayedStep={displayedStep}
  >
  </StepProgress>
</aside>

<h2>{displayedStep.title}</h2>

{#if displayedStep.ingredients}
  <!-- TODO: custom ingredients instruction -->
  <p>Mix:</p>
  <ul>
    {#each displayedStep.ingredients as ingredient}
      <li>
        {ingredient}
      </li>
    {/each}
  </ul>
{/if}

<!-- TODO(!!!!): DEBUG why not the same - same recipe? -->
{#if $ongoingStep && displayedStep.id === $ongoingStep.id && $isStartedStep(displayedStep)}
  <div class="step-actions">
    <!-- TODO(!!): filled variant -->
    <Button on:click={startWaitOngoingStep}>Done</Button>
  </div>
{/if}

<nav>
  {#if prevStepLink}
    <a href="{prevStepLink}">
      &larr; View previous step
    </a>
  {:else}
    <span></span>
  {/if}
  {#if nextStepLink}
    <a href="{nextStepLink}">
      View next step &rarr;
    </a>
  {:else}
    <span></span>
  {/if}
</nav>

<style type="text/scss">
 @import "../theme/colors";

 @mixin bullet-list {
   margin-left: 20px;

   li {
     list-style-type: disc;
   }
 }

 .current-wait {
   border-left: 10px solid $primary-color;
   background-color: #f7f0de;
   padding: 10px;
   margin-bottom: 20px;
 }

 nav {
   display: flex;
   flex-direction: row;
   justify-content: space-between;
   margin-top: 10px;
 }

 h2 {
   margin-top: 1em;
 }

 ul {
   @include bullet-list;
 }

 .current-wait-main {
   display: flex;
   flex-direction: row;
 }

 .current-wait-description {
   flex: 1;
 }

 .step-actions {
   text-align: center;
 }

 .progress {
   float: right;
   display: flex;
   flex-direction: column;
   align-items: flex-end;
   gap: 1em;
 }
</style>
