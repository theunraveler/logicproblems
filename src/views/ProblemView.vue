<script setup lang="ts">
import { computed, inject, useTemplateRef } from 'vue'
import { onBeforeRouteUpdate } from 'vue-router'
import { problemsInjectionKey } from '../utils'
import type { ProblemList } from '../utils'
import ProofTable from '../components/ProofTable.vue'

type ProofTableType = InstanceType<typeof ProofTable>

const props = defineProps(['id'])

const problems = inject(problemsInjectionKey) as ProblemList
const problem = computed(() => problems[props.id])
const proofTable = useTemplateRef<ProofTableType>('proof-table')

onBeforeRouteUpdate(async () => {
  return (
    !proofTable?.value?.hasUnsavedChanges ||
    window.confirm(
      "It looks like you started this proof but haven't finished it. Are you sure you want to leave?",
    )
  )
})
</script>

<template>
  <BRow>
    <BCol cols="12" lg="8" xl="9">
      <div class="d-flex justify-content-between border-bottom mb-4">
        <h2>{{ problem.title }}</h2>
        <h4>
          Conclusion: <code>{{ proofTable?.proof?.conclusion }}</code>
        </h4>
      </div>

      <ProofTable
        ref="proof-table"
        :assumptions="problem.assumptions"
        :conclusion="problem.conclusion"
        data-testid="proof-table" />

      <ProblemNav class="px-0 mt-4 mt-lg-5" :current="$route.params.id" />
    </BCol>

    <BCol cols="12" lg="4" xl="3" class="mt-4 mt-lg-0">
      <FormulaInputHelp />
    </BCol>
  </BRow>

  <BModal :show="proofTable?.proof?.qed()" title="Q.E.D." ok-only ok-title="Close"
    >Congrats, you solved the problem!</BModal
  >
</template>
