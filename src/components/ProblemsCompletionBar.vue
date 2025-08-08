<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Problem } from '@/plugins/data'
import { db, uniqueKeys } from '@/store'

const props = defineProps<{ problems: Problem[] }>()
const ids = computed(() => props.problems.map((problem) => problem.id))
const solved = ref<string[]>([])

watch(
  ids,
  async (ids) => {
    const allSolved = await uniqueKeys(db.solutions.orderBy('problemId'))
    solved.value = allSolved.filter((id) => ids.includes(id))
  },
  { immediate: true },
)
</script>

<template>
  <aside>
    <BProgress
      :value="solved.length"
      :max="ids.length"
      :variant="solved.length === ids.length ? 'success' : undefined" />
    <small class="text-center"> Solved {{ solved.length }} of {{ ids.length }} </small>
  </aside>
</template>
