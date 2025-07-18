<script setup lang="ts">
import { computed, inject, reactive, ref, useTemplateRef } from 'vue'
import { onBeforeRouteUpdate } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { useModal } from 'bootstrap-vue-next'
import { chaptersInjectionKey, humanizeDuration, humanizeTimestamp } from '../utils'
import type { ChapterList, SolutionList } from '../utils'
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

const allSolutions = useStorage(`solutions`, {} as SolutionList)
const solutions = computed(() => allSolutions.value[props.id] || [])
const solution = ref<number>()

const qed = (proof: Proof) => {
  if (!proofTable?.value?.solvedIn) {
    return
  }

  if (!(props.id in allSolutions.value)) {
    allSolutions.value[props.id] = []
  }

  allSolutions.value[props.id].unshift({
    t: Date.now(),
    d: proofTable.value.solvedIn,
    l: proof.deductions.map((l: Line) => {
      return [
        l.formula.toString().replaceAll(' ', ''),
        l.rule.toString().replaceAll(' ', ''),
        l.justifications,
      ]
    }),
  })
  solution.value = 0
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

const clear = () => {
  solution.value = undefined
  hideModal()
}

onBeforeRouteUpdate(confirmDiscard)
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
          <small v-if="solutions.length" class="text-success"><IBiCheckCircleFill /> Solved</small>
        </template>
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
