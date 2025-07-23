<script setup lang="ts">
import { inject, reactive, toRaw, useTemplateRef } from 'vue'
import { onBeforeRouteUpdate } from 'vue-router'
import { useModal } from 'bootstrap-vue-next'
import { chaptersInjectionKey, humanizeDuration, type ChapterList, type Solution } from '../utils'
import { Proof, Line } from '../lib/logic'
import ProblemNav from '../components/ProblemNav.vue'
import ProofTable from '../components/ProofTable.vue'
import SolutionList from '../components/SolutionList.vue'

type ProofTableType = InstanceType<typeof ProofTable>
type ProblemNavType = InstanceType<typeof ProblemNav>
type SolutionListType = InstanceType<typeof SolutionList>

const chapters = inject(chaptersInjectionKey) as ChapterList

const props = defineProps(['id', 'problem'])
const proof = reactive(new Proof(props.problem.assumptions, props.problem.conclusion))
const proofTable = useTemplateRef<ProofTableType>('proof-table')

const problemNav = useTemplateRef<ProblemNavType>('problem-nav')
const solutionList = useTemplateRef<SolutionListType>('solution-list')

const { hide: hideModal, show: showModal } = useModal('qed-modal')

const qed = async (proof: Proof) => {
  if (!proofTable?.value?.solvedIn || !solutionList?.value) {
    return
  }

  await solutionList.value.add({
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

const viewSolution = async (solution: Solution) => {
  if (!(await confirmDiscard())) {
    return
  }

  proof.clear()
  solution.lines.forEach((line) => {
    proof.addDeduction(...line)
  })
}

const clear = () => {
  solutionList.value?.clearSelection()
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
      <SolutionList ref="solution-list" :problemId="props.id" @select="viewSolution" />
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
