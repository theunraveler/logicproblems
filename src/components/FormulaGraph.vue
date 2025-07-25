<script setup lang="ts">
const props = defineProps(['expression'])
</script>

<template>
  <BRow>
    <BCol>
      <BCard class="text-center" v-if="props.expression">
        <div>
          <span class="fw-bold">Formula: </span>
          {{ props.expression }}
        </div>
        <div v-if="props.expression?.operator" class="text-capitalize">
          <span class="fw-bold">Operator: </span>
          <span>
            {{ props.expression.operator.label }} ({{ props.expression.operator.symbol }})
          </span>
        </div>
      </BCard>
    </BCol>
  </BRow>

  <BRow class="mt-3">
    <BCol v-if="props.expression?.antecedent">
      <div class="mb-3 text-end me-5 fs-4"><IBiArrowDownLeft /></div>
      <FormulaGraph :expression="props.expression.antecedent" />
    </BCol>
    <BCol v-if="props.expression?.consequent">
      <div class="mb-3 text-start ms-5 fs-4"><IBiArrowDownRight /></div>
      <FormulaGraph :expression="props.expression.consequent" />
    </BCol>
    <BCol v-if="props.expression?.expression">
      <div class="mb-3 text-center fs-4"><IBiArrowDown /></div>
      <FormulaGraph :expression="props.expression.expression" />
    </BCol>
  </BRow>
</template>
