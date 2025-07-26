<script setup lang="ts">
import { inject, onMounted, reactive, useTemplateRef } from 'vue'
import { onBeforeRouteUpdate, useRouter } from 'vue-router'
import { chaptersInjectionKey, compressProofLines, type ChapterList, type Solution } from '@/utils'
import { Proof } from '@/logic'
import ProblemNav from '@/components/ProblemNav.vue'
import ProofTable from '@/components/ProofTable.vue'
import SolutionList from '@/components/SolutionList.vue'

type ProofTableType = InstanceType<typeof ProofTable>
type ProblemNavType = InstanceType<typeof ProblemNav>
type SolutionListType = InstanceType<typeof SolutionList>

const $router = useRouter()

const chapters = inject(chaptersInjectionKey) as ChapterList

const props = defineProps(['id', 'problem', 'lines'])
const proof = reactive(new Proof(props.problem.assumptions, props.problem.conclusion))
const proofTable = useTemplateRef<ProofTableType>('proof-table')

const problemNav = useTemplateRef<ProblemNavType>('problem-nav')
const solutionList = useTemplateRef<SolutionListType>('solution-list')

const onQed = async (proof: Proof) => {
  if (!proofTable.value?.solvedIn || !solutionList.value) {
    return
  }

  await solutionList.value.add({
    problemId: props.id,
    completedAt: Date.now(),
    completedIn: proofTable.value.solvedIn,
    lines: compressProofLines(proof),
  })
}

const viewSolution = async (solution: Solution) => {
  if (!(await proofTable?.value?.confirmDiscard())) {
    return
  }

  proof.clear()
  proof.addDeductions(solution.lines)
  proofTable.value?.$el?.scrollIntoView({ behavior: 'auto', block: 'center' })
}

const clear = () => {
  solutionList.value?.clearSelection()
  const { l: _, ...params } = $router.currentRoute.value.query
  $router.push(params)
}

onBeforeRouteUpdate(async () => await proofTable?.value?.confirmDiscard())
onMounted(async () => {
  if (!props.lines) {
    return
  }

  proof.addDeductions(props.lines)
})
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
        @qed="onQed"
        @clear="clear"
        data-testid="proof-table">
        <template #qed-modal-actions="{ clear }">
          <BButton variant="outline-secondary" @click="clear">Solve Again</BButton>
          <BLink
            v-if="problemNav?.next"
            class="btn btn-primary"
            :to="{ name: 'problem', params: { id: problemNav.next.id } }">
            Next Problem<IBiArrowRightShort />
          </BLink>
        </template>
      </ProofTable>
      <ProblemNav ref="problem-nav" class="px-0 mt-4 mt-lg-5" :current="id" />
    </BCol>

    <BCol cols="12" lg="4" xl="3" class="mt-4 mt-lg-0">
      <SolutionList ref="solution-list" :problemId="props.id" @select="viewSolution" class="mb-3" />
      <ProofPermalink tag="aside" :id="props.id" :title="problem.title" :proof="proof" class="mb-3" />
      <FormulaInputHelp />
    </BCol>
  </BRow>
</template>
