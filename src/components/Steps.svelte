<script>
 import { onMount } from 'svelte';
 import { writable, derived } from 'svelte/store';

 import Button from '@smui/button';
 import Switch from '@smui/switch';
 import FormField from '@smui/form-field';

 import ChooseRecipe from '../components/ChooseRecipe.svelte';
 import Step2 from '../components/Step2.svelte';
 import Step3 from '../components/Step3.svelte';
 import Step4 from '../components/Step4.svelte';
 import Step5 from '../components/Step5.svelte';
 import Step6 from '../components/Step6.svelte';
 import Step7 from '../components/Step7.svelte';

 import { createScheduledNotification, clearScheduledNotification } from '../utils/schedule';


 function range(min, max) {
   return {
     type: 'range',
     min,
     max,
   };
 }

 function exact(value) {
   return {
     type: 'exact',
     value,
   };
 }

 function hours(n) {
   return minutes(n * 60);
 }

 function minutes(n) {
   return seconds(n * 60);
 }

 function seconds(n) {
   return n * 1000;
 }

 function getDurationMin(duration) {
   return duration.type === 'range' ? duration.min : duration.value;
 }

 function isReady(startTime, duration) {
   const minDuration = getDurationMin(duration);
   const now = new Date();
   return now - startTime > minDuration;
 }

 function addMinDuration(startTime, duration) {
   const minDuration = getDurationMin(duration);
   const d = new Date(startTime);
   d.setMilliseconds(d.getMilliseconds() + minDuration);
   return d;
 }

 let RECIPES = [{
   id: 'pain-de-campagne',
   name: 'Pain de campagne',
   leavenIngredients: [
     // TODO: as structured quantities to allow adapting quantities
     '30g sourdough starter',
     '15g strong white flour',
     '15g wholemeal flour',
     '40ml water at 30°C',
   ],
   mainIngredients: [
     '100g leaven',
     '500g strong white flour',
     '400ml water at 30°C',
   ],
   // TODO: auto define UI steps from this
   methodSteps: [
     {
       id: 2,
       title: 'Set the leaven',
       duration: range(hours(2), hours(4)),
     },
     {
       id: 3,
       title: 'Mix in the flour and water',
       duration: exact(hours(1)),
     },
     {
       id: 4,
       title: 'Pinch in the salt',
       duration: exact(minutes(30)),
     },
     {
       id: 5,
       title: 'First fold',
       duration: exact(minutes(30)),
     },
     {
       id: 6,
       title: 'Second fold',
       duration: exact(minutes(30)),
     },
     {
       id: 7,
       title: 'Third fold',
       duration: exact(minutes(90)),
     },
     {
       id: 8,
       title: 'First shaping',
       duration: exact(minutes(90)),
     },
     // bench rest
     {
       id: 9,
       title: 'Final shaping',
       duration: exact(minutes(90)),
     },
     // basket proving
     {
       id: 10,
       title: 'Cold proving',
       duration: range(hours(12), hours(36)),
     },
     {
       id: 11,
       title: 'Baking',
       // TODO: 2x 20 minutes
       duration: exact(minutes(40)),
     },
   ],
 }];

 const NUMBER = {
   deserialize: (s) => Number(s),
   serialize: (n) => String(n),
 };

 const STRING = {
   deserialize: (s) => s,
   serialize: (s) => s,
 };

 const OBJECT = {
   deserialize: (s) => JSON.parse(s),
   serialize: (o) => JSON.stringify(o),
 };

 const BOOLEAN = {
   deserialize: (s) => s === "true",
   serialize: (b) => String(b),
 };

 function withLocalStorage(key, defaultValue, serialization) {
   const v = writable(defaultValue);

   onMount(() => {
     // TODO: parse JSON?
     const localStorageValue = localStorage[key];
     const initialValue = localStorageValue != null ? serialization.deserialize(localStorageValue) : defaultValue;
     v.set(initialValue);
     v.subscribe($v => {
       localStorage[key] = $v != null ? serialization.serialize($v) : $v;
     });
   });

   return v;
 }

 // TODO: server-side rendering has no localStorage
 const displayedStepId = withLocalStorage('sd:displayedStepId', undefined, NUMBER);
 const recipeId = withLocalStorage('sd:recipeId', undefined, STRING);
 const progress = withLocalStorage('sd:progress', {}, OBJECT);
 const alarmEnabled = withLocalStorage('sd:alarmEnabled', true, BOOLEAN);

 const recipe = derived(recipeId, id => RECIPES.find(r => r.id === id));

 const methodSteps = derived(recipe, $recipe => $recipe && $recipe.methodSteps || []);

 const displayedStep = derived(
   [displayedStepId, methodSteps],
   ([$displayedStepId, $methodSteps]) =>
     $methodSteps.find(s => s.id === $displayedStepId)
 );

 const ongoingStep = derived(
   [methodSteps, progress], ([$methodSteps, $progress]) => {
     return $methodSteps.find(step => {
       return $progress[step.id] &&
              $progress[step.id].startTime &&
              !$progress[step.id].endWaitTime &&
              (!$progress[step.id].startWaitTime ||
               !isReady($progress[step.id].startWaitTime, step.duration));
     });
 });

 const ongoingStepId = derived(
   ongoingStep,
   $ongoingStep => $ongoingStep && $ongoingStep.id
 );

 const currentWait = derived([ongoingStep, progress], ([$ongoingStep, $progress]) => {
   const startWaitTime = $ongoingStep && $progress[$ongoingStep.id] && $progress[$ongoingStep.id].startWaitTime;
   const endWaitTime = startWaitTime && $ongoingStep && addMinDuration(startWaitTime, $ongoingStep.duration);
   return $ongoingStep && startWaitTime && {
     step: $ongoingStep.id,
     duration: $ongoingStep.duration,
     startWaitTime,
     endWaitTime,
   };
 });

 const currentAlarm = derived(
   [alarmEnabled, currentWait],
   ([$alarmEnabled, $currentWait]) => {
     return $alarmEnabled && $currentWait;
   }
 );
 
 onMount(() => {
   currentAlarm.subscribe($currentAlarm => {
     if ($currentAlarm) {
       // TODO: NEXT step!
       const title = $ongoingStep.title.replace(/^(.)/, letter => letter.toLowerCase());
       createScheduledNotification('step', `Time to ‘${title}’`, $currentAlarm.endWaitTime);
     } else {
       clearScheduledNotification('step');
     }
   });
 });
 

 function viewNextStep() {
   displayedStepId.update(s => s + 1);
 }

 function viewPrevStep() {
   displayedStepId.update(s => s - 1);
 }

 function displayStep(step) {
   displayedStepId.set(step.id);
 }

 function startWaitOngoingStep() {
   // Mark current step as wait starting.
   progress.update($progress => {
     return {
       ...$progress,
       [$ongoingStepId]: {
         ...$progress[$ongoingStepId] || {
         },
         startWaitTime: new Date(),
       },
     };
   });
   // TODO: mark any previous step endWaitTime if missing

   viewNextStep();
 }

 function finishWaitOngoingStep() {
   // Mark current step as done waiting.
   progress.update($progress => {
     return {
       ...$progress,
       [$ongoingStepId]: {
         ...$progress[$ongoingStepId] || {
         },
         endWaitTime: new Date(),
       },
       // TODO: cleaner mark any next step startTime if missing
       // TODO: should also be set upon duration elapsing?
       [$ongoingStepId + 1]: {
         ...$progress[$ongoingStepId + 1] || {
         },
         startTime: new Date(),
       },
     };
   });
 }
 
 
 function firstStep() {
   // TODO: start at 1
   displayedStepId.set(2);

   progress.set({
     // TODO: ongoing step?
     [$displayedStepId]: {
       startTime: new Date(),
     },
   });
 }

 function chooseRecipe(event) {
   const id = event.detail;
   recipeId.set(id);

   firstStep();
 }

 function toggleAlarm(enabled) {
   // TODO: check if has permission and browser supported, else flag
   alarmEnabled.set(enabled);
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
   return $progress[step.id] &&
          $progress[step.id].startTime &&
          ($progress[step.id].endWaitTime ||
           ($progress[step.id].startWaitTime &&
            isReady($progress[step.id].startWaitTime, step.duration)));
 }

 function isStartedStep($progress, step) {
   return $progress[step.id] &&
          $progress[step.id].startTime &&
          !$progress[step.id].startWaitTime;
 }

 function isWaitingStep($progress, step) {
   return $progress[step.id] &&
          $progress[step.id].startTime &&
          !$progress[step.id].endWaitTime &&
          ($progress[step.id].startWaitTime &&
           !isReady($progress[step.id].startWaitTime, step.duration));
 }


 let hasTriggers = false;

 onMount(async () => {
   if ("showTrigger" in Notification.prototype) {
     /* Notification Triggers supported */
     hasTriggers = true;
   } else {
     toggleAlarm(false);
   }
 })
