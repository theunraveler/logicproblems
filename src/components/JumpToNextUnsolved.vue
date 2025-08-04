<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ProblemList } from '@/plugins/data'
import { db, uniqueKeys } from '@/store'

const props = defineProps<{ problems: ProblemList }>()

const firstUnsolvedId = ref<string>()
const firstUnsolved = computed(() =>
  firstUnsolvedId.value ? props.problems[firstUnsolvedId.value] : undefined,
)
const loadSolvedProblems = async () => {
  const solvedProblems = await uniqueKeys(db.solutions.orderBy('problemId'))
  firstUnsolvedId.value = Object.keys(props.problems).find((id) => !solvedProblems.includes(id))
}

onMounted(loadSolvedProblems)
</script>

<template>
  <BLink
    v-if="firstUnsolved"
    :to="{ name: 'problem', params: { id: firstUnsolvedId } }"
    class="btn btn-outline-secondary hstack">
    <span class="me-2 flex-grow-1 text-start">
      <small class="d-block">Jump to Next Unsolved Problem</small>
      {{ firstUnsolved.title }}
    </span>
    <IBiArrowRightSquareFill />
  </BLink>
</template>
