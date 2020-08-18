<script lang="ts">
 import ChooseRecipe from '../components/ChooseRecipe.svelte';

 import {RECIPES} from '../content/recipes';
</script>

<style>
 footer {
   margin-top: 40px;
   text-align: center;
   font-size: 12px;
   color: #bbb;
 }
</style>

<ChooseRecipe recipes={RECIPES}></ChooseRecipe>

<footer>
  <div>App made by <a href="https://inso.cc">Sébastien Cevey</a></div>
  <div>Logo made by <a href="http://www.freepik.com/" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">flaticon.com</a></div>
</footer>
