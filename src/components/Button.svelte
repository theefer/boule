<style>
 button {
   font-family: inherit;
   font-size: 1em;
   padding: 0.3em 1em;
   color: #c77e3e;
   border: 1px solid #c77e3e;
   border-radius: 5px;
   background: none;
   cursor: pointer;
 }

 button:hover {
   background-color: #ffeedf;
 }
</style>

<button on:click>
  <slot></slot>
</button>
