<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { db } from '@/store'

const props = defineProps(['problems'])
const problemIds = computed(() => Object.keys(props.problems))
const solvedProblemIds = ref<string[]>([])

watch(problemIds, async (problemIds) => {
  const solved = (await db.solutions.orderBy('problemId').uniqueKeys()) as string[]
  solvedProblemIds.value = solved.filter((id) => problemIds.includes(id))
}, { immediate: true })
</script>

<template>
  <aside>
    <BProgress :value="solvedProblemIds.length" :max="problemIds.length" :variant="solvedProblemIds.length === problemIds.length ? 'success' : undefined" />
    <small class="text-center">Solved {{ solvedProblemIds.length }} of {{ problemIds.length }}</small>
  </aside>
</template>
