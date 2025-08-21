<script setup lang="ts">
import { computedAsync } from '@vueuse/core'
import { parse } from '@/logic/parse'
import type { Problem } from '@/plugins/data'
import { db } from '@/store'

const props = withDefaults(
  defineProps<{
    problem: Problem
    compact?: boolean
  }>(),
  { compact: false },
)

const isSolved = computedAsync(async () => {
  return !!(await db.solutions.get({ problemId: props.problem.id }))
}, false)
</script>

<template>
  <BCard no-body :class="{ compact }">
    <BCardHeader v-if="!compact" class="hstack justify-content-between">
      <BLink
        :to="{ name: 'problem', params: { id: props.problem.id } }"
        class="text-reset text-decoration-none stretched-link">
        <span>{{ props.problem.title }}</span>
      </BLink>
      <span v-if="isSolved" class="badge rounded-pill text-bg-success">
        <IBiCheckCircleFill class="me-1" /> Solved
      </span>
    </BCardHeader>
    <BListGroup flush>
      <BListGroupItem v-for="(premise, index) in props.problem.premises" :key="index">
        {{ index + 1 }}. <span class="ms-3">{{ parse(premise) }}</span>
      </BListGroupItem>
      <BListGroupItem>
        <span>Conclusion: {{ parse(props.problem.conclusion) }}</span>
      </BListGroupItem>
    </BListGroup>
  </BCard>
</template>

<style scoped lang="scss">
.card {
  &.compact {
    border: none;
  }

  &:not(.compact) {
    &:hover {
      border: 1px solid #999;
    }
  }
}
</style>
