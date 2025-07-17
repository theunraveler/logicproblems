<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef } from 'vue'
import { onBeforeRouteUpdate } from 'vue-router'
import { useStorage } from '@vueuse/core'
import { Proof } from '../lib/logic'

type ProofTableType = InstanceType<typeof ProofTable>

const props = defineProps(['id', 'problem'])
const proof = reactive(new Proof(props.problem.assumptions, props.problem.conclusion))
const proofTable = useTemplateRef<ProofTableType>('proof-table')

const allSolutions = useStorage(`solutions`, {})
const solutions = computed(() => allSolutions.value[props.id] || [])
const solution = ref(null)
const showModal = ref(false)

const qed = (proof) => {
  if (!(props.id in allSolutions.value)) {
    allSolutions.value[props.id] = []
  }

  allSolutions.value[props.id].unshift({
    t: Date.now(),
    l: proof.deductions.map((l) => {
      return [l.formula.toString(), l.rule.toString(), l.justifications]
    }),
  })
  solution.value = 0
  showModal.value = true
}

const confirmDiscard = async () => {
  return (
    !proofTable?.value?.hasUnsavedChanges ||
    window.confirm(
      "It looks like you started this proof but haven't finished it. Are you sure you want to leave?",
    )
  )
}

const viewSolution = async (index) => {
  if (!(await confirmDiscard())) {
    return
  }

  solution.value = index
  proof.clear()
  solutions.value[index].l.forEach((line) => {
    proof.addDeduction(...line)
  })
}

const clearSolutions = () => {
  if (!window.confirm('Are you sure?')) {
    return
  }
  delete allSolutions.value[props.id]
}

onBeforeRouteUpdate(confirmDiscard)
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
      <BCard class="mb-3" no-body header-class="d-flex justify-content-between">
        <template #header>
          <span>Solutions</span>
          <a href="#" @click.prevent="clearSolutions" v-if="solutions.length" class="text-danger">
            <IBiTrash />
          </a>
        </template>
        <BListGroup flush v-if="solutions.length">
          <BListGroupItem v-for="(s, index) in solutions" :key="index" :class="{ 'd-flex': true, active: index === solution}">
            <span class="flex-grow-1">{{ new Date(s.t).toLocaleString() }}</span>
            <a v-if="index !== solution" href="#" @click.prevent="viewSolution(index)" class="stretched-link">View</a>
          </BListGroupItem>
        </BListGroup>
        <BCardBody v-else>You have not solved this proof yet.</BCardBody>
      </BCard>

      <FormulaInputHelp />
    </BCol>
  </BRow>

  <BModal :show="showModal" title="Q.E.D." ok-only ok-title="Close">
    Congrats, you solved the problem!
  </BModal>
</template>
