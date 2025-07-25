<script setup lang="ts">
import { ref, useTemplateRef, type Ref } from 'vue'
import FormulaInput from '@/components/FormulaInput.vue'
import { Expression } from '@/logic/ast'

type FormulaInputType = InstanceType<typeof FormulaInput>
const formulaInput = useTemplateRef<FormulaInputType>('formula-input')
const expression: Ref<Expression | undefined> = ref(undefined)

const onSubmit = () => {
  expression.value = undefined

  if (!formulaInput.value) {
    return
  }

  formulaInput.value.validate()
  if (formulaInput.value.error) {
    return
  }

  expression.value = formulaInput.value.formula
}
</script>

<template>
  <BForm @submit.prevent="onSubmit" class="mb-3">
    <FormulaInput ref="formula-input" />
    <div class="d-grid gap-2 mt-2">
      <BButton type="submit" variant="primary">Test and Graph</BButton>
    </div>
  </BForm>

  <div v-if="expression">
    <hr class="mb-4" />
    <FormulaGraph :expression="expression" />
  </div>
  <div v-else>
    <FormulaInputHelp />
  </div>
</template>
