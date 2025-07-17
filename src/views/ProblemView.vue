<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef } from 'vue'
import { onBeforeRouteUpdate } from 'vue-router'
import { Proof } from '../lib/logic'

type ProofTableType = InstanceType<typeof ProofTable>

const props = defineProps(['id', 'problem'])
const proof = reactive(new Proof(props.problem.assumptions, props.problem.conclusion))
const proofTable = useTemplateRef<ProofTableType>('proof-table')

const showModal = ref(false)

const qed = (proof) => {
  showModal.value = true
}

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
        <h4>Conclusion: {{ proof.conclusion }}</h4>
      </div>
      <ProofTable ref="proof-table" :proof="proof" @qed="qed" data-testid="proof-table" />
      <ProblemNav class="px-0 mt-4 mt-lg-5" :current="id" />
    </BCol>

    <BCol cols="12" lg="4" xl="3" class="mt-4 mt-lg-0">
      <FormulaInputHelp />
    </BCol>
  </BRow>

  <BModal :show="showModal" title="Q.E.D." ok-only ok-title="Close">
    Congrats, you solved the problem!
  </BModal>
</template>
