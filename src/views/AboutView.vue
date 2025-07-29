<script setup lang="ts">
import { useHead } from '@unhead/vue'

useHead({ title: 'About' })
</script>

<template>
  <h1 class="mb-4">Solve Propositional Logic Problems Online!</h1>

  <p>
    Welcome to <strong>logicproblems.org</strong>! This system is capable of validating whether or
    not a given string of text is a Well Formed Formula or not, and give a person a visualization of
    that formula,and possibly the errors that cause it not to be a well formed formula.
  </p>

  <p>
    An instructor can create logic proof problems by supplying the system with a set of assumptions
    and a desired conclusion. A student of logic may then try and solve the proof with a given set
    of rules.
  </p>

  <p>
    <BLink :to="{ name: 'contact' }">Contact us</BLink> with any suggestions, problems, or general
    inquiries. Thanks for visiting!
  </p>
</template>
