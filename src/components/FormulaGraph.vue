<script setup lang="ts">
import { BinaryExpression, Expression, OperatorExpression, UnaryExpression } from '@/logic/ast'

const props = defineProps<{ expression?: Expression }>()
</script>

<template>
  <BRow>
    <BCol>
      <BCard v-if="props.expression" class="text-center">
        <div>
          <span class="fw-bold">Formula: </span>
          {{ props.expression }}
        </div>
        <div v-if="props.expression instanceof OperatorExpression">
          <span class="fw-bold">Operator: </span>
          <span class="text-capitalize">
            {{ props.expression.operator.label }} ({{ props.expression.operator.symbol }})
          </span>
        </div>
      </BCard>
    </BCol>
  </BRow>

  <BRow class="mt-3">
    <template v-if="props.expression instanceof BinaryExpression">
      <BCol>
        <div class="mb-3 text-end me-5 fs-4"><IBiArrowDownLeft /></div>
        <FormulaGraph :expression="props.expression.antecedent" />
      </BCol>
      <BCol>
        <div class="mb-3 text-start ms-5 fs-4"><IBiArrowDownRight /></div>
        <FormulaGraph :expression="props.expression.consequent" />
      </BCol>
    </template>
    <BCol v-if="props.expression instanceof UnaryExpression">
      <div class="mb-3 text-center fs-4"><IBiArrowDown /></div>
      <FormulaGraph :expression="props.expression.expression" />
    </BCol>
  </BRow>
</template>
