import { derived, get } from 'svelte/store';

import { RECIPES, RecipeStep, Recipe } from '../content/recipes';
import { isReady, addMinDuration } from '../utils/duration';
import type { Duration } from '../content/duration';

import { withLocalStorage, OBJECT, BOOLEAN, STRING } from './persistence';
import type { Quantity } from '../content/quantity';

export interface Progress {
  readonly [stepId: number]: StepProgress;
}

export interface StepProgress {
  readonly startTime: Date;
  readonly endWaitTime?: Date;
  readonly startWaitTime?: Date;
  readonly extraDelay?: Duration;
}

export interface ProgressWait {
  readonly step: RecipeStep;
  readonly nextStep?: RecipeStep;
  readonly duration: Quantity<Duration>;
  readonly startWaitTime: Date;
  readonly endWaitTime?: Date;
}

type Mapper<T> = (v: T) => T;


import { stores } from '@sapper/app';
import type { Page } from '@sapper/common';

function lookupRecipe(recipeId: string): Recipe | undefined {
  return RECIPES.find(r => r.id === recipeId);
}

// TODO(!!): upon deserialization, parse dates back into date objects
export function init() {
  const { page } = stores();

  const displayedRecipeId = derived(page, ($page: Page) => {
    if ($page.path?.startsWith('/recipes/')) {
      const recipeId = $page.params.id;
      return recipeId;
    } else {
      return undefined;
    }
  });
  // TODO: use Option#map?
  const displayedRecipe = derived(
    displayedRecipeId,
    recipeId => recipeId ? lookupRecipe(recipeId) : undefined);

  // TODO: group both into one? or at least manage consistency
  const bakingRecipeId = withLocalStorage('sd:bakingRecipeId', '', STRING);
  const progress = withLocalStorage<Progress>('sd:progress', {}, OBJECT);
  const alarmEnabled = withLocalStorage('sd:alarmEnabled', true, BOOLEAN);

  const isBaking = derived(bakingRecipeId, recipeId => !!recipeId);
  const bakingRecipe = derived(bakingRecipeId, lookupRecipe);
  const bakingSteps = derived(bakingRecipe, recipe => recipe && recipe.methodSteps || []);

  const ongoingStep = derived(
    [progress, bakingSteps], ([$progress, $bakingSteps]) => {
      return $bakingSteps.find(step => {
        const ongoingStepProgress = $progress[step.id];
        return ongoingStepProgress &&
          ongoingStepProgress.startTime &&
          !ongoingStepProgress.endWaitTime &&
          (!ongoingStepProgress.startWaitTime ||
            !isReady(ongoingStepProgress.startWaitTime, step.duration));
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
    ([$ongoingStep, $nextStep, $progress]): ProgressWait | undefined => {
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

  const isStartedStep = derived([progress], ([$progress]) => (step: RecipeStep) => {
    const stepProgress = $progress[step.id];
    return stepProgress &&
      stepProgress.startTime &&
      !stepProgress.startWaitTime;
  });

  const isWaitingStep = derived([progress], ([$progress]) => (step: RecipeStep) => {
    const stepProgress = $progress[step.id];
    return stepProgress &&
      stepProgress.startTime &&
      !stepProgress.endWaitTime &&
      (stepProgress.startWaitTime &&
        !isReady(stepProgress.startWaitTime, step.duration));
  });

  const isCompletedStep =
    derived([progress], ([$progress]) => (step: RecipeStep) => {
      const stepProgress = $progress[step.id];
      return stepProgress &&
        stepProgress.startTime &&
        (stepProgress.endWaitTime ||
          (stepProgress.startWaitTime &&
            isReady(stepProgress.startWaitTime, step.duration)));
    });

  function startBaking(recipeId: string) {
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

  function updateStep(stepId: number, stepUpdater: Mapper<StepProgress>) {
    progress.update($progress => {
      const currentStep = $progress[stepId] || {};
      const updatedStep = stepUpdater(currentStep);
      return {
        ...$progress,
        [stepId]: updatedStep,
      };
    });
  }

  function updateOngoingStep(stepUpdater: Mapper<StepProgress>) {
    const $ongoingStepId = get(ongoingStepId);
    if ($ongoingStepId !== undefined) {
      updateStep($ongoingStepId, stepUpdater);
    }
  }

  function mergeIn<T>(objUpdate: Partial<T>): Mapper<T> {
    return currentObj => ({ ...currentObj, ...objUpdate });
  }

  function startWaitOngoingStep() {
    // Mark current step as wait starting.
    updateOngoingStep(mergeIn<StepProgress>({ startWaitTime: new Date() }));
    // TODO: mark any previous step endWaitTime if missing

    // TODO: Go to current step?
  }

  function finishWaitOngoingStep() {
    const $ongoingStepId = get(ongoingStepId);
    if ($ongoingStepId === undefined) {
      return;
    }

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

  function delayWait(delayMillis: number) {
    // TODO: instead add to current value
    // TODO: take this into account when computing end time
    updateOngoingStep(mergeIn<StepProgress>({ extraDelay: delayMillis }));
  }

  function toggleAlarm(enabled: boolean) {
    // TODO: check if has permission and browser supported, else flag
    alarmEnabled.set(enabled);
  }

  return {
    // Properties
    progress,
    isBaking,
    bakingRecipe,
    ongoingStep,
    ongoingStepId,
    nextStep,
    currentWait,
    alarmEnabled,
    // Routing state
    displayedRecipe,
    // Methods
    isStartedStep,
    isWaitingStep,
    isCompletedStep,
    // Actions
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

