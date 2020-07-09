<script>
 import { onMount } from 'svelte';
 import { writable, derived } from 'svelte/store';

 import Button from '@smui/button';
 import Switch from '@smui/switch';
 import FormField from '@smui/form-field';

 import ChooseRecipe from '../components/ChooseRecipe.svelte';

 import { clearNotifications, notifyOngoingStep, notifyWait } from '../utils/schedule';


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
   methodSteps: [
     {
       id: 2,
       title: 'Set the leaven',
       duration: range(hours(2), hours(4)),
       ingredients: [
         // TODO: as structured quantities to allow adapting quantities
         '30g sourdough starter',
         '15g strong white flour',
         '15g wholemeal flour',
         '40ml water at 30°C',
       ],
     },
     {
       id: 3,
       title: 'Mix in the flour and water',
       duration: exact(hours(1)),
       ingredients: [
         '100g leaven',
         '500g strong white flour',
         '400ml water at 30°C',
       ],
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
       duration: range(minutes(15), minutes(25)),
     },
     // bench rest
     {
       id: 9,
       title: 'Final shaping',
       duration: range(hours(1), hours(2)),
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

 const nextStep = derived(
   [ongoingStepId, methodSteps],
   ([$ongoingStepId, $methodSteps]) => {
     const nextIndex = $methodSteps.findIndex(step => step.id === $ongoingStepId) + 1;
     if (nextIndex < $methodSteps.length) {
       return $methodSteps[nextIndex];
     }
 });

 const currentWait = derived([ongoingStep, nextStep, progress], ([$ongoingStep, $nextStep, $progress]) => {
   const startWaitTime = $ongoingStep && $progress[$ongoingStep.id] && $progress[$ongoingStep.id].startWaitTime;
   // TODO: keep range if time range
   const endWaitTime = startWaitTime && $ongoingStep && addMinDuration(startWaitTime, $ongoingStep.duration);
   return $ongoingStep && startWaitTime && {
     step: $ongoingStep,
     nextStep: $nextStep,
     duration: $ongoingStep.duration,
     startWaitTime,
     endWaitTime,
   };
 });

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
         delayWait(minutes(10));
         // TODO: add more wait time
       }
     }
   });

   derived([ongoingStep, progress, alarmEnabled, currentWait],
           ([ongoingStep, progress, alarmEnabled, currentWait]) => ({ongoingStep, progress, alarmEnabled, currentWait}))
     .subscribe(({ongoingStep, progress, alarmEnabled, currentWait}) => {
       if (alarmEnabled) {
         if (isStartedStep(progress, ongoingStep)) {
           notifyOngoingStep(ongoingStep);
         } else if (isWaitingStep(progress, ongoingStep)) {
           notifyWait(currentWait);
         }
       } else {
         clearNotifications('step');
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

   // Go to current step
   displayedStepId.set($ongoingStepId);
 }

 function delayWait(delayMillis) {
   progress.update($progress => {
     return {
       ...$progress,
       [$ongoingStepId]: {
         ...$progress[$ongoingStepId] || {
         },
         // TODO: take this into account when computing end time
         extraDelay: delayMillis,
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
                           on:change={(ev) => toggleAlarm(ev.target.checked)}/>
            <span slot="label">Track progress with notifications</span>
          </FormField>
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

  {#if $displayedStep.ingredients}
    <!-- TODO: custom ingredients instruction -->
    <p>Mix:</p>
    <ul>
      {#each $displayedStep.ingredients as ingredient}
        <li>
          {ingredient}
        </li>
      {/each}
    </ul>
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

  <div class="options">
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
  </div>

  <footer>
    <div>App made by <a href="https://inso.cc">Sébastien Cevey</a></div>
    <div>Logo made by <a href="http://www.freepik.com/" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">flaticon.com</a></div>
  </footer>
{/if}

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

 .options {
   margin-top: 20px;
 }
</style>
