<script setup lang="ts">
import { Operator } from '../lib/logic';
</script>

<template>
    <h4>What symbols can I use?</h4>
    <p>The following is a list of characters that can be used:</p>
    <ul>
        <li>Any alphabetical character from <code>A</code> to <code>Z</code></li>
        <li v-for="operator in Operator.all" :key="operator.symbol">
            The {{ operator.label }} operator (<code>{{ operator }}</code>)
        </li>
        <li>Opening and closing parentheses (<code>()</code>)</li>
        <li>Spaces</li>
    </ul>
    <p>The following list, though not exhaustive, cannot be entered:</p>
    <ul>
        <li>Numbers (<code>1</code>, <code>2</code>, <code>3</code>, etc.)</li>
        <li>Punctuation (<code>,</code>, <code>.</code>, <code>?</code>, etc.)</li>
        <li>Brackets (<code>{ }</code>, <code>[ ]</code>, etc.)</li>
        <li>Probably some other stuff</li>
    </ul>
</template>
