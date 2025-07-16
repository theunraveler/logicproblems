<script setup lang="ts">
import { toString as formulaToString } from 'propositional/lib/transform/toString'
import * as AST from 'propositional/lib/syntax/ast'
import { Formula, Operator } from '../lib/logic'

const props = defineProps(['expression'])

const expressionToString = (expression: AST.Expression): string => {
  return Formula.normalize(formulaToString(expression, true), true)
}

const operatorText = (symbol: string): string => {
  const operator = Operator.findBySymbol(Formula.normalize(symbol))
  return `${operator.label} (${operator.symbol})`
}
</script>

<template>
  <BRow>
    <BCol>
      <BCard class="text-center" v-if="props.expression">
        <div>
          <span class="fw-bold">Formula: </span>
          {{ expressionToString(props.expression) }}
        </div>
        <div v-if="props.expression?.operator" class="text-capitalize">
          <span class="fw-bold">Operator: </span>
          <span v-html="operatorText(props.expression.operator.lexeme)"></span>
        </div>
      </BCard>
    </BCol>
  </BRow>

  <BRow class="mt-3">
    <BCol v-if="props.expression?.left">
      <div class="arrow left mb-3 text-end me-5 fs-3">⇙</div>
      <FormulaGraph :expression="props.expression.left" />
    </BCol>
    <BCol v-if="props.expression?.right">
      <div class="arrow right mb-3 text-start ms-5 fs-3">⇘</div>
      <FormulaGraph :expression="props.expression.right" />
    </BCol>
    <BCol v-if="props.expression?.inner">
      <div class="arrow mb-3 text-center fs-3">⇓</div>
      <FormulaGraph :expression="props.expression.inner" />
    </BCol>
  </BRow>
</template>
