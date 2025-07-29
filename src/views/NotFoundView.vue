<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({ title: 'NotFound' })
</script>

<template>
  <h1>Page Not Found</h1>

  <p>
    Ooops, this page does not exist! <BLink :to="{ name: 'home' }">Go back to the homepage</BLink>.
  </p>
</template>
