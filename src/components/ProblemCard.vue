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
  <BCard no-body>
    <BCardHeader v-if="!compact" class="hstack justify-content-between">
      <span>{{ props.problem.title }}</span>
      <span v-if="isSolved" class="badge rounded-pill text-bg-success">
        <IBiCheckCircleFill class="me-1" /> Solved
      </span>
    </BCardHeader>
    <BListGroup flush numbered>
      <BListGroupItem v-for="(premise, index) in props.problem.premises" :key="index">
        <span class="ms-3">{{ parse(premise) }}</span>
      </BListGroupItem>
    </BListGroup>
    <BListGroup flush class="border-top-0">
      <BListGroupItem>
        <span>Conclusion: {{ parse(props.problem.conclusion) }}</span>
      </BListGroupItem>
    </BListGroup>
    <BCardBody v-if="!props.compact">
      <BLink
        :to="{ name: 'problem', params: { id: props.problem.id } }"
        class="btn btn-primary stretched-link">
        Solve!
      </BLink>
    </BCardBody>
  </BCard>
</template>
