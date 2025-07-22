<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import { db } from '../store'
import Rollbar from 'rollbar'
import { humanizeDuration, humanizeTimestamp, type Solution, type SolutionProps } from '../utils'

const rollbar = inject('rollbar') as Rollbar

const props = defineProps(['problemId'])
const emit = defineEmits(['select'])

const solutions = ref<Solution[]>([])
const loadSolutions = async () => {
  solutions.value = await db.solutions
    .where('problemId')
    .equals(props.problemId)
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

onMounted(loadSolutions)
</script>

<template>
  <BCard
    class="mb-3"
    no-body
    header-class="d-flex justify-content-between align-items-center"
    data-testid="solutions">
    <template #header>
      Solutions
      <span
        v-if="solutions.length"
        class="badge rounded-pill text-bg-success d-flex align-items-center">
        <IBiCheckCircleFill class="me-1" /> Solved
      </span>
    </template>
    <BListGroup flush v-if="solutions.length">
      <BListGroupItem
        v-for="solution in solutions"
        :key="solution.id"
        :class="['d-flex align-items-center', { active: solution.id === selected }]">
        <span class="flex-grow-1">
          {{ humanizeTimestamp(solution.completedAt) }}
          <small :class="['d-block', `text-${solution.id === selected ? '-bg-primary' : 'muted'}`]">
            Solved in {{ humanizeDuration(solution.completedIn) }}
          </small>
        </span>
        <a
          v-if="solution.id !== selected"
          href="#"
          @click.stop.prevent="updateSelection(solution)"
          class="stretched-link ms-3">
          View
        </a>
      </BListGroupItem>
    </BListGroup>
    <BCardBody v-else>You have not solved this problem yet.</BCardBody>
  </BCard>
</template>
