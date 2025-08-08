<script setup lang="ts">
import { computed, inject, useTemplateRef } from 'vue'
import { problemsInjectionKey, type Problem, type ProblemList } from '@/plugins/data'

const props = defineProps<{ current: Problem }>()

const problems = inject(problemsInjectionKey) as ProblemList
const problemKeys = Object.keys(problems)
const currentIndex = computed(() => problemKeys.indexOf(props.current.id))
const prev = computed(() => {
  if (currentIndex.value === 0) {
    return
  }
  const id = problemKeys[currentIndex.value - 1]
  return problems[id]
})
const next = computed(() => {
  if (currentIndex.value === problemKeys.length - 1) {
    return
  }
  const id = problemKeys[currentIndex.value + 1]
  return problems[id]
})

const prevPopover = useTemplateRef('prev-popover')
const nextPopover = useTemplateRef('next-popover')

defineExpose({ prev, next })
</script>

<template>
  <BContainer class="d-flex justify-content-between align-items-center">
    <BPopover v-if="prev" ref="prev-popover">
      <template #title>{{ prev.title }}</template>
      <template #target>
        <BLink
          :to="{ name: 'problem', params: { id: prev.id } }"
          class="btn btn-outline-secondary"
          data-testid="previous-problem-link"
          @click="prevPopover?.hide()">
          <IBiArrowLeftShort class="me-2" />
          <span class="d-inline-block text-truncate" style="max-width: 250px">
            {{ prev.title }}
          </span>
        </BLink>
      </template>
      <ProblemCard :problem="prev" compact />
    </BPopover>
    <span v-else />

    <BPopover v-if="next" ref="next-popover">
      <template #title>{{ next.title }}</template>
      <template #target>
        <BLink
          :to="{ name: 'problem', params: { id: next.id } }"
          class="btn btn-outline-secondary"
          data-testid="next-problem-link"
          @click="nextPopover?.hide()">
          <span class="d-inline-block text-truncate" style="max-width: 250px">
            {{ next.title }}
          </span>
          <IBiArrowRightShort class="ms-2" />
        </BLink>
      </template>
      <ProblemCard :problem="next" compact />
    </BPopover>
  </BContainer>
</template>
