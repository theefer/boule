import { derived, get } from 'svelte/store';

import { RECIPES } from '../content/recipes';
import { getDurationMin, isReady, addMinDuration } from '../utils/duration';

import { withLocalStorage, OBJECT, BOOLEAN, STRING } from './persistence';

// TODO: upon deserialization, parse dates back into date objects
export function init() {
  // TODO: group both into one? or at least manage consistency
  const bakingRecipeId = withLocalStorage('sd:bakingRecipeId', '', STRING);
  const progress = withLocalStorage('sd:progress', {}, OBJECT);
  const alarmEnabled = withLocalStorage('sd:alarmEnabled', true, BOOLEAN);

  const isBaking = derived(bakingRecipeId, recipeId => !!recipeId);
  const bakingRecipe = derived(bakingRecipeId, recipeId => RECIPES.find(r => r.id === recipeId));
  const bakingSteps = derived(bakingRecipe, recipe => recipe && recipe.methodSteps || [] );

  const ongoingStep = derived(
    [progress, bakingSteps], ([$progress, $bakingSteps]) => {
      return $bakingSteps.find(step => {
        return $progress[step.id] &&
          $progress[step.id].startTime &&
          !$progress[step.id].endWaitTime &&
          (!$progress[step.id].startWaitTime ||
           !isReady($progress[step.id].startWaitTime, step.duration));
      });
    });

  const ongoingStepId = derived(ongoingStep, $ongoingStep => $ongoingStep && $ongoingStep.id);

  const nextStep = derived(
    [ongoingStepId, bakingSteps],
    ([$ongoingStepId, $bakingSteps]) => {
      const nextIndex = $bakingSteps.findIndex(step => step.id === $ongoingStepId) + 1;
      if (nextIndex < $bakingSteps.length) {
        return $bakingSteps[nextIndex];
      }
    });

  const currentWait = derived(
    [ongoingStep, nextStep, progress],
    ([$ongoingStep, $nextStep, $progress]) => {
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


  function startBaking(recipeId) {
    bakingRecipeId.set(recipeId);
    progress.set({
      // Mark first step as started
      1: {
        startTime: new Date(),
      },
    });
  }

  function stopBaking() {
    bakingRecipeId.set('');
    progress.set({
    });
  }

  function updateStep(stepId, stepUpdater) {
    progress.update($progress => {
      const currentStep = $progress[stepId] || {};
      const updatedStep = stepUpdater(currentStep);
      return {
        ...$progress,
        [stepId]: updatedStep,
      };
    });
  }

  function updateOngoingStep(stepUpdater) {
    const $ongoingStepId = get(ongoingStepId);
    updateStep($ongoingStepId, stepUpdater);
  }

  function mergeIn(objUpdate) {
    return currentObj => ({...currentObj, ...objUpdate});
  }

  function startWaitOngoingStep() {
    // Mark current step as wait starting.
    updateOngoingStep(mergeIn({startWaitTime: new Date()}));
    // TODO: mark any previous step endWaitTime if missing

    // TODO: Go to current step?
  }

  function finishWaitOngoingStep() {
    const $ongoingStepId = get(ongoingStepId);

    const now = new Date();

    // Mark current step as done waiting.
    progress.update($progress => {
      return {
        ...$progress,
        [$ongoingStepId]: {
          ...$progress[$ongoingStepId] || {
          },
          endWaitTime: now,
        },
        // TODO: cleaner mark any next step startTime if missing
        // TODO: should also be set upon duration elapsing?
        [$ongoingStepId + 1]: {
          ...$progress[$ongoingStepId + 1] || {
          },
          startTime: now,
        },
      };
    });

    // TODO: Go to current step?
  }

  function delayWait(delayMillis) {
    // TODO: instead add to current value
    // TODO: take this into account when computing end time
    updateOngoingStep(mergeIn({extraDelay: delayMillis}));
  }

  function toggleAlarm(enabled) {
    // TODO: check if has permission and browser supported, else flag
    alarmEnabled.set(enabled);
  }

  return {
    progress,
    isBaking,
    ongoingStep,
    ongoingStepId,
    nextStep,
    currentWait,
    alarmEnabled,
    actions: {
      startBaking,
      stopBaking,
      startWaitOngoingStep,
      finishWaitOngoingStep,
      delayWait,
      toggleAlarm,
    },
  };
}

