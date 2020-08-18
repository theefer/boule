<script lang="ts">
 import { onMount, getContext } from 'svelte';
 import { derived } from 'svelte/store';
 import { goto } from '@sapper/app';

 import Button from '@smui/button';
 import Switch from '@smui/switch';
 import FormField from '@smui/form-field';

 import { isReady } from '../utils/duration';
 import { clearNotifications, notifyOngoingStep, notifyWait } from '../utils/schedule';
 import { getRecipeStepLink } from '../utils/routes';

 export let recipe: Recipe;
 export let displayedStepId: number;

 const { progress, alarmEnabled, isBaking, ongoingStep, ongoingStepId, currentWait, actions } = getContext('state');

 const methodSteps = recipe.methodSteps || [];

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
         actions.delayWait(minutes(10));
         // TODO: add more wait time
       }
     }
   });

   derived([ongoingStep, progress, alarmEnabled, currentWait, isBaking],
           ([ongoingStep, progress, alarmEnabled, currentWait, isBaking]) => ({ongoingStep, progress, alarmEnabled, currentWait, isBaking}))
   .subscribe(({ongoingStep, progress, alarmEnabled, currentWait, isBaking}) => {
     if (alarmEnabled) {
       if (isBaking && ongoingStep) {
         if (isStartedStep(progress, ongoingStep)) {
           notifyOngoingStep(ongoingStep);
         } else if (isWaitingStep(progress, ongoingStep)) {
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

 function isCompletedStep($progress, step) {
   const stepProgress = $progress[step.id];
   return stepProgress &&
          stepProgress.startTime &&
          (stepProgress.endWaitTime ||
           (stepProgress.startWaitTime &&
            isReady($progress[step.id].startWaitTime, step.duration)));
 }

 function isStartedStep($progress, step) {
   const stepProgress = $progress[step.id];
   return stepProgress &&
          stepProgress.startTime &&
          !stepProgress.startWaitTime;
 }

 function isWaitingStep($progress, step) {
   const stepProgress = $progress[step.id];
   return stepProgress &&
          stepProgress.startTime &&
          !stepProgress.endWaitTime &&
          (stepProgress.startWaitTime &&
           !isReady(stepProgress.startWaitTime, step.duration));
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
  <aside>
    <div class="current-wait-main">
      <div class="current-wait-description">
        <strong>{$ongoingStep.title}</strong>

        <!-- TODO: show time range -->
        <p>Wait {durationStr($currentWait.duration)} until {formatTime($currentWait.endWaitTime)}</p>
      </div>

      <div class="current-wait-actions">
        <Button variant="unelevated" on:click={finishWaitOngoingStep}>Start next step</Button>
      </div>
    </div>

    <!-- TODO: show remaining time before this step (editable) -->
    <!-- TODO: show ETA of last step being done -->

    {#if hasTriggers}
      <div>
        <FormField>
          <Switch
            bind:checked={$alarmEnabled}
                         on:change={(ev) => actions.toggleAlarm(ev.target.checked)}/>
          <span slot="label">Track progress with notifications</span>
        </FormField>
      </div>
    {:else}
      <p>
        Scheduled notifications not supported in your browser, so we won't
        be able to notify you when you need to take the next step.
      </p>
    {/if}
  </aside>
{/if}

{#if ! $isBaking}
  <Button variant="outlined" on:click={() => actions.startBaking(recipe.id)}>
    Start baking
  </Button>
{/if}

<ol class="step-bullets">
  {#each methodSteps as step}
    <a href="{getStepLink(step.id)}"
       class="step-bullet"
       class:step-bullet--displayed="{step == displayedStep}"
       class:step-bullet--started="{isStartedStep($progress, step)}"
       class:step-bullet--waiting="{isWaitingStep($progress, step)}"
       class:step-bullet--completed="{isCompletedStep($progress, step)}"
       class:step-bullet--future="{!isStartedStep($progress, step) && !isWaitingStep($progress, step) && !isCompletedStep($progress, step)}"
    >
    </a>
  {/each}
</ol>

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

<!-- TODO(!!!!): DEBUG why not the same -->
{#if $ongoingStep && displayedStep.id === $ongoingStep.id && isStartedStep($progress, displayedStep)}
  <div class="step-actions">
    <Button variant="unelevated" on:click={startWaitOngoingStep}>Done</Button>
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

<style>
 aside {
   border-left: 10px solid #c77e3e;
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
