<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useHead } from '@unhead/vue'
import FormulaInput from '@/components/FormulaInput.vue'

useHead({ title: 'Formulae' })

const formulaInput = useTemplateRef<InstanceType<typeof FormulaInput>>('formula-input')
</script>

<template>
  <BForm @submit.prevent="formulaInput?.validate()" class="mb-3">
    <FormulaInput ref="formula-input" />
    <div class="d-grid gap-2 mt-2">
      <BButton type="submit" variant="primary">Test and Graph</BButton>
    </div>
  </BForm>

  <div v-if="formulaInput?.formula">
    <hr class="mb-4" />
    <FormulaGraph :expression="formulaInput.formula" />
  </div>
  <div v-else>
    <FormulaInputHelp />
  </div>
</template>
