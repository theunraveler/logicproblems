<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
    <h1>Solve Propositional logic problems online!</h1>

    <p>Welcome to <strong>logicproblems.org</strong>! This system is capable of validating whether or not a given string of text is a Well Formed Formula or not, and give a person a visualization of that formula,and possibly the errors that cause it not to be a well formed formula.</p>

    <p>An instructor can create logic proof problems by supplying the system with a set of assumptions and a desired conclusion. A student of logic may then try and solve the proof with a given set of rules.</p>

    <p>Get <RouterLink :to="{name: 'contact'}">in contact</RouterLink> with us with any suggestions, problems, or general inquiries. Thanks for visiting!</p>
</template>
