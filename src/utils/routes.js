export function getRecipeLink(recipe) {
  return `/recipes/${recipe.id}`;
}

export function getRecipeStepLink(recipe, stepId) {
  if (stepId < 1 || stepId > recipe.methodSteps.length) {
    return undefined;
  }

  const stepParam = stepId === 1 ? '' : `?step=${stepId}`;
  const recipeLink = getRecipeLink(recipe);
  return `${recipeLink}${stepParam}`;
}
