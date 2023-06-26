<script lang="ts">
  import type { ActionData } from './$types';
  export let form: ActionData;
</script>

<h1>Vector embedding search</h1>

{#if form && form.success}
  {#if form.results}
  <p>Results for {form.phrase}:</p>
  <ol>
    {#each form.results as result}
      <li>{result.phrase}</li>
    {/each}
  </ol>
  {:else if form.phrase}
    <p>Successfully added {form.phrase}</p>
  {/if}
{/if}

<form id="add_form" method="post" action="?/add">
  <label for="add_phrase">Add Phrase</label>
  <input id="add_phrase" name="add_phrase" autocomplete="off" /><button type="submit">Add</button>
</form>
<form id="search_form" method="post" action="?/search">
  <label for="search_phrase">Search Phrase</label>
  <input id="search_phrase" name="search_phrase" autocomplete="off" /><button type="submit">Search</button>
</form>
