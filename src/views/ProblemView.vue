<script setup lang="ts">
import { inject, onMounted, ref, toRaw, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import ProblemNav from '@/components/ProblemNav.vue'
import ProofTable from '@/components/ProofTable.vue'
import ProofTour from '@/components/ProofTour.vue'
import SolutionList from '@/components/SolutionList.vue'
import { Proof } from '@/logic'
import { chaptersInjectionKey, type ChapterList, type Problem } from '@/plugins/data'
import { compressProofLines, type SerializedLine, type Solution } from '@/utils'

const router = useRouter()

const chapters = inject(chaptersInjectionKey) as ChapterList

const props = defineProps<{ id: string; problem: Problem; lines?: SerializedLine[] }>()
const proof = ref<Proof>()
const loadProof = () => {
  proof.value = new Proof(props.problem.premises, props.problem.conclusion)
}
watch(props, loadProof, { immediate: true })

useHead({ title: props.problem.title })

const problemNav = useTemplateRef<InstanceType<typeof ProblemNav>>('problem-nav')
const proofTable = useTemplateRef<InstanceType<typeof ProofTable>>('proof-table')
const proofTour = useTemplateRef<InstanceType<typeof ProofTour>>('tour')
const solutionList = useTemplateRef<InstanceType<typeof SolutionList>>('solution-list')

const onQed = async (proof: Proof) => {
  if (!proofTable.value?.solvedIn || !solutionList.value) {
    return
  }

  await solutionList.value.add({
    problemId: props.id,
    completedAt: Date.now(),
    completedIn: proofTable.value.solvedIn,
    lines: compressProofLines(toRaw(proof)),
  })
}

const viewSolution = async (solution: Solution) => {
  if (!(await proofTable?.value?.confirmDiscard())) {
    return
  }

  proof.value?.clear()
  proof.value?.addDeductions(solution.lines)
  proofTable.value?.$el?.scrollIntoView({ behavior: 'auto', block: 'center' })
}

const clear = () => {
  solutionList.value?.clearSelection()
  const { l: _, ...params } = router.currentRoute.value.query
  router.push(params)
}

onMounted(async () => {
  loadProof()

  if (!props.lines) {
    return
  }

  proof.value?.addDeductions(props.lines)
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
      <div class="hstack justify-content-between border-bottom mb-4">
        <h2>{{ problem.title }}</h2>
        <h4 data-tour="conclusion">Conclusion: {{ proof?.conclusion }}</h4>
      </div>
      <ProofTable
        v-if="proof"
        ref="proof-table"
        :proof="proof"
        data-testid="proof-table"
        @qed="onQed"
        @clear="clear">
        <template #qed-modal-actions="{ clear: _clear, close: _close }">
          <BButton variant="outline-secondary" @click="_clear">Solve Again</BButton>
          <BLink
            v-if="problemNav?.next"
            class="btn btn-primary"
            :to="{ name: 'problem', params: { id: problemNav.next.id } }"
            @click="_close()">
            Next Problem<IBiArrowRightShort />
          </BLink>
        </template>
      </ProofTable>
      <ProblemNav ref="problem-nav" class="px-0 mt-4" :current="id" />
    </BCol>

    <BCol cols="12" lg="4" xl="3" class="mt-4 mt-lg-0">
      <SolutionList
        ref="solution-list"
        :problem-id="props.id"
        class="mb-3"
        @select="viewSolution" />
      <ProofPermalink
        v-if="proof"
        :id="props.id"
        :title="problem.title"
        :proof="proof"
        class="mb-3" />
      <aside class="mb-3">
        <BButton
          variant="outline-secondary"
          class="w-100"
          data-tour="tour"
          @click.prevent="proofTour?.prompt()">
          <IBiSignpostSplit class="me-2" /> How Do I Use This?
        </BButton>
      </aside>
      <FormulaInputHelp />
    </BCol>
  </BRow>

  <ProofTour ref="tour" />
</template>