</script>

{#if $displayedStep}
  {#if $currentWait}
    <aside>
      <div class="current-wait-main">
        <div class="current-wait-description">
          <strong>{$ongoingStep.title}</strong>

          <!-- TODO: show time range -->
          <p>Wait {durationStr($currentWait.duration)} until {formatTime($currentWait.endWaitTime)}</p>
        </div>

        <div class="current-wait-actions">
          <Button variant="unelevated" on:click={finishWaitOngoingStep}>Done</Button>
        </div>
      </div>

      <!-- TODO: show remaining time before this step (editable) -->
      <!-- TODO: show ETA of last step being done -->

      {#if hasTriggers}
        <div>
          <label>
            <input type="checkbox"
                   bind:checked={$alarmEnabled}
                         on:input={(ev) => toggleAlarm(ev.target.checked)}
            >
            Notify me
          </label>
        </div>
      {/if}
    </aside>
  {/if}

  <ol class="step-bullets">
    {#each $methodSteps as step}
      <!-- TODO: proper link -->
      <li class="step-bullet"
          class:step-bullet--displayed="{step == $displayedStep}"
          class:step-bullet--started="{isStartedStep($progress, step)}"
          class:step-bullet--waiting="{isWaitingStep($progress, step)}"
          class:step-bullet--completed="{isCompletedStep($progress, step)}"
          class:step-bullet--future="{!isStartedStep($progress, step) && !isWaitingStep($progress, step) && !isCompletedStep($progress, step)}"
          on:click="{displayStep(step)}"
      >
      </li>
    {/each}
  </ol>

  <h2>{$displayedStep.title}</h2>

  {#if $displayedStepId == 2}
    <Step2 recipe={$recipe}></Step2>
  {:else if $displayedStepId == 3}
    <Step3 recipe={$recipe}></Step3>
  {:else if $displayedStepId == 4}
    <Step4></Step4>
  {:else if $displayedStepId == 5}
    <Step5></Step5>
  {:else if $displayedStepId == 6}
    <Step6></Step6>
  {:else if $displayedStepId == 7}
    <Step7></Step7>
  {:else if $displayedStepId == 8}
    <!-- TODO: more steps -->
  {/if}

  {#if $displayedStep === $ongoingStep && isStartedStep($progress, $displayedStep)}
    <div class="step-actions">
      <Button variant="unelevated" on:click={startWaitOngoingStep}>Done</Button>
    </div>
  {/if}

  <nav>
    <!-- TODO: cleaner real links -->
    <button class="button-link" on:click={viewPrevStep}>&larr; View previous step</button>
    <button class="button-link" on:click={viewNextStep}>View next step &rarr;</button>
  </nav>
{:else}
  <ChooseRecipe recipes={RECIPES} on:chooseRecipe={chooseRecipe}></ChooseRecipe>

  {#if hasTriggers}
    <FormField>
      <Switch
        bind:checked={$alarmEnabled}
                     on:change={(ev) => toggleAlarm(ev.target.checked)}/>
      <span slot="label">Track progress with notifications</span>
    </FormField>
  {:else}
    <p>
      Scheduled notifications not supported in your browser, so we won't
      be able to notify you when you need to take the next step.
    </p>
  {/if}

  <footer>
    <div>App made by <a href="https://inso.cc">Sébastien Cevey</a></div>
    <div>Logo made by <a href="http://www.freepik.com/" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">flaticon.com</a></div>
  </footer>
{/if}

<style>
 aside {
   border-left: 10px solid #c77e3e;
   background-color: #e7ce9e;
   padding: 10px;
   margin-bottom: 10px;
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

 .button-link {
   font-family: inherit;
   color: inherit;
   background: none;
   border: none;
   padding: 0;
   margin: 0;
   text-decoration: underline;
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

 footer {
   margin-top: 40px;
   text-align: center;
   font-size: 12px;
   color: #bbb;
 }
</style>
