<script setup lang="ts">
import { computed, inject, useTemplateRef } from 'vue'
import { problemsInjectionKey, type ProblemList } from '@/plugins/data'

const props = defineProps(['current'])

const problems = inject(problemsInjectionKey) as ProblemList
const problemKeys = Object.keys(problems)
const currentIndex = computed(() => problemKeys.indexOf(props.current))
const prev = computed(() => {
  if (currentIndex.value === 0) {
    return
  }
  const id = problemKeys[currentIndex.value - 1]
  return { id, problem: problems[id] }
})
const next = computed(() => {
  if (currentIndex.value === problemKeys.length - 1) {
    return
  }
  const id = problemKeys[currentIndex.value + 1]
  return { id, problem: problems[id] }
})

const prevPopover = useTemplateRef('prev-popover')
const nextPopover = useTemplateRef('next-popover')

defineExpose({ prev, next })
</script>

<template>
  <BContainer class="d-flex justify-content-between align-items-center">
    <BPopover v-if="prev" ref="prev-popover">
      <template #title>{{ prev.problem.title }}</template>
      <template #target>
        <BLink
          :to="{ name: 'problem', params: { id: prev.id } }"
          @click="prevPopover?.hide()"
          class="btn btn-outline-secondary"
          data-testid="previous-problem-link">
          <IBiArrowLeftShort class="me-2" />
          <span class="d-inline-block text-truncate" style="max-width: 250px">
            {{ prev.problem.title }}
          </span>
        </BLink>
      </template>
      <ProblemCard v-bind="prev" compact />
    </BPopover>
    <span v-else />

    <BPopover v-if="next" ref="next-popover">
      <template #title>{{ next.problem.title }}</template>
      <template #target>
        <BLink
          :to="{ name: 'problem', params: { id: next.id } }"
          @click="nextPopover?.hide()"
          class="btn btn-outline-secondary"
          data-testid="next-problem-link">
          <span class="d-inline-block text-truncate" style="max-width: 250px">
            {{ next.problem.title }}
          </span>
          <IBiArrowRightShort class="ms-2" />
        </BLink>
      </template>
      <ProblemCard v-bind="next" compact />
    </BPopover>
  </BContainer>
</template>
