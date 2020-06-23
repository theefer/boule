<script>
 export let recipe;
</script>

<p>Mix:</p>

<ul>
  {#each recipe.leavenIngredients as ingredient}
    <li>
      {ingredient}
    </li>
  {/each}
</ul>
