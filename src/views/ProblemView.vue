<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { onBeforeRouteUpdate } from 'vue-router'
import ProofTable from '../components/ProofTable.vue'

type ProofTableType = InstanceType<typeof ProofTable>

defineProps(['id', 'problem'])
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
      <div class="d-flex justify-content-between align-items-center border-bottom mb-4">
        <h2>{{ problem.title }}</h2>
        <h4>Conclusion: {{ proofTable?.proof?.conclusion }}</h4>
      </div>

      <ProofTable
        ref="proof-table"
        :assumptions="problem.assumptions"
        :conclusion="problem.conclusion"
        data-testid="proof-table" />

      <ProblemNav class="px-0 mt-4 mt-lg-5" :current="id" />
    </BCol>

    <BCol cols="12" lg="4" xl="3" class="mt-4 mt-lg-0">
      <FormulaInputHelp />
    </BCol>
  </BRow>

  <BModal :show="proofTable?.proof?.qed()" title="Q.E.D." ok-only ok-title="Close"
    >Congrats, you solved the problem!</BModal
  >
</template>
