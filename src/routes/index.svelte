<script lang="ts">
 import ChooseRecipe from '../components/ChooseRecipe.svelte';

 import {RECIPES} from '../content/recipes';
</script>

<style type="text/scss">
 @import "../theme/fonts";
 @import "../theme/colors";

 footer {
   margin-top: 40px;
   text-align: center;
   font-size: $font-size-tiny;
   color: $foreground-color-faint;
 }
</style>

<ChooseRecipe recipes={RECIPES}></ChooseRecipe>
