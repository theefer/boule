<script>
 export let recipe;
</script>

<p>Mix:</p>

<ul>
  {#each recipe.mainIngredients as ingredient}
    <li>
      {ingredient}
    </li>
  {/each}
</ul>
