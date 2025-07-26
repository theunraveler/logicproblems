<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import insertTextAtCursor from 'insert-text-at-cursor'
import { Expression, Operator } from '@/logic/ast'
import { parse } from '@/logic/parse'

const text = ref('')
const input = useTemplateRef<HTMLInputElement>('input')
const error = ref('')
const validationState = ref<boolean>()
const formula = ref<Expression>()

const addOperator = (operator: Operator) => {
  if (!input.value) {
    return
  }
  input.value.focus()
  let toAdd = ` ${operator.toString()}`
  if (operator.isBinary) {
    toAdd += ' '
  }
  insertTextAtCursor(input.value, toAdd)
}

const validate = () => {
  validationState.value = undefined
  error.value = ''
  formula.value = undefined

  try {
    formula.value = parse(text.value)
    text.value = formula.value.toString()
    validationState.value = true
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else if (typeof err === 'string') {
      error.value = err
    }
    validationState.value = false
  }
}

const reset = () => {
  text.value = ''
  validationState.value = undefined
  error.value = ''
  formula.value = undefined
}

defineExpose({ text, formula, input, error, validate, reset })
</script>

<template>
  <BFormInput
    v-model="text"
    ref="input"
    placeholder="Formula"
    :state="validationState"
    required
    v-bind="$attrs" />
  <BButtonGroup class="mt-1" aria-label="Operators" data-tour="operators">
    <BButton
      size="sm"
      variant="outline-secondary"
      v-for="operator in Operator.all"
      :key="operator.symbol"
      @click.stop.prevent="addOperator(operator)"
      :title="`Insert ${operator.label} operator (${operator})`">
      {{ operator }}
    </BButton>
  </BButtonGroup>
  <BFormInvalidFeedback :state="validationState">{{ error }}</BFormInvalidFeedback>
</template>
