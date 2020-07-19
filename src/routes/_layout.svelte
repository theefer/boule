<!-- <style lang="sass"> -->
<style>
 main {
   position: relative;
   max-width: 44em;
   background-color: white;
   padding: 0 1em;
   margin: 0 auto;
   box-sizing: border-box;
 }

 /* $header-border-color: #ccc;
  */
 header {
   max-width: 44em;
   /* border-bottom: 1px solid $header-border-color; */
   border-bottom: 1px solid #eee;
   padding: 10px 1em;
   margin: 0 auto 10px;
 }

 aside {
   border-top: 10px solid #c77e3e;
   background-color: #f7f0de;
   max-width: 40em;
   padding: 5px 10px;
   margin: 0 auto;
   position: absolute;
   left: 0;
   right: 0;
   bottom: 0;
 }
 /* TODO: if present, add bottom margin to main */

 footer {
   margin-top: 40px;
   text-align: center;
   font-size: 12px;
   color: #bbb;
 }

 .current-label {
   font-size: 0.66em;
   text-transform: uppercase;
 }

 .header-line {
   display: flex;
   text-decoration: none;
 }

 .logo {
   max-height: 24px;
   width: auto;
   margin-right: 0.5em;
 }

 h1 {
   font-size: 1.3em;
   font-weight: 700;
   margin: 0;
   /* margin: 0 0 0.5em 0; */
 }

 @media (min-width: 40em) {
   .header-line {
     margin: 0 1em;
   }
 }
</style>

<svelte:head>
  <title>Boule</title>
</svelte:head>

<header>
  <a href="/" class="header-line">
    <img src="/logo-128.png" alt="" width="128" height="128" class="logo">
    <h1>Boule</h1>
  </a>
</header>

<main>
  <slot></slot>
</main>

<aside>
  <div class="current-label">Currently baking</div>
  <h3>Pain de campagne</h3>

  <!-- TODO: more ongoing details -->

  <!-- TODO: stop baking -->
</aside>

<footer>
  <div>App made by <a href="https://inso.cc">Sébastien Cevey</a></div>
  <div>Logo made by <a href="http://www.freepik.com/" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">flaticon.com</a></div>
</footer>
