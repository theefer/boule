import type { Recipe } from "../content/recipes";

export function getRecipeLink(recipe: Recipe) {
  return `/recipes/${recipe.id}`;
}

export function getRecipeFirstStepLink(recipe: Recipe) {
  return getRecipeStepLink(recipe, 1);
}

export function getRecipeStepLink(recipe: Recipe, stepId: number) {
  if (stepId < 1 || stepId > recipe.methodSteps.length) {
    return undefined;
  }

  const stepParam = `?step=${stepId}`;
  const recipeLink = getRecipeLink(recipe);
  return `${recipeLink}${stepParam}`;
}
