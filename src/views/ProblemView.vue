<script setup lang="ts">
import { computed, inject, reactive, ref, useTemplateRef, watch } from 'vue'
import { onBeforeRouteUpdate } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { chaptersInjectionKey, humanizeDuration, humanizeTimestamp } from '../utils'
import type { ChapterList, SolutionList } from '../utils'
import { Proof, Line } from '../lib/logic'
import ProofTable from '../components/ProofTable.vue'

type ProofTableType = InstanceType<typeof ProofTable>

const chapters = inject(chaptersInjectionKey) as ChapterList

const props = defineProps(['id', 'problem'])
const proof = reactive(new Proof(props.problem.assumptions, props.problem.conclusion))
const proofTable = useTemplateRef<ProofTableType>('proof-table')

const allSolutions = useStorage(`solutions`, {} as SolutionList)
const solutions = computed(() => allSolutions.value[props.id] || [])
const solution = ref<number>()
const solvedIn = ref(0)
let startedAt: number

watch(
  props,
  async () => {
    startedAt = Date.now()
  },
  { immediate: true },
)

const qed = (proof: Proof) => {
  if (!(props.id in allSolutions.value)) {
    allSolutions.value[props.id] = []
  }

  const now = Date.now()
  allSolutions.value[props.id].unshift({
    t: now,
    d: now - startedAt,
    l: proof.deductions.map((l: Line) => {
      return [
        l.formula.toString().replaceAll(' ', ''),
        l.rule.toString().replaceAll(' ', ''),
        l.justifications,
      ]
    }),
  })
  solution.value = 0
  solvedIn.value = now - startedAt
}

const confirmDiscard = async () => {
  return (
    !proofTable?.value?.hasUnsavedChanges ||
    window.confirm(
      "It looks like you started this proof but haven't finished it. Are you sure you want to leave?",
    )
  )
}

const viewSolution = async (index: number) => {
  if (!(await confirmDiscard())) {
    return
  }

  solution.value = index
  proof.clear()
  solutions.value[index].l.forEach((line) => {
    proof.addDeduction(...line)
  })
}

onBeforeRouteUpdate(confirmDiscard)
</script>

<template>
  <BBreadcrumb>
    <BBreadcrumbItem :to="{name: 'home'}">Home</BBreadcrumbItem>
    <BBreadcrumbItem :to="{name: 'problems'}">Problems</BBreadcrumbItem>
    <BBreadcrumbItem :to="{name: 'problems', query: {chapter: problem.chapter}}">
      {{ chapters[problem.chapter] }}
    </BBreadcrumbItem>
    <BBreadcrumbItem active>{{ problem.title }}</BBreadcrumbItem>
  </BBreadcrumb>

  <BRow>
    <BCol cols="12" lg="8" xl="9">
      <div class="d-flex justify-content-between align-items-center border-bottom mb-4">
        <h2>{{ problem.title }}</h2>
        <h4>Conclusion: {{ proof.conclusion }}</h4>
      </div>
      <ProofTable ref="proof-table" :proof="proof" @qed="qed" data-testid="proof-table" />
      <ProblemNav class="px-0 mt-4 mt-lg-5" :current="id" />
    </BCol>

    <BCol cols="12" lg="4" xl="3" class="mt-4 mt-lg-0">
      <BCard class="mb-3" header="Solutions" no-body>
        <BListGroup flush v-if="solutions.length">
          <BListGroupItem
            v-for="(s, index) in solutions"
            :key="index"
            :class="['d-flex align-items-center', { active: index === solution }]">
            <span class="flex-grow-1">
              {{ humanizeTimestamp(s.t) }}
              <small class="d-block text-muted">Solved in {{ humanizeDuration(s.d) }}</small>
            </span>
            <a
              v-if="index !== solution"
              href="#"
              @click.prevent="viewSolution(index)"
              class="stretched-link"
              >View</a
            >
          </BListGroupItem>
        </BListGroup>
        <BCardBody v-else>You have not solved this proof yet.</BCardBody>
      </BCard>

      <FormulaInputHelp />
    </BCol>
  </BRow>

  <BModal :show="!!solvedIn" title="Q.E.D." ok-only ok-title="Close">
    Congrats, you solved the problem in {{ humanizeDuration(solvedIn) }}!
  </BModal>
</template>
