<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Problem } from '@/plugins/data'
import { db, uniqueKeys } from '@/store'

const props = defineProps<{ problems: Problem[] }>()

const nextUnsolved = ref<Problem>()
const findNextUnsolved = async () => {
  const solvedProblems = await uniqueKeys(db.solutions.orderBy('problemId'))
  nextUnsolved.value = props.problems.find((problem) => !solvedProblems.includes(problem.id))
}

watch(props, findNextUnsolved, { immediate: true })
</script>

<template>
  <BLink
    v-if="nextUnsolved"
    :to="{ name: 'problem', params: { id: nextUnsolved.id } }"
    class="btn btn-outline-secondary hstack">
    <span class="me-2 flex-grow-1 text-start">
      <small class="d-block">Next Unsolved Problem</small>
      {{ nextUnsolved.title }}
    </span>
    <IBiArrowRightSquareFill />
  </BLink>
</template>
