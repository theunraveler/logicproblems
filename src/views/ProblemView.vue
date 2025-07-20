<script setup lang="ts">
import { inject, onMounted, reactive, ref, toRaw, useTemplateRef } from 'vue'
import { onBeforeRouteUpdate } from 'vue-router'
import { useModal } from 'bootstrap-vue-next'
import { db } from '../store'
import {
  chaptersInjectionKey,
  humanizeDuration,
  humanizeTimestamp,
  type ChapterList,
  type Solution,
} from '../utils'
import { Proof, Line } from '../lib/logic'
import ProblemNav from '../components/ProblemNav.vue'
import ProofTable from '../components/ProofTable.vue'

type ProofTableType = InstanceType<typeof ProofTable>
type ProblemNavType = InstanceType<typeof ProblemNav>

const chapters = inject(chaptersInjectionKey) as ChapterList

const props = defineProps(['id', 'problem'])
const proof = reactive(new Proof(props.problem.assumptions, props.problem.conclusion))
const proofTable = useTemplateRef<ProofTableType>('proof-table')

const problemNav = useTemplateRef<ProblemNavType>('problem-nav')

const { hide: hideModal, show: showModal } = useModal('qed-modal')

const solutions = ref<Solution[]>([])
const solutionId = ref<number>()

const qed = async (proof: Proof) => {
  if (!proofTable?.value?.solvedIn) {
    return
  }

  solutionId.value = await db.solutions.add({
    problemId: props.id,
    completedAt: Date.now(),
    completedIn: proofTable.value.solvedIn,
    lines: proof.deductions.map((l: Line) => {
      return [
        l.formula.toString().replaceAll(' ', ''),
        l.rule.toString().replaceAll(' ', ''),
        toRaw(l.justifications),
      ]
    }),
  })
  loadSolutions()
  showModal()
}

const confirmDiscard = async () => {
  return (
    !proofTable?.value?.hasUnsavedChanges ||
    window.confirm(
      "It looks like you started this proof but haven't finished it. Are you sure you want to leave?",
    )
  )
}

const viewSolution = async (id: number) => {
  if (!(await confirmDiscard())) {
    return
  }

  const solution = solutions.value.find((s) => s.id === id)
  if (!solution) {
    return
  }
  proof.clear()
  solutionId.value = id
  solution.lines.forEach((line) => {
    proof.addDeduction(...line)
  })
}

const clear = () => {
  solutionId.value = undefined
  hideModal()
}

const loadSolutions = async () => {
  solutions.value = await db.solutions
    .where('problemId')
    .equals(props.id)
    .reverse()
    .sortBy('completedAt')
}

onBeforeRouteUpdate(confirmDiscard)
onMounted(loadSolutions)
</script>

<template>
  <BBreadcrumb>
    <BBreadcrumbItem :to="{ name: 'home' }">Home</BBreadcrumbItem>
    <BBreadcrumbItem :to="{ name: 'problems' }">Problems</BBreadcrumbItem>
    <BBreadcrumbItem :to="{ name: 'problems', query: { chapter: problem.chapter } }">
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
      <ProofTable
        ref="proof-table"
        :proof="proof"
        @qed="qed"
        @clear="clear"
        data-testid="proof-table" />
      <ProblemNav ref="problem-nav" class="px-0 mt-4 mt-lg-5" :current="id" />
    </BCol>

    <BCol cols="12" lg="4" xl="3" class="mt-4 mt-lg-0">
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
            v-for="s in solutions"
            :key="s.id"
            :class="['d-flex align-items-center', { active: s.id === solutionId }]">
            <span class="flex-grow-1">
              {{ humanizeTimestamp(s.completedAt) }}
              <small :class="['d-block', `text-${s.id === solutionId ? '-bg-primary' : 'muted'}`]">
                Solved in {{ humanizeDuration(s.completedIn) }}
              </small>
            </span>
            <a
              v-if="s.id !== solutionId"
              href="#"
              @click.prevent="viewSolution(s.id)"
              class="stretched-link ms-3">
              View
            </a>
          </BListGroupItem>
        </BListGroup>
        <BCardBody v-else>You have not solved this problem yet.</BCardBody>
      </BCard>

      <FormulaInputHelp />
    </BCol>
  </BRow>

  <BModal title="Q.E.D." id="qed-modal">
    <template v-if="proofTable?.solvedIn">
      Congrats, you solved the problem in {{ humanizeDuration(proofTable.solvedIn) }}!
    </template>
    <template #footer>
      <BButton variant="outline-secondary" @click="proofTable?.clear()">Solve Again</BButton>
      <BLink
        v-if="problemNav?.next"
        class="btn btn-primary"
        :to="{ name: 'problem', params: { id: problemNav.next.id } }">
        Next Problem<IBiArrowRightShort />
      </BLink>
    </template>
  </BModal>
</template>
