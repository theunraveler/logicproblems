<script setup lang="ts">
import { inject, onMounted, ref, watch } from 'vue'
import Rollbar from 'rollbar'
import type { Problem } from '@/plugins/data'
import { db } from '@/store'
import { humanizeDuration, humanizeTimestamp, type Solution, type SolutionProps } from '@/utils'

const rollbar = inject('rollbar') as Rollbar

const props = defineProps<{ problem: Problem }>()
const emit = defineEmits(['select'])

const solutions = ref<Solution[]>([])
const loadSolutions = async () => {
  solutions.value = await db.solutions
    .where('problemId')
    .equals(props.problem.id)
    .reverse()
    .sortBy('completedAt')
}
const selected = ref<number>()

const addSolution = async (solution: SolutionProps) => {
  selected.value = await db.solutions.add(solution)
  rollbar.info('Problem solved', {
    solution: {
      ...solution,
      ...{
        lines: JSON.stringify(solution.lines),
      },
    },
  })
  loadSolutions()
}

const updateSelection = (solution: Solution) => {
  selected.value = solution.id
  emit('select', solution)
}

const clearSelection = () => {
  selected.value = undefined
}

defineExpose({ add: addSolution, clearSelection })

watch(props, async () => {
  clearSelection()
  await loadSolutions()
})
onMounted(loadSolutions)
</script>

<template>
  <BCard
    tag="aside"
    no-body
    header-class="hstack justify-content-between"
    data-tour="solutions"
    data-testid="solutions">
    <template #header>
      Solutions
      <span v-if="solutions.length" class="badge rounded-pill text-bg-success">
        <IBiCheckCircleFill class="me-1" /> Solved
      </span>
    </template>
    <BListGroup v-if="solutions.length" flush class="overflow-y-auto" style="max-height: 50vh">
      <BListGroupItem
        v-for="solution in solutions"
        :key="solution.id"
        :class="['hstack', { active: solution.id === selected }]">
        <span class="flex-grow-1">
          {{ humanizeTimestamp(solution.completedAt) }}
          <small :class="['d-block', `text-${solution.id === selected ? '-bg-primary' : 'muted'}`]">
            Solved in {{ humanizeDuration(solution.completedIn) }}
          </small>
        </span>
        <a
          v-if="solution.id !== selected"
          href="#"
          class="stretched-link"
          @click.stop.prevent="updateSelection(solution)">
          View
        </a>
      </BListGroupItem>
    </BListGroup>
    <BCardBody v-else>You have not solved this problem yet.</BCardBody>
  </BCard>
</template>
