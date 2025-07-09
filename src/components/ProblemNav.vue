<script setup lang="ts">
import { computed, inject } from 'vue';
import { problemsInjectionKey } from '../utils';
import type { ProblemList } from '../utils'

const props = defineProps(['current']);

const _problems = inject(problemsInjectionKey) as ProblemList
const _problemKeys = computed(() => Object.keys(_problems));
const _problemIndex = computed(() => _problemKeys.value.indexOf(props.current));
const prev = computed(() => {
    if (_problemIndex.value === 0) {
        return;
    }
    const id =  _problemKeys.value[_problemIndex.value - 1];
    return { id, title: _problems[id].title };
});
const next = computed(() => {
    if (_problemIndex.value === _problemKeys.value.length - 1) {
        return;
    }
    const id =  _problemKeys.value[_problemIndex.value + 1];
    return { id, title: _problems[id].title };
});
</script>

<template>
    <BContainer v-bind="$attrs">
        <BLink
            v-if="prev"
            :to="{name: 'problem', params: {id: prev.id}}"
            class="btn btn-outline-secondary float-start"
            :title="prev.title">
            ← Previous
        </BLink>
        <BLink
            v-if="next"
            :to="{name: 'problem', params: {id: next.id}}"
            class="btn btn-outline-secondary float-end"
            :title="next.title">
            Next →
        </BLink>
    </BContainer>
</template>
