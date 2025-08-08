<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { onKeyDown } from '@vueuse/core'
import insertTextAtCursor from 'insert-text-at-cursor'
import { Expression, Operator } from '@/logic/ast'
import { parse } from '@/logic/parse'

const text = ref('')
const input = useTemplateRef('input')
const error = ref('')
const validationState = ref<boolean>()
const formula = ref<Expression>()

const keys: Record<string, Operator> = {
  '>': Operator.CONDITIONAL,
  '<': Operator.BICONDITIONAL,
  '?': Operator.DISJUNCTION,
}
onKeyDown(
  (event) => event.shiftKey && event.key in keys,
  (event) => {
    event.preventDefault()
    addOperator(keys[event.key])
  },
  { target: input.value?.$el },
)

const addOperator = (operator: Operator) => {
  if (!input.value) {
    return
  }
  input.value.focus()
  let toAdd = ` ${operator.toString()}`
  if (operator.isBinary) {
    toAdd += ' '
  }
  insertTextAtCursor(input.value.$el, toAdd)
}

const validate = () => {
  text.value = text.value.toUpperCase()
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
    ref="input"
    v-model="text"
    placeholder="Formula"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    :state="validationState"
    required
    v-bind="$attrs" />
  <BButtonGroup class="mt-1" aria-label="Operators" data-tour="operators">
    <BButton
      v-for="operator in Operator.all"
      :key="operator.symbol"
      size="sm"
      variant="outline-secondary"
      :title="`Insert ${operator.label} operator (${operator})`"
      @click.stop.prevent="addOperator(operator)">
      {{ operator }}
    </BButton>
  </BButtonGroup>
  <BFormInvalidFeedback :state="validationState">{{ error }}</BFormInvalidFeedback>
</template>

<style scoped lang="scss">
input[type='text']:not(:placeholder-shown) {
  text-transform: uppercase;
}
</style>
