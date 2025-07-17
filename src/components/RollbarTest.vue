<script setup lang="ts">
const triggerError = () => {
  throw new Error('Testing Rollbar integration')
}
</script>

<template>
  <div>
    <BButton variant="secondary" size="sm" @click="triggerError">
      Test Rollbar
    </BButton>
  </div>
</template>
