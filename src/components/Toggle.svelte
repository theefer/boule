<script lang="ts">
 import { createEventDispatcher } from 'svelte';

 export let checked: boolean;

 const dispatch = createEventDispatcher();

 function change(checked: boolean) {
   dispatch('change', checked);
 }
</script>

<style>
 .container {
   display: flex;
   flex-direction: row;
   gap: 10px;
 }
 .slider {
   width: 80px;
   height: 26px;
   background: #333;
   position: relative;
   border-radius: 50px;
   box-shadow: inset 0px 1px 1px rgba(0,0,0,0.5), 0px 1px 0px rgba(255,255,255,0.2);
 }
 .slider:after {
   content: 'OFF';
   color: #000;
   position: absolute;
   right: 10px;
   z-index: 0;
   font: 12px/26px Arial, sans-serif;
   font-weight: bold;
   text-shadow: 1px 1px 0px rgba(255,255,255,.15);
 }
 .slider:before {
   content: 'ON';
   color: green;
   position: absolute;
   left: 10px;
   z-index: 0;
   font: 12px/26px Arial, sans-serif;
   font-weight: bold;
 }
 .nub {
   display: block;
   width: 34px;
   height: 20px;
   cursor: pointer;
   position: absolute;
   top: 3px;
   left: 3px;
   z-index: 1;
   background: #fcfff4;
   background: linear-gradient(top, #fcfff4 0%, #dfe5d7 40%, #b3bead 100%);
   border-radius: 50px;
   transition: all 0.2s ease;
   box-shadow: 0px 2px 5px 0px rgba(0,0,0,0.3);
 }
 input[type=checkbox] {
   visibility: hidden;
 }
 input[type=checkbox]:checked + .nub {
   left: 43px;
 }
</style>

<div class="container">
  <div class="slider" on:click={change(!checked)}>
    <input
      type="checkbox"
      value="None"
      id="slider"
      name="check"
      bind:checked={checked}
      on:change={(ev) => change(ev.target.checked)} />
    <div class="nub"></div>
  </div>
  <label for="slider"><slot></slot></label>
</div>
