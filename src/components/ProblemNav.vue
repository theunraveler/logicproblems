<script setup lang="ts">
import { computed, inject } from 'vue'
import { problemsInjectionKey, type ProblemList } from '@/utils'

const props = defineProps(['current'])

const problems = inject(problemsInjectionKey) as ProblemList
const problemKeys = Object.keys(problems)
const currentIndex = computed(() => problemKeys.indexOf(props.current))
const prev = computed(() => {
  if (currentIndex.value === 0) {
    return
  }
  const id = problemKeys[currentIndex.value - 1]
  return { id, title: problems[id].title }
})
const next = computed(() => {
  if (currentIndex.value === problemKeys.length - 1) {
    return
  }
  const id = problemKeys[currentIndex.value + 1]
  return { id, title: problems[id].title }
})

defineExpose({ prev, next })
</script>

<template>
  <BContainer v-bind="$attrs">
    <BLink
      v-if="prev"
      :to="{ name: 'problem', params: { id: prev.id } }"
      class="btn btn-outline-secondary float-start"
      :title="prev.title"
      data-testid="previous-problem-link">
      <IBiArrowLeftShort class="me-2" />Previous
    </BLink>
    <BLink
      v-if="next"
      :to="{ name: 'problem', params: { id: next.id } }"
      class="btn btn-outline-secondary float-end"
      :title="next.title"
      data-testid="next-problem-link">
      Next<IBiArrowRightShort class="ms-2" />
    </BLink>
  </BContainer>
</template>
