<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Problem } from '@/plugins/data'
import { db, uniqueKeys } from '@/store'

const props = defineProps<{ problems: Problem[] }>()
const ids = computed(() => props.problems.map((p) => p.id))
const total = computed(() => props.problems.length)
const solved = ref(0)

watch(
  ids,
  async (ids) => {
    solved.value = (await uniqueKeys(db.solutions.where('problemId').anyOf(ids))).length
  },
  { immediate: true },
)
</script>

<template>
  <aside>
    <BProgress :value="solved" :max="total" :variant="solved === total ? 'success' : undefined" />
    <small class="text-center"> Solved {{ solved }} of {{ total }} </small>
  </aside>
</template>
